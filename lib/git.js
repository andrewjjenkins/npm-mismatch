'use strict';
var child_process = require('child_process');
var fs = require('fs');
var util = require('util');
var async = require('async');
var mkdirp = require('mkdirp');
var log = require('winston');

var workdir = './work/git';

function ensureSetup(cb) {
  mkdirp(workdir, cb);
}

function getCloneDir(name) {
  return workdir + '/' + name;
}
module.exports.cloneDir = getCloneDir;

function clone(name, repo, cb) {
  ensureSetup(function (err) {
    if (err) return cb(err);

    var localDir = getCloneDir(name);
    mkdirp(localDir, function (err) {
      if (err) return cb(err);

      var cmd = util.format('git clone %s %s', repo, localDir);
      log.info('Cloning package %s: %s', name, cmd);
      child_process.exec(cmd, { timeout : 60*1000 },
        function (err, stdout, stderr) {
          log.debug('git said (stdout):', stdout);
          log.debug('git said (stderr):', stderr);
          if (err) return cb(err);
          cb();
        }
      );
    });
  });
}
module.exports.clone = clone;

module.exports.ensureCloned = function(name, repo, cb) {
  var gitDir = getCloneDir(name + '/.git');
  fs.stat(gitDir, function (err, stat) {
    if (!err && stat.isDirectory()) {
      log.verbose('Found existing git repo for %s at %s', name, gitDir);
      return cb();
    }
    clone(name, repo, cb);
  });
};

//FIXME(andrew): User has to make sure it is cloned first (maybe that's OK?)
module.exports.tags = function(name, cb) {
  var localDir = getCloneDir(name);
  var cmd = util.format('cd %s && git tag', localDir);
  child_process.exec(cmd, { timeout: 10*1000 },
      function (err, stdout, stderr) {
        //log.debug('git said (stdout):', stdout);
        log.debug('git said (stderr):', stderr);
        if (err) return cb(err);
        var tags = stdout.split('\n');
        tags = tags.filter(function (tag) {
          var trimmed = tag.trim();
          return trimmed.length;
        });
        cb(null, tags);
      }
  );
};

//FIXME(andrew): User has to make sure it is cloned first (maybe that's OK?)
module.exports.checkoutVersion = function(name, version, cb) {
  var localDir = getCloneDir(name);

  var tagFmts = [ '%s',    // Just the version
                  'v%s',   // v1.2.3
                  'v-%s',  // v-1.2.3
                  ];


  function tryCheckoutTag(tagFmt, cb) {
    var tag = util.format(tagFmt, version);
    var cmd = util.format('cd %s && git checkout -B branch-%s %s', localDir, version, tag);
    child_process.exec(cmd, { timeout: 30 * 1000 },
        function (err, stdout, stderr) {
          if (stdout) log.verbose('git said (%s, stdout):', tag, stdout);
          if (stderr) log.verbose('git said (%s, stderr):', tag, stderr);
          if (err) {
            log.verbose('Failed to checkout tag %s', tag);
            return cb(false);
          }
          cb(true);
        }
    );
  }

  // Must be series or else multiple git checkouts run in the same directory
  async.detectSeries(tagFmts, tryCheckoutTag, function (res) {
    if (!res) {
      var msg = util.format('Failed to checkout any tag for %s@%s', name, version);
      log.warn(msg);
      var e = new Error(msg);
      e.failedToCheckout = true;
      return cb(e);
    }
    cb();
  });
};
