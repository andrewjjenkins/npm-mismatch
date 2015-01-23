//FIXME(andrew): Couldn't figure out the right API call, and this seems
//expensive to pound the registry.npmjs.org server with over and over,
//so it uses a static file.  I got it via:
//
// curl http://registry.npmjs.org/-/_view/dependedUpon?group_level=1 > dependedUpon.json
'use strict';

var dependedUponJson = "data/dependedUpon.json";

var fs = require('fs');
var log = require('winston');

var dependedUponCache = {};
function loadDependedUpon(cb) {
  if (Object.keys(dependedUponCache).length) {
    cb(null, dependedUponCache);
  } else {
    fs.readFile(dependedUponJson, function (err, contents) {
      if (err) return cb(err);
      try {
        dependedUponCache = JSON.parse(contents);
      } catch(e) {
        return cb(err);
      }
      cb(null, dependedUponCache);
    });
  }
}

var mostDependedUponCache = [];
module.exports.most = function (count, cb) {
  if (typeof count === 'function') {
    cb = count;
    count = 100;
  }

  if (mostDependedUponCache.length) {
    cb(null, mostDependedUponCache.slice(0, count));
  }
  loadDependedUpon(function (err, dependedUpon) {
    var toSort = dependedUpon.rows.slice();
    toSort.sort(function (a, b) {
      // Sort descending based on dependedUpon
      return b.value - a.value;
    });
    var dependedUpon = [];
    for(var i = 0; i < toSort.length; ++i) {
      dependedUpon.push({ dependents: toSort[i].value, name: toSort[i].key[0]});
    }
    mostDependedUponCache = dependedUpon;
    var mostSlice = mostDependedUponCache.slice(0, count);
    cb(null, mostSlice);
  });
};
