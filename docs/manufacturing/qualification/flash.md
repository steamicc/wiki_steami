---
title: 14. Flash W25Q64
sidebar_position: 8
---

# 14. Flash W25Q64

**Ce que le test vérifie** : la mémoire flash externe W25Q64 (8 Mo), reliée au STM32F103 par SPI, s'écrit, se relit et s'efface. Le STM32WB55 n'y accède pas directement : il passe par le pont I2C du DAPLink (adresse 0x3B), qui range les données dans le fichier que l'ordinateur voit sur le lecteur **STEAMI** (voir [Flash W25Q64](/docs/hardware/main-components/w25q64) et [DAPLink — Protocole I2C](/docs/software/daplink#protocole-i2c)). Le même pont donne accès à la config zone du STM32F103, testée avec la flash.

**Lancer** : trois scénarios automatiques.

```bash
make test-daplink_flash PORT=/dev/ttyACM0
make test-daplink_bridge PORT=/dev/ttyACM0
make test-steami_config PORT=/dev/ttyACM0
```

## Résultat attendu

| Scénario                                                                                                                  | Ce qui doit passer                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`daplink_flash.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/daplink_flash.yaml)   | Nom de fichier écrit puis relu ; écriture puis effacement ; contenu relu identique ; 20 lignes sans corruption aux limites de page ; lecture sur plusieurs secteurs ; secteur de 256 octets ; fichier vide après effacement ; config zone intacte après des opérations sur le fichier |
| [`daplink_bridge.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/daplink_bridge.yaml) | WHO_AM_I à 0x4C ; registres STATUS et ERROR lisibles ; config zone écrite puis relue ; config zone vide après effacement                                                                                                                                                              |
| [`steami_config.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/steami_config.yaml)   | Configuration sauvegardée puis relue ; elle survit à l'effacement de la W25Q64 ; calibrations du magnétomètre et de l'accéléromètre et compteur de démarrages sauvegardés, relus et appliqués aux capteurs                                                                            |

## Après le test

Ces scénarios laissent la carte dans un état de test :

- la config zone contient des valeurs de test : réécrire la configuration d'usine (voir [Après la qualification](../preparation/configuration-usine#après-la-qualification)) ;
- la W25Q64 a reçu puis perdu plusieurs fichiers de test : son contenu final dépend des scénarios lancés et de leur ordre. Lancé seul, `daplink_flash` laisse par exemple un fichier `TEST.CSV`, que l'utilisateur verrait sur le lecteur **STEAMI**. Effacer la W25Q64 avant la livraison, et le contenu à y laisser (aucun fichier, ou un fichier d'accueil), sont **à définir**.
