
const include                 = require('../lib/include')(module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');
const {_}                     = sg;

const urllib                  = require("url");


// --------------------------------------------------------------------------------------------------------------------
/**
 *
 * @param req
 * @param httpBody
 */
module.exports.parseRequestData = function(req, httpBody =null) {
  const url                         = urllib.parse(req.url, true);
  const headQuery                   = mkHeadQuery(req.headers)            ||{};
  let   query                       = mkQuery(url.query, req.headers);
  let   payload                     = sg.jsonify(req.bodyJson  || httpBody     ||{});

  return {url, headQuery, query, payload, query0:query, payload0:payload};
};

// --------------------------------------------------------------------------------------------------------------------
/**
 *
 * @param url
 * @param keysOptions
 */
module.exports.composeRequestData = function({url, ...rest}, keysOptions) {
  let   {specialKeys,payloadKeys}       = keysOptions ||{};
  let   {headerOnlyKeys}                = keysOptions ||{};
  // let   {query,headQuery,payload}       = rest;
  let   query2                          = {...rest.query};
  let   payload2                        = {...rest.payload};
  let   headQuery2                      = {};

  specialKeys       = specialKeys       || sg.keyMirror('sessionId,clientId,projectId');
  payloadKeys       = payloadKeys       || specialKeys;
  headerOnlyKeys    = headerOnlyKeys    || sg.keyMirror('tokenup,tokeninfo');

  // restrict headerOnlyKeys to headQuery2
  _.each(rest.headQuery, function (value, key) {
    headQuery2[key] = value;
    if (!(key in headerOnlyKeys)) {
      query2[key] = value;
    }
  });

  // Gather data from the special keys
  let   special = {};
  _.each(specialKeys, (key) => {
    const keyLc = key.toLowerCase();
    special[key] = special[key] || payload2[key] || query2[key] || payload2[keyLc] || query2[keyLc];
  });

  // Put important values onto the payload
  _.each(payloadKeys, (key) => {
    const keyLc = key.toLowerCase();
    payload2[key] = payload2[key] || special[key] || query2[key] || payload2[keyLc] || query2[keyLc];
  });

  return {special,    headQuery:headQuery2, query: query2, payload: payload2,     headQuery2, query2, payload2};
};

// --------------------------------------------------------------------------------------------------------------------
function mkHeadQuery(headers) {
  let query = {};

  _.each(headers, function(value, k) {
    const match = /^x-cdr0-(.*)$/.exec(k);
    if (match) {
      const key = match[1];
      if (key !== 'query') {
        query[key] = sg.safeJSONParse(value) || sg.smartValue(value);
      }
    }
  });

  return query;
}

// --------------------------------------------------------------------------------------------------------------------
function mkQuery(query_, headers) {
  // const query = sg.extend(query_, sg.safeJSONParse(headers['x-cdr0-query']) ||{}, mkHeadQuery(headers));
  const query = sg.extend(query_, sg.safeJSONParse(headers['x-cdr0-query']) ||{});

  return query;
}



