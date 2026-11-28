// Tests du protocole REPL brut (repl.mjs), avec une fausse carte MicroPython qui
// répond octet par octet comme la STeaMi (V1c, MicroPython 1.29) : invite
// normale, REPL brut, raw paste avec contrôle de flux, repli « R\x00 »,
// redémarrage logiciel. Le « programme » exécuté est simulé par chaque test.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import { ErreurLecteur } from '../EssayerExemple/logique.mjs';
import {
  ArretDemande,
  DELAI_INVITE_MS,
  PAQUET,
  PAUSE_MS,
  creerRepl,
  estBanniereMicroPython,
} from './repl.mjs';

const BANNIERE =
  'MicroPython c0ed7d70da-dirty on 2026-11-26; STEAM32-WB55 with STM32WB55RGV6\r\n' +
  'Type "help()" for more information.\r\n';
const INVITE_BRUT = 'raw REPL; CTRL-B to exit\r\n>';
const TRACEBACK_ZERO =
  'Traceback (most recent call last):\r\n' +
  '  File "<stdin>", line 1, in <module>\r\n' +
  'ZeroDivisionError: divide by zero\r\n';
const TRACEBACK_INTERRUPTION =
  'Traceback (most recent call last):\r\n' +
  '  File "<stdin>", line 2, in <module>\r\n' +
  'KeyboardInterrupt: \r\n';
const TRACEBACK_SYNTAXE =
  'Traceback (most recent call last):\r\n' +
  '  File "<stdin>", line 3\r\n' +
  'SyntaxError: invalid syntax\r\n';
const LIGNE_ARDUINO = 'Voltage:            4168 mV\r\n';

const encodeur = new TextEncoder();
const decoder = (octets) => new TextDecoder().decode(Uint8Array.from(octets));

// Fausse carte. Options :
// - rawPaste : true (accepté), false (« R\x00 »), 'inconnu' (firmware sans raw paste) ;
// - fenetre : taille de la fenêtre de raw paste ;
// - arduino : la carte fait tourner un programme Arduino (ne répond pas au REPL) ;
// - decoupe : tailles successives des morceaux livrés à l'écouteur ;
// - abandonApres : en raw paste, la carte abandonne après n octets (erreur de syntaxe) ;
// - programme(code) : ce que fait le code reçu, { sortie, erreur }, { infini: ligne }
//   (imprime sans fin jusqu'à Ctrl-C) ou { bloque: true } (ignore Ctrl-C).
function fausseCarte({
  rawPaste = true,
  fenetre = 128,
  arduino = false,
  decoupe = [1, 7, 3, 64],
  abandonApres = null,
  programme = () => ({}),
} = {}) {
  const ecouteurs = new Set();
  // mainPy : redémarrages qui auraient relancé le main.py de l'utilisateur.
  const journal = {
    ecritures: [],
    codes: [],
    modes: [],
    depassements: 0,
    redemarrages: 0,
    mainPy: 0,
    // Suite des codes lancés (« code ») et des redémarrages (« redemarrage »).
    ordre: [],
  };
  let mode = 'normal';
  let ligne = [];
  let entete = [];
  let recus = 0;
  let accorde = 0;
  let execution = null;
  let iDecoupe = 0;

  // Livraison asynchrone, dans l'ordre, en morceaux de tailles variées.
  function livrer(octets, avant) {
    setImmediate(() => {
      avant?.();
      for (const fn of ecouteurs) fn(octets);
    });
  }

  function emettre(...parties) {
    for (const partie of parties) {
      const octets = typeof partie === 'string' ? encodeur.encode(partie) : Uint8Array.from(partie);
      for (let i = 0; i < octets.length; ) {
        const n = decoupe[iDecoupe++ % decoupe.length];
        livrer(octets.slice(i, i + n));
        i += n;
      }
    }
  }

  // La carte a lu une fenêtre entière : elle en accorde une autre (« \x01 »).
  function accorder() {
    livrer(Uint8Array.of(1), () => {
      accorde += fenetre;
    });
  }

  function finir(sortie, erreur) {
    emettre(sortie, [4], erreur, [4], '>');
    mode = 'brut';
  }

  function lancer(code, enPaste) {
    journal.codes.push(code);
    journal.ordre.push('code');
    journal.modes.push(enPaste ? 'paste' : 'brut');
    if (!enPaste) emettre('OK');
    const r = programme(code) ?? {};
    if (r.infini !== undefined) {
      mode = 'execution';
      execution = { bloque: false };
      const tic = () => {
        if (mode !== 'execution') return;
        emettre(r.infini);
        setTimeout(tic, 2);
      };
      tic();
    } else if (r.bloque) {
      mode = 'execution';
      execution = { bloque: true };
    } else {
      finir(r.sortie ?? '', r.erreur ?? '');
    }
  }

  function traiter(o) {
    switch (mode) {
      case 'normal':
        if (o === 3) emettre('\r\n>>> ');
        else if (o === 2) emettre('\r\n', BANNIERE, '>>> ');
        else if (o === 1) {
          mode = 'brut';
          ligne = [];
          emettre(INVITE_BRUT);
        } else if (o === 4) {
          // En REPL normal, le redémarrage logiciel relance boot.py et main.py.
          journal.redemarrages++;
          journal.ordre.push('redemarrage');
          journal.mainPy++;
          emettre('MPY: soft reboot\r\n', BANNIERE, '>>> ');
        } else emettre([o]);
        break;
      case 'brut':
        if (o === 1) {
          ligne = [];
          emettre(INVITE_BRUT);
        } else if (o === 2) {
          mode = 'normal';
          emettre('\r\n', BANNIERE, '>>> ');
        } else if (o === 3) ligne = [];
        else if (o === 4) {
          if (ligne.length === 0) {
            // En REPL brut : redémarrage sans main.py, retour au REPL brut.
            journal.redemarrages++;
            journal.ordre.push('redemarrage');
            emettre('OK\r\nMPY: soft reboot\r\n', INVITE_BRUT);
          } else lancer(decoder(ligne), false);
          ligne = [];
        } else if (o === 5 && rawPaste !== 'inconnu') {
          mode = 'entete';
          entete = [];
        } else ligne.push(o);
        break;
      case 'entete':
        entete.push(o);
        if (entete.length < 2) break;
        if (entete[0] !== 0x41 || entete[1] !== 1) mode = 'brut';
        else if (!rawPaste) {
          mode = 'brut';
          emettre('R', [0]);
        } else {
          mode = 'paste';
          ligne = [];
          recus = 0;
          accorde = fenetre;
          emettre('R', [1], [fenetre & 0xff, fenetre >> 8]);
        }
        break;
      case 'paste':
        if (o === 4) {
          emettre([4]);
          lancer(decoder(ligne), true);
        } else if (o === 3) {
          emettre([4]);
          finir('', TRACEBACK_INTERRUPTION);
        } else {
          recus++;
          if (recus > accorde) journal.depassements++;
          ligne.push(o);
          if (recus % fenetre === 0) accorder();
          if (recus === abandonApres) {
            emettre([4]);
            mode = 'vidange';
          }
        }
        break;
      case 'vidange':
        if (o === 3 || o === 4) finir('', TRACEBACK_SYNTAXE);
        break;
      case 'execution':
        if (o === 3 && !execution.bloque) {
          execution = null;
          finir('', TRACEBACK_INTERRUPTION);
        }
        break;
    }
  }

  return {
    journal,
    get mode() {
      return mode;
    },
    get ecouteurs() {
      return ecouteurs.size;
    },
    ecouter(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    async ecrire(octets) {
      journal.ecritures.push(Uint8Array.from(octets));
      if (arduino) {
        emettre(LIGNE_ARDUINO);
        return;
      }
      for (const o of octets) traiter(o);
    },
  };
}

const DELAIS_TESTS = { invite: 50, reponse: 500, commande: 2000, arret: 50 };

function replSur(carte, options = {}) {
  const pauses = [];
  const repl = creerRepl({
    ecrire: carte.ecrire,
    ecouter: carte.ecouter,
    attendre: async (ms) => {
      pauses.push(ms);
    },
    delais: DELAIS_TESTS,
    ...options,
  });
  return { repl, pauses };
}

// Exécute du code et rassemble la sortie transmise au fil de l'eau.
async function lancer(repl, code) {
  const morceaux = [];
  const r = await repl.executer(code, { surSortie: (t) => morceaux.push(t) });
  return { ...r, sortie: morceaux.join(''), morceaux };
}

async function jusqua(condition, ms = 2000) {
  const debut = Date.now();
  while (!condition()) {
    if (Date.now() - debut > ms) throw new Error('condition jamais remplie');
    await new Promise((r) => setTimeout(r, 2));
  }
}

const tousLesOctets = (ecritures) => ecritures.flatMap((e) => [...e]);

test('constantes : valeurs retenues à la tâche 1', () => {
  assert.equal(DELAI_INVITE_MS, 1500);
  assert.equal(PAQUET, 62);
  assert.equal(PAUSE_MS, 5);
});

test('executer : renvoie la sortie et pas d’erreur pour print(1+1)', async () => {
  const carte = fausseCarte({
    programme: (code) => (code === 'print(1+1)' ? { sortie: '2\r\n' } : { erreur: 'inconnu' }),
  });
  const { repl } = replSur(carte);
  const r = await lancer(repl, 'print(1+1)');
  assert.equal(r.sortie, '2\r\n');
  assert.equal(r.erreur, null);
  assert.equal(r.arrete, false);
  assert.deepEqual(carte.journal.modes, ['paste']);
  assert.equal(carte.ecouteurs, 0, "l'écouteur est retiré après l'opération");
});

test('executer : traceback renvoyé dans erreur', async () => {
  const carte = fausseCarte({ programme: () => ({ erreur: TRACEBACK_ZERO }) });
  const { repl } = replSur(carte);
  const r = await lancer(repl, '1/0');
  assert.equal(r.sortie, '');
  assert.equal(r.erreur, TRACEBACK_ZERO);
});

test('executer : sortie UTF-8 reçue octet par octet', async () => {
  const carte = fausseCarte({ decoupe: [1], programme: () => ({ sortie: 'été à 20 °C\r\n' }) });
  const { repl } = replSur(carte);
  const r = await lancer(repl, 'print("été à 20 °C")');
  assert.equal(r.sortie, 'été à 20 °C\r\n');
  assert.ok(r.morceaux.every((m) => !m.includes('�')));
});

test("executer : code envoyé par paquets de 'paquet' octets (raw paste)", async () => {
  const code = Array.from({ length: 40 }, (_, i) => `print("ligne ${i} é")`).join('\n');
  const carte = fausseCarte();
  const { repl } = replSur(carte);
  await lancer(repl, code);
  assert.deepEqual(carte.journal.codes, [code], 'code reçu à l’identique (UTF-8)');
  assert.deepEqual(carte.journal.modes, ['paste']);
  assert.ok(carte.journal.ecritures.every((e) => e.length <= PAQUET));
  assert.equal(carte.journal.depassements, 0, 'jamais plus que la fenêtre accordée');
});

test("executer : code envoyé par paquets de 'paquet' octets (REPL brut, après R\\x00)", async () => {
  const code = 'x = 1\n'.repeat(50);
  const carte = fausseCarte({ rawPaste: false });
  const { repl, pauses } = replSur(carte, { paquet: 16, pause: 7 });
  await lancer(repl, code);
  assert.deepEqual(carte.journal.codes, [code]);
  assert.deepEqual(carte.journal.modes, ['brut']);
  const ecritures = carte.journal.ecritures;
  assert.ok(ecritures.every((e) => e.length <= 16));
  // Les octets du code partent en paquets de 16, séparés par la pause.
  const paquetsCode = ecritures.filter((e) => e.length === 16);
  assert.equal(paquetsCode.length, Math.floor(code.length / 16));
  assert.ok(pauses.filter((ms) => ms === 7).length >= Math.ceil(code.length / 16) - 1);

  // Le refus est retenu : l'exécution suivante ne redemande pas le raw paste.
  const avant = carte.journal.ecritures.length;
  await lancer(repl, 'y = 2');
  const nouvelles = tousLesOctets(carte.journal.ecritures.slice(avant));
  assert.ok(!nouvelles.includes(5));
  assert.deepEqual(carte.journal.modes, ['brut', 'brut']);
});

test('executer : firmware sans raw paste, repli en REPL brut', async () => {
  const carte = fausseCarte({ rawPaste: 'inconnu', programme: () => ({ sortie: 'ok\r\n' }) });
  const { repl } = replSur(carte);
  const r = await lancer(repl, 'print("ok")');
  assert.equal(r.sortie, 'ok\r\n');
  assert.deepEqual(carte.journal.modes, ['brut']);
});

test('executer : la carte abandonne le raw paste (erreur de syntaxe)', async () => {
  const code = 'a = (\n' + '# commentaire\n'.repeat(30);
  const carte = fausseCarte({ abandonApres: 70 });
  const { repl } = replSur(carte);
  const r = await lancer(repl, code);
  assert.equal(r.erreur, TRACEBACK_SYNTAXE);
  assert.ok(tousLesOctets(carte.journal.ecritures).length < code.length, 'envoi interrompu');
});

test('executer : sortie continue (1000 lignes) puis fin détectée', async () => {
  const attendu = Array.from({ length: 1000 }, (_, i) => `ligne ${i} : é\r\n`).join('');
  const carte = fausseCarte({ decoupe: [5, 61, 13, 200], programme: () => ({ sortie: attendu }) });
  const { repl } = replSur(carte);
  const r = await lancer(repl, 'for i in range(1000): print("ligne", i, ": é")');
  assert.equal(r.sortie, attendu);
  assert.equal(r.erreur, null);
  assert.ok(r.morceaux.length > 1, 'sortie transmise au fil de l’eau');
  // La carte est de nouveau prête : une autre exécution passe.
  assert.equal((await lancer(repl, 'print(1+1)')).erreur, null);
});

test('executer : délai dépassé si MicroPython ne répond pas', async () => {
  const carte = fausseCarte({ arduino: true });
  const { repl } = replSur(carte);
  await assert.rejects(repl.executer('print(1)'), (err) => {
    assert.ok(err instanceof ErreurLecteur);
    assert.match(err.message, /ne répond pas/);
    return true;
  });
  assert.equal(carte.ecouteurs, 0);
});

test('arreter : interrompt un programme sans fin, la sortie arrive pendant qu’il tourne', async () => {
  const carte = fausseCarte({ programme: () => ({ infini: 'tic\r\n' }) });
  const { repl } = replSur(carte);
  const morceaux = [];
  const execution = repl.executer('while True: print("tic")', {
    surSortie: (t) => morceaux.push(t),
  });
  await jusqua(() => morceaux.join('').split('tic').length > 5);
  assert.equal(await repl.arreter(), true, 'remise à zéro confirmée');
  const r = await execution;
  assert.deepEqual(r, { erreur: null, arrete: true });
  assert.equal(carte.journal.redemarrages, 1, 'redémarrage logiciel (Ctrl-D)');
  assert.equal(carte.journal.mainPy, 0, 'main.py n’est pas relancé');
  assert.equal(carte.mode, 'normal', 'retour au REPL normal');
  assert.equal(carte.ecouteurs, 0);
});

test('arreter : un programme qui ignore Ctrl-C ne bloque pas executer', async () => {
  const carte = fausseCarte({ programme: () => ({ bloque: true }) });
  const { repl } = replSur(carte);
  const execution = repl.executer('while True: pass');
  await jusqua(() => carte.mode === 'execution');
  assert.equal(await repl.arreter(), false, 'la carte n’a pas répondu : appuyer sur Reset');
  assert.deepEqual(await execution, { erreur: null, arrete: true });
  assert.equal(carte.journal.mainPy, 0, 'pas de Ctrl-D hors du REPL brut');
  assert.equal(carte.journal.redemarrages, 0);
});

test('arreter : false si MicroPython ne répond pas (programme Arduino)', async () => {
  const carte = fausseCarte({ arduino: true });
  const { repl } = replSur(carte);
  assert.equal(await repl.arreter(), false);
  assert.equal(carte.ecouteurs, 0);
});

test('arreter : un executer demandé pendant l’arrêt passe après la remise à zéro', async () => {
  const carte = fausseCarte({
    programme: (code) => (code.includes('while') ? { infini: 'tic\r\n' } : { sortie: 'après\r\n' }),
  });
  const { repl } = replSur(carte);
  const morceaux = [];
  const premier = repl.executer('while True: print("tic")', {
    surSortie: (t) => morceaux.push(t),
  });
  await jusqua(() => morceaux.join('').includes('tic'));
  // « Lancer » juste après « Arrêter », sans attendre la fin de l'arrêt.
  const arret = repl.arreter();
  const second = lancer(repl, 'print("après")');
  assert.equal(await arret, true);
  assert.deepEqual(await premier, { erreur: null, arrete: true });
  const r = await second;
  assert.equal(r.sortie, 'après\r\n');
  assert.equal(r.arrete, false, 'le nouveau programme n’est pas arrêté');
  assert.deepEqual(carte.journal.ordre, ['code', 'redemarrage', 'code']);
  assert.equal(carte.journal.mainPy, 0);
});

test('arreter : depuis le REPL normal, redémarre en REPL brut puis revient à >>>', async () => {
  const carte = fausseCarte({ programme: () => ({ sortie: '2\r\n' }) });
  const { repl } = replSur(carte);
  assert.equal(await repl.interrompre(), true);
  assert.equal(await repl.arreter(), true);
  assert.equal(carte.journal.redemarrages, 1);
  assert.equal(carte.journal.mainPy, 0);
  assert.equal(carte.mode, 'normal');
  // La carte reste utilisable ensuite.
  assert.equal((await lancer(repl, 'print(1+1)')).sortie, '2\r\n');
});

test('arreter : sans programme en cours, remet la carte à zéro', async () => {
  const carte = fausseCarte();
  const { repl } = replSur(carte);
  assert.equal(await repl.arreter(), true);
  assert.equal(carte.journal.redemarrages, 1);
  assert.equal(carte.journal.mainPy, 0, 'main.py n’est pas relancé');
  assert.equal(carte.mode, 'normal');
});

// Programme simulé du disque en RAM : montage, écriture en base64.
function disqueRam() {
  const fichiers = new Map();
  const etat = { montages: 0, fichiers };
  etat.programme = (code) => {
    if (code.includes('vfs.mount(')) {
      etat.montages++;
      return {};
    }
    const m = /open\('\/ram\/([^']+)', '(wb|ab)'\)[\s\S]*a2b_base64\('([A-Za-z0-9+/=]*)'\)/.exec(
      code,
    );
    if (!m) return { erreur: 'Traceback (most recent call last):\r\nNameError: inconnu\r\n' };
    const morceau = Buffer.from(m[3], 'base64');
    const avant = m[2] === 'ab' ? fichiers.get(m[1]) : Buffer.alloc(0);
    fichiers.set(m[1], Buffer.concat([avant, morceau]));
    return {};
  };
  return etat;
}

test('ecrireFichierRam : contenu avec é, guillemets, \\ et \\x04 relu à l’identique', async () => {
  const disque = disqueRam();
  const carte = fausseCarte({ programme: disque.programme });
  const { repl } = replSur(carte);
  const contenu = "# é \"x\" 'y' \\ \x04 fin\nLED = 'ok-ram'\n";
  await repl.ecrireFichierRam('pins.py', contenu);
  assert.equal(disque.fichiers.get('pins.py').toString('utf8'), contenu);
  assert.ok(disque.montages >= 1);
  // Le contenu n'est jamais inséré tel quel dans le code Python.
  for (const code of carte.journal.codes) {
    assert.ok(!code.includes('\x04') && !code.includes('é') && !code.includes('ok-ram'));
  }
});

test('ecrireFichierRam : gros fichier envoyé en plusieurs morceaux, plusieurs fichiers', async () => {
  const disque = disqueRam();
  const carte = fausseCarte({ programme: disque.programme });
  const { repl } = replSur(carte);
  const gros = Array.from({ length: 600 }, (_, i) => `V${i} = "é${i}"\n`).join('');
  await repl.ecrireFichierRam('mesh.py', gros);
  await repl.ecrireFichierRam('vide.py', '');
  assert.equal(disque.fichiers.get('mesh.py').toString('utf8'), gros);
  assert.equal(disque.fichiers.get('vide.py').length, 0);
  assert.ok(carte.journal.codes.filter((c) => c.includes("'ab'")).length >= 2);
});

test('ecrireFichierRam : erreur de la carte et nom invalide', async () => {
  const carte = fausseCarte({
    programme: (code) =>
      code.includes('a2b_base64')
        ? { erreur: 'Traceback (most recent call last):\r\nOSError: 28\r\n' }
        : {},
  });
  const { repl } = replSur(carte);
  // Le lecteur ne peut rien y faire : le message dit à qui le signaler.
  await assert.rejects(repl.ecrireFichierRam('gros.py', 'x'), /plein.*Signaler le problème/);
  await assert.rejects(repl.ecrireFichierRam('../main.py', 'x'), ErreurLecteur);
  await assert.rejects(repl.ecrireFichierRam("a'b.py", 'x'), ErreurLecteur);
});

test('ecrireFichierRam : autre erreur de la carte → message qui dit quoi faire', async () => {
  const carte = fausseCarte({
    programme: (code) =>
      code.includes('a2b_base64')
        ? { erreur: 'Traceback (most recent call last):\r\nMemoryError: \r\n' }
        : {},
  });
  const { repl } = replSur(carte);
  await assert.rejects(
    repl.ecrireFichierRam('pins.py', 'x'),
    /Impossible d'écrire pins\.py sur la carte \(MemoryError:\)\. Signaler le problème/,
  );
});

test('ecrireFichierRam : arrêtée pendant l’écriture (KeyboardInterrupt) → ArretDemande', async () => {
  // L'écriture tourne encore quand Ctrl-C arrive : la carte répond par un
  // traceback KeyboardInterrupt, qui n'est pas une erreur pour le lecteur.
  const carte = fausseCarte({
    programme: (code) => (code.includes('a2b_base64') ? { infini: '' } : {}),
  });
  const { repl } = replSur(carte);
  const ecriture = repl.ecrireFichierRam('pins.py', 'A = 1');
  ecriture.catch(() => {});
  await jusqua(() => carte.mode === 'execution');
  const arret = repl.arreter();
  await assert.rejects(ecriture, ArretDemande);
  assert.equal(await arret, true);
});

test('ecrireFichierRam : arrêt demandé pendant la dernière commande, finie normalement → ArretDemande', async () => {
  // Ctrl-C arrive au REPL brut après la fin de la commande : il n'y efface
  // que la ligne, la commande se termine sans erreur. L'arrêt doit quand même
  // être rendu à l'appelant, qui ne doit rien lancer ensuite.
  let arret = null;
  let repl;
  const carte = fausseCarte({
    programme: (code) => {
      if (code.includes('a2b_base64')) arret ??= repl.arreter();
      return {};
    },
  });
  ({ repl } = replSur(carte));
  await assert.rejects(repl.ecrireFichierRam('pins.py', 'A = 1'), ArretDemande);
  assert.equal(await arret, true);
});

test('lireVersion : "v0.29.0", "dev", puis null sans module', async () => {
  for (const version of ['v0.29.0', 'dev', null]) {
    const carte = fausseCarte({
      programme: (code) =>
        code.includes('steami.version') ? { sortie: `${JSON.stringify(version)}\r\n` } : {},
    });
    const { repl } = replSur(carte);
    assert.equal(await repl.lireVersion(), version);
  }
});

test('interrompre : true quand l’invite >>> arrive', async () => {
  const carte = fausseCarte();
  const { repl } = replSur(carte);
  assert.equal(await repl.interrompre(), true);
});

test('interrompre : true aussi si la carte était restée en REPL brut', async () => {
  const carte = fausseCarte();
  const { repl } = replSur(carte);
  await lancer(repl, 'print(1)');
  assert.equal(carte.mode, 'brut');
  assert.equal(await repl.interrompre(), true);
  assert.equal(carte.mode, 'normal');
});

test('interrompre : false sans invite dans le délai', async () => {
  const carte = fausseCarte({ arduino: true });
  const { repl } = replSur(carte);
  const debut = Date.now();
  assert.equal(await repl.interrompre(), false);
  assert.ok(Date.now() - debut >= DELAIS_TESTS.invite - 5);
  assert.equal(carte.ecouteurs, 0);
});

test('estBanniereMicroPython : vrai pour la bannière STeaMi, faux pour une sortie Arduino', () => {
  assert.equal(estBanniereMicroPython(BANNIERE), true);
  assert.equal(
    estBanniereMicroPython('MicroPython v1.29.0 on 2026-11-26; STEAM32-WB55 with STM32WB55RGV6'),
    true,
  );
  assert.equal(estBanniereMicroPython(LIGNE_ARDUINO), false);
  assert.equal(estBanniereMicroPython('MicroPython est super'), false);
  assert.equal(estBanniereMicroPython(''), false);
});
