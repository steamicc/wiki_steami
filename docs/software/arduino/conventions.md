---
title: Conventions API des drivers
sidebar_position: 4
---

# Conventions de l'API Arduino

Tous les drivers de **arduino-steami-lib** suivent les mêmes conventions afin de proposer une API cohérente sur l'ensemble des composants de la carte STeaMi.

Une fois qu'un driver est maîtrisé, les autres s'utilisent de manière très similaire.

## Initialisation

Tous les drivers utilisent le même principe d'initialisation.

Le constructeur reçoit le bus de communication (`TwoWire` pour l'I²C) ainsi que l'adresse du périphérique, qui est optionnelle lorsque l'adresse par défaut est utilisée.

```cpp
#include <Wire.h>
#include <HTS221.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
HTS221 sensor(internalI2C);

void setup() {
    internalI2C.begin();

    if (!sensor.begin()) {
        Serial.println("Capteur non détecté");
        while (true);
    }
}
```

La méthode `begin()` :

- vérifie la présence du composant ;
- charge les données de calibration lorsque nécessaire ;
- initialise le périphérique dans son état par défaut.

Elle retourne toujours `false` si le composant n'est pas détecté.

---

## Identification du composant

Chaque driver fournit une méthode permettant de lire l'identifiant matériel (`WHO_AM_I`).

```cpp
uint8_t id = sensor.deviceId();

Serial.print("Device ID : 0x");
Serial.println(id, HEX);
```

Cette méthode est principalement utile pour le diagnostic ou le débogage.

---

## Gestion de l'alimentation

Tous les capteurs peuvent être activés ou mis en veille.

```cpp
sensor.powerOff();

// ...

sensor.powerOn();
```

Cela permet de réduire la consommation lorsque les mesures ne sont pas nécessaires.

---

## Lecture des mesures

Les méthodes suivent une convention de nommage commune.

### Lecture d'une grandeur

Les unités SI courantes n'utilisent pas de suffixe.

```cpp
float temperature = sensor.temperature();
float humidity = sensor.humidity();
```

### Mesure avec unité explicite

Lorsque plusieurs unités sont possibles, un suffixe est ajouté au nom de la méthode.

```cpp
float pressure = sensor.pressureHpa();
uint16_t distance = sensor.distanceMm();

auto accel = imu.accelerationG();
auto gyro = imu.gyroscopeDps();
```

### Lecture complète

La plupart des drivers proposent également une méthode `read()` qui retourne toutes les mesures du capteur.

```cpp
auto data = sensor.read();

Serial.println(data.temperature);
Serial.println(data.humidity);
```

Le contenu de la structure dépend du composant.

---

## Disponibilité des données

Les drivers permettent de vérifier si une nouvelle mesure est disponible avant la lecture.

```cpp
if (sensor.dataReady()) {
    auto data = sensor.read();
}
```

Certains composants proposent également des méthodes spécifiques :

```cpp
sensor.temperatureReady();
sensor.pressureReady();
sensor.humidityReady();
```

---

## Mesures en continu et One-Shot

Les capteurs proposant plusieurs modes de fonctionnement utilisent toujours les mêmes méthodes.

### Mode continu

```cpp
sensor.setContinuous(HTS221_ODR_1_HZ);
```

La fréquence d'acquisition est définie grâce aux constantes du driver.

### Mesure unique

```cpp
sensor.triggerOneShot();

while (!sensor.dataReady()) {
}

auto data = sensor.read();
```

La plupart des drivers proposent également une version simplifiée :

```cpp
auto data = sensor.readOneShot();
```

---

## Calibration

Les drivers mesurant une grandeur physique peuvent appliquer une correction logicielle.

### Offset

```cpp
sensor.setTemperatureOffset(-0.5f);
```

### Calibration sur deux points

```cpp
sensor.calibrateTemperature(
    20.0f, 20.8f,
    40.0f, 41.3f
);
```

La correction utilisateur est appliquée après la calibration d'usine.

---

## Bus I²C interne de la STeaMi

La majorité des capteurs intégrés à la carte utilisent le bus I²C interne.

Il est donc recommandé de créer une instance dédiée :

```cpp
TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);

internalI2C.begin();
```

Puis de la transmettre au constructeur du driver :

```cpp
HTS221 sensor(internalI2C);
```

L'utilisation du bus `Wire` par défaut ne permet pas de communiquer avec les capteurs intégrés de la carte.

---

## Conventions générales

| Convention                                         | Description                                                  |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `begin()`                                          | Initialise le périphérique et vérifie sa présence.           |
| `deviceId()`                                       | Retourne l'identifiant matériel (`WHO_AM_I`).                |
| `powerOn()` / `powerOff()`                         | Active ou met le périphérique en veille.                     |
| `read()`                                           | Retourne toutes les mesures disponibles.                     |
| `temperature()`, `humidity()`                      | Mesures exprimées dans les unités SI usuelles.               |
| `pressureHpa()`, `distanceMm()`, `accelerationG()` | Le suffixe indique l'unité utilisée.                         |
| `dataReady()`                                      | Vérifie que les nouvelles mesures sont disponibles.          |
| `setContinuous()`                                  | Active les acquisitions en continu.                          |
| `triggerOneShot()`                                 | Lance une mesure unique sans attendre le résultat.           |
| `readOneShot()`                                    | Lance une mesure unique et retourne directement le résultat. |

## Voir aussi

- Installation
- Arduino IDE
- PlatformIO
- Drivers
