
const crypto                  = require('crypto');


// --------------------------------------------------------------------------------------------------------------------
module.exports.hashOfString = function(str, {algo ='sha1', encoding ='hex'}) {

  const hashSum = crypto.createHash(algo);      /* md5, sha1, sha256 */
  hashSum.update(str);

  return  hashSum.digest(encoding);                  /* hex, base64 */
}



