'use strict';

var pkgInfo = require('./lib/pkgInfo.js');
var dependedUpon = require('./lib/dependedUpon.js');
var git = require('./lib/git.js');
var random = require('./lib/random.js');
var async = require('async');
var log = require('winston');

log.cli();
log.level = 'debug'
var PACKAGES = 2, VERSIONS = 2, RANDOMSEED="hello";

random.seed(RANDOMSEED);

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

async.waterfall([
  getMostDependedUpon,
  getVersionsForEachPackage,
  function (pkgs, cb) { random.versionsForEachPackage(pkgs, VERSIONS, cb); },
  ],
  lcb(function () {})
);

git.ensureCloned('underscore', 'https://github.com/jashkenas/underscore.git', lcb(function () {}));
git.tags('underscore', lcb(function () {}));
git.checkoutTag('underscore', '1.3.3', lcb(function () {}));
