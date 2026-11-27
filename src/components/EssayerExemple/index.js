import React, { Suspense, lazy, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ETAT_INITIAL, carte } from './carte.mjs';
import { ETAT_INITIAL_DAPLINK, verificationDaplink } from './daplink.mjs';
import EtapesDaplink from './EtapesDaplink';
import {
  ETAT_INITIAL_PILE,
  controlesOccupes,
  erreurCarteVisible,
  estOccupee,
  operateurSurCarte,
  pileRadioVisible,
  relaisPile,
} from '../PileRadio/etat.mjs';
import {
  LIBELLES_STATUT,
  affichageProgression,
  estEnBas,
  etatWebUSB,
  idValide,
  messageStatut,
  nomFichier,
  statutCarte,
  telechargerExemple,
  urlBin,
  voyantVisible,
} from './logique.mjs';
import styles from './styles.module.css';

// Bouton « Vérifier la pile radio » : chargé à la demande, seulement sous un
// exemple BLE/… (pileRadioVisible). Les autres pages n'en chargent ni le
// code ni les effets de module (retenue de la carte et de l'onglet). Une
// fois chargé, il branche son parcours sur relaisPile (etat.mjs), que lisent
// les blocs de la page.
const PileRadio = lazy(() => import('../PileRadio'));

function Telechargement({ id, href }) {
  return (
    <p className={styles.telechargement}>
      <a href={href} download={nomFichier(id)}>
        Télécharger le .bin
      </a>{' '}
      Glisser ce fichier sur le lecteur STEAMI de la carte.
    </p>
  );
}

// État de la carte : pastille de couleur et libellé, jamais la couleur seule.
// Pas de région aria-live : chaque exemple de la page l'affiche, une
// annonce serait répétée autant de fois. Les annonces passent par les
// messages de l'exemple cliqué. libelle : remplace celui du statut (le
// composant MicroPython dit « installation » au lieu de « téléversement »).
export function EtatCarte({ statut, libelle }) {
  return (
    <p className={styles.etatCarte}>
      <span className={styles.pastille} data-statut={statut} aria-hidden="true" />
      Carte : {libelle ?? LIBELLES_STATUT[statut]}
    </p>
  );
}

// Voyant d'activité série : la clé change à chaque signal (au plus dix par
// seconde, voir activiteASignaler), ce qui recrée le voyant et rejoue son
// clignotement CSS. Avec « réduire les animations », il reste allumé dès que
// des données sont arrivées.
function VoyantSerie({ activite }) {
  const actif = activite > 0;
  return (
    <p className={styles.etatCarte}>
      <span
        key={activite}
        className={styles.voyant}
        data-actif={actif ? 'oui' : 'non'}
        aria-hidden="true"
      />
      Réception série : {actif ? 'données reçues' : 'en attente'}
    </p>
  );
}

// Barre native : les lecteurs d'écran en donnent la valeur. Tant que DAP.js
// n'a pas commencé à écrire, elle est indéterminée (pas d'attribut value) et
// annonce la préparation de la carte. Le texte écrit à côté est pour les yeux
// seulement : « Téléversement en cours… » est déjà annoncé. libelle : nom de
// la barre pour les lecteurs d'écran.
export function Progression({ progression, libelle = 'Progression du téléversement' }) {
  const { valeur, texte } = affichageProgression(progression);
  return (
    <div className={styles.progression}>
      <progress
        className={styles.barre}
        max={100}
        value={valeur ?? undefined}
        aria-label={libelle}
      />
      <span aria-hidden="true">{texte}</span>
    </div>
  );
}

function Controles({ id, href }) {
  const etat = useSyncExternalStore(
    carte.abonner,
    () => carte.etat,
    () => ETAT_INITIAL,
  );
  // Vérification de la pile radio (exemples BLE) : une seule par page, lue
  // par le relais (état initial tant que PileRadio n'est pas chargé). Tant
  // qu'elle tient la carte, Téléverser et Déconnecter sont inactifs sous
  // tous les exemples.
  const etatPile = useSyncExternalStore(
    relaisPile.abonner,
    () => relaisPile.etat,
    () => ETAT_INITIAL_PILE,
  );
  const idOperateur = useSyncExternalStore(
    relaisPile.abonner,
    () => relaisPile.idOperateur,
    () => null,
  );
  // DAPLink plus ancien que celui du wiki : un seul encart pour la page,
  // affiché sous l'exemple cliqué en dernier. Il reste après une
  // déconnexion (redémarrage en MAINTENANCE pendant la mise à jour).
  const etatDaplink = useSyncExternalStore(
    verificationDaplink.abonner,
    () => verificationDaplink.etat,
    () => ETAT_INITIAL_DAPLINK,
  );
  const pileOccupee = estOccupee(etatPile);
  const occupee = controlesOccupes(etat, etatPile);
  const urlDapjs = useBaseUrl('/vendor/dapjs-2.3.0/dap.umd.js');
  const urlFirmwareJson = useBaseUrl('/daplink/firmware.json');
  const urlFirmwareBin = useBaseUrl('/daplink/firmware.bin');
  const consoleRef = useRef(null);
  const connecterRef = useRef(null);
  const televerserRef = useRef(null);
  // Après « Déconnecter », le bouton cliqué disparaît : le focus passe à
  // « Connecter la carte », qui le remplace, au lieu de retomber sur la page.
  const refocaliserRef = useRef(false);
  // Pendant une connexion ou un téléversement lancé depuis cet exemple, le
  // bouton cliqué est grisé, voire remplacé : il perd le focus. À la fin de
  // l'opération, le focus revient sur le bouton suivant de cet exemple.
  const focaliserApresRef = useRef(false);
  // Le lecteur était-il en bas de la console à son dernier défilement ?
  const colleRef = useRef(true);

  // Statut et erreur ne s'affichent que sous l'exemple cliqué en dernier.
  // Vérification de la pile radio en erreur sous cet exemple : son message
  // remplace celui de la carte, qui parlerait de MicroPython.
  const clique = etat.dernierClic === id;
  const erreur = clique && erreurCarteVisible(etatPile, id) ? etat.erreur : null;
  const montrerConsole = etat.programmeActif === id && etat.lignes.length > 0;

  // La console suit les nouvelles lignes, sauf si le lecteur est remonté.
  useLayoutEffect(() => {
    const pre = consoleRef.current;
    if (!pre) {
      colleRef.current = true;
      return;
    }
    if (colleRef.current) pre.scrollTop = pre.scrollHeight;
  }, [etat.lignes, montrerConsole]);

  // Valeur de etat.connectee au rendu précédent, pour ne réagir qu'au passage
  // de connectée à déconnectée (et pas au montage du composant).
  const connecteeAvantRef = useRef(etat.connectee);

  useLayoutEffect(() => {
    const vientDeSeDeconnecter = connecteeAvantRef.current && !etat.connectee;
    connecteeAvantRef.current = etat.connectee;
    if (etat.connectee) return;
    if (refocaliserRef.current) {
      refocaliserRef.current = false;
      connecterRef.current?.focus();
      return;
    }
    // Carte débranchée hors de toute opération : « Téléverser » et
    // « Déconnecter » disparaissent. Si le focus est retombé sur la page, il
    // passe à « Connecter la carte » de l'exemple cliqué en dernier.
    // Comportement non couvert par les tests (pas de rendu du composant).
    if (!vientDeSeDeconnecter || !clique) return;
    const actif = document.activeElement;
    if (actif && actif !== document.body) return;
    connecterRef.current?.focus();
  }, [etat.connectee, clique]);

  // Opération finie : « Téléverser » si la carte est connectée, sinon
  // « Connecter la carte » (connexion échouée). Seulement si le focus est
  // perdu (retombé sur la page) : s'il est ailleurs, le lecteur l'y a mis.
  useLayoutEffect(() => {
    if (etat.occupee || !focaliserApresRef.current) return;
    focaliserApresRef.current = false;
    const actif = document.activeElement;
    if (actif && actif !== document.body) return;
    (etat.connectee ? televerserRef : connecterRef).current?.focus();
  }, [etat.occupee, etat.connectee]);

  function televerser() {
    focaliserApresRef.current = true;
    // Le programme de lecture de la pile radio va être remplacé. Une
    // vérification finie en erreur s'efface : l'erreur éventuelle du
    // téléversement doit se voir.
    relaisPile.oublierOperateur();
    relaisPile.oublierErreur();
    carte.televerser(id, () => telechargerExemple(href));
  }

  // Une fois connectée, la version du DAPLink est comparée à celle épinglée
  // par le wiki. verifier ne rejette jamais : un échec laisse l'encart masqué.
  async function connecter() {
    focaliserApresRef.current = true;
    relaisPile.oublierErreur();
    await carte.connecter(id, urlDapjs);
    if (!carte.etat.connectee) return;
    await verificationDaplink.verifier({
      numeroSerie: carte.numeroSerie,
      lireReponse: carte.lireReponseVersionDaplink,
      chargerEpingle: () => fetch(urlFirmwareJson).then((r) => r.json()),
    });
  }

  function deconnecter() {
    refocaliserRef.current = true;
    carte.deconnecter();
  }

  // Après une vérification de la pile radio, la carte garde l'operator, que
  // carte.mjs compte comme le programme de cet exemple : l'état affiché est
  // « connectée », sans « Programme téléversé. ». Pendant la vérification,
  // ses propres messages remplacent le statut.
  const operateur = operateurSurCarte(etat, idOperateur);
  const statutEtat = statutCarte(operateur ? { ...etat, programmeActif: null } : etat, id);
  // Téléversement lancé depuis cet exemple, téléchargement du .bin compris.
  const televersement = clique && statutEtat === 'televersement';
  const statut = operateur || (pileOccupee && etatPile.id === id) ? null : messageStatut(etat, id);

  return (
    <div className={styles.controles}>
      <div className={styles.boutons}>
        {etat.connectee ? (
          <>
            <button
              ref={televerserRef}
              type="button"
              className={styles.bouton}
              disabled={occupee}
              onClick={televerser}
            >
              Téléverser
            </button>
            {/* Libère la carte tout de suite, pour un Codespace ou l'Arduino
                IDE ; grisé pendant un téléversement ou une vérification de la
                pile radio, qu'il ne faut pas couper. */}
            <button
              type="button"
              className={styles.boutonSecondaire}
              disabled={occupee}
              onClick={deconnecter}
            >
              Déconnecter
            </button>
          </>
        ) : (
          <button
            ref={connecterRef}
            type="button"
            className={styles.bouton}
            disabled={etat.occupee}
            onClick={connecter}
          >
            Connecter la carte
          </button>
        )}
      </div>
      <div className={styles.indicateurs}>
        <EtatCarte statut={statutEtat} />
        {voyantVisible(etat, id) && <VoyantSerie activite={etat.activite} />}
      </div>
      {televersement && <Progression progression={etat.progression} />}
      <div className={styles.messages} aria-live="polite">
        {statut && <p className={styles.statut}>{statut}</p>}
        {erreur && <p className={styles.erreur}>{erreur}</p>}
      </div>
      {etatDaplink.release !== null && clique && (
        <EtapesDaplink
          release={etatDaplink.release}
          href={urlFirmwareBin}
          surPlusTard={verificationDaplink.reporter}
          derniereEtape="Cliquer sur « Connecter la carte », puis sur « Téléverser »."
        />
      )}
      {/* WebUSB peut exister mais être inutilisable (poste géré, Linux sans
          règle udev) : après une erreur, le .bin reste accessible. */}
      {erreur && <Telechargement id={id} href={href} />}
      {pileRadioVisible(id) && (
        <Suspense fallback={null}>
          <PileRadio id={id} />
        </Suspense>
      )}
      {montrerConsole && (
        // Région nommée et accessible au clavier pour défiler ; pas role="log",
        // qui ferait lire cinq lignes par seconde.
        <pre
          ref={consoleRef}
          className={styles.console}
          role="region"
          aria-label="Console série"
          tabIndex={0}
          onScroll={(evenement) => {
            colleRef.current = estEnBas(evenement.currentTarget);
          }}
        >
          {etat.lignes.join('\n')}
        </pre>
      )}
    </div>
  );
}

function ControlesOuTelechargement({ id, href }) {
  const etat = etatWebUSB(navigator, window.top === window.self);
  if (etat !== 'ok') return <Telechargement id={id} href={href} />;
  return <Controles id={id} href={href} />;
}

// id : « COMPOSANT/NomExemple », par exemple « VL53L1X/GestureDetection ».
export default function EssayerExemple({ id }) {
  const href = useBaseUrl(urlBin(String(id)));
  if (!idValide(id)) {
    return <p className={styles.erreur}>Exemple inconnu : {String(id)}</p>;
  }
  return (
    <div className={styles.essayer}>
      <BrowserOnly fallback={<Telechargement id={id} href={href} />}>
        {() => <ControlesOuTelechargement id={id} href={href} />}
      </BrowserOnly>
    </div>
  );
}
