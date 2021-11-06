
const ra                      = require('../..');
const urllib = require("url");
const {getReqBody} = require("../http");
const utils = require("../http");
const {parseRequestData, composeRequestData} = require("../http-data");
const mod                     = ra.mod(module);



// curl -sSL 'http://localhost:3001/request/data?x=42'
// curl -sSL -X POST -d '{"foo":"bar"}' 'http://localhost:3001/request/data?x=42&sessionId=asdf-1234'
// curl -sSL -X POST -d '{"foo":"bar","projectId":"booya"}' --header "x-cdr0-token: ttookkeenn" 'http://localhost:3001/request/data?x=42&sessionId=asdf-1234'

mod.rr({data(req, res, match) {
  const url = urllib.parse(req.url, true);

  // console.log(req.method, req.url, match, url)

  return getReqBody(req, res, function(err, bodyStr, bodyJson) {
    if (err) {
      return utils._500(req, res);
    }

    const {url, query, payload, headQuery}          = parseRequestData(req);
    const {special, headQuery2, query2, payload2}   = composeRequestData({url, query, payload, headQuery});

    return utils._200(req, res, {query, payload, headQuery, query2, payload2, headQuery2, special});
  });

}});

