// Position de la page pendant une question (encart), sans DOM : le composant
// passe la lecture de window.scrollY et les événements « scroll ».
//
// L'encart prend le focus à son apparition (pour les lecteurs d'écran), ce
// qui fait défiler la page pour le montrer en entier. À sa fermeture, le code
// de l'exemple, au-dessus, sortirait de l'écran : la page revient à sa
// position d'avant le focus, sauf si la personne l'a fait défiler entre-temps.

// Écart (px) toléré entre deux lectures de la position : les positions
// fractionnaires (zoom) ne comptent pas comme un défilement.
const TOLERANCE_PX = 1;

// lirePosition : () => window.scrollY.
export function suivreDefilement(lirePosition) {
  // Position avant le focus, et juste après (défilement dû au focus).
  let avant = null;
  let apresFocus = null;
  let defileeParLaPersonne = false;

  return {
    // L'encart apparaît : focaliser() lui donne le focus.
    ouvrir(focaliser) {
      avant = lirePosition();
      focaliser();
      apresFocus = lirePosition();
      defileeParLaPersonne = false;
    },
    // Événement « scroll » de la page. Celui du focus arrive après coup, à la
    // position déjà lue : seul un autre défilement compte.
    surDefilement() {
      if (apresFocus === null) return;
      if (Math.abs(lirePosition() - apresFocus) > TOLERANCE_PX) defileeParLaPersonne = true;
    },
    // L'encart disparaît : position où revenir, ou null pour ne pas bouger.
    fermer() {
      const position =
        apresFocus !== null && !defileeParLaPersonne && Math.abs(apresFocus - avant) > TOLERANCE_PX
          ? avant
          : null;
      avant = null;
      apresFocus = null;
      defileeParLaPersonne = false;
      return position;
    },
  };
}
