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

module.exports.clone = function(name, repo, cb) {
  ensureSetup(function (err) {
    if (err) return cb(err);

    var localDir = workdir + '/' + name;
    mkdirp(localDir, function (err) {
      if (err) return cb(err);

      var cmd = util.format('git clone %s %s', repo, localDir);
      log.info('Cloning package %s: %s', name, cmd);
      var child = child_process.exec(cmd, { timeout : 60*1000 },
        function (err, stdout, stderr) {
          if (err) return cb(err);
          log.debug('git said (stdout):', stdout);
          log.debug('git said (stderr):', stderr);
          cb();
        }
      );
    });
  });
};
