'use strict';

const DefaultSettings = {
  "enabled": false,
  "delay": 150,
  "bankList": { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] },
  "depositGold": false,
  "depositAmount": 0
};

function MigrateSettings(from_ver, to_ver, settings) {
  if (from_ver === undefined) {
    return Object.assign(Object.assign({}, DefaultSettings), settings);
  }
  else if (from_ver === null) {
    return DefaultSettings;
  }
  else {
    if (from_ver + 1 < to_ver) {
      settings = MigrateSettings(from_ver, from_ver + 1, settings);
      return MigrateSettings(from_ver + 1, to_ver, settings);
    }
    switch (to_ver) {
      case 2:
        settings.delay = settings.bank_delay;
        delete settings.bank_delay;
        break;
      case 3:
        settings.deposit_gold = false;
        settings.deposit_amount = 0;
        break;
      case 4:
        settings.enabled = settings.enable;
        delete settings.enable;
        settings.bankList = settings.bank_list;
        delete settings.bank_list;
        settings.depositGold = settings.deposit_gold;
        delete settings.deposit_gold;
        settings.depositAmount = settings.deposit_amount;
        delete settings.deposit_amount;
        break;
    }

    return settings;
  }
}

module.exports = MigrateSettings;