import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DELAIS_OPERATEUR, ErreurDelaiOperateur, ErreurFus, creerOperateur } from './operateur.mjs';

const octets = (texte) => new TextEncoder().encode(texte);
const texte = (o) => new TextDecoder().decode(o);

// Lignes écrites telles quelles par l'operator épinglé (chaînes relevées dans
// static/pile-radio/operateur.hex) : la réponse de DELETE a la clé
// « command  » (avec une espace), et UPGRADE répond d'abord « Upgrade », puis
// « Upgrade(status) » avec status et error.
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

  it('rejette après trois essais sans réponse', async () => {
    const carte = creerCarte();
    await assert.rejects(creerOperateur(carte).version(), ErreurDelaiOperateur);
    assert.equal(carte.journal.filter((l) => l === 'ecrire VERSION').length, 3);
  });

  it('réessaie un VERSION parti avant que l operator soit prêt', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (n === 2) emettre('{"command": "Version", "status": 0, "fus_version": 0}\n');
    });
    const reponse = await creerOperateur(carte).version();
    assert.equal(reponse.fus_version, 0);
    assert.deepEqual(carte.journal, [
      'ecrire VERSION',
      'attendre 1000',
      'ecrire VERSION',
      'attendre 1000',
    ]);
  });
});

describe('supprimer', () => {
  it('réessaie DELETE jusqu à trois fois', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      if (n === 3) emettre('{"command ": "Delete", "status": 0}\n');
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

  it('acceptation tout de suite : la ligne « Upgrade » de status 0', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 0}\n');
      emettre('{"command": "Upgrade(status)", "status": 16, "error": 0}\n');
    });
    const lignes = [];
    const fin = await creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o) });
    assert.deepEqual(fin, { command: 'Upgrade', status: 0 });
    assert.equal(lignes.length, 1);
  });

  it('acceptation tardive : un status 0 sur une ligne « Upgrade(status) »', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 1}\n');
      emettre('{"command": "Upgrade(status)", "status": 16, "error": 0}\n');
      emettre('{"command": "Upgrade(status)", "status": 0, "error": 0}\n');
      emettre('{"command": "Upgrade(status)", "status": 9, "error": 0}\n');
    });
    const lignes = [];
    const fin = await creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o.status) });
    assert.equal(fin.command, 'Upgrade(status)');
    assert.equal(fin.status, 0);
    assert.deepEqual(lignes, [1, 16, 0]);
  });

  it('rejette ErreurFus(4) sur une ligne « Upgrade(status) » d error non nul', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 3}\n');
      emettre('{"command": "Upgrade(status)", "status": 3, "error": 4}\n');
    });
    const lignes = [];
    await assert.rejects(
      creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o) }),
      (err) => err instanceof ErreurFus && err.code === 4 && /place/.test(err.message),
    );
    assert.equal(lignes.length, 2);
  });

  it('rejette ErreurFus(3) après une acceptation refusée (status 1)', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 1}\n');
      emettre('{"command": "Upgrade(status)", "status": 0, "error": 3}\n');
    });
    await assert.rejects(
      creerOperateur(carte).upgrade({ surLigne: () => {} }),
      (err) => err instanceof ErreurFus && err.code === 3,
    );
  });

  it('une ligne « Upgrade(status) » arrivée plus tard réveille l attente', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 1}\n');
    });
    // L'attente de 10 s dure ici 200 ms réelles : la ligne suivante arrive
    // pendant ce temps et doit la couper.
    const attendre = async (ms) => {
      carte.journal.push(`attendre ${ms}`);
      if (ms === DELAIS_OPERATEUR.ligneUpgrade) await new Promise((r) => setTimeout(r, 200));
    };
    const fin = creerOperateur({ ...carte, attendre }).upgrade({ surLigne: () => {} });
    await new Promise((r) => setImmediate(r));
    carte.emettre('{"command": "Upgrade(status)", "status": 0, "error": 0}\n');
    assert.equal((await fin).status, 0);
  });

  it('ne prend pas error null ou absent pour une erreur', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Upgrade", "status": 1}\n');
      emettre('{"command": "Upgrade(status)", "status": 2, "error": null}\n');
      emettre('{"command": "Upgrade(status)", "status": 0, "error": 0}\n');
    });
    const fin = await creerOperateur(carte).upgrade({ surLigne: () => {} });
    assert.equal(fin.status, 0);
  });

  it('une ligne d une autre commande pendant UPGRADE est écartée', async () => {
    const carte = creerCarte((cmd, n, { emettre }) => {
      emettre('{"command": "Status", "status": 0, "error": 3}\n');
      emettre('{"command": "Upgrade", "status": 0}\n');
    });
    const lignes = [];
    const fin = await creerOperateur(carte).upgrade({ surLigne: (o) => lignes.push(o) });
    assert.equal(fin.command, 'Upgrade');
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

describe('délais', () => {
  it('prend les délais passés à la création (DELAIS_PILE du déroulement)', async () => {
    const carte = creerCarte();
    const operateur = creerOperateur({
      ...carte,
      delais: { apresCommande: 7, avantUpgrade: 8, ligneUpgrade: 9 },
    });
    await operateur.relancer();
    await assert.rejects(operateur.upgrade({ surLigne: () => {} }), ErreurDelaiOperateur);
    assert.deepEqual(carte.journal, [
      'ecrire START',
      'attendre 7',
      'attendre 8',
      'ecrire UPGRADE',
      'attendre 9',
    ]);
  });

  it('garde 1 s, 5 s et 10 s pour un délai non donné', async () => {
    const carte = creerCarte();
    const operateur = creerOperateur({ ...carte, delais: { apresCommande: 7 } });
    await assert.rejects(operateur.upgrade({ surLigne: () => {} }), ErreurDelaiOperateur);
    assert.deepEqual(carte.journal, ['attendre 5000', 'ecrire UPGRADE', 'attendre 10000']);
  });
});
