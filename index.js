var pkgInfo = require('./lib/pkgInfo.js');
var async = require('async');
var log = require('winston');

log.cli();
log.level = 'debug'

function lcb(cb) {
  return function (err, result) {
    if (err) {
      log.error('Error:', err);
    }
    log.info('Result:', result);
    cb(err, result);
  };
}

async.series([
  function (cb) { pkgInfo.versions('async', lcb(cb)); },
  function (cb) { pkgInfo.versions('express', lcb(cb)); },
  function (cb) { pkgInfo.repository('express', lcb(cb)); },
  function (cb) { pkgInfo.repository('async', lcb(cb)); },
],
function (err, result) {
  log.info('done');
});
