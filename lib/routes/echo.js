
const ra                      = require('../..');
const mod                     = ra.mod(module);
const utils                   = require('../http');
const urllib                  = require('url');
const {getReqBody} = require("../http");



// curl -sSL 'http://localhost:3001/echo?x=42'
// curl -sSL -X POST -d '{"foo":"bar"}' 'http://localhost:3001/echo?x=42'

mod.rr({main(req, res, match) {
  const url = urllib.parse(req.url, true);

  let   result = {
    query: url.query,
    headers: req.headers,
  };

  return getReqBody(req, res, function(err, bodyStr, bodyJson) {
    if (err) {
      return utils._500(req, res);
    }

    result = {...result, bodyJson};
    return utils._200(req, res, result);
  });

}});

