'use strict';

class auto_banker {

  constructor(mod) {

    this.mod = mod;
    this.command = mod.command;

    // init
    this.can_bank = false;
    this.do_bank = false;
    this.to_bank = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 3: [] };

    // command
    mod.command.add('bank', {
      '$none': () => {
        mod.settings.enable = !mod.settings.enable;
        this.send(`${mod.settings.enable ? 'En' : 'Dis'}abled`);
      },
      'add': async (page, id) => {
        if (page && id) {
          (!isNaN(page = parseInt(page)) && !isNaN(id)) ? id = parseInt(id) : id = await this.get_chatlink_id(id);
          mod.settings.bank_list[page].push(id);
          this.send(`Added &lt;${mod.game.data.items.get(id).name}&gt; to bank page ${page}.`);
        }
        else {
          this.send(`Invalid argument. usage : bank add &lt;page&gt; &lt;item id | chat link&gt;`);
        }
      },
      'list': () => {
        mod.log('Bank list :');
        for (let page in mod.settings.bank_list) {
          console.log(`${page}.`);
          mod.settings.bank_list[page].sort();
          mod.settings.bank_list[page].forEach((item) => {
            console.log('- ' + item + ' : ' + (mod.game.data.items.get(item) ? mod.game.data.items.get(item).name : 'undefined'));
          });
        }
        this.send(`Exported bank list to console.`);
      },
      'rm': async (id) => {
        if (id) {
          (!isNaN(parseInt(id))) ? id = parseInt(id) : id = await this.get_chatlink_id(id);
          let i = -1;
          for (let page in mod.settings.bank_list) {
            mod.settings.bank_list[page].sort();
            i = mod.settings.bank_list[page].indexOf(id);
            if (i >= 0) {
              mod.settings.bank_list[page].splice(i, 1);
              this.send(`Item found.`);
              break;
            }
          }
          if (i >= 0)
            this.send(`Removed &lt;${mod.game.data.items.get(id).name}&gt; from bank list.`);
          else
            this.send(`Unable to find &lt;${mod.game.data.items.get(id).name}&gt; in bank list.`);
        }
        else {
          this.send(`Invalid argument. usage : bank rm &lt;item id | chat link&gt;`);
        }
      },
      'set': {
        'delay': (n) => {
          n = parseInt(n);
          if (!isNaN(n)) {
            if (n >= 80) {
              mod.settings.bank_delay = n;
              this.send(`Set delay between items banked to ${n} ms.`);
            }
            else {
              this.send(`Recommended delay between items banked is 80 ms or longer. for risk concerns, please try a value greater than 80 ms.`);
            }
          }
          else {
            this.send(`Invalid argument. usage : bank set delay <num>`);
          }
        },
        '$default': () => { this.send(`Invalid argument. usage : bank set [delay]`); }
      },
      '$default': () => { this.send(`Invalid argument. usage : bank [add|list|rm|set]`); }
    });

    // inventory
    mod.game.initialize('inventory');
    mod.game.inventory.on('update', this._listener.bind(this));

    // code
    mod.hook('S_REQUEST_CONTRACT', 1, { order: 10 }, (e) => {
      if (mod.settings.enable && e.senderId == mod.game.me.gameId && e.type == 26) {
        this.can_bank = true;
      }
    });

    mod.hook('S_VIEW_WARE_EX', 2, { order: -10 }, (e) => {
      if (this.can_bank && !this.do_bank && e.gameId == mod.game.me.gameId && e.container == 1) {
        this.do_bank = true;
        this.handle_bank();
      }
    });
  }

  destructor() {
    this.command.remove('bank');
    for (let page in this.mod.settings.bank_list) {
      this.mod.settings.bank_list[page] = Array.from(new Set(this.mod.settings.bank_list[page]));
    }

    if (this.mod.manager.isLoaded('tera-game-state'))
      this.mod.game.inventory.removeListener('update', this._listener);
  }

  // listener
  _listener() {
    if (!this.do_bank) {
      this.to_bank = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 3: [] };

      for (let page in this.mod.settings.bank_list) {
        this.mod.game.inventory.findAllInBag(this.mod.settings.bank_list[page]).forEach((item) => {
          this.to_bank[page].push({ id: item.id, dbid: item.dbid, slot: item.slot, amount: item.amount });
        });
      }
    }
  }

  // handler
  async handle_bank() {
    for (let page in this.to_bank) {
      if (this.to_bank[page].length > 0) {
        this.to_bank[page].sort((a, b) => b.slot - a.slot);

        this.mod.send('C_VIEW_WARE', 2, {
          gameId: this.mod.game.me.gameId,
          type: 1,
          offset: (page - 1) * 72
        });
        await this.sleep(100);
        for (let item of this.to_bank[page]) {
          await this.try_bank(page, item);
        }
        await this.sleep(100);
      }
    }

    this.to_bank = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 3: [] };
    this.can_bank = this.do_bank = false;
  }

  // helper
  get_chatlink_id(chatlink) {
    return new Promise((resolve) => {
      let regex_id = /#(\d+)@/;
      let res = chatlink.match(regex_id);
      res = parseInt(res[1]);
      resolve(res);
    });
  }

  try_bank(page, item) {
    return new Promise((resolve) => {
      this.mod.setTimeout(() => {
        this.mod.send('C_PUT_WARE_ITEM', 3, {
          gameId: this.mod.game.me.gameId,
          container: 1,
          offset: (page - 1) * 72,
          fromSlot: item.slot,
          id: item.id,
          dbid: item.dbid,
          amount: item.amount,
          toSlot: (page - 1) * 72
        });
        resolve();
      }, 50);
    });
  }

  sleep(ms) {
    return new Promise((resolve) => {
      this.mod.setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  send(msg) { this.command.message(': ' + msg); }

  // reload
  saveState() { }

  loadState() { }

}

module.exports = auto_banker;