---
title: Conventions de l'API
sidebar_position: 5
---

# Conventions de l'API Arduino

Les drivers de [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) partagent des conventions de nommage, reprises de la [bibliothèque MicroPython](../micropython/conventions) pour faciliter le passage d'un langage à l'autre. Elles ne sont pas encore appliquées de façon uniforme : cette page indique, pour chaque convention, les drivers qui la suivent.

Les exemples supposent un bus I²C interne déjà créé (voir [Le bus I²C interne](./bibliotheques#le-bus-ic-interne)) :

```cpp
TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
```

## Construction et initialisation

Les capteurs I²C se construisent avec le bus, puis l'adresse, qui est optionnelle : la valeur par défaut correspond au câblage de la carte.

```cpp
WsenHids sensor(internalI2C);
```

Exceptions :

| Driver                   | Construction                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `MCP23009E`              | `MCP23009E dpad(internalI2C, RST_EXPANDER, MCP23009_I2C_ADDR, INT_EXPANDER);` (broches de reset et d'interruption) |
| `BQ27441`                | `BQ27441 batterie(internalI2C);` accepte en plus la capacité de la batterie en mAh                                 |
| `WS_OLED_128X128_STEAMI` | `WS_OLED_128X128_STEAMI oled;` : écran SPI, aucun paramètre                                                        |

`begin()` initialise le composant et renvoie `false` s'il ne répond pas. Le bus doit être démarré avant :

```cpp
void setup() {
  Serial.begin(115200);
  internalI2C.begin();
  if (!sensor.begin()) {
    Serial.println("Capteur non détecté");
    while (true) {}
  }
}
```

## Identification

`deviceId()` lit l'identifiant matériel du composant, utile pour le diagnostic. Sa taille dépend du composant : `uint8_t` pour la plupart, `uint16_t` pour `BQ27441` et `VL53L1X`. Avec `auto`, le type n'a pas à être connu :

```cpp
auto id = sensor.deviceId();
Serial.print("Identifiant : 0x");
Serial.println(id, HEX);
```

`MCP23009E` et l'écran SSD1327 n'ont pas de `deviceId()`.

## Alimentation

`powerOn()` et `powerOff()` réveillent ou mettent en veille le composant, pour réduire la consommation. Tous les drivers les fournissent.

## Lecture des mesures

### Nom et unité

Le nom de la méthode est celui de la grandeur. Quand l'unité n'est pas l'unité usuelle, elle est ajoutée en suffixe :

| Méthode                                | Unité                     |
| -------------------------------------- | ------------------------- |
| `temperature()`, `humidity()`          | °C, % d'humidité relative |
| `pressureHpa()`                        | hectopascal               |
| `distanceMm()`                         | millimètre                |
| `voltageMv()`                          | millivolt                 |
| `accelerationG()`, `accelerationMs2()` | g, m/s²                   |
| `gyroscopeDps()`, `gyroscopeRads()`    | degré/s, radian/s         |
| `magneticFieldUt()`                    | microtesla                |

### Deux styles de lecture

Selon le driver, une mesure est **renvoyée** par la méthode, ou **écrite dans une variable** passée en paramètre ; la méthode renvoie alors `true` si la lecture a réussi.

| Style                        | Exemple                                                | Drivers                                                  |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| valeur renvoyée              | `float t = sensor.temperature();`                      | `WsenHids`, `WSEN_PADS`, `VL53L1X`, `BQ27441`, `LIS2MDL` |
| variable passée en paramètre | `ISM330DL::Vector3 a; if (imu.accelerationG(a)) { … }` | `ISM330DL`, `APDS9960`                                   |

### Lecture complète

`read()` renvoie toutes les mesures du capteur en une fois, dans une structure dont le contenu dépend du composant :

```cpp
auto data = humidite.read();
Serial.println(data.temperature);
Serial.println(data.humidity);
```

Disponible sur `WsenHids` (`temperature`, `humidity`) et `WSEN_PADS` (`pressure`, `temperature`). Sur `VL53L1X`, `read()` renvoie simplement la distance en millimètres.

## Disponibilité des données

`dataReady()` indique qu'une nouvelle mesure est prête. Tous les capteurs le fournissent. Certains précisent la grandeur : `temperatureReady()`, `humidityReady()`, `pressureReady()`, `accelReady()`, `gyroReady()`.

```cpp
if (sensor.dataReady()) {
  auto data = sensor.read();
}
```

## Mesure continue ou ponctuelle

Les capteurs d'environnement et le magnétomètre ont deux modes :

| Méthode            | Rôle                                                   |
| ------------------ | ------------------------------------------------------ |
| `setContinuous(…)` | mesures répétées à la fréquence indiquée               |
| `triggerOneShot()` | lance une mesure unique sans attendre le résultat      |
| `readOneShot()`    | lance une mesure unique, attend et renvoie le résultat |

Drivers concernés : `WsenHids`, `WSEN_PADS` et `LIS2MDL`. Le paramètre de `setContinuous()` est une constante de fréquence propre au driver (par exemple `WSEN_HIDS_ODR_1_HZ`), sauf pour `LIS2MDL` qui attend une fréquence en hertz.

Le capteur de distance utilise ses propres méthodes : `startRanging()` et `stopRanging()`.

## Calibration de la température

Les drivers qui mesurent une température permettent de la corriger :

```cpp
sensor.setTemperatureOffset(-0.5f);              // décalage simple, en °C
sensor.calibrateTemperature(20.0f, 20.8f,        // référence, mesure (point bas)
                            40.0f, 41.3f);       // référence, mesure (point haut)
```

Drivers concernés : `WsenHids`, `WSEN_PADS`, `ISM330DL` et `LIS2MDL` (où le décalage s'appelle `setTempOffset()`). La correction s'applique après la calibration d'usine.

## Récapitulatif

| Méthode                      | APDS9960 | BQ27441 | ISM330DL | LIS2MDL | MCP23009E | SSD1327 | VL53L1X | WsenHids | WSEN_PADS |
| ---------------------------- | :------: | :-----: | :------: | :-----: | :-------: | :-----: | :-----: | :------: | :-------: |
| `begin()`                    |    ✅    |   ✅    |    ✅    |   ✅    |    ✅     |   ✅    |   ✅    |    ✅    |    ✅     |
| `deviceId()`                 |    ✅    |   ✅    |    ✅    |   ✅    |           |         |   ✅    |    ✅    |    ✅     |
| `powerOn()` / `powerOff()`   |    ✅    |   ✅    |    ✅    |   ✅    |    ✅     |   ✅    |   ✅    |    ✅    |    ✅     |
| `dataReady()`                |    ✅    |   ✅    |    ✅    |   ✅    |           |         |   ✅    |    ✅    |    ✅     |
| `read()`                     |          |         |          |         |           |         |   ✅    |    ✅    |    ✅     |
| `setContinuous()` / one-shot |          |         |          |   ✅    |           |         |         |    ✅    |    ✅     |
| calibration de température   |          |         |    ✅    |   ✅    |           |         |         |    ✅    |    ✅     |

La documentation complète de chaque driver se trouve dans son README, dans le dossier `lib/<driver>/` du [dépôt](https://github.com/steamicc/arduino-steami-lib).
