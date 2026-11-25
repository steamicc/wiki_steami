---
title: Conventions de l'API
sidebar_position: 6
---

# Conventions de l'API Arduino

Les drivers de [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) partagent des conventions de nommage, reprises de la [bibliothèque MicroPython](../micropython/conventions) pour faciliter le passage d'un langage à l'autre. Elles ne sont pas encore appliquées de façon uniforme : cette page indique, pour chaque convention, les drivers qui la suivent.

Chaque driver est une classe `Steami<Composant>` déclarée dans l'en-tête du même nom : `SteamiWsenHids` dans `<SteamiWsenHids.h>`, `SteamiBME280` dans `<SteamiBME280.h>`… Le préfixe `Steami` évite les conflits avec les bibliothèques du gestionnaire qui portent le nom du composant (BME280, VL53L1X…).

Les exemples supposent un bus I²C interne déjà créé (voir [Le bus I²C interne](./bibliotheques#le-bus-ic-interne)) :

```cpp
TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
```

## Construction et initialisation

Les capteurs I²C se construisent avec le bus, puis l'adresse, qui est optionnelle : la valeur par défaut correspond au câblage de la carte.

```cpp
SteamiWsenHids sensor(internalI2C);
```

Exceptions :

| Driver            | Construction                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `SteamiMCP23009E` | `SteamiMCP23009E dpad(internalI2C, RST_EXPANDER, MCP23009_I2C_ADDR, INT_EXPANDER);` (broches de reset et d'interruption) |
| `SteamiBQ27441`   | `SteamiBQ27441 batterie(internalI2C);` accepte en plus la capacité de la batterie en mAh                                 |
| `SteamiSSD1327`   | `SteamiSSD1327 oled;` : écran SPI des V1a et V1b, aucun paramètre                                                        |
| `SteamiGC9A01`    | `SteamiGC9A01 affichage;` : écran SPI de la V1c, aucun paramètre                                                         |

`begin()` initialise le composant et renvoie `false` s'il ne répond pas (pour l'écran de la V1c, si la mémoire manque pour l'image). Le bus doit être démarré avant :

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

`deviceId()` lit l'identifiant matériel du composant, utile pour le diagnostic. Sa taille dépend du composant : `uint8_t` pour la plupart, `uint16_t` pour `SteamiBQ27441` et `SteamiVL53L1X`. Avec `auto`, le type n'a pas à être connu :

```cpp
auto id = sensor.deviceId();
Serial.print("Identifiant : 0x");
Serial.println(id, HEX);
```

`SteamiMCP23009E` et les écrans (`SteamiSSD1327`, `SteamiGC9A01`) n'ont pas de `deviceId()`.

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

| Style                        | Exemple                                                      | Drivers                                                                                               |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| valeur renvoyée              | `float t = sensor.temperature();`                            | `SteamiWsenHids`, `SteamiWsenPads`, `SteamiBME280`, `SteamiVL53L1X`, `SteamiBQ27441`, `SteamiLIS2MDL` |
| variable passée en paramètre | `SteamiISM330DL::Vector3 a; if (imu.accelerationG(a)) { … }` | `SteamiISM330DL`, `SteamiAPDS9960`                                                                    |

### Lecture complète

`read()` renvoie toutes les mesures du capteur en une fois, dans une structure dont le contenu dépend du composant :

```cpp
auto data = humidite.read();
Serial.println(data.temperature);
Serial.println(data.humidity);
```

Disponible sur `SteamiWsenHids` (`temperature`, `humidity`), `SteamiWsenPads` (`pressure`, `temperature`) et `SteamiBME280` (`temperature`, `humidity`, `pressure`). Sur `SteamiVL53L1X`, `read()` renvoie simplement la distance en millimètres.

## Disponibilité des données

`dataReady()` indique qu'une nouvelle mesure est prête. Tous les capteurs le fournissent. Certains précisent la grandeur : `temperatureReady()`, `humidityReady()`, `pressureReady()`, `accelReady()`, `gyroReady()`.

Le BME280 fait exception : il ne signale pas les nouvelles mesures. Sur `SteamiBME280`, `dataReady()` indique seulement qu'aucune mesure n'est en cours (après `triggerOneShot()`, que cette mesure est terminée), et `read()` n'en a pas besoin : capteur en veille, il lance une mesure et en attend le résultat ; en mesure continue, il renvoie la dernière mesure.

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

Drivers concernés : `SteamiWsenHids`, `SteamiWsenPads`, `SteamiBME280` et `SteamiLIS2MDL`. Le paramètre de `setContinuous()` est une constante propre au driver (par exemple `WSEN_HIDS_ODR_1_HZ`, ou pour le BME280 l'attente entre deux mesures, comme `BME280_STANDBY_1000_MS`), sauf pour `SteamiLIS2MDL` qui attend une fréquence en hertz.

Le capteur de distance utilise ses propres méthodes : `startRanging()` et `stopRanging()`.

## Calibration de la température

Les drivers qui mesurent une température permettent de la corriger :

```cpp
sensor.setTemperatureOffset(-0.5f);              // décalage simple, en °C
sensor.calibrateTemperature(20.0f, 20.8f,        // référence, mesure (point bas)
                            40.0f, 41.3f);       // référence, mesure (point haut)
```

Drivers concernés : `SteamiWsenHids`, `SteamiWsenPads`, `SteamiBME280`, `SteamiISM330DL` et `SteamiLIS2MDL` (où le décalage s'appelle `setTempOffset()`). La correction s'applique après la calibration d'usine.

## Récapitulatif

Les noms de colonnes omettent le préfixe `Steami`.

| Méthode                      | APDS9960 | BME280 | BQ27441 | GC9A01 | ISM330DL | LIS2MDL | MCP23009E | SSD1327 | VL53L1X | WsenHids | WsenPads |
| ---------------------------- | :------: | :----: | :-----: | :----: | :------: | :-----: | :-------: | :-----: | :-----: | :------: | :------: |
| `begin()`                    |    ✅    |   ✅   |   ✅    |   ✅   |    ✅    |   ✅    |    ✅     |   ✅    |   ✅    |    ✅    |    ✅    |
| `deviceId()`                 |    ✅    |   ✅   |   ✅    |        |    ✅    |   ✅    |           |         |   ✅    |    ✅    |    ✅    |
| `powerOn()` / `powerOff()`   |    ✅    |   ✅   |   ✅    |   ✅   |    ✅    |   ✅    |    ✅     |   ✅    |   ✅    |    ✅    |    ✅    |
| `dataReady()`                |    ✅    |   ✅   |   ✅    |        |    ✅    |   ✅    |           |         |   ✅    |    ✅    |    ✅    |
| `read()`                     |          |   ✅   |         |        |          |         |           |         |   ✅    |    ✅    |    ✅    |
| `setContinuous()` / one-shot |          |   ✅   |         |        |          |   ✅    |           |         |         |    ✅    |    ✅    |
| calibration de température   |          |   ✅   |         |        |    ✅    |   ✅    |           |         |         |    ✅    |    ✅    |

La documentation complète de chaque driver se trouve dans son README, dans le dossier `lib/<driver>/` du [dépôt](https://github.com/steamicc/arduino-steami-lib).
