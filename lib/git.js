'use strict';
var child_process = require('child_process');
var fs = require('fs');
var util = require('util');
var mkdirp = require('mkdirp');
var log = require('winston');

var workdir = './work/git';

function ensureSetup(cb) {
  mkdirp(workdir, cb);
}

function getLocalDir(name) {
  return workdir + '/' + name;
}

function clone(name, repo, cb) {
  ensureSetup(function (err) {
    if (err) return cb(err);

    var localDir = getLocalDir(name);
    mkdirp(localDir, function (err) {
      if (err) return cb(err);

      var cmd = util.format('git clone %s %s', repo, localDir);
      log.info('Cloning package %s: %s', name, cmd);
      child_process.exec(cmd, { timeout : 60*1000 },
        function (err, stdout, stderr) {
          if (err) return cb(err);
          log.debug('git said (stdout):', stdout);
          log.debug('git said (stderr):', stderr);
          cb();
        }
      );
    });
  });
}
module.exports.clone = clone;

module.exports.ensureCloned = function(name, repo, cb) {
  var gitDir = getLocalDir(name + '/.git');
  fs.stat(gitDir, function (err, stat) {
    if (!err && stat.isDirectory()) {
      log.debug('Found existing git repo for %s at %s', name, gitDir);
      return cb();
    }
    clone(name, repo, cb);
  });
};

//FIXME(andrew): User has to make sure it is cloned first (maybe that's OK?)
module.exports.tags = function(name, cb) {
  var localDir = getLocalDir(name);
  var cmd = util.format('cd %s && git tag', localDir);
  child_process.exec(cmd, { timeout: 10*1000 },
      function (err, stdout, stderr) {
        if (err) return cb(err);
        //log.debug('git said (stdout):', stdout);
        log.debug('git said (stderr):', stderr);
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
module.exports.checkoutTag = function(name, tag, cb) {
  var localDir = getLocalDir(name);
  var cmd = util.format('cd %s && git checkout -B branch-%s %s', localDir, tag, tag);
  child_process.exec(cmd, { timeout: 30 * 1000 },
      function (err, stdout, stderr) {
        if (err) return cb(err);
        log.debug('git said (stdout):', stdout);
        log.debug('git said (stderr):', stderr);
        cb();
      }
  );
};
