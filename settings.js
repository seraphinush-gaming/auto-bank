'use strict';

const DefaultSettings = {
  "enable": false,
  "bank_list": { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] },
  "bank_delay": 150
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
      //
    }

    return settings;
  }
}

module.exports = MigrateSettings;