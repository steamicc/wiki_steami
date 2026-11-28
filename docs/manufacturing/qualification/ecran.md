---
title: 12. Écran
sidebar_position: 6
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# 12. Écran

**Ce que le test vérifie** : le STM32WB55 pilote l'écran par son bus SPI et l'écran affiche ce qui lui est envoyé. L'écran dépend de la release (voir [Écran](/docs/hardware/main-components/display)) : TFT rond couleur GC9A01 de 240 × 240 pixels sur la V1c, OLED rond SSD1327 de 128 × 128 pixels sur les V1a et V1b.

<ReleaseTabs>
<Release releases="v1c">

**Lancer** : scénario [`steami_screen_v1c.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/steami_screen_v1c.yaml), qui dessine par la classe `steami.Screen` du firmware.

```bash
make test-steami_screen_v1c PORT=/dev/ttyACM0
```

| Test                                                           | Attendu                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Démarrage de l'écran                                           | `Screen.begin()` réussit, sur un GC9A01 de 240 × 240, facteur d'échelle 2, sans erreur |
| Textes, barres, graphe, menu, jauge, boussole, montre, visages | Chaque dessin s'exécute et s'affiche sans erreur                                       |
| Primitives en couleur                                          | Dessinées et affichées sans erreur                                                     |
| Envoi d'une image                                              | `show()` envoie l'image en moins de 150 ms                                             |
| Police Spleen, accents et degré                                | Police compilée dans le firmware ; pixels relus conformes                              |
| Dimensions et temps du texte                                   | `max_chars`, `text_height` et temps d'affichage des widgets conformes                  |

La plupart de ces tests ne vérifient que l'absence d'erreur : ils ne voient pas l'écran. Le scénario recommande de regarder l'écran, ou de le filmer, pour juger le dessin lui-même. Il ne dit pas quelle image attendre : le contrôle visuel de l'écran est **à définir**.

</Release>
<Release releases="v1a v1b">

**Lancer** : scénario [`ssd1327.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/ssd1327.yaml), interactif.

```bash
make test-ssd1327 PORT=/dev/ttyACM0
```

| Ce que dessine le test | Question posée à l'opérateur                                        |
| ---------------------- | ------------------------------------------------------------------- |
| Écran blanc            | L'écran affiche-t-il un fond blanc uniforme ?                       |
| Texte                  | L'écran affiche-t-il 'STeaMi' et 'Test OK' sur fond noir ?          |
| Dégradé de gris        | L'écran affiche-t-il 16 bandes verticales du noir au blanc ?        |
| Texte qui défile       | Le texte 'STeaMi' a-t-il défilé horizontalement de manière fluide ? |

Chaque question attend une réponse positive.

</Release>
</ReleaseTabs>
