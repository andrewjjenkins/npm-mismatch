var pkgInfo = require('./lib/pkgInfo.js');
var async = require('async');
var log = require('winston');

log.cli();
log.level = 'debug'

async.series([
  function (cb) { pkgInfo.versions('async', cb); },
  function (cb) { pkgInfo.versions('express', cb); },
],
function (err, result) {
  log.info('done');
});
