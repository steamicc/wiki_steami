import React, { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ETAT_INITIAL, carte } from './carte.mjs';
import {
  estEnBas,
  etatWebUSB,
  idValide,
  nomFichier,
  telechargerExemple,
  urlBin,
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

function Controles({ id, href }) {
  const etat = useSyncExternalStore(
    carte.abonner,
    () => carte.etat,
    () => ETAT_INITIAL,
  );
  const urlDapjs = useBaseUrl('/vendor/dapjs-2.3.0/dap.umd.js');
  const consoleRef = useRef(null);
  const connecterRef = useRef(null);
  // Après « Déconnecter », le bouton cliqué disparaît : le focus passe à
  // « Connecter la carte », qui le remplace, au lieu de retomber sur la page.
  const refocaliserRef = useRef(false);
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

  useLayoutEffect(() => {
    if (etat.connectee || !refocaliserRef.current) return;
    refocaliserRef.current = false;
    connecterRef.current?.focus();
  }, [etat.connectee]);

  function televerser() {
    carte.televerser(id, () => telechargerExemple(href));
  }

  function connecter() {
    carte.connecter(id, urlDapjs);
  }

  function deconnecter() {
    refocaliserRef.current = true;
    carte.deconnecter();
  }

  let statut = null;
  if (clique && etat.occupee && etat.connectee) statut = 'Téléversement en cours…';
  else if (clique && etat.programmeActif === id && etat.connectee && !etat.occupee && !erreur) {
    statut = 'Programme téléversé.';
  }

  return (
    <div className={styles.controles}>
      <div className={styles.boutons}>
        {etat.connectee ? (
          <>
            <button
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
