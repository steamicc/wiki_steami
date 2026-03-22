---
sidebar_position: 11
title: 'Cristaux'
---

import OctopartButton from '@site/src/components/OctopartButton';

# Cristaux et oscillateurs

| Composant    | Description                  | Fabricant                                                          | Reference                                             | Qte | Datasheet |
| ------------ | ---------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | --- | --------- |
| 830103552209 | Quartz 32 MHz, 9 pF, 10 ppm  | [Wurth](https://www.we-online.com/en/components/products/WE-QUARZ) | 830103552209 <br/><OctopartButton q="830103552209" /> | 1   | —         |
| 830062558    | Quartz 32 kHz, 12 pF, 30 ppm | [Wurth](https://www.we-online.com/en/components/products/WE-QUARZ) | 830062558 <br/><OctopartButton q="830062558" />       | 1   | —         |
| 830108313809 | Quartz 8 MHz, 12 pF, 20 ppm  | [Wurth](https://www.we-online.com/en/components/products/WE-QUARZ) | 830108313809 <br/><OctopartButton q="830108313809" /> | 1   | —         |

## Utilisation

- **32 MHz** : Horloge principale du [STM32WB55RG](../main-components/stm32wb55)
- **32 kHz** : Horloge RTC (Real Time Clock) du [STM32WB55RG](../main-components/stm32wb55)
- **8 MHz** : Horloge principale du [STM32F103CBT6](../main-components/stm32f103) (microcontroleur interface)
