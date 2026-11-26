import React, { useState, useSyncExternalStore } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { carte } from './carte';
import { etatWebUSB, idValide, messageErreur, nomFichier, urlBin } from './logique.mjs';
import styles from './styles.module.css';

const ETAT_SERVEUR = Object.freeze({
  connectee: false,
  occupee: false,
  exempleActif: null,
  lignes: [],
  erreur: null,
});

function Telechargement({ id, href }) {
  return (
    <p className={styles.telechargement}>
      <a href={href} download={nomFichier(id)}>
        Télécharger le .bin
      </a>{' '}
      Glisse ce fichier sur le lecteur STEAMI de la carte.
    </p>
  );
}

function Controles({ id, href }) {
  const etat = useSyncExternalStore(
    carte.abonner,
    () => carte.etat,
    () => ETAT_SERVEUR,
  );
  const urlDapjs = useBaseUrl('/vendor/dapjs-2.3.0/dap.umd.js');
  const [aClique, setAClique] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreurLocale, setErreurLocale] = useState(null);

  const actif = etat.exempleActif === id;
  const occupe = etat.occupee || chargement;
  // Une erreur de connexion n'appartient à aucun exemple : seul l'exemple cliqué l'affiche.
  const erreur =
    erreurLocale || (actif || (etat.exempleActif === null && aClique) ? etat.erreur : null);

  async function televerser() {
    setAClique(true);
    setErreurLocale(null);
    setChargement(true);
    try {
      const reponse = await fetch(href);
      if (!reponse.ok) throw new Error(`Exemple introuvable (${reponse.status}).`);
      await carte.televerser(id, await reponse.arrayBuffer());
    } catch (err) {
      setErreurLocale(messageErreur(err));
    } finally {
      setChargement(false);
    }
  }

  function connecter() {
    setAClique(true);
    setErreurLocale(null);
    carte.connecter(urlDapjs);
  }

  let statut = null;
  if (actif && etat.occupee) statut = 'Téléversement en cours…';
  else if (actif && etat.connectee && !etat.erreur) statut = 'Programme téléversé.';

  return (
    <div className={styles.controles}>
      {etat.connectee ? (
        <button type="button" className={styles.bouton} disabled={occupe} onClick={televerser}>
          Téléverser
        </button>
      ) : (
        <button type="button" className={styles.bouton} disabled={occupe} onClick={connecter}>
          Connecter la carte
        </button>
      )}
      <div className={styles.messages} aria-live="polite">
        {statut && <p className={styles.statut}>{statut}</p>}
        {erreur && <p className={styles.erreur}>{erreur}</p>}
      </div>
      {actif && etat.lignes.length > 0 && (
        <pre className={styles.console} aria-label="Console série">
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
