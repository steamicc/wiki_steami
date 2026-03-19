---
sidebar_position: 7
title: "Microphone"
---

# Microphone

**Identifiant** : FP5

Un microphone est integre pour l'entree audio, utilisant le modele IMP34DT05 de STMicroelectronics. Il se connecte au microcontroleur pour traiter les donnees sonores.

## Caracteristiques

- **Composant** : STMicroelectronics IMP34DT05
- **Type** : Microphone MEMS PDM (Pulse Density Modulation)
- **Application** : Industrielle (haute qualite)
- **Directivite** : Omnidirectionnel
- **Signaux** :
  - `MIC_IN` (MICRO_DATA) -> PA10 (STM32WB55)
  - `MIC_CLK` (MICRO_CLK) -> PA3 (STM32WB55)
