// Bouton « Vérifier la pile radio » sous un exemple BLE (EssayerExemple, ids
// BLE/…, avec WebUSB) : lit la pile radio de la carte par l'operator
// d'EasyFlash et, si elle manque ou n'est pas celle du wiki, propose de
// l'installer. Le déroulement est dans deroulement.mjs, les textes et les
// règles d'affichage dans affichage.mjs ; ce fichier ne fait que l'afficher.
import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { ETAT_INITIAL, carte } from '../EssayerExemple/carte.mjs';
import EtapesDaplink from '../EssayerExemple/EtapesDaplink';
import {
  TEXTE_DERNIERE_ETAPE_DAPLINK,
  boutonPileActif,
  contenuEncart,
  creerSuiviOperateur,
  doitAbandonner,
  issueFocus,
  lireForcer,
  messageEtape,
  morceauxTexte,
  questionEnAttente,
  retenirCarte,
  retenirOnglet,
  texteDecompte,
} from './affichage.mjs';
import { ETAT_INITIAL_PILE, parcoursPile } from './deroulement.mjs';
import { relaisPile } from './etat.mjs';
import communs from '../EssayerExemple/styles.module.css';

// Une seule vérification par page (parcoursPile, comme la carte) : la carte
// reste retenue pendant le parcours, l'onglet aussi pendant l'installation
// (même si le bloc a disparu), et l'operator écrit est suivi pour l'état
// affiché sous l'exemple (voir affichage.mjs). Ce module n'est chargé que
// sous un exemple BLE (import dynamique d'EssayerExemple) : il branche alors
// le parcours et le suivi sur relaisPile, que lisent tous les blocs.
retenirCarte(parcoursPile, carte);
if (typeof window !== 'undefined') retenirOnglet(parcoursPile, window);
export const suiviOperateur = creerSuiviOperateur(parcoursPile);
relaisPile.brancher(parcoursPile, suiviOperateur);

const lireStockage = () => window.localStorage;

// Question en attente sous le bloc : le focus y passe, pour que les lecteurs
// d'écran la lisent ; jamais sur le bouton d'action, qu'une touche Entrée de
// trop validerait. surReponse : le bouton cliqué va disparaître, le bloc
// reprend le focus ensuite.
function Encart({ encart, surReponse }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, [encart]);
  const { paragraphes, boutons } = contenuEncart(encart);
  return (
    <div ref={ref} className={communs.encart} role="group" aria-label="Question" tabIndex={-1}>
      {paragraphes.map(({ texte, fort }) => (
        <p key={texte}>{fort ? <strong>{texte}</strong> : texte}</p>
      ))}
      <div className={communs.boutons}>
        {boutons.map(({ valeur, libelle, principal }) => (
          <button
            key={valeur}
            type="button"
            className={principal ? communs.bouton : communs.boutonSecondaire}
            onClick={() => {
              surReponse();
              parcoursPile.confirmer(valeur);
            }}
          >
            {libelle}
          </button>
        ))}
      </div>
    </div>
  );
}

// Message ou erreur du parcours : le renvoi vers EasyFlash est un lien vers
// la section « Installer la pile » de la page « Pile radio Bluetooth ». Les
// morceaux d'un texte ne changent pas d'ordre : la clé est leur rang.
function Texte({ texte }) {
  return morceauxTexte(texte).map(({ texte: morceau, lien }, i) =>
    lien ? (
      <Link key={i} to={lien}>
        {morceau}
      </Link>
    ) : (
      <React.Fragment key={i}>{morceau}</React.Fragment>
    ),
  );
}

export default function PileRadio({ id }) {
  const etatCarte = useSyncExternalStore(
    carte.abonner,
    () => carte.etat,
    () => ETAT_INITIAL,
  );
  const etat = useSyncExternalStore(
    parcoursPile.abonner,
    () => parcoursPile.etat,
    () => ETAT_INITIAL_PILE,
  );
  const urls = {
    operateur: useBaseUrl('/pile-radio/operateur.hex'),
    installation: useBaseUrl('/pile-radio/installation.hex'),
    index: useBaseUrl('/pile-radio/index.json'),
    daplink: useBaseUrl('/daplink/firmware.json'),
  };
  const urlDaplinkBin = useBaseUrl('/daplink/firmware.bin');
  const boutonRef = useRef(null);
  // Le bouton cliqué (Vérifier grisé, réponse d'un encart, Plus tard)
  // disparaît ou se grise : le focus retombe sur la page. Quand le parcours
  // est fini, il revient sur « Vérifier la pile radio », comme pour
  // MicroPython.
  const focaliserApresRef = useRef(false);
  const focaliserApres = () => {
    focaliserApresRef.current = true;
  };
  // Étapes du DAPLink fermées par « Plus tard » : l'objet daplink du
  // parcours, qui change à chaque nouvelle vérification.
  const [daplinkFerme, setDaplinkFerme] = useState(null);

  const actif = etat.id === id;
  const encart = actif ? etat.encart : null;
  const etapesDaplink = actif && etat.daplink !== null && etat.daplink !== daplinkFerme;
  const libre = boutonPileActif(etatCarte, etat);

  // Bloc quitté (navigation) : sa vérification, question en attente ou
  // étape occupée, ne doit pas bloquer les boutons des autres pages. Lu au
  // démontage, pas à chaque rendu.
  useEffect(
    () => () => {
      if (doitAbandonner(parcoursPile.etat, id)) parcoursPile.annuler();
    },
    [id],
  );

  // Carte perdue pendant une question : le parcours s'arrête avec un message,
  // au lieu d'attendre une réponse qui ne servirait plus.
  useEffect(() => {
    if (!etatCarte.connectee && questionEnAttente(etat, id)) parcoursPile.annuler();
  }, [etatCarte.connectee, etat, id]);

  // La demande ne vit que le temps du parcours (voir issueFocus).
  useLayoutEffect(() => {
    if (!focaliserApresRef.current) return;
    const issue = issueFocus({ libre, question: Boolean(encart || etapesDaplink), etat });
    if (issue === 'attendre') return;
    focaliserApresRef.current = false;
    if (issue === 'oublier') return;
    const actuel = document.activeElement;
    if (actuel && actuel !== document.body) return;
    boutonRef.current?.focus();
  }, [libre, encart, etapesDaplink, etat]);

  function verifier() {
    focaliserApres();
    void parcoursPile.verifier(id, { carte, urls, forcer: lireForcer(lireStockage) });
  }

  // Étapes du DAPLink fermées : leur message (« Suivre les étapes
  // ci-dessous… ») laisse place à l'invitation à téléverser l'exemple.
  const daplinkReporte = actif && etat.daplink !== null && etat.daplink === daplinkFerme;
  const message = actif ? messageEtape(etat, daplinkReporte) : null;
  const erreur = actif ? etat.erreur : null;
  const decompte = actif && etat.etape === 'attente' ? etat.decompte : null;

  return (
    <>
      <div className={communs.boutons}>
        <button
          ref={boutonRef}
          type="button"
          className={communs.boutonSecondaire}
          disabled={!libre}
          onClick={verifier}
        >
          Vérifier la pile radio
        </button>
      </div>
      {encart && <Encart encart={encart} surReponse={focaliserApres} />}
      {/* Messages avant les étapes du DAPLink : leur guide dit « Suivre les
          étapes ci-dessous ». */}
      <div className={communs.messages} aria-live="polite">
        {message && (
          <p className={communs.statut}>
            <Texte texte={message} />
          </p>
        )}
        {erreur && (
          <p className={communs.erreur}>
            <Texte texte={erreur} />
          </p>
        )}
      </div>
      {/* role="timer" : pas d'annonce à chaque seconde. */}
      {decompte !== null && (
        <p className={communs.statut} role="timer">
          {texteDecompte(decompte)}
        </p>
      )}
      {etapesDaplink && (
        <EtapesDaplink
          release={etat.daplink.release}
          href={urlDaplinkBin}
          derniereEtape={TEXTE_DERNIERE_ETAPE_DAPLINK}
          surPlusTard={() => {
            focaliserApres();
            setDaplinkFerme(etat.daplink);
          }}
        />
      )}
    </>
  );
}
