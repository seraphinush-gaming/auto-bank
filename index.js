'use strict';

const regex_id = /#(\d+)@/;

class auto_banker {

  constructor(mod) {

    this.mod = mod;
    this.command = mod.command;

    // init
    this.do_bank = false;
    this.to_bank = {};

    // command
    mod.command.add('bank', {
      '$none': () => {
        mod.settings.enable = !mod.settings.enable;
        this.send(`${mod.settings.enable ? 'En' : 'Dis'}abled`);
      },
      'add': async (tab, id) => {
        if (!tab || !id)
          return this.send(`Invalid argument. usage : bank add &lt;tab&gt; &lt;item id | chat link&gt;`);

        (!isNaN(tab = parseInt(tab)) && !isNaN(id)) ? id = parseInt(id) : id = await this.get_chatlink_id(id);
        if (!mod.game.data.items.get(id))
          return this.send(`Invalid id. usage : bank add &lt;tab&gt; &lt;item id | chat link&gt;`);

        mod.settings.bank_list[tab].push(id);
        let name = mod.game.data.items.get(id) ? mod.game.data.items.get(id).name : 'undefined';
        this.send(`Added &lt;${name}&gt; to bank tab ${tab}.`);
      },
      'gold': () => {
        mod.settings.deposit_gold = !mod.settings.deposit_gold;
        this.send(`Auto-deposit Gold ${mod.settings.deposit_gold ? 'En' : 'Dis'}abled`);
      },
      'list': () => {
        mod.log('Bank list :');
        for (let tab in mod.settings.bank_list) {
          console.log(`${tab}.`);
          mod.settings.bank_list[tab].sort((a, b) => parseInt(a) - parseInt(b));
          mod.settings.bank_list[tab] = Array.from(new Set(mod.settings.bank_list[tab]));
          mod.settings.bank_list[tab].forEach((item) => {
            let name = mod.game.data.items.get(id) ? mod.game.data.items.get(id).name : 'undefined';
            console.log('- ' + item + ' : ' + name);
          });
        }
        this.send(`Exported bank list to console.`);
      },
      'rm': async (id) => {
        if (!id)
          return this.send(`Invalid argument. usage : bank rm &lt;item id | chat link&gt;`);

        (!isNaN(parseInt(id))) ? id = parseInt(id) : id = await this.get_chatlink_id(id);
        let i = -1;
        for (let tab in mod.settings.bank_list) {
          i = mod.settings.bank_list[tab].indexOf(id);
          i >= 0 ? mod.settings.bank_list[tab].splice(i, 1) : null;
        }
        let name = mod.game.data.items.get(id) ? mod.game.data.items.get(id).name : 'undefined';
        this.send(`Removed &lt;${name}&gt; from bank list.`);
      },
      'set': {
        'delay': (num) => {
          if (isNaN(num = parseInt(num)))
            return this.send(`Invalid argument. usage : bank set delay &lt;num&gt;`);

          mod.settings.delay = num;
          this.send(`Set delay between items banked to ${num} ms.`);
        },
        'gold': (num) => {
          if (!isNaN(num = parseInt(num)))
            return this.send(`Invalid argument. usage : bank set gold &lt;num&gt;`);

          mod.settings.deposit_amount = num * 10000;
          this.send(`Set auto-deposit to keep ${num} Gold in Inventory.`);
        },
        '$default': () => this.send(`Invalid argument. usage : bank set [delay|gold]`)
      },
      '?': () => this.send(`Usage : bank [add|gold|list|rm|set]`),
      '$default': () => this.send(`Invalid argument. usage : bank [add|gold|list|rm|set|?]`)
    });

    // inventory
    mod.game.initialize('inventory');
    mod.game.inventory.on('update', this._listener.bind(this));

    // code
    mod.hook('S_REQUEST_CONTRACT', 1, { order: 10 }, (e) => {
      if (mod.settings.enable && e.senderId == mod.game.me.gameId && e.type == 26) {
        mod.hookOnce('S_VIEW_WARE_EX', mod.majorPatchVersion >= 96 ? 3 : 2, { order: -10 }, async (e) => {
          if (!this.do_bank && e.gameId == mod.game.me.gameId && e.container == 1) {
            this.do_bank = true;
            await this.handle_bank();
            if (mod.settings.deposit_gold)
              this.handle_deposit();
          }
        });
      }
    });

  }

  destructor() {
    this.command.remove('bank');
    for (let tab in this.mod.settings.bank_list) {
      mod.settings.bank_list[tab].sort((a, b) => parseInt(a) - parseInt(b));
      this.mod.settings.bank_list[tab] = Array.from(new Set(this.mod.settings.bank_list[tab]));
    }

    if (this.mod.manager.isLoaded('tera-game-state'))
      this.mod.game.inventory.removeListener('update', this._listener);
  }

  // listener
  _listener() {
    if (!this.do_bank) {
      this.to_bank = {};

      for (let tab in this.mod.settings.bank_list) {
        this.mod.game.inventory.findAllInBag(this.mod.settings.bank_list[tab]).forEach((item) => {
          if (!this.to_bank[tab]) this.to_bank[tab] = [];
          this.to_bank[tab].push({ id: item.id, dbid: item.dbid, slot: item.slot, amount: item.amount });
        });
      }
    }
  }

  // handler
  async handle_bank() {
    for (let tab in this.to_bank) {
      if (this.to_bank[tab].length > 0) {
        this.to_bank[tab].sort((a, b) => b.slot - a.slot);
        this.mod.send('C_VIEW_WARE', 2, {
          gameId: this.mod.game.me.gameId,
          type: 1,
          offset: (tab - 1) * 72
        });
        await this.sleep(100);

        for (let item of this.to_bank[tab])
          await this.try_bank(tab, item);

        await this.sleep(100);
      }
    }

    this.to_bank = {};
    this.do_bank = false;
  }

  async handle_deposit() {
    if (this.mod.game.inventory.money > this.mod.settings.deposit_amount) {
      this.mod.send('C_PUT_WARE_ITEM', 3, {
        gameId: this.mod.game.me.gameId,
        container: 1,
        money: this.mod.game.inventory.money - BigInt(this.mod.settings.deposit_amount),
        fromPocket: -1,
        fromSlot: -1,
        id: -1,
        toSlot: -1
      });
    }

  }

  // helper
  get_chatlink_id(chatlink) {
    return new Promise((resolve) => {
      let res = chatlink.match(regex_id);
      res = parseInt(res[1]);
      resolve(res);
    });
  }

  try_bank(tab, item) {
    return new Promise((resolve) => {
      this.mod.setTimeout(() => {
        this.mod.send('C_PUT_WARE_ITEM', 3, {
          gameId: this.mod.game.me.gameId,
          container: 1,
          offset: (tab - 1) * 72,
          fromSlot: item.slot,
          id: item.id,
          dbid: item.dbid,
          amount: item.amount,
          toSlot: (tab - 1) * 72
        });
        resolve();
      }, this.mod.settings.delay);
    });
  }

  sleep(ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }

  send(msg) { this.command.message(': ' + msg); }

}

module.exports = { NetworkMod: auto_banker };