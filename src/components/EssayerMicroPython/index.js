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
import { estEnBas, etatWebUSB } from '../EssayerExemple/logique.mjs';
import { TEXTE_EFFACEMENT, texteInstallation, texteMiseAJourDaplink } from './logique.mjs';
import { creerRepl } from './repl.mjs';
import {
  SESSION_INITIALE,
  TEXTE_AUTRE_CAUSE,
  arreter,
  chargerEpingles,
  creerSession,
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

const NOM_FIRMWARE_DAPLINK = 'stm32f103xb_steami32_if_crc.bin';

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

// Question en attente sous le bloc : le focus y passe, pour que les lecteurs
// d'écran la lisent ; jamais sur le bouton d'action, qu'une touche Entrée de
// trop validerait.
function Encart({ encart }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, [encart]);
  const { type, donnees } = encart;
  const repondre = (valeur) => () => session.repondre(valeur);
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
        <p>{texteInstallation(donnees.version)}</p>
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
    <div ref={ref} className={styles.encart} role="group" aria-label="Question" tabIndex={-1}>
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

// Mise à jour du DAPLink, guidée à la main comme dans le Codespace : le
// DAPLink ne peut pas se flasher lui-même.
function EtapesDaplink({ release, href }) {
  return (
    <div className={styles.encart}>
      <p>{texteMiseAJourDaplink(release)}</p>
      <ol className={styles.etapes}>
        <li>
          <a href={href} download={NOM_FIRMWARE_DAPLINK}>
            Télécharger le firmware
          </a>{' '}
          : le fichier <code>{NOM_FIRMWARE_DAPLINK}</code> arrive dans le dossier des
          téléchargements.
        </li>
        <li>
          Créer un fichier vide nommé <code>START_BL.ACT</code> sur le lecteur de la carte (
          <strong>STEAMI</strong>) : la carte redémarre et un lecteur <strong>MAINTENANCE</strong>{' '}
          apparaît à la place.
        </li>
        <li>
          Copier le fichier téléchargé sur le lecteur <strong>MAINTENANCE</strong>, puis attendre
          que le lecteur de la carte revienne.
        </li>
        <li>Cliquer de nouveau sur « Essayer sur la carte », puis choisir la carte.</li>
      </ol>
      <p>
        <Link to="/docs/software/arduino/codespace#le-bouton-redémarrer-la-carte-ne-fonctionne-pas">
          Si le lecteur MAINTENANCE n&apos;apparaît pas
        </Link>
      </p>
      <button type="button" className={communs.boutonSecondaire} onClick={session.reporterDaplink}>
        Plus tard
      </button>
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
  const actif = etat.actif === id;

  // Carte perdue ou libérée : le programme du bloc actif ne s'affiche plus.
  const connecteeAvantRef = useRef(etatCarte.connectee);
  useEffect(() => {
    const perdue = connecteeAvantRef.current && !etatCarte.connectee;
    connecteeAvantRef.current = etatCarte.connectee;
    if (perdue && actif) signalerDeconnexion(session);
  }, [etatCarte.connectee, actif]);

  function lancer() {
    void essayer(
      { id, code, fichiers, confirmation },
      {
        carte,
        creerRepl: nouveauRepl,
        session,
        demander: session.demander,
        epingles: () => epingles(urls),
        urls: { dapjs: urls.dapjs, firmware: urls.firmware },
      },
    );
  }

  const occupee = estOccupee(etat) || etatCarte.occupee;
  const message = actif ? messageSession(etat) : null;
  const erreur = actif ? etat.erreur : null;
  const erreurCarte = etatCarte.dernierClic === id ? etatCarte.erreur : null;
  const encart = etat.encart?.donnees.id === id ? etat.encart : null;
  const montrerConsole =
    actif && (etat.sortie !== '' || etat.traceback !== null || etat.etape === 'programme');

  return (
    <div className={communs.controles}>
      <div className={communs.boutons}>
        <button type="button" className={communs.bouton} disabled={occupee} onClick={lancer}>
          Essayer sur la carte
        </button>
        {actif && peutArreter(etat) && (
          <button
            type="button"
            className={communs.boutonSecondaire}
            onClick={() => arreter({ session })}
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
            onClick={() => carte.deconnecter()}
          >
            Déconnecter
          </button>
        )}
      </div>
      <div className={communs.indicateurs}>
        <EtatCarte statut={statutPastille(etatCarte, etat, id)} />
      </div>
      {encart && <Encart encart={encart} />}
      {actif && etat.daplink && (
        <EtapesDaplink release={etat.daplink.release} href={urls.daplinkBin} />
      )}
      {actif && etat.etape === 'installation' && etatCarte.occupee && (
        <Progression progression={etatCarte.progression} />
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
