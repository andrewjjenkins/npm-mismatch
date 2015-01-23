'use strict';
var npm = require('npm');
var util = require('util');
var events = require('events');
var log = require('winston');

var config = { 'registry' : 'http://localhost:8080/' };

function NpmLoader(config) {
  this.loaded = false;
  this.loading = false;
  this.config = config;
}
util.inherits(NpmLoader, events.EventEmitter);

NpmLoader.prototype.load = function (cb) {
  if (this.loaded) return cb();
  if (this.loading) return this.on('loaded', cb);

  this.loading = true;
  this.on('loaded', cb);

  log.debug('calling npm.load()');
  var self = this;
  npm.load(this.config, function (err, result) {
    // FIXME(andrew): On error we pretty much blow up, because most users
    // don't hook for errors.
    if (err) return self.emit('error', err);
    self.loaded = true;
    self.loading = false;
    log.debug('npm.load() finished');
    self.emit('loaded', null, result);
  });
};

var npmLoader = new NpmLoader(config);

var viewCache = {};

function getView(name, cb) {
  if (viewCache[name]) {
    return cb(null, viewCache[name]);
  }

  npmLoader.load(function (err) {
    if (err) return cb(err);
    log.debug('Package "%s" info not in cache, fetching', name);
    npm.commands['view']([name], true, function (err, result) {
      if (err) return cb(err);

      // There should be 1 key, for the current version.
      var thisVers = Object.keys(result);
      if (thisVers.length !== 1) {
        return cb(new Error('More than one version (' + thisVers.toString()
                             + ') for package ' + name));
      }

      var viewResult = result[thisVers[0]];

      viewCache[name] = viewResult;
      cb(null, viewResult);
    });
  });
}

module.exports.versions = function(name, cb) {
  getView(name, function (err, result) {
    if (err) return cb(err);

    // Return the versions
    var versions = result.versions;
    cb(null, versions);
  });
};

module.exports.repository = function (name, cb) {
  getView(name, function (err, result) {
    if (err) return cb(err);

    cb(null, result.repository);
  });
};

