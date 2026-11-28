// Limite d'erreur (error boundary) autour d'un composant chargé à la demande
// (React.lazy) : si l'import de son morceau échoue (coupure réseau, morceau
// retiré par un nouveau déploiement) ou si son rendu lève une erreur, lui seul
// est remplacé par un message court, et le reste du bloc reste utilisable.
// Sans elle, l'erreur remonterait jusqu'à Docusaurus, qui remplace toute la
// page par son écran d'erreur.
//
// React.lazy garde l'échec de l'import : un nouvel essai demande de recharger
// la page, ce que dit le message. Pas de région aria-live : chaque exemple de
// la page l'affiche, une annonce serait répétée autant de fois.
//
// Fichier .mjs sans JSX, pour être testé par node --test.
import React from 'react';

export class LimiteChargement extends React.Component {
  constructor(props) {
    super(props);
    this.state = { echec: false };
  }

  static getDerivedStateFromError() {
    return { echec: true };
  }

  // message : texte affiché à la place du composant ; className : sa classe.
  render() {
    if (!this.state.echec) return this.props.children;
    return React.createElement('p', { className: this.props.className }, this.props.message);
  }
}
