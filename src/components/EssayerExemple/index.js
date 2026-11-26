import React, { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ETAT_INITIAL, carte } from './carte.mjs';
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
// messages de l'exemple cliqué.
function EtatCarte({ statut }) {
  return (
    <p className={styles.etatCarte}>
      <span className={styles.pastille} data-statut={statut} aria-hidden="true" />
      Carte : {LIBELLES_STATUT[statut]}
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
// seulement : « Téléversement en cours… » est déjà annoncé.
function Progression({ progression }) {
  const { valeur, texte } = affichageProgression(progression);
  return (
    <div className={styles.progression}>
      <progress
        className={styles.barre}
        max={100}
        value={valeur ?? undefined}
        aria-label="Progression du téléversement"
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
  const urlDapjs = useBaseUrl('/vendor/dapjs-2.3.0/dap.umd.js');
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
  const clique = etat.dernierClic === id;
  const erreur = clique ? etat.erreur : null;
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
    carte.televerser(id, () => telechargerExemple(href));
  }

  function connecter() {
    focaliserApresRef.current = true;
    carte.connecter(id, urlDapjs);
  }

  function deconnecter() {
    refocaliserRef.current = true;
    carte.deconnecter();
  }

  const statutEtat = statutCarte(etat, id);
  // Téléversement lancé depuis cet exemple, téléchargement du .bin compris.
  const televersement = clique && statutEtat === 'televersement';
  const statut = messageStatut(etat, id);

  return (
    <div className={styles.controles}>
      <div className={styles.boutons}>
        {etat.connectee ? (
          <>
            <button
              ref={televerserRef}
              type="button"
              className={styles.bouton}
              disabled={etat.occupee}
              onClick={televerser}
            >
              Téléverser
            </button>
            {/* Libère la carte tout de suite, pour un Codespace ou l'Arduino
                IDE ; grisé pendant un téléversement, qu'il ne faut pas couper. */}
            <button
              type="button"
              className={styles.boutonSecondaire}
              disabled={etat.occupee}
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
      {/* WebUSB peut exister mais être inutilisable (poste géré, Linux sans
          règle udev) : après une erreur, le .bin reste accessible. */}
      {erreur && <Telechargement id={id} href={href} />}
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
