'use strict';
var util = require('util');
var child_process = require('child_process');
var fs = require('fs');
var mkdirp = require('mkdirp');
var log = require('winston');

var workdir = './work/npm_installed';

function ensureSetup(cb) {
  mkdirp(workdir, cb);
}

function getInstallDir(module, version) {
  return workdir + '/' + module + '/' + version + '/node_modules/' + module;
}
module.exports.installDir = getInstallDir;

function install(module, version, cb) {
  ensureSetup(function (err) {
    if (err) return cb(err);

    var where = getInstallDir(module, version);
    var cmd = util.format('mkdir -p %s && npm install --prefix=%s %s@%s',
                          where, where, module, version);
    log.debug('About to run %s', cmd);
    child_process.exec(cmd, { timeout: 60*1000 },
      function (err, stdout, stderr) {
        log.debug('npm install %s@%s said (stdout):',
                  module, version, stdout);
        log.debug('npm install %s@%s said (stderr):',
                  module, version, stderr);
        if (err) return cb(err);
        cb();
      }
    );
  });
}
module.exports.install = install;

module.exports.ensureInstalled = function(module, version, cb) {
  var where = getInstallDir(module, version);
  fs.stat(where, function (err, stat) {
    if (!err && stat.isDirectory()) {
      log.verbose('Found existing install of %s@%s', module, version);
      return cb();
    }
    install(module, version, cb);
  });
};
