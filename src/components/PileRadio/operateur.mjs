// Protocole de l'operator d'EasyFlash (wb55_operator), parlé sur le port série
// de la carte à 115 200 bauds : une commande « NOM\n », une réponse JSON d'une
// ligne. Le module ne touche ni à la carte ni au temps : ecrire/ecouter ont la
// forme de carte.ecrireSerie/carte.ecouterSerie (octets bruts) et attendre(ms)
// est injectée, pour que les tests ne dorment jamais. `delais` (facultatif)
// remplace tout ou partie de DELAIS_OPERATEUR : le déroulement y passe
// DELAIS_PILE.
import { LecteurLignes, texteErreurFus } from './logique.mjs';

// Délais (ms) d'EasyFlash : attente après chaque commande, avant UPGRADE, et
// silence le plus long accepté entre deux lignes d'UPGRADE.
export const DELAIS_OPERATEUR = Object.freeze({
  apresCommande: 1000,
  avantUpgrade: 5000,
  ligneUpgrade: 10000,
});
const ESSAIS = 3;

export class ErreurDelaiOperateur extends Error {
  constructor(commande) {
    super(`L'operator ne répond pas à la commande ${commande}.`);
    this.name = 'ErreurDelaiOperateur';
    this.commande = commande;
  }
}

export class ErreurFus extends Error {
  constructor(code) {
    super(texteErreurFus(code));
    this.name = 'ErreurFus';
    this.code = code;
  }
}

// Une réponse tardive d'une autre commande porte son propre nom : elle est
// écartée. Une ligne sans nom est acceptée.
function repondA(objet, nom) {
  return objet.command === undefined || String(objet.command).toUpperCase() === nom;
}

export function creerOperateur({ ecrire, ecouter, attendre, delais }) {
  const encodeur = new TextEncoder();
  const { apresCommande, avantUpgrade, ligneUpgrade } = { ...DELAIS_OPERATEUR, ...delais };

  // Écoute la carte le temps de `corps(recevoir)`, puis retire l'écouteur : ce
  // qui arrive ensuite n'est jamais attribué à la commande suivante.
  async function ecoutant(nom, corps) {
    const lecteur = new LecteurLignes();
    const lignes = [];
    let reveil = null;
    const retirer = ecouter((paquet) => {
      for (const objet of lecteur.ajouter(paquet)) {
        if (!repondA(objet, nom)) continue;
        lignes.push(objet);
        reveil?.();
      }
    });
    try {
      return await corps({
        lignes,
        signal: () => new Promise((resoudre) => (reveil = resoudre)),
      });
    } finally {
      retirer();
    }
  }

  // Écrit NOM, attend 1 s, rend la première ligne acceptée par `convient`
  // (undefined si aucune). Plusieurs essais si `essais` > 1.
  async function commande(nom, { essais = 1, convient = () => true } = {}) {
    for (let essai = 0; essai < essais; essai++) {
      const reponse = await ecoutant(nom, async ({ lignes }) => {
        await ecrire(encodeur.encode(`${nom}\n`));
        await attendre(apresCommande);
        return lignes.find(convient);
      });
      if (reponse) return reponse;
    }
    throw new ErreurDelaiOperateur(nom);
  }

  return {
    // Deux STATUS d'affilée : le premier répond status 255 / error 254 (normal),
    // le second fait basculer le second cœur et ne répond souvent qu'à un essai
    // suivant, avec `last_fus_status`. Rend cette seconde réponse.
    async statusDouble() {
      await commande('STATUS', { essais: ESSAIS });
      return commande('STATUS', {
        essais: ESSAIS,
        convient: (objet) => objet.last_fus_status !== undefined,
      });
    },

    version() {
      return commande('VERSION');
    },

    supprimer() {
      return commande('DELETE', { essais: ESSAIS });
    },

    // START ne répond rien : 1 s d'attente, sans lire de ligne.
    async relancer() {
      await ecrire(encodeur.encode('START\n'));
      await attendre(apresCommande);
    },

    // Rend la ligne d'acceptation (status 0). Une ligne d'error non nul rejette
    // ErreurFus ; 10 s sans ligne rejettent ErreurDelaiOperateur.
    async upgrade({ surLigne }) {
      await attendre(avantUpgrade);
      return ecoutant('UPGRADE', async ({ lignes, signal }) => {
        await ecrire(encodeur.encode('UPGRADE\n'));
        for (;;) {
          if (lignes.length === 0) {
            const delai = Symbol('delai');
            const issue = await Promise.race([signal(), attendre(ligneUpgrade).then(() => delai)]);
            if (issue === delai && lignes.length === 0) {
              throw new ErreurDelaiOperateur('UPGRADE');
            }
            continue;
          }
          const objet = lignes.shift();
          surLigne(objet);
          if (Number.isInteger(objet.error) && objet.error !== 0) throw new ErreurFus(objet.error);
          if (objet.status === 0) return objet;
        }
      });
    },
  };
}
