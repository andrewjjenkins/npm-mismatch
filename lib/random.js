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

function versionsForEachPackage(pkgs, versions, cb) {
  var newPkgs = {};
  Object.keys(pkgs).forEach(function (pkgName) {
    var newVersions = pkgs[pkgName].slice();
    durstenfeldShuffle(newVersions);
    newPkgs[pkgName] = newVersions.slice(0, versions);
  });
  cb(null, newPkgs);
}
module.exports.versionsForEachPackage = versionsForEachPackage;
