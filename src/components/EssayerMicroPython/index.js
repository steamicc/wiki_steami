// Bouton « Essayer sur la carte » sous un bloc de code MicroPython : lance le
// programme en RAM par le REPL brut, sans l'enregistrer. Le déroulement
// (confirmation, DAPLink, sondage, installation, fichiers, lancement, arrêt)
// est dans deroulement.mjs ; ce fichier ne fait que l'afficher.
//
// Inséré par le plugin remark des blocs exécutables (enregistré dans
// src/theme/MDXComponents.js, sans import dans les pages) :
// <EssayerMicroPython id="…" code="…" fichiers='[{"nom":"pins.py","contenu":"…"}]'
//   confirmation="…" />
import React, { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ETAT_INITIAL, carte } from '../EssayerExemple/carte.mjs';
import { EtatCarte, Progression } from '../EssayerExemple';
import EtapesDaplink from '../EssayerExemple/EtapesDaplink';
import { estEnBas, etatWebUSB } from '../EssayerExemple/logique.mjs';
import {
  TEXTE_DUREE_INSTALLATION,
  TEXTE_EFFACEMENT,
  texteInstallation,
  texteMiseAJourDaplink,
} from './logique.mjs';
import { creerRepl } from './repl.mjs';
import { suivreDefilement } from './defilement.mjs';
import {
  ETAT_INITIAL_PILE,
  controlesOccupes,
  estOccupee as estOccupeePile,
  relaisPile,
} from '../PileRadio/etat.mjs';
import {
  SESSION_INITIALE,
  TEXTE_AUTRE_CAUSE,
  abandonnerBloc,
  arreter,
  chargerEpingles,
  creerSession,
  erreurCarteAffichee,
  essayer,
  estOccupee,
  lireFichiers,
  messageSession,
  peutArreter,
  signalerDeconnexion,
  statutPastille,
  texteConsole,
} from './deroulement.mjs';
import communs from '../EssayerExemple/styles.module.css';
import styles from './styles.module.css';

// Le wiki est une application d'une seule page : la session vit aussi
// longtemps que l'onglet (« Plus tard » est retenu jusqu'au rechargement).
const session = creerSession();

const nouveauRepl = () =>
  creerRepl({
    ecrire: (octets) => carte.ecrireSerie(octets),
    ecouter: (fn) => carte.ecouterSerie(fn),
  });

// Versions épinglées, lues une fois par page ; relues après un échec.
let epinglesEnCours = null;
function epingles(urls) {
  epinglesEnCours ??= chargerEpingles(urls).catch((err) => {
    epinglesEnCours = null;
    throw err;
  });
  return epinglesEnCours;
}

// Sans WebUSB (Firefox, Safari, aperçu dans un cadre) : pas de bouton.
function SansWebUSB() {
  return (
    <p className={styles.sansWebUSB}>
      Pour lancer ce programme sur la carte, utiliser{' '}
      <Link to="/docs/software/micropython/thonny">Thonny</Link> ou{' '}
      <Link to="/docs/software/micropython/mpremote">mpremote</Link> (le bouton « Essayer sur la
      carte » demande Chrome ou Edge).
    </p>
  );
}

// Élément au moins en partie dans la fenêtre.
function estALEcran(element) {
  if (!element) return false;
  const { top, bottom } = element.getBoundingClientRect();
  return bottom > 0 && top < window.innerHeight;
}

// Question en attente sous le bloc : le focus y passe, pour que les lecteurs
// d'écran la lisent ; jamais sur le bouton d'action, qu'une touche Entrée de
// trop validerait. surReponse : le bouton cliqué va disparaître, le bloc
// reprend le focus ensuite. Le focus fait défiler la page pour montrer
// l'encart : à sa fermeture, la page revient où elle était, sauf si la
// personne l'a fait défiler entre-temps ou que le bouton « Essayer »
// (blocRef) n'était pas à l'écran (defilement.mjs). Effet de mise en page : la
// position revient avant que la page ne s'affiche sans l'encart.
function Encart({ encart, surReponse, blocRef }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const suivi = suivreDefilement(
      () => window.scrollY,
      () => estALEcran(blocRef.current),
    );
    suivi.ouvrir(() => ref.current?.focus());
    const surDefilement = () => suivi.surDefilement();
    window.addEventListener('scroll', surDefilement, { passive: true });
    return () => {
      window.removeEventListener('scroll', surDefilement);
      const position = suivi.fermer();
      if (position !== null) window.scrollTo(window.scrollX, position);
    };
  }, [encart]);
  const { type, donnees } = encart;
  const repondre = (valeur) => () => {
    surReponse();
    session.repondre(valeur);
  };
  let contenu;
  let boutons;
  if (type === 'confirmation') {
    contenu = (
      <>
        <p>
          <strong>Ce programme modifie la carte de façon durable.</strong>
        </p>
        <p>{donnees.texte}</p>
      </>
    );
    boutons = [
      ['oui', 'Lancer quand même'],
      ['non', 'Annuler'],
    ];
  } else if (type === 'daplink') {
    contenu = <p>{texteMiseAJourDaplink(donnees.release)}</p>;
    boutons = [
      ['oui', 'Mettre à jour…'],
      ['plus-tard', 'Plus tard'],
    ];
  } else {
    contenu = (
      <>
        <p>{texteInstallation(donnees.version, donnees.raison)}</p>
        <p>{TEXTE_DUREE_INSTALLATION}</p>
        <p>
          <strong>{TEXTE_EFFACEMENT}</strong>
        </p>
        {donnees.autreCause && <p>{TEXTE_AUTRE_CAUSE}</p>}
      </>
    );
    boutons = [
      ['oui', `Installer MicroPython ${donnees.version}`],
      ['non', 'Annuler'],
    ];
  }
  return (
    <div ref={ref} className={communs.encart} role="group" aria-label="Question" tabIndex={-1}>
      {contenu}
      <div className={communs.boutons}>
        {boutons.map(([valeur, libelle], i) => (
          <button
            key={valeur}
            type="button"
            className={i === 0 ? communs.bouton : communs.boutonSecondaire}
            onClick={repondre(valeur)}
          >
            {libelle}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sortie du programme ; l'erreur Python (traceback) est mise en évidence. La
// console suit la sortie, sauf si le lecteur est remonté pour relire.
function Console({ sortie, traceback }) {
  const ref = useRef(null);
  const colleRef = useRef(true);
  useLayoutEffect(() => {
    const pre = ref.current;
    if (pre && colleRef.current) pre.scrollTop = pre.scrollHeight;
  }, [sortie, traceback]);
  return (
    // Région nommée et accessible au clavier pour défiler ; pas role="log",
    // qui ferait lire chaque ligne d'un programme bavard.
    <pre
      ref={ref}
      className={communs.console}
      role="region"
      aria-label="Console MicroPython"
      tabIndex={0}
      onScroll={(evenement) => {
        colleRef.current = estEnBas(evenement.currentTarget);
      }}
    >
      {texteConsole(sortie)}
      {traceback && <span className={styles.traceback}>{texteConsole(traceback)}</span>}
    </pre>
  );
}

function Controles({ id, code, fichiers, confirmation, urls }) {
  const etatCarte = useSyncExternalStore(
    carte.abonner,
    () => carte.etat,
    () => ETAT_INITIAL,
  );
  const etat = useSyncExternalStore(
    session.abonner,
    () => session.etat,
    () => SESSION_INITIALE,
  );
  // Vérification de la pile radio (exemples BLE), une seule par page : tant
  // qu'elle tient la carte, même entre deux commandes et pendant l'attente du
  // FUS, Essayer et Déconnecter sont inactifs ici aussi (une navigation vers
  // une page MicroPython ne l'arrête pas une fois DELETE envoyé).
  const etatPile = useSyncExternalStore(
    relaisPile.abonner,
    () => relaisPile.etat,
    () => ETAT_INITIAL_PILE,
  );
  const actif = etat.actif === id;
  const essayerRef = useRef(null);
  // Le bouton cliqué (Essayer grisé, réponse d'un encart, Arrêter,
  // Déconnecter, Plus tard) disparaît ou se grise : le focus retombe sur la
  // page. Quand le bloc est de nouveau libre, il revient sur « Essayer sur la
  // carte », comme dans EssayerExemple.
  const focaliserApresRef = useRef(false);
  const focaliserApres = () => {
    focaliserApresRef.current = true;
  };

  // Carte absente alors qu'un programme ou une question l'attend (débranchée,
  // libérée, y compris pendant qu'aucun bloc n'était affiché) : l'essai se
  // termine avec un message.
  useEffect(() => {
    if (!actif || etatCarte.connectee) return;
    if (peutArreter(etat) || etat.etape === 'arret' || etat.etape === 'question') {
      signalerDeconnexion(session);
    }
  }, [etatCarte.connectee, actif, etat]);

  // Bloc quitté (navigation) : son essai en préparation ou sa question en
  // attente ne doit pas bloquer les boutons des autres pages.
  useEffect(() => () => abandonnerBloc(session, id), [id]);

  // Installation en cours : fermer ou recharger la page la couperait et
  // laisserait la carte sans firmware. Le navigateur demande confirmation.
  const installation = actif && etat.etape === 'installation';
  useEffect(() => {
    if (!installation) return undefined;
    const retenir = (evenement) => {
      evenement.preventDefault();
      evenement.returnValue = '';
    };
    window.addEventListener('beforeunload', retenir);
    return () => window.removeEventListener('beforeunload', retenir);
  }, [installation]);

  function lancer() {
    focaliserApres();
    void essayer(
      { id, code, fichiers, confirmation },
      {
        carte,
        creerRepl: nouveauRepl,
        session,
        demander: session.demander,
        epingles: () => epingles(urls),
        urls: { dapjs: urls.dapjs, firmware: urls.firmware },
        // Relu au moment d'agir : le clic peut partir avant le rendu.
        pileOccupee: () => estOccupeePile(relaisPile.etat),
      },
    );
  }

  const occupee = estOccupee(etat) || controlesOccupes(etatCarte, etatPile);
  // 'televersement' : la carte est réservée par l'installation de MicroPython.
  const statut = statutPastille(etatCarte, etat, id);
  const message = actif ? messageSession(etat) : null;
  const erreur = actif ? etat.erreur : null;
  // Erreur de la connexion partagée, avec les mots de ce bouton (voir
  // traduireMessageCarte).
  const erreurCarte = erreurCarteAffichee(etatCarte, etat, id);
  const encart = etat.encart?.donnees.id === id ? etat.encart : null;
  const etapesDaplink = actif && etat.daplink;

  useLayoutEffect(() => {
    if (!focaliserApresRef.current || occupee) return;
    // Une question ou les étapes du DAPLink prennent elles-mêmes le focus.
    if (encart || etapesDaplink) {
      focaliserApresRef.current = false;
      return;
    }
    focaliserApresRef.current = false;
    const actuel = document.activeElement;
    if (actuel && actuel !== document.body) return;
    // Sans défilement : la page est déjà revenue à sa position (Encart).
    essayerRef.current?.focus({ preventScroll: true });
  }, [occupee, encart, etapesDaplink, etat.etape, etatCarte.connectee]);
  const montrerConsole =
    actif && (etat.sortie !== '' || etat.traceback !== null || etat.etape === 'programme');

  return (
    <div className={communs.controles}>
      <div className={communs.boutons}>
        <button
          ref={essayerRef}
          type="button"
          className={communs.bouton}
          disabled={occupee}
          onClick={lancer}
        >
          Essayer sur la carte
        </button>
        {actif && peutArreter(etat) && (
          <button
            type="button"
            className={communs.boutonSecondaire}
            onClick={() => {
              focaliserApres();
              void arreter({ session });
            }}
          >
            Arrêter
          </button>
        )}
        {etatCarte.connectee && (
          // Libère la carte pour Thonny, mpremote ou un Codespace.
          <button
            type="button"
            className={communs.boutonSecondaire}
            disabled={occupee}
            onClick={() => {
              focaliserApres();
              void carte.deconnecter();
            }}
          >
            Déconnecter
          </button>
        )}
      </div>
      <div className={communs.indicateurs}>
        <EtatCarte
          statut={statut}
          libelle={statut === 'televersement' ? 'installation' : undefined}
        />
      </div>
      {encart && <Encart encart={encart} surReponse={focaliserApres} blocRef={essayerRef} />}
      {etapesDaplink && (
        <EtapesDaplink
          release={etat.daplink.release}
          href={urls.daplinkBin}
          surPlusTard={() => {
            focaliserApres();
            session.reporterDaplink();
          }}
        />
      )}
      {installation && etatCarte.occupee && (
        <Progression progression={etatCarte.progression} libelle="Progression de l'installation" />
      )}
      <div className={communs.messages} aria-live="polite">
        {message && <p className={communs.statut}>{message}</p>}
        {erreur && <p className={communs.erreur}>{erreur}</p>}
        {erreurCarte && <p className={communs.erreur}>{erreurCarte}</p>}
      </div>
      {montrerConsole && <Console sortie={etat.sortie} traceback={etat.traceback} />}
    </div>
  );
}

function ControlesOuRenvoi(props) {
  if (etatWebUSB(navigator, window.top === window.self) !== 'ok') return <SansWebUSB />;
  return <Controles {...props} />;
}

// id : identifiant du bloc dans la page ; code : le programme ; fichiers :
// JSON des fichiers annexes (facultatif) ; confirmation : ce que le programme
// modifie durablement (facultatif, demande « Lancer quand même »).
export default function EssayerMicroPython({ id, code, fichiers, confirmation }) {
  const urls = {
    dapjs: useBaseUrl('/vendor/dapjs-2.3.0/dap.umd.js'),
    firmware: useBaseUrl('/micropython/firmware.bin'),
    micropython: useBaseUrl('/micropython/index.json'),
    daplink: useBaseUrl('/daplink/firmware.json'),
    daplinkBin: useBaseUrl('/daplink/firmware.bin'),
  };
  const liste = lireFichiers(fichiers);
  if (typeof id !== 'string' || !id || typeof code !== 'string' || liste === null) {
    return (
      <p className={communs.erreur}>
        Bloc MicroPython mal déclaré ({String(id)}) : signaler le problème sur le dépôt du wiki.
      </p>
    );
  }
  return (
    <div className={communs.essayer}>
      <BrowserOnly fallback={<SansWebUSB />}>
        {() => (
          <ControlesOuRenvoi
            id={id}
            code={code}
            fichiers={liste}
            confirmation={confirmation || undefined}
            urls={urls}
          />
        )}
      </BrowserOnly>
    </div>
  );
}
