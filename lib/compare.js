'use strict';
var assert = require('assert');
var util = require('util');
var child_process = require('child_process');
var async = require('async');
var log = require('winston');
var git = require('./git');
var npm = require('./npmExec');
var pkgInfo = require('./pkgInfo');
var random = require('./random');

var excludes = '--exclude=.git --exclude=node_modules';


function longestPrefix(a, b) {
  for(var i = 0; i < a.length && a[i] === b[i]; ++i);
  return a.substring(0, i);
}

function diffGitAndNpm(pkg, version, cb) {
  var gitDir = git.cloneDir(pkg);
  var npmDir = npm.installDir(pkg, version);
  var prefix = longestPrefix(gitDir, npmDir);
  if (!prefix.length) {
    var msg = util.format('Could not find prefix of %s and %s',
                          gitDir, npmDir);
    return cb(new Error(msg));
  }
  var gitSubDir = gitDir.substring(prefix.length);
  var npmSubDir = gitDir.substring(prefix.length);

  var cmd = '';
  cmd += util.format('cd %s', prefix);
  cmd += util.format(' && diff -Naur %s %s %s',
                     excludes, gitSubDir, npmSubDir);
  child_process.exec(cmd, function (err, stdout, stderr) {
    if (err && err.signal) return cb(err);
    if (err && err.code !== 1) return cb(err);
    if (stderr.length !== 0) return cb(err);
    if (!err) {
      log.info('No diff for %s@%s', pkg, version);
      return cb(null, '');
    }

    // We found a diff.
    log.warn('Found a diff (%s@%s):', pkg, version, stdout);
    cb(null, stdout);
  });
}

function logger(name) {
  return function (cb) {
    log.silly('Done with %s', name);
    cb();
  };
}

function compare(pkg, numVersions, cb) {

  var repo, versions = {};

  function getRepoUrl(cb) {
    pkgInfo.repository(pkg, function (err, repo_) {
      if (err) return cb(err);
      repo = repo_;
      cb();
    });
  }

  function ensureRepoGit(cb) {
    // If repo type isn't git, nothing we can do.
    // FIXME(andrew): could probably handle hg, svn without too much trouble
    if (repo.type !== 'git') {
      var msg = util.format('Package %s repo is %s, not git, skipping',
                            pkg, repo.type);
      return cb(new Error(msg));
    }
    cb();
  }

  function clone(cb) {
    git.ensureCloned(pkg, repo.url, cb);
  }

  function chooseVersions(cb) {
    pkgInfo.versions(pkg, function (err, versions_) {
      if (err) return cb(err);
      var versionsToTry = random.sample(versions_, numVersions);
      versionsToTry.forEach(function (ver) {
        versions[ver] = { gitCheckedout: false,
                          npmInstalled: false,
                          diff: ''
                        };
      });
      cb();
    });
  }

  function npmInstallVersion(version, cb) {
    npm.ensureInstalled(pkg, version, function (err, res) {
      if (err) {
        log.error('Failed to install %s@%s:', pkg, version, err);
        return cb(); // Move on, try other versions.
      }
      versions[version].npmInstalled = true;
      cb();
    });
  }

  function npmInstallVersions(cb) {
    // FIXME(andrew): Could be eachLimit().
    async.eachSeries(Object.keys(versions), npmInstallVersion, cb);
  }

  function checkoutVersion(version, cb) {
    git.checkoutVersion(pkg, version, function (err, res) {
      if (err) {
        if (err.failedToCheckout) {
          log.verbose('Failed to git checkout %s@%s:', pkg, version, err);
        }
        return cb(); // Move on, try other versions.
      }
      versions[version].gitCheckedout = true;
      cb();
    });
  }

  function compareInstalledVersions(cb) {
    // Must be series or else multiple git checkouts can stomp on each other.
    async.mapSeries(Object.keys(versions), function (ver, cb) {
      checkoutVersion(ver, function(err, res) {
        if (versions[ver].gitCheckedout && versions[ver].npmInstalled) {
          return diffGitAndNpm(pkg, ver, function (err, diff) {
            versions[ver].diff = diff;
            return cb(null, diff);
          });
        } else {
          var msg = util.format('Cannot compare %s@%s (git: %s, npm: %s)',
                                pkg, ver, versions[ver].gitCheckedout,
                                versions[ver].npmInstalled);
          versions[ver].diff = msg;
          log.warn(msg);
          return cb(null, msg);
        }
      });
    }, function (err, diffs) {
      if (err) return cb(err);
      assert.equal(Object.keys(versions).length, diffs.length);
      var numDiffs = 0;
      diffs.forEach(function (diff) {
        if (diff.length) {
          ++numDiffs;
        }
      });
      log.info('Found %d diffs in %d versions for %s',
               numDiffs, diffs.length, pkg);
      cb(null, versions);
    });
  }

  async.series([
    getRepoUrl,
    logger('getRepoUrl'),
    ensureRepoGit,
    logger('ensureRepoGit'),
    clone,
    logger('clone'),
    chooseVersions,
    logger('chooseVersions'),
    npmInstallVersions,
    logger('npmInstallVersions'),
    compareInstalledVersions,
  ], function (err, res) {
    if (err) return cb(err);
    var result = {};
    Object.keys(versions).forEach(function (ver) {
      result[ver] = versions[ver].diff;
    });
    cb(null, result);
  });
}
module.exports.compare = compare;
