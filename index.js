'use strict';

var assert = require('assert');
var util = require('util');
var pkgInfo = require('./lib/pkgInfo.js');
var dependedUpon = require('./lib/dependedUpon.js');
var git = require('./lib/git.js');
var random = require('./lib/random.js');
var compare = require('./lib/compare.js');
var async = require('async');
var log = require('winston');

log.cli();
log.level = 'debug';
var PACKAGES = parseInt(process.env.PACKAGES) || 100,
    VERSIONS = parseInt(process.env.VERSIONS) || 10,
    RANDOMSEED = process.env.RANDOMSEED || "hello";

random.seed(RANDOMSEED);

function start(cb) {
  log.info('***** Starting scan of top %d packages, %d versions *****',
           PACKAGES, VERSIONS);
  log.info('***** seed: %s *****', RANDOMSEED);
  cb();
}

function getMostDependedUpon(cb) {
  dependedUpon.most(PACKAGES, function (err, du) {
    if (err) return cb(err);
    var mostDependedUpon = du.map(function (val) { return val.name; });
    return cb(err, mostDependedUpon);
  });
}

function compareVersions(pkgs, cb) {
  async.mapSeries(pkgs, function (pkg, cb) {
    log.info('=== Checking package %s ===', pkg);
    compare.compare(pkg, VERSIONS, cb);
  }, function (err, pkgDiffs) {
    var diffs = {};
    if (err) return cb(err);
    assert.equal(pkgDiffs.length, pkgs.length);
    for (var i = 0; i < pkgDiffs.length; ++i) {
      var pkgName = pkgs[i];
      diffs[pkgName] = pkgDiffs[i];
    }
    cb(null, diffs);
  });
}

async.waterfall([
    start,
    getMostDependedUpon,
    compareVersions,
], function (err, diffs) {
  if (err) throw err;
  log.info('***** Complete, summarizing results *****');
  var totalDiffsFound = 0;
  Object.keys(diffs).forEach(function (pkg) {
    var diffFound = false;
    Object.keys(diffs[pkg]).forEach(function (ver) {
      if (diffs[pkg][ver]) {
        diffFound = true;
        ++totalDiffsFound;
      }
    });
    if (diffFound) {
      log.warn('Found diff(s) in %s:', pkg);
      util.inspect(diffs[pkg]).split('\n').forEach(function (line) {
        log.warn(line);
      });
    } else {
      log.info('Found no diffs in %d versions of %s', VERSIONS, pkg);
    }
  });
  if (totalDiffsFound === 0) {
    log.warn('Found no diffs in %d packages, %d versions',
             PACKAGES, VERSIONS);
  }
});

