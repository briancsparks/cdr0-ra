
const include                 = require('../lib/include') (module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');
const {_}                     = sg;
const path                    = require("path");
const findMods                = require('./find-mods');
const http                    = require('http');
const url                     = require('url');
const utils                   = require('./http');

// Given a routes object, walk /routes and load all 'rr' type fns.


// Set with `npm config set quick-cdr0-server:ingestPort 80`
const port = process.env.INGEST_PORT || process.env.PORT  || process.env.npm_package_config_ingestPort || 3001;

// --------------------------------------------------------------------------------------------------------------------
const loadRoutes = module.exports.loadRoutes = function(router, startDir_ =process.cwd()) {
  const startDir = path.join(startDir_, 'lib', 'routes');
  const mods = findMods.findJsFiles(startDir);

  _.each(mods, function (modpath) {
    const parts = path.relative(startDir, modpath).split('.')[0].split(path.sep);

    if (modpath === __filename)                   { return; }

    const mod = require(modpath);
    if (typeof mod.addRoutes === 'function') {
      mod.addRoutes(router);
      return;
    }

    // This module has an 'rr' object?
    if (!mod.rr)                                  { return; }

    // fn name 'main' gets the name of the file
    const mainUrlpath = `/${parts.join('/')}`;
    setupRoute(router, mod.rr.main, mainUrlpath);
    console.log(modpath, mainUrlpath);

    _.each(mod.rr, function (fn, name) {
      if (name === 'main')                        { return; }

      const urlpath = `/${parts.join('/')}/${name}`;
      setupRoute(router, fn, urlpath);
      console.log(modpath, urlpath);
    });
  });
``};

// --------------------------------------------------------------------------------------------------------------------
const serve = module.exports.serve = function(startDir =process.cwd()) {

  const Router = require('routes');
  const router = Router();

  loadRoutes(router, startDir);

  const server = http.createServer((req, res) => {
    const pathname = url.parse(req.url).pathname;
    const match = router.match(pathname);
    if (match) {
      return match.fn(req, res, match);
    }

    /* otherwise */
    return utils._404(req, res);
  });

  server.listen(+port, () => {
    console.log(`Ingest server running on port: ${port}`);
  });
};

// --------------------------------------------------------------------------------------------------------------------
function setupRoute(router, fn, urlpath) {
  if (!fn || !urlpath) {
    return;
  }

  router.addRoute(urlpath, fn);
}


// --------------------------------------------------------------------------------------------------------------------
if (require.main === module) {
  // loadMain1()
  serveMain1()
}

// --------------------------------------------------------------------------------------------------------------------
function loadMain1() {
  loadRoutes(require('routes')())
}

// --------------------------------------------------------------------------------------------------------------------
function serveMain1() {
  serve()
}

