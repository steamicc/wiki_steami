---
title: 8. Capteurs
sidebar_position: 2
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';
import TOCInline from '@theme/TOCInline';

# 8. Capteurs

**Ce que le test vérifie** : chaque capteur donne des mesures dans une plage plausible pour une carte posée à plat, immobile, à température ambiante. Ces tests suivent le [test du bus I2C](./i2c), qui a déjà vérifié la présence et l'identifiant de chaque puce. Pour quelques mesures, l'opérateur confirme en plus que la valeur affichée lui paraît juste.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Lancer

Poser la carte à plat et ne plus la toucher pendant les tests de l'accéléromètre et du gyroscope. Prévoir un objet à placer devant le capteur de distance.

<ReleaseTabs>
<Release releases="v1c">

```bash
make test-bme280 PORT=/dev/ttyACM0
make test-ism330dl PORT=/dev/ttyACM0
make test-lis2mdl PORT=/dev/ttyACM0
make test-vl53l1x PORT=/dev/ttyACM0
make test-steami_board PORT=/dev/ttyACM0
make test-board_temperature_comparison PORT=/dev/ttyACM0
make test-bq27441 PORT=/dev/ttyACM0
```

</Release>
<Release releases="v1a v1b">

```bash
make test-wsen-hids PORT=/dev/ttyACM0
make test-wsen-pads PORT=/dev/ttyACM0
make test-apds9960 PORT=/dev/ttyACM0
make test-ism330dl PORT=/dev/ttyACM0
make test-lis2mdl PORT=/dev/ttyACM0
make test-vl53l1x PORT=/dev/ttyACM0
make test-board_temperature_comparison PORT=/dev/ttyACM0
make test-bq27441 PORT=/dev/ttyACM0
```

</Release>
</ReleaseTabs>

`make test-hardware` lance aussi tous ces scénarios.

## Résultat attendu

Les plages sont celles des scénarios de [`tests/scenarios`](https://github.com/steamicc/micropython-steami-lib/tree/main/tests/scenarios).

<ReleaseTabs>
<Release releases="v1c">

| Capteur                                       | Tests automatiques                                                                                                                                        | Question posée à l'opérateur                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| BME280 (`bme280`)                             | Température de 10 à 45 °C, pression de 900 à 1 100 hPa, humidité de 5 à 95 % ; mesure unique et mode continu plausibles                                   | Les valeurs sont-elles vraisemblables ?                                                          |
| ISM330DL (`ism330dl`)                         | Accélération totale entre 0,8 et 1,2 g ; vitesse de rotation sous 20 °/s sur chaque axe ; température de 10 à 50 °C ; décalages d'accéléromètre appliqués | Les valeurs d'accélération, de rotation, de température et d'orientation sont-elles cohérentes ? |
| LIS2MDL (`lis2mdl`)                           | Champ magnétique de 10 à 300 µT ; température de 10 à 45 °C ; identifiant relu après un reset logiciel et un redémarrage                                  | Les valeurs sont-elles cohérentes (environ 25 à 65 µT, cap de 0 à 360°) ?                        |
| VL53L1X (`vl53l1x`)                           | Distance de 0 à 4 000 mm                                                                                                                                  | La distance mesurée est-elle cohérente (objet devant le capteur) ?                               |
| Carte (`steami_board`)                        | `Steami.begin()` reconnaît une V1c ; la température vient du BME280 et vaut de 0 à 50 °C ; pas de capteur de lumière ; batterie de 3,0 à 4,4 V            | —                                                                                                |
| Températures (`board_temperature_comparison`) | BME280 de 5 à 50 °C, LIS2MDL et ISM330DL de -40 à 85 °C ; écart sous 2 °C une fois les décalages alignés sur le BME280                                    | Les températures lues sont-elles cohérentes entre elles et avec l'ambiance ?                     |

Le scénario `steami_board` contient aussi des tests de boutons, décrits dans [Boutons](./boutons).

</Release>
<Release releases="v1a v1b">

| Capteur                                       | Tests automatiques                                                                                                  | Question posée à l'opérateur                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| WSEN-HIDS (`wsen-hids`)                       | Humidité de 5 à 100 %, température de -10 à 60 °C                                                                   | Les valeurs sont-elles cohérentes (humidité et température ambiantes) ?                          |
| WSEN-PADS (`wsen-pads`)                       | Pression de 900 à 1 100 hPa, température de -10 à 60 °C                                                             | Les valeurs sont-elles cohérentes (pression d'environ 1 013 hPa, température ambiante) ?         |
| APDS-9960 (`apds9960`)                        | Lumière ambiante de 1 à 65 535, proximité de 0 à 255                                                                | Les valeurs de lumière ambiante et de proximité sont-elles cohérentes ?                          |
| ISM330DL (`ism330dl`)                         | Accélération totale entre 0,8 et 1,2 g ; vitesse de rotation sous 20 °/s sur chaque axe ; température de 10 à 50 °C | Les valeurs d'accélération, de rotation, de température et d'orientation sont-elles cohérentes ? |
| LIS2MDL (`lis2mdl`)                           | Champ magnétique de 10 à 300 µT ; température de 10 à 45 °C                                                         | Les valeurs sont-elles cohérentes (environ 25 à 65 µT, cap de 0 à 360°) ?                        |
| VL53L1X (`vl53l1x`)                           | Distance de 0 à 4 000 mm                                                                                            | La distance mesurée est-elle cohérente (objet devant le capteur) ?                               |
| Températures (`board_temperature_comparison`) | Lecture de toutes les sondes, alignement des décalages sur le WSEN-HIDS                                             | Les températures lues sont-elles cohérentes entre elles et avec l'ambiance ?                     |

Le scénario `steami_board` ne concerne que la V1c : il est sauté sur ces releases.

</Release>
</ReleaseTabs>

## Batterie

La jauge BQ27441 (`bq27441`) et le test de tension batterie de `steami_board` ne passent qu'avec une batterie branchée. Le scénario `bq27441` commence par demander « Une batterie est-elle connectée à la carte ? », puis attend une tension de 3 000 à 4 300 mV, une charge de 0 à 100 %, une capacité pleine de 100 à 2 000 mAh et un état de santé de 0 à 100 %. Brancher une batterie pendant la qualification, ou sauter ces tests, est **à définir**.

## Microphone

Le microphone IMP34DT05 n'a pas de scénario de test, et son driver MicroPython n'a pas d'exemple. Le test du microphone est **à définir**.
