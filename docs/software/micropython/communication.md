---
title: Communication
sidebar_label: Communication
sidebar_position: 6
---

import TOCInline from '@theme/TOCInline';
import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

<!-- cspell:ignore aioble readfrom baudrate asyncio NimBLE Qwiic STEMMA LPUART USART I2CINT I2CEXT SPIINT SPIEXT rfcore SparkFun Adafruit Jacdac jacdac -->

# Communication : Bluetooth, I2C, SPI et UART

Cette page présente les liaisons de la carte STeaMi en MicroPython : le Bluetooth Low Energy, les bus I2C et SPI, et les liaisons série (UART). Le STM32WB55 est le même sur les trois releases : les noms de bus et de broches de cette page valent pour la V1a, la V1b et la V1c. Seuls changent les composants du bus I2C interne et le type des connecteurs STEMMA/Qwiic, présentés en onglets.

La couche `steami` de la bibliothèque [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami) se charge des bus internes : les classes par fonction (`Temperature`, `Distance`…) et `steami.Screen` ouvrent elles-mêmes le bus I2C interne et le bus SPI de l'écran. Les liaisons externes (Bluetooth, I2C des connecteurs STEMMA/Qwiic, SPI et UART) n'ont pas de classe `steami` : elles s'utilisent avec les modules standard de MicroPython, `bluetooth`, `aioble` et `machine`.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Les liaisons de la carte

Le firmware MicroPython de la STeaMi (le fork [micropython-steami](https://github.com/steamicc/micropython-steami/tree/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG), branche `stm32-steami-rev1d-final`) nomme chaque bus dans [`mpconfigboard.h`](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/mpconfigboard.h). Un bus s'ouvre par son numéro ou par ce nom : `I2C(3)` et `I2C("I2CEXT")` désignent le même bus.

| Liaison       | Périphérique du STM32WB55 | Usage                                                 | Broches                        | En MicroPython                              |
| ------------- | ------------------------- | ----------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| Bluetooth LE  | Radio du second cœur      | Échanges avec un téléphone ou une autre carte         | —                              | `bluetooth`, `aioble`                       |
| I2C interne   | I2C1                      | Capteurs, expandeur, jauge de batterie, pont DAPLink  | SCL PB8, SDA PB9               | `I2C(1)` ou `I2C("I2CINT")`                 |
| I2C externe   | I2C3                      | Connecteurs STEMMA/Qwiic J3 et J4, broches P19 et P20 | SCL PC0, SDA PC1               | `I2C(3)` ou `I2C("I2CEXT")`                 |
| SPI interne   | SPI1                      | Écran (réservé)                                       | SCK PA1, MOSI PB5              | `SPI(1)` ou `SPI("SPIINT")`                 |
| SPI externe   | SPI2                      | Connecteur edge, broches P13 à P15 (P16 pour CS)      | SCK PB13, MISO PB14, MOSI PB15 | `SPI(2)` ou `SPI("SPIEXT")`                 |
| UART Jacdac   | USART1                    | Connecteur Jacdac                                     | TX PB6, RX PB7                 | `UART(1)` ou `UART("UART2")`                |
| Console série | LPUART1                   | REPL, `print()`, Thonny, `mpremote` (ne pas utiliser) | TX PB11, RX PB10               | `UART(2)`, `UART("UART1")` ou `UART("LP1")` |

:::warning Les noms des UART

Les noms des UART suivent les nets du schéma, pas les périphériques : `UART("UART2")` est l'USART1 du connecteur Jacdac, et `UART("UART1")` le LPUART1 de la console. Le numéro suit l'ordre des périphériques du STM32WB55, qui n'a qu'un USART : `UART(1)` est l'USART1 et `UART(2)` le LPUART1. Pour le connecteur Jacdac, écrire `UART(1)`.

:::

Le [fichier des broches](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/pins.csv) du firmware donne aussi un nom à chaque broche de ces bus, à passer à `Pin()` : `I2C_EXT_SCL`, `I2C_EXT_SDA`, `SPI_EXT_SCK`, `SPI_EXT_MISO`, `SPI_EXT_MOSI`, `JACDAC_DATA_TX`, `JACDAC_DATA_RX`, ainsi que `P0` à `P16` pour les broches du [connecteur edge](/docs/hardware/pin-mapping/edge-connector).

:::caution P19 et P20

Dans ce fichier, `Pin("P19")` désigne PC1 (SDA) et `Pin("P20")` PC0 (SCL). Le schéma de la carte fait l'inverse : la broche P19 du connecteur edge porte SCL (PC0) et P20 porte SDA (PC1). Pour ces deux broches, utiliser les noms `I2C_EXT_SCL` et `I2C_EXT_SDA`, ou simplement `I2C(3)`.

:::

## Bluetooth Low Energy

Le firmware embarque le Bluetooth de MicroPython, avec la pile NimBLE ([`mpconfigboard.mk`](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/mpconfigboard.mk)), et deux bibliothèques déjà installées ([`manifest.py`](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/manifest.py)) :

- [`aioble`](https://github.com/micropython/micropython-lib/tree/master/micropython/bluetooth/aioble), qui simplifie le Bluetooth avec `asyncio` : recherche d'appareils, annonces, services GATT, connexions. Les programmes de cette page l'utilisent ;
- `asyncio`, pour faire tourner plusieurs tâches à la fois (mesurer et annoncer, par exemple).

Le module de bas niveau [`bluetooth`](https://docs.micropython.org/en/latest/library/bluetooth.html) reste disponible pour ce qu'`aioble` ne propose pas.

### La pile radio

La radio est pilotée par le second cœur du STM32WB55, qui exécute une pile radio installée à part. Sans elle, l'activation du Bluetooth échoue. Installer la pile **BLE HCI Layer** et vérifier la version installée avec `stm.rfcore_fw_version(1)` : voir [Pile radio Bluetooth](../pile-radio). Changer de firmware MicroPython ou [installer MicroPython depuis le wiki](./essayer#installation-de-micropython) n'efface pas la pile radio.

### Chercher les appareils voisins

Ce programme écoute les annonces Bluetooth pendant 5 secondes, puis affiche chaque appareil trouvé, du plus proche au plus lointain d'après la force du signal (RSSI, en dBm) :

```python run
import asyncio

import aioble


async def scan(duration_ms=5000):
    found = {}  # adresse -> (nom, RSSI)
    # active=True demande aussi la réponse de scan, qui contient souvent le nom
    async with aioble.scan(
        duration_ms, interval_us=30000, window_us=30000, active=True
    ) as scanner:
        async for result in scanner:
            name = result.name() or found.get(result.device.addr_hex(), ("?",))[0]
            found[result.device.addr_hex()] = (name, result.rssi)

    # Du signal le plus fort au plus faible
    for address, (name, rssi) in sorted(found.items(), key=lambda e: -e[1][1]):
        print(address, rssi, "dBm", name)
    print(len(found), "appareils trouvés")


asyncio.run(scan())
```

Un RSSI proche de −40 dBm signale un appareil tout près ; vers −90 dBm, il est loin ou derrière un obstacle. Un appareil qui n'annonce pas de nom s'affiche avec « ? ».

### Publier une mesure

Ce programme fait de la carte un thermomètre Bluetooth. Il annonce le nom `STeaMi-temp` et le service standard **Environmental Sensing** (0x181A), dont la caractéristique **Temperature** (0x2A6E) contient la température en centièmes de degré. Une application de test Bluetooth, comme nRF Connect ou LightBlue, s'y connecte et lit la valeur, ou s'y abonne pour la recevoir chaque seconde.

La température vient de `steami.Temperature`, qui choisit le capteur de la carte : le BME280 sur une V1c, le WSEN-HIDS ou le WSEN-PADS sur une V1a ou une V1b. Le même programme tourne donc sur les trois releases.

```python run
import asyncio
import struct

import aioble
import bluetooth
from steami import Temperature

# Service et caractéristique définis par le Bluetooth SIG
ENV_SENSE_UUID = bluetooth.UUID(0x181A)  # Environmental Sensing
TEMPERATURE_UUID = bluetooth.UUID(0x2A6E)  # Temperature

service = aioble.Service(ENV_SENSE_UUID)
characteristic = aioble.Characteristic(
    service, TEMPERATURE_UUID, read=True, notify=True
)
aioble.register_services(service)

temperature = Temperature()


async def measure():
    while True:
        t = temperature.read()
        if t == t:  # nan (différent de lui-même) si le capteur ne répond pas
            # Entier signé de 16 bits, en centièmes de degré
            characteristic.write(struct.pack("<h", int(t * 100)), send_update=True)
            print("Température :", round(t, 2), "°C")
        await asyncio.sleep_ms(1000)


async def advertise():
    while True:
        # Annonce toutes les 250 ms, jusqu'à la connexion d'un appareil
        async with await aioble.advertise(
            250_000, name="STeaMi-temp", services=[ENV_SENSE_UUID]
        ) as connection:
            print("Connexion de", connection.device)
            await connection.disconnected(timeout_ms=None)
            print("Déconnexion")


async def main():
    await asyncio.gather(
        asyncio.create_task(measure()), asyncio.create_task(advertise())
    )


asyncio.run(main())
```

Le programme tourne jusqu'à l'arrêt (bouton **Arrêter**, ou Ctrl-C dans le REPL). Il ne gère qu'un appareil connecté à la fois : l'annonce reprend après la déconnexion.

### Aller plus loin

Le dépôt [micropython-steami-sample](https://github.com/steamicc/micropython-steami-sample/tree/main/ble) rassemble des programmes Bluetooth plus complets, écrits pour la STeaMi avec `aioble` :

- [`beacon`](https://github.com/steamicc/micropython-steami-sample/tree/main/ble/beacon) : balise qui diffuse son nom et la température dans ses annonces, sans connexion ;
- [`rssi_proximity`](https://github.com/steamicc/micropython-steami-sample/tree/main/ble/rssi_proximity) et [`hot_cold`](https://github.com/steamicc/micropython-steami-sample/tree/main/ble/hot_cold) : estimer la distance entre deux cartes par la force du signal ;
- [`STeaMi_talk`](https://github.com/steamicc/micropython-steami-sample/tree/main/ble/STeaMi_talk) : deux cartes qui échangent des données par une connexion, l'une centrale, l'autre périphérique.

Les [exemples d'aioble](https://github.com/micropython/micropython-lib/tree/master/micropython/bluetooth/aioble/examples) montrent aussi le côté central : se connecter à un appareil et lire ses caractéristiques.

## Bus I2C

La carte a deux bus I2C : le bus interne I2C1, qui relie les composants de la carte, et le bus externe I2C3, pour les modules branchés sur la carte. Le STM32WB55 en est le maître. Le firmware n'a pas de pilote I2C matériel pour le STM32WB55 : il pilote ces bus en logiciel, avec `freq=400000` par défaut ([`machine_i2c.c`](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/machine_i2c.c), voir aussi [les trames du pont DAPLink](../daplink#trames)). Les adresses sont au format 7 bits, celui de `scan()` et `readfrom_mem()`.

### Bus interne (I2C1)

Les capteurs, l'expandeur des boutons, la jauge de batterie et le pont du DAPLink partagent l'I2C1. Les classes de la couche `steami` l'ouvrent elles-mêmes, et `Steami.i2c()` renvoie ce même bus : un programme qui crée aussi un driver doit lui passer `Steami.i2c()`, plutôt qu'un second `I2C(1)`.

Ce programme affiche la release de la carte, puis les adresses qui répondent sur le bus interne :

```python run
from time import sleep_ms

from machine import Pin
from steami import Steami

# L'expandeur MCP23009E (0x20) ne répond qu'une fois sorti de son reset
Pin("RST_EXPANDER", Pin.OUT).on()
sleep_ms(10)

print("Carte :", Steami.release_name())  # V1c, ou V1a/V1b
i2c = Steami.i2c()  # le bus I2C1, partagé avec les classes steami
print("Adresses :", [hex(address) for address in i2c.scan()])
```

`Steami.release_name()` détecte la release en interrogeant les capteurs (ou en lisant la zone de configuration du DAPLink), et affiche d'abord une ligne `[STeaMi] Board …` qui dit comment elle a été trouvée. Les adresses attendues dépendent de la release :

<ReleaseTabs>
<Release releases="v1a v1b">

| Adresse | Composant                             |
| ------- | ------------------------------------- |
| 0x1e    | LIS2MDL, magnétomètre                 |
| 0x20    | MCP23009E, expandeur (D-PAD)          |
| 0x29    | VL53L1X, distance                     |
| 0x39    | APDS-9960, lumière, couleur et gestes |
| 0x3b    | Pont DAPLink (STM32F103)              |
| 0x55    | BQ27441, jauge (batterie branchée)    |
| 0x5d    | WSEN-PADS, pression                   |
| 0x5f    | WSEN-HIDS, humidité et température    |
| 0x6b    | ISM330DL, accéléromètre et gyroscope  |

Sur la V1a, le pont DAPLink (0x3b) peut ne pas répondre : le bus arrive sur d'autres broches du STM32F103 que celles du firmware DAPLink (voir [Liaisons avec le STM32F103](/docs/hardware/main-components/stm32wb55#liaisons-avec-le-stm32f103)).

</Release>
<Release releases="v1c">

| Adresse | Composant                                 |
| ------- | ----------------------------------------- |
| 0x1e    | LIS2MDL, magnétomètre                     |
| 0x20    | MCP23009E, expandeur (D-PAD)              |
| 0x29    | VL53L1X, distance                         |
| 0x3b    | Pont DAPLink (STM32F103)                  |
| 0x55    | BQ27441, jauge (batterie branchée)        |
| 0x6b    | ISM330DL, accéléromètre et gyroscope      |
| 0x76    | BME280, pression, humidité et température |

</Release>
</ReleaseTabs>

La page [Capteurs et bus internes](/docs/hardware/pin-mapping/internal-bus#adresses-i2c) détaille ces composants. Ne rien écrire à l'adresse 0x3b sans passer par les drivers `daplink_bridge`, `daplink_flash` ou `steami_config` : le pont DAPLink garde la zone de configuration de la carte et les fichiers du lecteur **STEAMI**.

### Bus externe (I2C3) : STEMMA QT et Qwiic

L'I2C3 sort sur les deux connecteurs STEMMA/Qwiic J3 et J4, câblés en parallèle, et sur les broches P19 (SCL) et P20 (SDA) du connecteur edge. Le type des connecteurs dépend de la release :

<ReleaseTabs>
<Release releases="v1a v1b">

Connecteurs JST PH 4 broches au pas de 2 mm : un module STEMMA QT ou Qwiic demande un câble adaptateur JST PH vers JST SH.

</Release>
<Release releases="v1c">

Connecteurs JST SH 4 broches au pas de 1 mm : un câble STEMMA QT ou Qwiic s'y branche directement.

</Release>
</ReleaseTabs>

La carte n'a pas de résistance de tirage (pull-up) sur l'I2C3, et le firmware n'active pas celles du STM32WB55 : ce sont les modules STEMMA QT et Qwiic qui tirent SDA et SCL au 3V3. Un composant nu, branché sur P19 et P20, demande deux résistances de 4,7 kΩ vers le 3V3. Le brochage des connecteurs est sur la page [STEMMA/Qwiic](/docs/hardware/main-components/connectors/stemma-qwiic).

Ce programme cherche les modules branchés sur l'I2C3 :

```python run
from machine import I2C

i2c = I2C(3)  # ou I2C("I2CEXT")
addresses = i2c.scan()
print("Modules :", [hex(address) for address in addresses])
```

Brancher le module avant de lancer le programme. Sans module, les lignes ne sont tirées nulle part et le résultat n'a pas de sens : une liste vide, ou des adresses qui n'existent pas.

Les drivers de la bibliothèque prennent le bus en premier paramètre ([conventions](./conventions#initialisation)) : ils marchent aussi sur l'I2C3. Par exemple, un module BME280 STEMMA QT ou Qwiic (Adafruit, SparkFun…), à l'adresse 0x77, se lit avec le driver `bme280` du firmware :

```python
from time import sleep

from bme280 import BME280
from machine import I2C

sensor = BME280(I2C(3), address=0x77)  # 0x76 si le module le permet

while True:
    temperature, pressure, humidity = sensor.read_one_shot()
    print(
        "{:.1f} °C  {:.1f} hPa  {:.0f} %".format(temperature, pressure, humidity)
    )
    sleep(1)
```

## Bus SPI

### Bus interne (SPI1) : l'écran

Le SPI1 relie l'écran : SSD1327 sur les V1a et V1b, GC9A01 sur la V1c. `steami.Screen` l'ouvre lui-même et choisit le driver de la release. Ne pas créer `SPI(1)` dans un programme qui affiche : voir le driver [`steami_screen`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen).

### Bus externe (SPI2) : P13 à P16

Le SPI2 sort sur le connecteur edge : P13 (SCK), P14 (MISO) et P15 (MOSI). Le firmware ne pilote pas la broche de sélection (CS) : le programme la gère avec une broche libre, en général P16, mise à l'état bas pendant chaque échange.

Ce programme vérifie le bus sans module : relier P14 (MISO) à P15 (MOSI) par un fil, puis le lancer. Chaque octet envoyé revient alors sur MISO :

```python run
from machine import SPI, Pin

cs = Pin("P16", Pin.OUT, value=1)  # CS, active à l'état bas
spi = SPI(2, baudrate=1_000_000, polarity=0, phase=0)  # ou SPI("SPIEXT")

sent = b"STeaMi"
received = bytearray(len(sent))
cs.off()
spi.write_readinto(sent, received)  # envoie et reçoit en même temps
cs.on()

print("Envoyé :", sent)
print("Reçu   :", bytes(received))  # le même texte si P14 est relié à P15
```

Sans le fil, les octets reçus n'ont pas de sens. Pour un vrai module, régler `baudrate`, `polarity` et `phase` d'après sa fiche technique, et le relier à P13, P14, P15, P16, au 3V3 et à la masse.

## Liaisons série (UART)

### Connecteur Jacdac (USART1)

Le connecteur Jacdac est relié à l'USART1 du STM32WB55, ouvert par `UART(1)`. Il n'a qu'une ligne de données : d'après le schéma, TX (PB6) et RX (PB7) y sont reliés tous les deux, par des résistances de faible valeur (brochage sur la page [Connecteur Jacdac](/docs/hardware/main-components/connectors/jacdac)). La carte reçoit donc tout ce qu'elle envoie, et l'émission d'un module ne doit pas se superposer à la sienne : c'est une liaison à l'alternat (half-duplex), comme le prévoit Jacdac. Le firmware MicroPython n'a pas de pilote pour le protocole Jacdac lui-même.

Ce programme envoie un texte sur la ligne et le relit, sans rien brancher :

```python run
from time import sleep_ms

from machine import UART

uart = UART(1, 9600, timeout=100)  # USART1, connecteur Jacdac
uart.read()  # vide ce qui a été reçu avant
uart.write(b"STeaMi")
sleep_ms(20)
print("Relu :", uart.read())  # b'STeaMi' : TX et RX partagent la ligne
```

### Console série (LPUART1)

Le LPUART1 relie le STM32WB55 au DAPLink, qui le transmet à l'ordinateur par le port série USB. Il porte le REPL : `print()`, Thonny, `mpremote` et le bouton **Essayer sur la carte** passent par lui. Ne pas le régler avec `UART(2, …)`, `UART("UART1", …)` ou `UART("LP1", …)` : le firmware ne le protège pas, et un autre réglage coupe la liaison avec l'ordinateur jusqu'au redémarrage de la carte. Pour écrire vers l'ordinateur, utiliser `print()`.

## Voir aussi

- [Pile radio Bluetooth](../pile-radio) : installer et vérifier la pile du second cœur
- [Connecteurs externes](/docs/hardware/pin-mapping/external-connectors) et [connecteur edge](/docs/hardware/pin-mapping/edge-connector) : brochage complet
- [Capteurs et bus internes](/docs/hardware/pin-mapping/internal-bus) : composants du bus I2C1 et de l'écran
- [Essayer sur la carte](./essayer) : lancer les programmes de cette page depuis le navigateur
- Documentation MicroPython : [`machine.I2C`](https://docs.micropython.org/en/latest/library/machine.I2C.html), [`machine.SPI`](https://docs.micropython.org/en/latest/library/machine.SPI.html), [`machine.UART`](https://docs.micropython.org/en/latest/library/machine.UART.html), [`bluetooth`](https://docs.micropython.org/en/latest/library/bluetooth.html)
