---
title: Conventions API des drivers
sidebar_position: 4
---

# Conventions API des drivers MicroPython

Tous les drivers de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) suivent des conventions standardisées, issues d'un refactoring majeur (issues [#56 à #82](https://github.com/steamicc/micropython-steami-lib/issues?q=is%3Aissue+is%3Aclosed+label%3Arefactoring)).

## Structure d'un driver

```text
lib/<driver_name>/
├── README.md
├── manifest.py
├── <module_name>/
│   ├── __init__.py     # Exports publics
│   ├── const.py        # Constantes (registres, masques, ODR)
│   ├── device.py       # Classe principale du driver
│   └── exceptions.py   # Exceptions spécifiques
└── examples/
    └── *.py            # Exemples d'utilisation
```

## Initialisation

Le constructeur prend toujours `i2c` comme premier paramètre et `address` comme paramètre optionnel :

```python
from machine import I2C
from ism330dl import ISM330DL

i2c = I2C(1)
imu = ISM330DL(i2c)                    # adresse par défaut
imu = ISM330DL(i2c, address=0x6A)      # adresse alternative
```

Le constructeur vérifie automatiquement la présence du composant via `device_id()`.

## Constantes (`const.py`)

Toutes les constantes utilisent `micropython.const()` pour l'optimisation mémoire :

```python
from micropython import const

ISM330DL_I2C_DEFAULT_ADDR = const(0x6B)
ISM330DL_WHO_AM_I_VALUE = const(0x6A)

REG_WHO_AM_I = const(0x0F)
REG_CTRL1_XL = const(0x10)

ACCEL_ODR_POWER_DOWN = const(0x00)
ACCEL_ODR_12_5HZ = const(0x01)
```

## Identification

Chaque driver expose une méthode `device_id()` :

```python
imu = ISM330DL(i2c)
print(f"Device ID: 0x{imu.device_id():02X}")  # 0x6A
```

L'appel est fait automatiquement dans le constructeur. Une exception est levée si le composant n'est pas détecté.

## Gestion de l'alimentation

Tous les drivers implémentent `power_on()` et `power_off()` :

```python
sensor = WSENPads(i2c)
sensor.power_off()     # mode basse consommation
sensor.power_on()      # reprise des mesures
```

## Lecture des mesures

### Nommage des méthodes

| Méthode              | Retour                      | Exemple                     |
| -------------------- | --------------------------- | --------------------------- |
| `<mesure>_raw()`     | Valeur brute du registre    | `pressure_raw()` → int      |
| `<mesure>_<unité>()` | Valeur convertie avec unité | `pressure_hpa()` → float    |
| `temperature()`      | Température en °C           | Unité SI → pas de suffixe   |
| `humidity()`         | Humidité relative en %      | Unité SI → pas de suffixe   |
| `read()`             | Tuple de toutes les mesures | `read()` → (pression, temp) |

**Règle** : pas de suffixe d'unité quand c'est l'unité SI (°C, %). Suffixe obligatoire pour les unités non-SI (`_hpa`, `_g`, `_dps`, `_ut`).

### Exemples concrets

```python
# Accéléromètre
ax, ay, az = imu.acceleration_g()       # en g
gx, gy, gz = imu.gyroscope_dps()        # en degrés/s
temp = imu.temperature()                # en °C

# Pression
pressure = sensor.pressure_hpa()         # en hPa
temp = sensor.temperature()              # en °C
pressure, temp = sensor.read()           # tuple

# Magnétomètre
x, y, z = mag.magnetic_field_ut()        # en µT
```

## État et disponibilité des données

| Méthode               | Description                              |
| --------------------- | ---------------------------------------- |
| `_status()`           | Registre STATUS brut (privé)             |
| `data_ready()`        | `True` si toutes les données sont prêtes |
| `temperature_ready()` | `True` si la température est prête       |
| `pressure_ready()`    | `True` si la pression est prête          |

## Réveil automatique en mode power-down

Si le capteur est en mode power-down, le driver déclenche automatiquement une mesure one-shot quand on appelle une méthode de lecture. Le mécanisme interne :

1. `_is_power_down()` vérifie si l'ODR est à 0
2. `_ensure_data()` déclenche un one-shot et attend les données
3. Timeout avec polling (50 itérations × 10 ms max)

Ce comportement est transparent pour l'utilisateur :

```python
sensor.power_off()              # mode basse consommation
temp = sensor.temperature()     # déclenche automatiquement une mesure
```

## Modes de mesure

| Méthode               | Description                               |
| --------------------- | ----------------------------------------- |
| `set_continuous(odr)` | Mesures continues à la fréquence ODR      |
| `trigger_one_shot()`  | Déclenche une mesure unique               |
| `read_one_shot()`     | Déclenche + attend + retourne les données |

## Calibration température

Tous les capteurs de température supportent la calibration :

```python
# Offset simple
sensor.set_temp_offset(-0.5)

# Calibration deux points
sensor.calibrate_temperature(
    ref_low=20.0, measured_low=20.8,
    ref_high=40.0, measured_high=41.2
)
```

La calibration peut être persistée via [steami_config](../daplink#steamiconfig).

## Helpers I2C (privés)

Les méthodes internes de communication I2C sont standardisées :

| Méthode                         | Description       |
| ------------------------------- | ----------------- |
| `_read_reg(reg)`                | Lire un octet     |
| `_write_reg(reg, value)`        | Écrire un octet   |
| `_read_block(reg, n)`           | Lire n octets     |
| `_update_reg(reg, mask, value)` | Modifier des bits |

## Exceptions

Chaque driver définit une hiérarchie d'exceptions :

```python
class ISM330DLError(Exception): pass        # base
class ISM330DLNotFound(ISM330DLError): pass # composant non détecté
class ISM330DLConfigError(ISM330DLError): pass # configuration invalide
class ISM330DLIOError(ISM330DLError): pass  # erreur I2C
```

Utilisation : `except Exception` (pas de bare `except`), chaînage avec `from exc`.

## Conventions générales

| Convention    | Détail                                                 |
| ------------- | ------------------------------------------------------ |
| Paramètre I2C | Toujours nommé `i2c` (pas `bus`)                       |
| Nommage       | snake_case partout                                     |
| Timing        | `from time import sleep_ms` (pas `utime`)              |
| Exceptions    | `except Exception` (pas bare `except`)                 |
| Linting       | Enforced par [ruff](https://github.com/astral-sh/ruff) |

## Voir aussi

- [Table des drivers](./) — Liste complète des 15 drivers
- [Code source](https://github.com/steamicc/micropython-steami-lib) — Tous les drivers
- [Issues de refactoring](https://github.com/steamicc/micropython-steami-lib/issues?q=is%3Aissue+is%3Aclosed+label%3Arefactoring) — Historique des conventions
