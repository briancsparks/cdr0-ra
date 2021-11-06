
const include                 = require('../lib/include')(module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');
const fs                      = require("fs");
const path                    = require("path");


// --------------------------------------------------------------------------------------------------------------------
const poison = sg.keyMirror('node_modules,.git,.idea');
// const poison = {};


// --------------------------------------------------------------------------------------------------------------------
module.exports.findJsFiles = function (startDir =process.cwd()) {
  const files = scanJsDir(startDir, function(filename) {
    const matches = filename.endsWith('.js');
    return matches
  });
  return files;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.findJsxFiles = function (startDir =process.cwd()) {
  const files = scanJsDir(startDir, (filename) => (filename.endsWith('.js') || filename.endsWith('.jsx')));
  return files;
};





// --------------------------------------------------------------------------------------------------------------------
function scanJsDir(startDir, pred) {
  const startDirent = fs.opendirSync(startDir);
  const files = scanJsDirent(startDirent, pred);
  startDirent.closeSync();

  return files;
}

// --------------------------------------------------------------------------------------------------------------------
function scanJsDirent(startDirent, pred) {
  let files = [];

  // console.log(startDirent.path + '--------------------------')
  // console.log(startDirent)
  // console.log(startDirent.readSync())

  for (let dirent = startDirent.readSync(); dirent; dirent = startDirent.readSync()) {
    // console.log(dirent)

    if (dirent.isDirectory()) {
      // console.log(`dir: ${dirent.name} ${startDirent.path}`, {dirent, dir});

      if (!(dirent.name in poison)) {
        const dirname = path.normalize(path.join(startDirent.path, dirent.name));
        const subDirent = fs.opendirSync(dirname);
        files = [...files, ...scanJsDirent(subDirent, pred)];
        subDirent.closeSync();
      }

    } else if (dirent.isFile()) {
      // console.log(`file: ${dirent.name}`);

      const fullname = path.normalize(path.join(startDirent.path, dirent.name));
      if (pred(fullname)) {
        files.push(fullname);
      }
      // } else {
      //   console.log(`???: ${dirent.name}`);
    }
  }

  return files;
}

// --------------------------------------------------------------------------------------------------------------------
if (require.main === module) {
  console.log(module.exports.findJsFiles())
}


