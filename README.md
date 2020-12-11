```
Support seraph via paypal donations, thanks in advance !
```

# auto-banker [![](https://img.shields.io/badge/paypal-donate-333333.svg?colorA=0070BA&colorB=333333)](https://www.paypal.me/seraphinush)
tera-toolbox module to automatically store whitelisted items from inventory to bank storage

## Auto-update guide
- Create a folder called `auto-banker` in `tera-toolbox/mods` and download >> [`module.json`](https://raw.githubusercontent.com/seraphinush-gaming/auto-banker/master/module.json) << (right-click this link and save as..) into the folder

## Usage
- __`bank`__
  - Toggle on/off
### Arguments
- __`add <bank tab> <chatLink | id>`__
  - Add item to user designated `bank tab` of bank list
- __`set`__
  - __`delay <num>`__
    - Set delay between items banked to `num` ms
- __`list`__
  - Export bank list to console
- __`rm <chatLink | id>`__
  - Remove item from bank list
- __`usage`__
  - Send command and arguments to chat

## Info
- [Demo](https://streamable.com/zs550j)
- Inventory support only, does not search for items in pocket to store in bank
- Bank storage support only, does not automatically store items into guild bank, pet storage, or wardrobe

## Changelog
<details>

    1.01
    - Added `usage` option
    1.00
    - Initial online commit

</details>