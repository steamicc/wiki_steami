import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ErreurDelaiOperateur, ErreurFus, creerOperateur } from './operateur.mjs';

const octets = (texte) => new TextEncoder().encode(texte);
const texte = (o) => new TextDecoder().decode(o);

const PREMIER = '{"command": "Status", "status": 255, "error": 254}\n';
const SECOND =
  '{"command": "Status", "status": 0, "last_fus_status": 0, "last_ws_status": 0, "current_ws": 1}\n';

// Fausse carte : `repondre(commande, n, ctx)` est appelée à chaque écriture
// (n = rang de la commande de ce nom) et émet des paquets avec ctx.emettre.
// Le journal garde les écritures et les attentes, dans l'ordre.
function creerCarte(repondre = () => {}) {
  const ecouteurs = new Set();
  const journal = [];
  const rangs = {};
  const emettre = (t) => {
    for (const fn of [...ecouteurs]) fn(octets(t));
  };
  return {
    journal,
    emettre,
    ecouteurs,
    ecrire: async (o) => {
      const commande = texte(o).trim();
      journal.push(`ecrire ${commande}`);
      rangs[commande] = (rangs[commande] ?? 0) + 1;
      repondre(commande, rangs[commande], { emettre });
    },
    ecouter: (fn) => {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    attendre: async (ms) => {
      journal.push(`attendre ${ms}`);
    },
  };
}

describe('statusDouble', () => {
  it('rend la seconde réponse après la séquence réelle (255/254, silence, réponse)', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (n === 1) emettre(PREMIER);
      if (n === 3) emettre(SECOND); // le 2e envoi reste sans réponse
    });
    const reponse = await creerOperateur(carte).statusDouble();
    assert.equal(reponse.last_fus_status, 0);
    assert.equal(reponse.current_ws, 1);
    assert.equal(carte.journal.filter((l) => l === 'ecrire STATUS').length, 3);
  });

  it('réessaie un premier STATUS resté sans réponse', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (n === 2) emettre(PREMIER);
      if (n === 3) emettre(SECOND);
    });
    const reponse = await creerOperateur(carte).statusDouble();
    assert.equal(reponse.last_fus_status, 0);
  });

  it('rejette ErreurDelaiOperateur après trois essais sans réponse', async () => {
    const carte = creerCarte();
    await assert.rejects(creerOperateur(carte).statusDouble(), ErreurDelaiOperateur);
    assert.equal(carte.journal.filter((l) => l === 'ecrire STATUS').length, 3);
  });

  it('attend 1 s après chaque envoi', async () => {
    const carte = creerCarte();
    await creerOperateur(carte)
      .statusDouble()
      .catch(() => {});
    assert.deepEqual(carte.journal.slice(0, 2), ['ecrire STATUS', 'attendre 1000']);
  });
});

describe('relancer', () => {
  it('écrit START et se termine sans ligne reçue', async () => {
    const carte = creerCarte();
    await creerOperateur(carte).relancer();
    assert.deepEqual(carte.journal, ['ecrire START', 'attendre 1000']);
  });
});

describe('version', () => {
  it('rend la ligne VERSION malgré une ligne non JSON avant', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('bruit du port série\r\n{"command": "Version", "version": 16777216}\n');
    });
    const reponse = await creerOperateur(carte).version();
    assert.equal(reponse.version, 16777216);
  });

  it('rejette si rien ne répond', async () => {
    await assert.rejects(creerOperateur(creerCarte()).version(), ErreurDelaiOperateur);
  });
});

describe('supprimer', () => {
  it('réessaie DELETE jusqu à trois fois', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (n === 3) emettre('{"command": "Delete", "status": 0}\n');
    });
    const reponse = await creerOperateur(carte).supprimer();
    assert.equal(reponse.status, 0);
    assert.equal(carte.journal.filter((l) => l === 'ecrire DELETE').length, 3);
  });

  it('rejette après trois essais sans réponse', async () => {
    await assert.rejects(creerOperateur(creerCarte()).supprimer(), ErreurDelaiOperateur);
  });
});

describe('upgrade', () => {
  it('attend 5 s avant d écrire UPGRADE', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 0}\n');
    });
    await creerOperateur(carte).upgrade({ surLigne: () => {} });
    assert.deepEqual(carte.journal.slice(0, 2), ['attendre 5000', 'ecrire UPGRADE']);
  });

  it('se termine sur status 0 et passe chaque ligne à surLigne', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 1}\n{"command": "Upgrade", "status": 0}\n');
      emettre('{"command": "Upgrade", "status": 9}\n');
    });
    const lignes = [];
    const fin = await creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o.status) });
    assert.equal(fin.status, 0);
    assert.deepEqual(lignes, [1, 0]);
  });

  it('rejette ErreurFus(4) sur une ligne d error non nul', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 3, "error": 4}\n');
    });
    const lignes = [];
    await assert.rejects(
      creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o) }),
      (err) => err instanceof ErreurFus && err.code === 4 && /place/.test(err.message),
    );
    assert.equal(lignes.length, 1);
  });

  it('rejette ErreurDelaiOperateur après 10 s de silence', async () => {
    const carte = creerCarte();
    await assert.rejects(
      creerOperateur(carte).upgrade({ surLigne: () => {} }),
      ErreurDelaiOperateur,
    );
    assert.ok(carte.journal.includes('attendre 10000'));
  });

  it('retire son écouteur à la fin', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 0}\n');
    });
    await creerOperateur(carte).upgrade({ surLigne: () => {} });
    assert.equal(carte.ecouteurs.size, 0);
  });
});

describe('réponse tardive', () => {
  it('une réponse tardive à un délai dépassé n est pas prise pour la commande suivante', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (cmd === 'DELETE') {
        // Réponse tardive de VERSION, avant la vraie réponse de DELETE.
        emettre('{"command": "Version", "version": 1}\n');
        emettre('{"command": "Delete", "status": 0}\n');
      }
    });
    const operateur = creerOperateur(carte);
    await assert.rejects(operateur.version(), ErreurDelaiOperateur);
    carte.emettre('{"command": "Version", "version": 1}\n'); // arrive trop tard
    const reponse = await operateur.supprimer();
    assert.equal(reponse.command, 'Delete');
  });

  it('une ligne arrivée entre deux commandes est ignorée', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (cmd === 'VERSION') emettre('{"command": "Version", "version": 2}\n');
    });
    const operateur = creerOperateur(carte);
    carte.emettre('{"command": "Version", "version": 1}\n');
    const reponse = await operateur.version();
    assert.equal(reponse.version, 2);
  });
});
