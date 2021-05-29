
module.exports = include;

function include(name) {
  // const clude = req('../../org-cdr0/cdr0-include') || require('@cdr0/include');
  const clude = req('../../cdr0-include') || require('@cdr0/include');

  return clude(name);
}

function req(name) {
  try {
    require(name);
  } catch(e) {
    // console.error(`Error req(${name})`, e);
  }
}
