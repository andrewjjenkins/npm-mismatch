'use strict';
var seedrandom = require('seedrandom');

var rng;
module.exports.seed = function (seed) {
  rng = seedrandom(seed);
};

function durstenfeldShuffle(a) {
  for (var i = a.length - 1; i > 0; --i) {
    var j = Math.floor(rng() * (i + 1));
    var aj = a[j], ai = a[i];
    a[i] = aj;
    a[j] = ai;
  }
}
module.exports.durstenfeldShuffle = durstenfeldShuffle;

function sample(a, n) {
  var newA = a.slice();
  durstenfeldShuffle(newA);
  return newA.slice(0, n);
}
module.exports.sample = sample;

function versionsForEachPackage(pkgs, versions, cb) {
  var newPkgs = {};
  Object.keys(pkgs).forEach(function (pkgName) {
    newPkgs[pkgName] = sample(pkgs[pkgName], versions);
  });
  cb(null, newPkgs);
}
module.exports.versionsForEachPackage = versionsForEachPackage;
