// Protocole du REPL brut de MicroPython : lance du code sur la carte, dépose des
// fichiers dans un disque en RAM, lit la version du firmware.
//
// Sans dépendance au navigateur : le module parle à la carte par deux fonctions
// injectées, ce qui permet de le tester avec une fausse carte (repl.test.mjs) :
// - ecrire(octets: Uint8Array) : envoie au plus `paquet` octets (62 : le DAPLink
//   refuse les écritures série plus longues, « Bad status for 8 -> 255 ») ;
// - ecouter(fn) : fn(octets: Uint8Array) reçoit les octets de la carte ; renvoie
//   la fonction qui retire l'écouteur. Le module n'écoute que pendant ses
//   opérations.
//
// Les octets, pas du texte : en raw paste, la carte envoie des octets binaires
// (taille de la fenêtre) qu'un décodage UTF-8 abîmerait. Le module encode le
// code en UTF-8 et décode lui-même la sortie (TextDecoder en continu).
//
// Protocole mesuré sur la V1c (MicroPython 1.29, firmware v0.28.2) :
// - REPL brut : « \r\x03\x03 », pause, « \x01 » ; la carte répond
//   « raw REPL; CTRL-B to exit\r\n> » ;
// - raw paste (mode principal, avec contrôle de flux, 9,4 ko/s sans perte) :
//   « \x05A\x01 » → « R\x01 » + fenêtre sur 2 octets (petit-boutiste) ; chaque
//   « \x01 » de la carte accorde une fenêtre de plus ; « \x04 » finit l'envoi,
//   la carte l'acquitte par « \x04 » ; un « \x04 » pendant l'envoi est un
//   abandon (erreur de syntaxe, Ctrl-C) ;
// - repli si la carte répond « R\x00 » : REPL brut simple, paquets de 62 octets
//   séparés par une pause de 5 ms (sans contrôle de flux, des octets se
//   perdent sans pause), puis « \x04 » et « OK » ;
// - ensuite : sortie, « \x04 », erreurs (traceback), « \x04 », « > ».
// Même protocole que mpremote (pyboard.py, raw_paste_write).
import { ErreurLecteur } from '../EssayerExemple/logique.mjs';

// Délai d'attente de l'invite « >>> » après Ctrl-C (interrompre).
export const DELAI_INVITE_MS = 1500;
// Taille maximale d'une écriture série par le DAPLink.
export const PAQUET = 62;
// Pause entre deux paquets en REPL brut simple (sans contrôle de flux).
export const PAUSE_MS = 5;
// Pause après Ctrl-C, le temps que le programme en cours s'arrête.
export const PAUSE_INTERRUPTION_MS = 100;
// Disque en RAM : 64 blocs de 512 octets (32 ko), essayé sur la V1c. Assez
// pour les fichiers annexes des samples (pins.py, mesh.py : quelques ko), sans
// trop prendre au tas de MicroPython.
export const BLOCS_RAM = 64;
// Contenu des fichiers envoyé par morceaux (multiple de 3 : base64 sans
// remplissage au milieu), pour que la carte ne compile pas une chaîne géante.
export const MORCEAU_FICHIER = 3072;

// Délais (ms). invite : interrompre ; reponse : chaque réponse attendue du
// protocole ; commande : exécution complète d'une commande interne (montage,
// écriture, version) ; arret : temps laissé au programme pour s'arrêter
// après Ctrl-C avant d'abandonner l'attente.
export const DELAIS = Object.freeze({
  invite: DELAI_INVITE_MS,
  reponse: 5000,
  commande: 10000,
  arret: 1000,
});

const CTRL_A = 0x01;
const CTRL_B = 0x02;
const CTRL_D = 0x04;
const CTRL_E = 0x05;
const INVITE = '>>> ';
const INVITE_BRUT = 'raw REPL; CTRL-B to exit\r\n>';
const REDEMARRAGE = 'soft reboot';

// Noms acceptés dans /ram : simples, sans dossier, sans guillemet.
const NOM_FICHIER = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

// Au-delà, les octets les plus anciens du tampon de réception sont oubliés
// (une carte qui inonde la liaison pendant une attente).
const LIMITE_TAMPON = 256 * 1024;
const GARDE_TAMPON = 64 * 1024;

const encodeur = new TextEncoder();
const octetsDe = (texte) => encodeur.encode(texte);

// La bannière de démarrage de MicroPython : « MicroPython v1.29.0 on … » ou,
// pour un firmware compilé hors release, « MicroPython c0ed7d70da-dirty on … ».
const BANNIERE = /MicroPython (?:v\d+\.\d+\S*|[0-9a-f]{7,40}(?:-[\w.]+)?) on /;

export function estBanniereMicroPython(texte) {
  return BANNIERE.test(texte);
}

// Délai dépassé en attendant la carte.
export class ErreurDelai extends ErreurLecteur {}

// L'opération a été arrêtée par arreter().
export class ArretDemande extends Error {
  constructor() {
    super('Programme arrêté.');
    this.name = 'ArretDemande';
  }
}

function verifierArret(op) {
  if (op.arretDemande) throw new ArretDemande();
}

function erreurDelai(quoi) {
  return new ErreurDelai(
    `MicroPython ne répond pas (attente de ${quoi}) : appuyer sur le bouton RESET de la carte, puis réessayer.`,
  );
}

function erreurProtocole(quoi) {
  return new ErreurLecteur(
    `Réponse inattendue de MicroPython (${quoi}) : appuyer sur le bouton RESET de la carte, puis réessayer.`,
  );
}

const dormir = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

// true si la promesse se termine (bien ou mal) dans le délai.
function dansLeDelai(promesse, ms) {
  return new Promise((resoudre) => {
    const minuterie = setTimeout(() => resoudre(false), ms);
    const fin = () => {
      clearTimeout(minuterie);
      resoudre(true);
    };
    promesse.then(fin, fin);
  });
}

function base64(octets) {
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  }
  return btoa(binaire);
}

// Octets reçus de la carte, pas encore lus par le protocole.
class Tampon {
  constructor() {
    this.octets = new Uint8Array(0);
  }

  get length() {
    return this.octets.length;
  }

  ajouter(octets) {
    let tout = new Uint8Array(this.octets.length + octets.length);
    tout.set(this.octets);
    tout.set(octets, this.octets.length);
    if (tout.length > LIMITE_TAMPON) tout = tout.slice(tout.length - GARDE_TAMPON);
    this.octets = tout;
  }

  chercher(motif) {
    const o = this.octets;
    for (let i = 0; i + motif.length <= o.length; i++) {
      let j = 0;
      while (j < motif.length && o[i + j] === motif[j]) j++;
      if (j === motif.length) return i;
    }
    return -1;
  }

  prendre(n) {
    const pris = this.octets.slice(0, n);
    this.octets = this.octets.slice(n);
    return pris;
  }

  vider() {
    this.octets = new Uint8Array(0);
  }
}

// Monte le disque en RAM s'il ne l'est pas déjà (un redémarrage logiciel le
// fait disparaître) et le place en tête de sys.path. Tout est rangé dans une
// fonction, supprimée ensuite, pour ne pas laisser de noms au programme lancé.
const CODE_MONTAGE = `def _monter_ram():
    import os, sys, vfs
    if 'ram' not in os.listdir('/'):
        class RAMBlock:
            def __init__(self, n, bs=512):
                self.bs = bs; self.data = bytearray(n * bs)
            def readblocks(self, num, buf, off=0):
                a = num * self.bs + off; buf[:] = self.data[a:a + len(buf)]
            def writeblocks(self, num, buf, off=None):
                a = num * self.bs + (off or 0); self.data[a:a + len(buf)] = buf
            def ioctl(self, op, arg):
                if op == 4: return len(self.data) // self.bs
                if op == 5: return self.bs
                if op == 6: return 0
        try:
            vfs.umount('/ram')
        except OSError:
            pass
        bd = RAMBlock(${BLOCS_RAM})
        vfs.VfsLfs2.mkfs(bd)
        vfs.mount(vfs.VfsLfs2(bd), '/ram')
    if '/ram' not in sys.path:
        sys.path.insert(0, '/ram')
_monter_ram()
del _monter_ram
`;

// Le contenu arrive en base64, jamais inséré tel quel dans le code Python.
function codeEcriture(nom, morceau, mode) {
  return `def _ecrire_ram():
    import binascii
    with open('/ram/${nom}', '${mode}') as f:
        f.write(binascii.a2b_base64('${base64(morceau)}'))
_ecrire_ram()
del _ecrire_ram
`;
}

// La version de la release, gravée dans le firmware par micropython-steami-lib
// (steami/version.py) ; null pour un firmware qui ne l'a pas.
const CODE_VERSION = `def _version():
    import json
    try:
        from steami.version import VERSION
    except ImportError:
        VERSION = None
    print(json.dumps(VERSION))
_version()
del _version
`;

function derniereLigne(texte) {
  const lignes = texte.trim().split(/\r?\n/);
  return lignes[lignes.length - 1];
}

export function creerRepl({
  ecrire,
  ecouter,
  attendre = dormir,
  paquet = PAQUET,
  pause = PAUSE_MS,
  delais = {},
}) {
  const d = { ...DELAIS, ...delais };
  const tampon = new Tampon();
  // Attente en cours (une seule : les opérations passent l'une après l'autre).
  let attente = null;
  // Opération en cours, et toutes celles en file (pour arreter()).
  let operation = null;
  const operations = new Set();
  let file = Promise.resolve();
  let fileEcriture = Promise.resolve();
  // null : pas encore essayé ; false : la carte a refusé le raw paste.
  let rawPaste = null;

  function recevoir(octets) {
    tampon.ajouter(octets instanceof Uint8Array ? octets : Uint8Array.from(octets));
    attente?.verifier();
  }

  // Attend que verifier() renvoie autre chose que undefined ; verifier est
  // rappelée à chaque arrivée d'octets. Délai infini : seul arreter() y met fin.
  function attendreQue(verifier, delai, quoi) {
    return new Promise((resoudre, rejeter) => {
      if (operation?.annulee) {
        rejeter(new ArretDemande());
        return;
      }
      let minuterie = null;
      const finir = (fn, valeur) => {
        if (attente !== cette) return;
        attente = null;
        clearTimeout(minuterie);
        fn(valeur);
      };
      const cette = {
        verifier() {
          let r;
          try {
            r = verifier();
          } catch (err) {
            finir(rejeter, err);
            return;
          }
          if (r !== undefined) finir(resoudre, r);
        },
        annuler(err) {
          finir(rejeter, err);
        },
      };
      attente = cette;
      if (Number.isFinite(delai)) {
        minuterie = setTimeout(() => finir(rejeter, erreurDelai(quoi)), delai);
      }
      cette.verifier();
    });
  }

  function attendreOctets(n, quoi) {
    return attendreQue(() => (tampon.length >= n ? tampon.prendre(n) : undefined), d.reponse, quoi);
  }

  // Attend un motif ; ce qui le précède est oublié.
  function attendreMotif(texte, delai, quoi) {
    const motif = octetsDe(texte);
    return attendreQue(
      () => {
        const i = tampon.chercher(motif);
        if (i >= 0) {
          tampon.prendre(i + motif.length);
          return true;
        }
        if (tampon.length >= motif.length) tampon.prendre(tampon.length - motif.length + 1);
        return undefined;
      },
      delai,
      quoi,
    );
  }

  // Écritures découpées en paquets, jamais entremêlées.
  function envoyer(donnees, taille = paquet) {
    const octets = typeof donnees === 'string' ? octetsDe(donnees) : Uint8Array.from(donnees);
    const suite = fileEcriture.then(async () => {
      for (let i = 0; i < octets.length; i += taille) {
        await ecrire(octets.slice(i, i + taille));
      }
    });
    fileEcriture = suite.catch(() => {});
    return suite;
  }

  // Les opérations passent l'une après l'autre ; chacune écoute la carte
  // pendant qu'elle tourne, avec un tampon vide au départ.
  function enFile(travail) {
    const op = { arretDemande: false, annulee: false };
    operations.add(op);
    const promesse = file.then(async () => {
      operation = op;
      tampon.vider();
      let desabonner;
      try {
        desabonner = ecouter(recevoir);
        return await travail(op);
      } finally {
        desabonner?.();
        attente = null;
        operation = null;
        tampon.vider();
        operations.delete(op);
      }
    });
    op.promesse = promesse;
    file = promesse.catch(() => {});
    return promesse;
  }

  async function entrerBrut(op) {
    verifierArret(op);
    await envoyer('\r\x03\x03');
    await attendre(PAUSE_INTERRUPTION_MS);
    tampon.vider();
    await envoyer([CTRL_A]);
    await attendreMotif(INVITE_BRUT, d.reponse, 'l’invite du REPL brut');
  }

  // Envoi en raw paste. Renvoie false si la carte ne le connaît pas.
  async function envoyerRawPaste(op, donnees) {
    await envoyer([CTRL_E, 0x41, CTRL_A]);
    const entete = await attendreOctets(2, 'la réponse au raw paste');
    if (entete[0] === 0x52 && entete[1] === 0) return false; // « R\x00 »
    if (entete[0] === 0x72 && entete[1] === 0x61) {
      // « ra » : firmware sans raw paste, qui a repris le REPL brut.
      await attendreMotif('w REPL; CTRL-B to exit\r\n>', d.reponse, 'l’invite du REPL brut');
      return false;
    }
    if (entete[0] !== 0x52 || entete[1] !== 1) throw erreurProtocole('raw paste');
    const f = await attendreOctets(2, 'la taille de la fenêtre');
    const fenetre = f[0] | (f[1] << 8);
    if (fenetre === 0) throw erreurProtocole('fenêtre vide');

    let credit = fenetre;
    let abandon = false;
    // Octets de contrôle de la carte pendant l'envoi.
    const controler = () => {
      while (tampon.length > 0 && !abandon) {
        const o = tampon.prendre(1)[0];
        if (o === CTRL_A) credit += fenetre;
        else if (o === CTRL_D) abandon = true;
        else throw erreurProtocole(`octet ${o} pendant l’envoi`);
      }
    };
    let i = 0;
    while (i < donnees.length) {
      verifierArret(op);
      controler();
      if (abandon) break;
      if (credit === 0) {
        await attendreQue(
          () => {
            controler();
            return credit > 0 || abandon ? true : undefined;
          },
          d.reponse,
          'la place pour la suite du programme',
        );
        continue;
      }
      const n = Math.min(credit, paquet, donnees.length - i);
      await envoyer(donnees.subarray(i, i + n));
      i += n;
      credit -= n;
    }
    verifierArret(op);
    await envoyer([CTRL_D]);
    if (!abandon) {
      // Accusé de fin d'envoi ; des « \x01 » peuvent arriver avant.
      await attendreQue(
        () => {
          const k = tampon.chercher([CTRL_D]);
          if (k < 0) {
            tampon.vider();
            return undefined;
          }
          tampon.prendre(k + 1);
          return true;
        },
        d.reponse,
        'la fin de l’envoi',
      );
    }
    return true;
  }

  async function envoyerBrut(op, donnees) {
    for (let i = 0; i < donnees.length; i += paquet) {
      verifierArret(op);
      if (i > 0) await attendre(pause);
      await envoyer(donnees.subarray(i, i + paquet));
    }
    verifierArret(op);
    await attendre(pause);
    await envoyer([CTRL_D]);
    const ok = await attendreOctets(2, '« OK »');
    if (ok[0] !== 0x4f || ok[1] !== 0x4b) throw erreurProtocole('« OK » attendu');
  }

  // Sortie au fil de l'eau jusqu'au premier « \x04 », puis erreurs jusqu'au
  // second, puis l'invite « > ».
  async function lireResultat(surSortie, delaiSortie) {
    const decodeur = new TextDecoder('utf-8');
    const transmettre = (octets) => {
      const texte = decodeur.decode(octets, { stream: true });
      if (texte && surSortie) surSortie(texte);
    };
    await attendreQue(
      () => {
        const k = tampon.chercher([CTRL_D]);
        if (k < 0) {
          if (tampon.length > 0) transmettre(tampon.prendre(tampon.length));
          return undefined;
        }
        transmettre(tampon.prendre(k));
        tampon.prendre(1);
        return true;
      },
      delaiSortie,
      'la fin du programme',
    );
    const reste = decodeur.decode();
    if (reste && surSortie) surSortie(reste);
    const octetsErreur = await attendreQue(
      () => {
        const k = tampon.chercher([CTRL_D]);
        if (k < 0) return undefined;
        const e = tampon.prendre(k);
        tampon.prendre(1);
        return e;
      },
      d.reponse,
      'le message d’erreur',
    );
    await attendreMotif('>', d.reponse, 'l’invite du REPL brut');
    const erreur = new TextDecoder('utf-8').decode(octetsErreur);
    return { erreur: erreur === '' ? null : erreur };
  }

  // Exécute du code, la carte étant déjà en REPL brut.
  async function executerBrut(op, code, surSortie, delaiSortie) {
    const donnees = octetsDe(code);
    let envoye = false;
    if (rawPaste !== false) {
      envoye = await envoyerRawPaste(op, donnees);
      rawPaste = envoye;
    }
    if (!envoye) await envoyerBrut(op, donnees);
    return lireResultat(surSortie, delaiSortie);
  }

  // Commande interne : sortie renvoyée, erreur de la carte levée en français.
  async function commande(op, code, quoi) {
    let sortie = '';
    const { erreur } = await executerBrut(
      op,
      code,
      (t) => {
        sortie += t;
      },
      d.commande,
    );
    if (erreur) {
      const ligne = derniereLigne(erreur);
      if (/OSError: (28|\[Errno 28\])/.test(ligne)) {
        throw new ErreurLecteur(
          `Impossible de ${quoi} : le disque en RAM de la carte est plein (${BLOCS_RAM / 2} ko).`,
        );
      }
      throw new ErreurLecteur(`Impossible de ${quoi} sur la carte (${ligne}).`);
    }
    return sortie;
  }

  // Ctrl-C deux fois, puis Ctrl-B (quitte le REPL brut si la carte y était
  // restée) : true si l'invite « >>> » arrive dans le délai.
  function interrompre() {
    return enFile(async () => {
      rawPaste = null; // le firmware a pu changer (installation)
      await envoyer('\r\x03\x03');
      await attendre(PAUSE_INTERRUPTION_MS);
      await envoyer('\x02');
      try {
        await attendreMotif(INVITE, d.invite, 'l’invite >>>');
        return true;
      } catch (err) {
        if (err instanceof ErreurDelai) return false;
        throw err;
      }
    });
  }

  // Lance du code en REPL brut. La sortie est transmise au fil de l'eau ;
  // erreur : la partie stderr (traceback), ou null. Sans délai pendant que le
  // programme tourne : arreter() y met fin ({ erreur: null, arrete: true }).
  function executer(code, { surSortie } = {}) {
    return enFile(async (op) => {
      try {
        await entrerBrut(op);
        const { erreur } = await executerBrut(op, code, surSortie, Infinity);
        if (op.arretDemande) return { erreur: null, arrete: true };
        return { erreur, arrete: false };
      } catch (err) {
        if (err instanceof ArretDemande || (op.arretDemande && err instanceof ErreurLecteur)) {
          return { erreur: null, arrete: true };
        }
        throw err;
      }
    });
  }

  // Écrit un fichier dans le disque en RAM (/ram, en tête de sys.path), monté
  // si besoin. contenu : texte (encodé en UTF-8) ou octets.
  function ecrireFichierRam(nom, contenu) {
    if (!NOM_FICHIER.test(nom)) {
      return Promise.reject(
        new ErreurLecteur(`Nom de fichier refusé pour le disque en RAM : « ${nom} ».`),
      );
    }
    const donnees = typeof contenu === 'string' ? octetsDe(contenu) : Uint8Array.from(contenu);
    return enFile(async (op) => {
      try {
        await entrerBrut(op);
        await commande(op, CODE_MONTAGE, 'monter le disque en RAM');
        let i = 0;
        do {
          verifierArret(op);
          const morceau = donnees.subarray(i, i + MORCEAU_FICHIER);
          await commande(op, codeEcriture(nom, morceau, i === 0 ? 'wb' : 'ab'), `écrire ${nom}`);
          i += MORCEAU_FICHIER;
        } while (i < donnees.length);
        // Ctrl-C arrivé après la fin de la dernière commande : elle s'est
        // terminée sans erreur, l'arrêt doit quand même être rendu.
        verifierArret(op);
      } catch (err) {
        // KeyboardInterrupt pendant une commande : c'est l'arrêt demandé, pas
        // une erreur de la carte (même règle qu'executer).
        if (op.arretDemande && err instanceof ErreurLecteur) throw new ArretDemande();
        throw err;
      }
    });
  }

  // Version de la release gravée dans le firmware (« v0.29.0 », « dev »), ou
  // null si le firmware ne la donne pas (antérieur à steami.version).
  function lireVersion() {
    return enFile(async (op) => {
      await entrerBrut(op);
      const sortie = await commande(op, CODE_VERSION, 'lire la version du firmware');
      let version;
      try {
        version = JSON.parse(sortie.trim());
      } catch {
        throw erreurProtocole('version du firmware');
      }
      return typeof version === 'string' ? version : null;
    });
  }

  // Remise à zéro par un redémarrage logiciel (Ctrl-D) fait en REPL brut : il
  // oublie les variables et le disque en RAM, et ne relance pas le main.py de
  // l'utilisateur (en REPL normal, Ctrl-D le relancerait). La carte revient
  // ensuite au REPL normal (Ctrl-B), au repos sur l'invite « >>> ». true si
  // l'invite est revenue ; false si la carte n'a pas répondu (délais
  // dépassés), sans Ctrl-D si elle n'a pas pu entrer en REPL brut.
  async function remettreAZero() {
    try {
      await envoyer('\r\x03\x03');
      await attendre(PAUSE_INTERRUPTION_MS);
      tampon.vider();
      await envoyer([CTRL_A]);
      await attendreMotif(INVITE_BRUT, d.reponse, 'l’invite du REPL brut');
    } catch (err) {
      if (err instanceof ErreurDelai) return false;
      throw err;
    }
    try {
      await envoyer([CTRL_D]);
      await attendreMotif(REDEMARRAGE, d.reponse, 'le redémarrage');
      await attendreMotif(INVITE_BRUT, d.reponse, 'l’invite du REPL brut');
    } catch (err) {
      if (!(err instanceof ErreurDelai)) throw err;
    }
    try {
      await envoyer([CTRL_B]);
      await attendreMotif(INVITE, d.reponse, 'l’invite >>>');
      return true;
    } catch (err) {
      if (err instanceof ErreurDelai) return false;
      throw err;
    }
  }

  // Arrête le programme en cours (Ctrl-C) et les opérations en file, puis
  // remet MicroPython à zéro (remettreAZero). Renvoie true si la carte est
  // revenue au repos sur « >>> », false si elle n'a pas répondu (programme
  // qui ignore Ctrl-C, pas d'invite) : il faut alors appuyer sur RESET.
  async function arreter() {
    for (const op of operations) op.arretDemande = true;
    const courante = operation;
    // La remise à zéro prend sa place dans la file avant toute attente : une
    // opération demandée pendant l'arrêt (« Lancer » juste après « Arrêter »)
    // passe après elle.
    const remise = enFile(remettreAZero);
    try {
      await envoyer('\x03\x03');
      if (courante && !(await dansLeDelai(courante.promesse, d.arret))) {
        // Le programme ignore Ctrl-C : on cesse de l'attendre.
        courante.annulee = true;
        attente?.annuler(new ArretDemande());
        await dansLeDelai(courante.promesse, d.arret);
      }
    } catch (err) {
      remise.catch(() => {});
      throw err;
    }
    return remise;
  }

  return { interrompre, executer, ecrireFichierRam, lireVersion, arreter };
}
