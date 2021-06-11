```
Support seraph via donations, thanks in advance !
```

# auto-bank [![](https://img.shields.io/badge/paypal-donate-333333.svg?colorA=0070BA&colorB=333333)](https://www.paypal.me/seraphinush) [![](https://img.shields.io/badge/patreon-pledge-333333.svg?colorA=F96854&colorB=333333)](https://www.patreon.com/seraphinush)
tera-toolbox module to automatically store gold and whitelisted items from inventory to bank storage

## Auto-update guide
- Create a folder called `auto-bank` in `tera-toolbox/mods` and download >> [`module.json`](https://raw.githubusercontent.com/seraphinush-gaming/auto-bank/master/module.json) << (right-click this link and save as..) into the folder

## Usage
- `bank`
  - Toggle on/off
### Arguments
- `add <bank tab> <chatLink | id>`
  - Add item to user designated `bank tab` of bank list
- `gold`
  - Toggle Gold auto-deposit on/off
- `list`
  - Export bank list to console
- `rm <chatLink | id>`
  - Remove item from bank list
- `set`
  - `delay <num>`
    - Set delay between items banked to `num` ms
  - `gold <num>`
    - Set Gold auto-deposit to keep `num` Gold in Inventory
    - Requires Gold auto-deposit to be set to `true`
- `?`
  - Send command and arguments to chat

## Info
- [Demo](https://streamable.com/zs550j)
- Inventory support only, does not search for items in pocket to store in bank
- Bank storage support only, does not automatically store items into guild bank, pet storage, or wardrobe

## Changelog
<details>

    1.03
    - Changed `usage` option to `?` option
    1.02
    - Added `gold` option
    1.01
    - Added `usage` option
    1.00
    - Initial online commit

</details>