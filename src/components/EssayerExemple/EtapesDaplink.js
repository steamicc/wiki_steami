// Mise à jour du DAPLink, guidée à la main comme dans le Codespace : le
// DAPLink ne peut pas se flasher lui-même. Partagée par le bouton « Essayer
// sur la carte » (EssayerMicroPython) et par « Vérifier la pile radio »
// (PileRadio). Le focus y passe à l'affichage, comme pour une question, pour
// que les étapes soient lues.
//
// release : la release épinglée du DAPLink ; href : son firmware sur le wiki ;
// surPlusTard : appelé par « Plus tard » ; derniereEtape : ce qu'il faut
// faire une fois le DAPLink à jour (par défaut, relancer « Essayer sur la
// carte »).
import React, { useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import { texteMiseAJourDaplink } from '../EssayerMicroPython/logique.mjs';
import styles from './styles.module.css';

const NOM_FIRMWARE_DAPLINK = 'stm32f103xb_steami32_if_crc.bin';

const DERNIERE_ETAPE =
  "Cliquer de nouveau sur « Essayer sur la carte », puis choisir la carte si la fenêtre de connexion s'ouvre.";

export default function EtapesDaplink({
  release,
  href,
  surPlusTard,
  derniereEtape = DERNIERE_ETAPE,
}) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      className={styles.encart}
      role="group"
      aria-label="Mise à jour du DAPLink"
      tabIndex={-1}
    >
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
        <li>{derniereEtape}</li>
      </ol>
      <p>
        <Link to="/docs/software/arduino/codespace#le-bouton-redémarrer-la-carte-ne-fonctionne-pas">
          Si le lecteur MAINTENANCE n&apos;apparaît pas
        </Link>
      </p>
      <button type="button" className={styles.boutonSecondaire} onClick={surPlusTard}>
        Plus tard
      </button>
    </div>
  );
}
