'use strict';

const REGEX_ID = /#(\d+)@/;

class AutoBank {

  constructor(mod) {

    this.mod = mod;
    this.command = mod.command;

    // init
    this.isBanking = false;
    this.toBank = {};

    // command
    mod.command.add('bank', {
      '$none': () => {
        mod.settings.enabled = !mod.settings.enabled;
        this.send(`${mod.settings.enabled ? 'En' : 'Dis'}abled`);
      },
      'add': async (tab, id) => {
        if (!tab || !id)
          return this.send(`Invalid argument. usage : bank add &lt;tab&gt; &lt;item id | chat link&gt;`);

        (!isNaN(tab = parseInt(tab)) && !isNaN(id)) ? id = parseInt(id) : id = await this.get_chatlinkId(id);
        let item = mod.game.data.items.get(id)
        if (!item)
          return this.send(`Invalid id. usage : bank add &lt;tab&gt; &lt;item id | chat link&gt;`);

        mod.settings.bankList[tab].push(id);
        mod.settings.bankList[tab] = Array.from(new Set(mod.settings.bankList[tab]));
        mod.settings.bankList[tab].sort((a, b) => parseInt(a) - parseInt(b));
        this.send(`Added &lt;${item.name}&gt; to bank tab ${tab}.`);
      },
      'gold': () => {
        mod.settings.depositGold = !mod.settings.depositGold;
        this.send(`Auto-deposit Gold ${mod.settings.depositGold ? 'En' : 'Dis'}abled`);
      },
      'list': () => {
        mod.log('Bank list :');
        for (let tab in mod.settings.bankList) {
          console.log(`${tab}.`);
          mod.settings.bankList[tab].forEach((id) => {
            let name = mod.game.data.items.get(id) ? mod.game.data.items.get(id).name : 'undefined';
            console.log('- ' + id + ' : ' + name);
          });
        }
        this.send(`Exported bank list to console.`);
      },
      'rm': async (id) => {
        if (!id)
          return this.send(`Invalid argument. usage : bank rm &lt;item id | chat link&gt;`);

        (!isNaN(parseInt(id))) ? id = parseInt(id) : id = await this.get_chatlinkId(id);
        for (let tab in mod.settings.bankList) {
          const i = mod.settings.bankList[tab].indexOf(id);
          if (i >= 0) mod.settings.bankList[tab].splice(i, 1);
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

          mod.settings.depositAmount = num * 10000;
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
      if (mod.settings.enabled && e.senderId == mod.game.me.gameId && e.type == 26) {
        mod.hookOnce('S_VIEW_WARE_EX', mod.majorPatchVersion >= 96 ? 3 : 2, { order: -10 }, async (e) => {
          if (!this.isBanking && e.gameId == mod.game.me.gameId && e.container == 1) {
            this.isBanking = true;
            await this.handleBank();
            if (mod.settings.depositGold)
              this.handleDeposit();
          }
        });
      }
    });

  }

  destructor() {
    this.command.remove('bank');
    for (let tab in this.mod.settings.bankList) {
      this.mod.settings.bankList[tab] = Array.from(new Set(this.mod.settings.bankList[tab]));
      this.mod.settings.bankList[tab].sort((a, b) => parseInt(a) - parseInt(b));
    }

    if (this.mod.manager.isLoaded('tera-game-state'))
      this.mod.game.inventory.removeListener('update', this._listener);
    
    this.command = undefined;
    this.mod = undefined;
  }

  // listener
  _listener() {
    if (!this.isBanking) {
      this.toBank = {};

      for (let tab in this.mod.settings.bankList) {
        this.mod.game.inventory.findAllInBag(this.mod.settings.bankList[tab]).forEach((item) => {
          if (!this.toBank[tab]) this.toBank[tab] = [];
          this.toBank[tab].push({ id: item.id, dbid: item.dbid, slot: item.slot, amount: item.amount });
        });
      }
    }
  }

  // handler
  async handleBank() {
    for (let tab in this.toBank) {
      if (this.toBank[tab].length > 0) {
        this.toBank[tab].sort((a, b) => b.slot - a.slot);
        this.mod.send('C_VIEW_WARE', 2, {
          gameId: this.mod.game.me.gameId,
          type: 1,
          offset: (tab - 1) * 72
        });
        await this.sleep(100);

        for (let item of this.toBank[tab])
          await this.tryBank(tab, item);

        await this.sleep(100);
      }
    }

    this.toBank = {};
    this.isBanking = false;
  }

  handleDeposit() {
    if (this.mod.game.inventory.money > this.mod.settings.depositAmount) {
      this.mod.send('C_PUT_WARE_ITEM', 3, {
        gameId: this.mod.game.me.gameId,
        container: 1,
        money: this.mod.game.inventory.money - BigInt(this.mod.settings.depositAmount),
        fromPocket: -1,
        fromSlot: -1,
        id: -1,
        toSlot: -1
      });
    }

  }

  // helper
  get_chatlinkId(chatlink) {
    return new Promise((resolve) => {
      let res = chatlink.match(REGEX_ID);
      res = parseInt(res[1]);
      resolve(res);
    });
  }

  tryBank(tab, item) {
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

  sleep(ms) { return new Promise((resolve) => { this.mod.setTimeout(resolve, ms); }); }

  send(msg) { this.command.message(': ' + msg); }

}

module.exports = { NetworkMod: AutoBank };