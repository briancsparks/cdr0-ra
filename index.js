
const include                 = require('./lib/include')(module);

const config                  = require('./lib/config');
const logging                 = require('./lib/logging');
const debug                   = require('./lib/debug');
const grumpy                  = require('./lib/grumpy');
const status                  = require('./lib/status');

module.exports = Object.assign({},
    require('./lib/mod'),

    {
      logging,
      debug,
      grumpy,
      config,
      status
    },

    config
);
