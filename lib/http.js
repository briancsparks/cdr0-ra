
const include                 = require('../lib/include')(module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');

const urllib                  = require("url");



// --------------------------------------------------------------------------------------------------------------------
module.exports.getReqBody = function(req, res, callback) {
  // Might have already been done
  if (req.bodyStr) {
    return callback(null, req.bodyStr, req.bodyJson);
  }

  req.on('end', onEnd);

  // Only collect data once
  if (req.chunks) {
    return;                 /* somebody is already on it */
  }

  /* otherwise -- accumulate the body */
  req.chunks = [];
  req.on('data', (chunk) => {
    req.chunks.push(chunk.toString());
  });

  // ============================================
  function onEnd() {
    req.bodyStr = req.chunks.join('');
    req.bodyJson = sg.safeJSONParse(req.bodyStr);
    return callback(null, req.bodyStr, req.bodyJson);
  }
}


// --------------------------------------------------------------------------------------------------------------------
/**
 * Figure out what the requests `payload` (body) is, and what the `items` are, if items are present.
 *
 *
 *
 * @param argv
 * @returns {{payload: {items}, items}}
 */
const httpCompositePayload = module.exports.httpCompositePayload = function(argv) {
  // {payload,headers,query,url,match,httpPayload,items}

  // Pull out all the inputs
  let   {payload,httpPayload,items}   = argv;

  // Any aliases
  payload = payload || httpPayload;
  if (sg.isEmpty(payload)) {
    if (items && Array.isArray(items)) {
      payload = {items};
    }
  }

  items   = items   || payload.items  || items;

  return {payload,items};
};

// --------------------------------------------------------------------------------------------------------------------
const httpCompositeData = module.exports.httpCompositeData = function (argv, usePayload =false) {
  // {payload,url,httpPayload,items,query,      headers,match}
  //   ^^^ optional ^^^                        ^^^ required ^^^
  //
  // Must have url or query

  // Pull out all the inputs
  let   {httpPayload,items}                 = argv;
  let   {payload,headers={},query,url,match}   = argv;

  // Any aliases
  payload = payload     || httpPayload    || {};
  if (sg.isEmpty(payload)) {
    if (items && Array.isArray(items)) {
      payload = {items};
    }
  }

  // Ensure url
  url = url   || {};
  if (typeof url === 'string') {
    url = urllib.parse(url, true);
  }

  // Build up the query
  const headersQuery  = sg.safeJSONParse(headers['x-cdr0-query'])  ||{};
  query   = query   || url.query  || {};
  query   = sg.extend(query, headersQuery);

  // Get params out of the headers
  const headersParams = sg.reduce(headers, {}, function (m, v, k) {
    const match = /^x-cdr0-(.*)$/.exec(k);
    if (match) {
      const key = match[1];
      if (key !== 'query') {
        return {...m, [key]: v};
      }
    }
    return m;
  });

  // Make our full params object
  let   params = sg._extend(query, {url}, headersParams, match);

  // What about payload?
  if (usePayload) {
    query   = sg.extend(query,  payload.query ||{});

    const payloadParams = sg.reduce(payload, {}, function (m, v, k) {
      if (Array.isArray(v)) { return m; }
      if (sg.isnt(v))       { return m; }
      if (!sg.isScalar(v))  { return m; }

      return {...m, [k]: v};
    });

    params  = sg.extend(payloadParams, payload.params ||{}, params);
    items   = items  || payload.items   || items;
  }

  //      {payload,headers,query,url,match,httpPayload}
  return  {query,url,params};
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.httpCompositeBody = function (argv, usePayload =false) {
  const {headers,query,url,params}  = httpCompositeData(argv, usePayload);
  const {payload}                   = httpCompositePayload(argv);

  return {payload, headers, query, url, params};
};


// --------------------------------------------------------------------------------------------------------------------
module.exports.sessionS3Path = function (sessionId ='') {
  const pre = sessionId.substring(0,3);
  return `${pre}/${sessionId}`;
};

// --------------------------------------------------------------------------------------------------------------------
const sessionDate = module.exports.sessionDate = function(sessionId) {
  if (!sessionId)   { return; }

  const dateStr = sessionId.split('-')[1];
  if (!dateStr)     { return; }

  const yyyy    = dateStr.substr(0, 4);
  const LL      = dateStr.substr(4, 2);
  const dd      = dateStr.substr(6, 2);
  const HH      = dateStr.substr(8, 2);
  const mm      = dateStr.substr(10, 2);
  const ss      = dateStr.substr(12, 2);
  const SSS     = dateStr.substr(14, 3);

  return `${yyyy}-${LL}-${dd}T${HH}:${mm}:${ss}.${SSS}Z`;
}

// --------------------------------------------------------------------------------------------------------------------
module.exports.getDate = function(httpPayload, params ={}) {
  let   uploadTime  = sessionDate(params && params.sessionId);
  uploadTime        = uploadTime || sg.deref(httpPayload, 'originator.originatorDetail.activity.currentDateTime');

  const dt          = uploadTime ? DateTime.fromISO(uploadTime) : DateTime.now();

  return dt;
}

// --------------------------------------------------------------------------------------------------------------------
module.exports.s3BodyJsonify = function (s3data ={}) {
  let Body = s3data.Body;
  if (Body) {
    Body = sg.safeJSONParse(''+Body) || Body;
  }

  return {...s3data, Body};
};


// --------------------------------------------------------------------------------------------------------------------
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports.randomString = function (len) {
  let result = '';
  while (result.length < len) {
    result += alphabet[Math.trunc(Math.random()*alphabet.length)];
  }
  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.nowString = function () {
  const t = new Date();

  let result = '';

  result += pad(t.getUTCFullYear(),     4, '0');
  result += pad(t.getUTCMonth()+1,   2, '0');
  result += pad(t.getUTCDate(),         2, '0');
  result += pad(t.getUTCHours(),        2, '0');
  result += pad(t.getUTCMinutes(),      2, '0');
  result += pad(t.getUTCSeconds(),      2, '0');
  result += pad(t.getUTCMilliseconds(), 3, '0');

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
// OK
const _200 = module.exports._200 = function (req, res, content ={ok:true}, headers ={}) {
  return _XXX(req, res, 200, content, headers);
};

// Created
const _201 = module.exports._201 = function (req, res, content ={ok:true}, headers ={}) {
  return _XXX(req, res, 201, content, headers);
};

// Accepted
const _202 = module.exports._202 = function (req, res, content ={ok:true}, headers ={}) {
  return _XXX(req, res, 202, content, headers);
};

// NoContent
const _204 = module.exports._204 = function (req, res, content ={ok:true}, headers ={}) {
  return _XXX(req, res, 204, content, headers);
};

// BadRequest
const _400 = module.exports._400 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 400, content, headers);
};

// Unauthorized
const _401 = module.exports._401 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 401, content, headers);
};

// Forbidden
const _403 = module.exports._403 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 403, content, headers);
};

// NotFound
const _404 = module.exports._404 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 404, content, headers);
};

// InternalServerError
const _500 = module.exports._500 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 500, content, headers);
};

// BadGateway
const _502 = module.exports._502 = function (req, res, content ={ok:false}, headers ={}) {
  return _XXX(req, res, 502, content, headers);
};

const _X00 = module.exports._X00 = function (req, res, err, content ={ok:false}, headers ={}) {
  console.error(`_X00`, sg.inspect({err, content, headers}));

  if ((err && !err.ok) || (content && content.ok === false)) {
    if ('permission' in err && !err.permission) {
      return _403(req, res, content, headers);
    }
    if ('authorized' in err && !err.authorized) {
      return _401(req, res, content, headers);
    }
    if ('unauthorized' in err && err.unauthorized) {
      return _401(req, res, content, headers);
    }

    return _400(req, res, content, headers);
  }

  return _200(req, res, content, headers);
};

function _XXX(req, res, code, content_, headers ={}) {
  const content = sg.extend(content_);    /* clean up */
  const body = stringify(content) + '\n';

  headers['Content-Type']   = headers['Content-Type'] || 'application/json';
  headers['Content-Length'] = body.length;

  res.writeHead(code, headers);
  res.write(body);
  res.end();
}


// --------------------------------------------------------------------------------------------------------------------
function stringify(x) {
  if (typeof x === 'string') { return x; }

  try {
    return JSON.stringify(x);
  } catch(e) {}

  return ''+x;
}

// --------------------------------------------------------------------------------------------------------------------
function pad(x, len, ch) {
  let result = ''+x;

  while (result.length < len) {
    result = ch + result;
  }

  return result;
}


