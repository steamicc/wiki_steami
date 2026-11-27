// Tests de ce qu'affiche le bouton « Vérifier la pile radio » : visibilité,
// état du bouton, textes des encarts, messages, et suivi du parcours. Sans
// DOM ni carte : le parcours et la carte sont simulés.
// Lancer : node --test src/components/PileRadio/affichage.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  CIBLE_RENVOI,
  CLE_FORCER,
  TEXTE_CONSIGNES_PILE,
  TEXTE_DUREE_PILE,
  TEXTE_DERNIERE_ETAPE_DAPLINK,
  boutonPileActif,
  contenuEncart,
  controlesOccupes,
  creerSuiviOperateur,
  doitAbandonner,
  erreurCarteVisible,
  issueFocus,
  lireForcer,
  messageEtape,
  morceauxTexte,
  operateurSurCarte,
  pileRadioVisible,
  questionEnAttente,
  retenirCarte,
  retenirFermeture,
  retenirOnglet,
  texteDecompte,
} from './affichage.mjs';
import {
  ETAT_INITIAL_PILE,
  LIBELLE_RENVOI,
  TEXTE_ANNULE,
  TEXTE_CONFIRMATION_VERIFICATION,
  TEXTE_DAPLINK_GUIDE,
  TEXTE_PILE_ABSENTE_APRES,
  TEXTE_PILE_ARRETEE,
  TEXTE_PILE_PEUT_ETRE_EFFACEE,
  TEXTE_PLUS_TARD,
  texteAutrePile,
  texteEchecInstallation,
  texteFusRefuse,
} from './deroulement.mjs';

const ID = 'BLE/BleBeacon';
const CARTE_LIBRE = { connectee: true, occupee: false, programmeActif: null };

function pile(partie) {
  return { ...ETAT_INITIAL_PILE, ...partie };
}

// Parcours simulé : même interface d'abonnement que creerParcoursPile.
function fauxParcours() {
  let etat = ETAT_INITIAL_PILE;
  const abonnes = new Set();
  return {
    get etat() {
      return etat;
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => abonnes.delete(fn);
    },
    poser(partie) {
      etat = { ...etat, ...partie };
      for (const fn of [...abonnes]) fn(etat);
    },
  };
}

const DONNEES = {
  id: ID,
  decision: 'absente',
  trouvee: null,
  epinglee: '1.20.0',
  pile: 'BLE HCI Layer',
};

describe('pileRadioVisible', () => {
  it('seulement pour les ids BLE/…', () => {
    assert.equal(pileRadioVisible('BLE/BleBeacon'), true);
    assert.equal(pileRadioVisible('BLE/BleIndoorMap'), true);
    assert.equal(pileRadioVisible('VL53L1X/GestureDetection'), false);
    assert.equal(pileRadioVisible('BLEX/Truc'), false);
    assert.equal(pileRadioVisible('ble/BleBeacon'), false);
    assert.equal(pileRadioVisible(undefined), false);
  });
});

describe('boutonPileActif', () => {
  it('actif carte connectée et libre, parcours au repos', () => {
    assert.equal(boutonPileActif(CARTE_LIBRE, pile({})), true);
  });

  it('inactif sans carte, pendant un flash ou une connexion', () => {
    assert.equal(boutonPileActif({ ...CARTE_LIBRE, connectee: false }, pile({})), false);
    assert.equal(boutonPileActif({ ...CARTE_LIBRE, occupee: true }, pile({})), false);
  });

  it('inactif pendant le parcours, première question comprise', () => {
    for (const etape of [
      'confirmation-verification',
      'operateur',
      'lecture',
      'proposition',
      'daplink',
      'suppression',
      'ecriture',
      'upgrade',
      'attente',
      'relecture',
    ]) {
      assert.equal(boutonPileActif(CARTE_LIBRE, pile({ etape })), false, etape);
    }
  });

  it('de nouveau actif après une fin de parcours', () => {
    for (const etape of ['repos', 'a-jour', 'fini', 'erreur']) {
      assert.equal(boutonPileActif(CARTE_LIBRE, pile({ etape })), true, etape);
    }
  });

  it('inactif pendant un essai MicroPython occupé sur la page', () => {
    assert.equal(boutonPileActif(CARTE_LIBRE, pile({}), true), false);
    assert.equal(boutonPileActif(CARTE_LIBRE, pile({}), false), true);
  });
});

describe('retenirFermeture', () => {
  it('de la suppression à la relecture seulement', () => {
    const retenues = ['suppression', 'ecriture', 'upgrade', 'attente', 'relecture'];
    for (const etape of retenues) assert.equal(retenirFermeture(pile({ etape })), true, etape);
    for (const etape of [
      'repos',
      'confirmation-verification',
      'operateur',
      'lecture',
      'proposition',
      'daplink',
      'a-jour',
      'fini',
      'erreur',
    ]) {
      assert.equal(retenirFermeture(pile({ etape })), false, etape);
    }
  });
});

describe('doitAbandonner', () => {
  it('vrai quand une question du bloc attend une réponse', () => {
    const encart = { type: 'proposition', donnees: DONNEES };
    assert.equal(doitAbandonner(pile({ id: ID, etape: 'proposition', encart }), ID), true);
    const premiere = { type: 'confirmation-verification', donnees: { id: ID, texte: 'x' } };
    assert.equal(
      doitAbandonner(pile({ id: ID, etape: 'confirmation-verification', encart: premiere }), ID),
      true,
    );
  });

  // Bloc quitté pendant le flash de l'operator ou la lecture : sans
  // annulation, le parcours poserait plus tard une question sans bloc pour
  // y répondre.
  it('vrai pendant une étape occupée du bloc, même sans question', () => {
    for (const etape of ['operateur', 'lecture', 'suppression', 'attente', 'relecture']) {
      assert.equal(doitAbandonner(pile({ id: ID, etape }), ID), true, etape);
    }
  });

  it("faux au repos, après la fin, ou pour le parcours d'un autre bloc", () => {
    const encart = { type: 'proposition', donnees: DONNEES };
    for (const etape of ['repos', 'a-jour', 'fini', 'erreur']) {
      assert.equal(doitAbandonner(pile({ id: ID, etape }), ID), false, etape);
    }
    assert.equal(
      doitAbandonner(pile({ id: ID, etape: 'proposition', encart }), 'BLE/Autre'),
      false,
    );
    assert.equal(doitAbandonner(pile({ id: ID, etape: 'lecture' }), 'BLE/Autre'), false);
  });
});

describe('questionEnAttente', () => {
  it('vrai seulement quand une question du bloc attend une réponse', () => {
    const encart = { type: 'proposition', donnees: DONNEES };
    assert.equal(questionEnAttente(pile({ id: ID, etape: 'proposition', encart }), ID), true);
    assert.equal(questionEnAttente(pile({ id: ID, etape: 'lecture' }), ID), false);
    assert.equal(
      questionEnAttente(pile({ id: ID, etape: 'proposition', encart }), 'BLE/Autre'),
      false,
    );
  });
});

describe('messageEtape', () => {
  it('dit ce qui se passe pendant chaque étape occupée', () => {
    for (const etape of [
      'operateur',
      'lecture',
      'telechargement',
      'suppression',
      'ecriture',
      'upgrade',
      'attente',
      'relecture',
    ]) {
      const texte = messageEtape(pile({ etape }));
      assert.equal(typeof texte, 'string', etape);
      assert.ok(texte.length > 0, etape);
    }
  });

  it("pendant l'attente : les consignes, sans le décompte (annoncé une seule fois)", () => {
    const texte = messageEtape(pile({ etape: 'attente', decompte: 42 }));
    assert.match(texte, /ne pas débrancher/);
    assert.match(texte, /RESET/);
    assert.match(texte, /fermer la page/);
    assert.doesNotMatch(texte, /42/);
  });

  it('sinon, le message du parcours, ou rien', () => {
    assert.equal(messageEtape(pile({ etape: 'fini', message: 'Fin.' })), 'Fin.');
    assert.equal(messageEtape(pile({ etape: 'repos' })), null);
    assert.equal(messageEtape(pile({ etape: 'proposition', encart: {} })), null);
  });

  it('étapes du DAPLink fermées par « Plus tard » : invitation à téléverser l exemple', () => {
    const etat = pile({
      etape: 'fini',
      daplink: { release: '2026-11-25.3' },
      message: TEXTE_DAPLINK_GUIDE,
    });
    assert.equal(messageEtape(etat), TEXTE_DAPLINK_GUIDE);
    assert.equal(messageEtape(etat, true), TEXTE_PLUS_TARD);
    assert.match(messageEtape(etat, true), /[Tt]éléverser l'exemple/);
  });

  it('le guide du DAPLink renvoie aux étapes affichées sous les messages', () => {
    assert.match(TEXTE_DAPLINK_GUIDE, /ci-dessous/);
  });
});

describe('controlesOccupes', () => {
  it('Téléverser et Déconnecter grisés pendant une opération de la carte', () => {
    assert.equal(controlesOccupes({ ...CARTE_LIBRE, occupee: true }, pile({})), true);
  });

  it('grisés aussi pendant chaque étape occupée de la vérification', () => {
    for (const etape of [
      'operateur',
      'lecture',
      'proposition',
      'daplink',
      'telechargement',
      'suppression',
      'ecriture',
      'upgrade',
      'attente',
      'relecture',
    ]) {
      assert.equal(controlesOccupes(CARTE_LIBRE, pile({ etape })), true, etape);
    }
  });

  it('libres carte libre, vérification au repos, en question préalable ou finie', () => {
    for (const etape of ['repos', 'confirmation-verification', 'a-jour', 'fini', 'erreur']) {
      assert.equal(controlesOccupes(CARTE_LIBRE, pile({ etape })), false, etape);
    }
  });
});

describe('issueFocus', () => {
  it('bouton de nouveau actif après le parcours : focaliser', () => {
    assert.equal(
      issueFocus({ libre: true, question: false, etat: pile({ etape: 'a-jour' }) }),
      'focaliser',
    );
  });

  it('une question ou les étapes du DAPLink prennent le focus : oublier', () => {
    for (const libre of [true, false]) {
      const etat = pile({ etape: 'proposition' });
      assert.equal(issueFocus({ libre, question: true, etat }), 'oublier');
    }
  });

  it('parcours en cours (étape occupée ou première question) : attendre', () => {
    for (const etape of ['operateur', 'lecture', 'suppression', 'attente', 'relecture']) {
      assert.equal(
        issueFocus({ libre: false, question: false, etat: pile({ etape }) }),
        'attendre',
        etape,
      );
    }
    const etat = pile({ etape: 'confirmation-verification' });
    assert.equal(issueFocus({ libre: false, question: false, etat }), 'attendre');
  });

  it('parcours fini avec le bouton inactif (carte perdue, occupée) : oublier sans focaliser', () => {
    for (const etape of ['erreur', 'fini', 'repos', 'a-jour']) {
      assert.equal(
        issueFocus({ libre: false, question: false, etat: pile({ etape }) }),
        'oublier',
        etape,
      );
    }
  });
});

describe('morceauxTexte (renvoi vers EasyFlash)', () => {
  it('un texte sans renvoi reste d un seul morceau', () => {
    assert.deepEqual(morceauxTexte(TEXTE_ANNULE), [{ texte: TEXTE_ANNULE, lien: null }]);
  });

  it('chaque fin sans issue porte un lien vers la section « Installer la pile »', () => {
    const textes = [
      texteFusRefuse({ majeur: 1, mineur: 1, sous: 0 }, 'ancien'),
      texteFusRefuse({ majeur: 2, mineur: 0, sous: 0 }, 'inconnu'),
      TEXTE_PILE_ARRETEE,
      TEXTE_PILE_PEUT_ETRE_EFFACEE,
      TEXTE_PILE_ABSENTE_APRES,
      texteEchecInstallation(3),
      texteAutrePile('1.19.0', '1.20.0'),
    ];
    for (const texte of textes) {
      const morceaux = morceauxTexte(texte);
      const liens = morceaux.filter((m) => m.lien);
      assert.deepEqual(liens, [{ texte: LIBELLE_RENVOI, lien: CIBLE_RENVOI }], texte);
      assert.equal(morceaux.map((m) => m.texte).join(''), texte);
    }
  });

  it('le lien cite le titre exact de la page et vise une section qui existe', () => {
    const page = readFileSync(
      new URL('../../../docs/software/pile-radio.md', import.meta.url),
      'utf8',
    );
    const titre = page.match(/^title: (.+)$/m)[1];
    assert.ok(LIBELLE_RENVOI.includes(`« ${titre} »`), LIBELLE_RENVOI);
    assert.match(page, /^## Installer la pile$/m);
    assert.ok(LIBELLE_RENVOI.includes('« Installer la pile »'));
    assert.equal(CIBLE_RENVOI, '/docs/software/pile-radio#installer-la-pile');
  });

  it('texte absent : aucun morceau', () => {
    assert.deepEqual(morceauxTexte(null), []);
  });
});

describe('erreurCarteVisible', () => {
  it('masquée sous le bloc dont la vérification est en erreur', () => {
    assert.equal(erreurCarteVisible(pile({ id: ID, etape: 'erreur', erreur: 'x' }), ID), false);
  });

  it('visible sous les autres blocs, et hors erreur de la vérification', () => {
    assert.equal(
      erreurCarteVisible(pile({ id: ID, etape: 'erreur', erreur: 'x' }), 'BLE/Autre'),
      true,
    );
    for (const etape of ['repos', 'operateur', 'fini', 'a-jour']) {
      assert.equal(erreurCarteVisible(pile({ id: ID, etape }), ID), true, etape);
    }
    assert.equal(erreurCarteVisible(pile({}), ID), true);
  });
});

describe('texteDecompte', () => {
  it('donne les secondes restantes', () => {
    assert.equal(texteDecompte(60), 'Temps restant : 60\u00a0s');
    assert.equal(texteDecompte(1), 'Temps restant : 1\u00a0s');
  });
});

describe('contenuEncart', () => {
  it('première confirmation : le texte du parcours, Continuer ou Annuler', () => {
    const contenu = contenuEncart({
      type: 'confirmation-verification',
      donnees: { id: ID, texte: TEXTE_CONFIRMATION_VERIFICATION },
    });
    assert.ok(contenu.paragraphes.some((p) => p.texte === TEXTE_CONFIRMATION_VERIFICATION));
    assert.deepEqual(
      contenu.boutons.map((b) => [b.valeur, b.libelle, b.principal]),
      [
        ['continuer', 'Continuer', true],
        ['annuler', 'Annuler', false],
      ],
    );
  });

  it('proposition, pile absente : aucune pile, version à installer, durée et consignes', () => {
    const contenu = contenuEncart({ type: 'proposition', donnees: DONNEES });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /Aucune pile radio/);
    assert.match(textes, /BLE HCI Layer 1\.20\.0/);
    assert.ok(textes.includes(TEXTE_DUREE_PILE));
    // Durée mesurée dans Chrome sur la V1c (2026-11-27) : 94 s du clic à la fin.
    assert.match(TEXTE_DUREE_PILE, /une minute et demie/);
    assert.ok(textes.includes(TEXTE_CONSIGNES_PILE));
    assert.doesNotMatch(textes, /effacée/);
    assert.deepEqual(
      contenu.boutons.map((b) => [b.valeur, b.libelle, b.principal]),
      [
        ['installer', 'Installer la pile radio', true],
        ['annuler', 'Annuler', false],
      ],
    );
  });

  it("proposition, pile ancienne : la version trouvée, et l'effacement de l'ancienne", () => {
    const contenu = contenuEncart({
      type: 'proposition',
      donnees: { ...DONNEES, decision: 'ancienne', trouvee: '1.13.0' },
    });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /1\.13\.0/);
    assert.match(textes, /plus ancienne/);
    assert.match(textes, /effacée/);
  });

  it("proposition, pile d'un autre type", () => {
    const contenu = contenuEncart({
      type: 'proposition',
      donnees: { ...DONNEES, decision: 'autre', trouvee: '1.20.0' },
    });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /autre type/);
    assert.match(textes, /effacée/);
  });

  it("proposition, pile plus récente : signalée, l'installation n'est pas mise en avant", () => {
    const contenu = contenuEncart({
      type: 'proposition',
      donnees: { ...DONNEES, decision: 'plus-recente', trouvee: '1.21.0' },
    });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /plus récente que celle du wiki/);
    assert.deepEqual(
      contenu.boutons.map((b) => [b.valeur, b.principal]),
      [
        ['annuler', true],
        ['installer', false],
      ],
    );
  });

  it('proposition, pile à jour (réinstallation forcée) : le dire', () => {
    const contenu = contenuEncart({
      type: 'proposition',
      donnees: { ...DONNEES, decision: 'a-jour', trouvee: '1.20.0' },
    });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /déjà/);
  });

  it('DAPLink à mettre à jour : pas de bouton Installer, la mise à jour guidée ou Plus tard', () => {
    const contenu = contenuEncart({
      type: 'daplink',
      donnees: { ...DONNEES, release: '2026-11-25.3' },
    });
    const textes = contenu.paragraphes.map((p) => p.texte).join('\n');
    assert.match(textes, /Aucune pile radio/);
    assert.match(textes, /DAPLink/);
    assert.match(textes, /2026-11-25\.3/);
    assert.deepEqual(
      contenu.boutons.map((b) => b.valeur),
      ['mettre-a-jour', 'plus-tard'],
    );
  });

  it('DAPLink du wiki illisible : seulement Plus tard', () => {
    const contenu = contenuEncart({ type: 'daplink', donnees: { ...DONNEES, release: null } });
    assert.deepEqual(
      contenu.boutons.map((b) => b.valeur),
      ['plus-tard'],
    );
  });
});

describe('lireForcer', () => {
  it("vrai seulement si l'indicateur vaut '1'", () => {
    const stockage = (valeur) => () => ({ getItem: (cle) => (cle === CLE_FORCER ? valeur : null) });
    assert.equal(CLE_FORCER, 'steami-pile-radio-forcer');
    assert.equal(lireForcer(stockage('1')), true);
    assert.equal(lireForcer(stockage('0')), false);
    assert.equal(lireForcer(stockage(null)), false);
  });

  it('faux si le stockage est absent ou interdit', () => {
    assert.equal(
      lireForcer(() => undefined),
      false,
    );
    assert.equal(
      lireForcer(() => {
        throw new Error('SecurityError');
      }),
      false,
    );
    assert.equal(
      lireForcer(() => ({
        getItem() {
          throw new Error('SecurityError');
        },
      })),
      false,
    );
  });
});

describe('creerSuiviOperateur et operateurSurCarte', () => {
  it("retient l'exemple dont le parcours a flashé l'operator", () => {
    const parcours = fauxParcours();
    const suivi = creerSuiviOperateur(parcours);
    const vus = [];
    suivi.abonner(() => vus.push(suivi.id));
    assert.equal(suivi.id, null);
    parcours.poser({ etape: 'confirmation-verification', id: ID });
    parcours.poser({ etape: 'operateur' });
    assert.equal(suivi.id, null);
    parcours.poser({ etape: 'lecture' });
    assert.equal(suivi.id, ID);
    parcours.poser({ etape: 'a-jour' });
    assert.equal(suivi.id, ID);
    assert.deepEqual(vus, [ID]);
  });

  it('oublier : un téléversement a remplacé le programme', () => {
    const parcours = fauxParcours();
    const suivi = creerSuiviOperateur(parcours);
    parcours.poser({ etape: 'lecture', id: ID });
    suivi.oublier();
    assert.equal(suivi.id, null);
  });

  it("l'operator n'est sur la carte que si le dernier programme flashé vient de cet exemple", () => {
    assert.equal(operateurSurCarte({ ...CARTE_LIBRE, programmeActif: ID }, ID), true);
    assert.equal(operateurSurCarte({ ...CARTE_LIBRE, programmeActif: 'BLE/Autre' }, ID), false);
    assert.equal(operateurSurCarte({ ...CARTE_LIBRE, programmeActif: null }, ID), false);
    assert.equal(operateurSurCarte({ ...CARTE_LIBRE, programmeActif: null }, null), false);
  });
});

describe('retenirCarte', () => {
  it('garde la carte abonnée pendant le parcours, même si aucun bloc ne reste affiché', () => {
    const parcours = fauxParcours();
    let abonnements = 0;
    const carte = {
      abonner() {
        abonnements += 1;
        return () => {
          abonnements -= 1;
        };
      },
    };
    retenirCarte(parcours, carte);
    parcours.poser({ etape: 'confirmation-verification', id: ID });
    assert.equal(abonnements, 0);
    parcours.poser({ etape: 'operateur' });
    assert.equal(abonnements, 1);
    parcours.poser({ etape: 'lecture' });
    parcours.poser({ etape: 'attente', decompte: 3 });
    assert.equal(abonnements, 1);
    parcours.poser({ etape: 'fini' });
    assert.equal(abonnements, 0);
    parcours.poser({ etape: 'operateur' });
    parcours.poser({ etape: 'erreur' });
    assert.equal(abonnements, 0);
  });
});

describe('retenirOnglet', () => {
  it('demande confirmation avant de fermer, de la suppression à la relecture, sans bloc affiché', () => {
    const parcours = fauxParcours();
    const ecouteurs = new Set();
    const fenetre = {
      addEventListener(type, fn) {
        assert.equal(type, 'beforeunload');
        ecouteurs.add(fn);
      },
      removeEventListener(type, fn) {
        assert.equal(type, 'beforeunload');
        ecouteurs.delete(fn);
      },
    };
    retenirOnglet(parcours, fenetre);
    parcours.poser({ etape: 'operateur', id: ID });
    parcours.poser({ etape: 'proposition' });
    assert.equal(ecouteurs.size, 0);
    parcours.poser({ etape: 'suppression' });
    assert.equal(ecouteurs.size, 1);
    parcours.poser({ etape: 'ecriture' });
    parcours.poser({ etape: 'upgrade' });
    parcours.poser({ etape: 'attente', decompte: 3 });
    parcours.poser({ etape: 'attente', decompte: 2 });
    parcours.poser({ etape: 'relecture' });
    assert.equal(ecouteurs.size, 1);

    let annule = false;
    let valeur = null;
    const evenement = {
      preventDefault() {
        annule = true;
      },
      set returnValue(v) {
        valeur = v;
      },
    };
    for (const fn of ecouteurs) fn(evenement);
    assert.equal(annule, true);
    assert.equal(valeur, '');

    parcours.poser({ etape: 'fini' });
    assert.equal(ecouteurs.size, 0);
    parcours.poser({ etape: 'suppression' });
    parcours.poser({ etape: 'erreur' });
    assert.equal(ecouteurs.size, 0);
  });
});

describe('TEXTE_DERNIERE_ETAPE_DAPLINK', () => {
  it('ne demande de choisir la carte que si la fenêtre de connexion s ouvre (carte autorisée reprise)', () => {
    assert.match(TEXTE_DERNIERE_ETAPE_DAPLINK, /si la fenêtre de connexion s'ouvre/);
    assert.match(TEXTE_DERNIERE_ETAPE_DAPLINK, /Vérifier la pile radio/);
  });
});
