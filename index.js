var pkgInfo = require('./lib/pkgInfo.js');
var dependedUpon = require('./lib/dependedUpon.js');
var async = require('async');
var log = require('winston');
var seedrandom = require('seedrandom');

log.cli();
log.level = 'debug'
var PACKAGES = 2, VERSIONS = 2, RANDOMSEED="hello";

var rng = seedrandom(RANDOMSEED);

function lcb(cb) {
  return function (err, result) {
    if (err) {
      log.error('Error:', err);
    }
    log.info('Result:', result);
    cb(err, result);
  };
}

function getMostDependedUpon(cb) {
  dependedUpon.most(PACKAGES, function (err, du) {
    if (err) return cb(err);
    return cb(null, du.map(function (val) { return val.name; }));
  });
}

function getVersionsForEachPackage(pkgs, cb) {
  var pkgVers = {};

  var failed;
  async.each(pkgs,
    function (pkg, cb) {
      pkgInfo.versions(pkg, function (err, res) {
        if (err) return cb(err);
        log.debug('Adding info for package %s:', pkg, res);
        pkgVers[pkg] = res;
        cb();
      });
    },
    function (err) {
      if (err) return cb(err);
      return cb(null, pkgVers);
    }
  );
}

function durstenfeldShuffle(a) {
  for (var i = a.length - 1; i > 0; --i) {
    var j = Math.floor(rng() * (i + 1));
    var aj = a[j], ai = a[i];
    a[i] = aj;
    a[j] = ai;
  }
}

function getRandomVersionsForEachPackage(pkgs, cb) {
  var newPkgs = {};
  Object.keys(pkgs).forEach(function (pkgName) {
    var newVersions = pkgs[pkgName].slice();
    durstenfeldShuffle(newVersions);
    newPkgs[pkgName] = newVersions.slice(0, VERSIONS);
  });
  cb(null, newPkgs);
}


/*
async.series([
  function (cb) { getMostDependedUpon(lcb(cb)); },
  function (cb) { pkgInfo.versions('async', lcb(cb)); },
  function (cb) { pkgInfo.versions('express', lcb(cb)); },
  function (cb) { pkgInfo.repository('express', lcb(cb)); },
  function (cb) { pkgInfo.repository('async', lcb(cb)); },
  function (cb) { dependedUpon.most(lcb(cb)); },
],
function (err, result) {
  log.info('done');
});
*/

async.waterfall([
  getMostDependedUpon,
  getVersionsForEachPackage,
  getRandomVersionsForEachPackage,
  ],
  lcb(function () {})
);
