---
sidebar_position: 1
title: "Hardware"
---

# Hardware - Blocs fonctionnels

La carte STeaMi est organisee en 16 blocs fonctionnels, chacun correspondant a une fonction specifique du systeme. Cette section decrit en detail chaque bloc.

## Liste des blocs fonctionnels

| Id | Bloc fonctionnel | Description |
|----|-------------------|-------------|
| FP0 | [Vue systeme](./system-overview) | Vue d'ensemble du systeme STEAM32 |
| FP1 | [Batterie](./battery) | Batterie LiPo, autonomie 1 jour / 5-10 jours |
| FP2 | [Chargeur de batterie](./battery-charger) | Recharge via micro-USB (BQ24075) |
| FP3 | [Jauge de batterie](./battery-gauge) | Mesure de l'energie restante (BQ27441) |
| FP4 | [Alimentation](./power-supply) | Convertisseur DC/DC, gestion des tensions |
| FP5 | [Microphone](./microphone) | Microphone PDM IMP34DT05 |
| FP6 | [Microcontroleur applicatif](./application-microcontroller) | STM32WB55RG |
| FP7 | [Extension GPIO](./gpio-extension-port) | Expandeur I/O MCP23009 |
| FP8 | [Interface visuelle](./visual-interface) | Ecran OLED + LEDs |
| FP9 | [Boutons de controle](./control-buttons) | Boutons directionnels, A/B, Menu |
| FP10 | [Sortie audio](./audio-output) | Buzzer piezo |
| FP11 | [Interface de programmation](./programming-debugging-interface) | JTAG/SWD |
| FP12 | [Capteurs internes](./internal-sensor) | Distance, IMU, magnetometre, etc. |
| FP13 | [Ports E/S specifiques](./specific-io-port) | Edge connector, STEMMA, Jacdac |
| FP14 | [Microcontroleur interface](./interface-microcontroller) | STM32F103, DAPLink, USB |
| FP15 | [Memoire flash](./flash-memory) | Flash QSPI 64 Mbit |
