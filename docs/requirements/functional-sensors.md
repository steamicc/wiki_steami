---
sidebar_position: 6
title: "FCT - Capteurs"
---

# Exigences fonctionnelles - Capteurs (FCT-40 a FCT-54)

## Capteurs internes

| ID | Nom | Description |
|----|-----|-------------|
| FCT-40 | Magnetometer (LIS2MDL) | Le systeme doit integrer un magnetometre (LIS2MDL). |
| FCT-41 | Distance (VL53L1X) | Le systeme doit integrer un capteur de distance (VL53L1X). |
| FCT-42 | PDM MEMS Microphone (MP34DT01) | Le systeme doit integrer un microphone MEMS PDM (MP34DT01 / IMP34DT05). |
| FCT-43 | Light, Color, and Gesture (APDS9960) | Le systeme doit integrer un capteur de lumiere, couleur et geste (APDS9960). |
| FCT-44 | Barometer (LPS22HH) | Le systeme doit integrer un barometre (LPS22HH / WSEN-PADS). |
| FCT-45 | Humidity and temperature (HTS221) | Le systeme doit integrer un capteur d'humidite et de temperature (HTS221 / WSEN-HIDS). |
| FCT-46 | Humidity and temperature - Isolation | Le capteur de temperature doit etre thermiquement eloigne de tout composant chauffant. |
| FCT-47 | Accel/Gyro (LSM6DS33) | Le systeme doit integrer un accelerometre/gyroscope (LSM6DS33 / ISM330DLC). |
| FCT-48 | IMU alignment | L'orientation des deux capteurs de l'IMU doit etre alignee. |

## Capteurs et connecteurs externes

| ID | Nom | Description |
|----|-----|-------------|
| FCT-49 | GPIO - Micro:bit edge connector | Le systeme doit fournir un connecteur externe similaire au connecteur edge du micro:bit. |
| FCT-50 | GPIO - Alligator-clip friendly pins | Le systeme doit fournir des broches d'entree/sortie compatibles avec les pinces crocodile autour de la carte. |
| FCT-50bis | GPIO | Les broches du MCU non utilisees doivent etre routees vers des pads du PCB. |
| FCT-51 | UART | Le systeme doit integrer des pads sur le PCB pour les signaux UART. Un connecteur JST peut etre ajoute. |
| FCT-52 | I2C - Qwiic/STEMMA QT connector | Le systeme doit integrer un connecteur Qwiic/STEMMA QT pour les signaux I2C. Les signaux doivent etre partages avec le connecteur edge. |
| FCT-53 | SPI | Le systeme doit integrer des pads sur le PCB pour les signaux SPI. Un connecteur JST peut etre ajoute. |
| FCT-54 | RTC | Le systeme doit integrer une horloge temps reel (RTC). |
