# npm-mismatch
Detect npm packages that have dists that differ from the repository

Please use an npm caching proxy like https://github.com/mixu/npm_lazy . If you
use npm_lazy, I suggest you set config.js' cacheAge to several hours or days:

    $ vim config.js
    module.exports = {
    ...
       cacheAge = 24 * 60 * 60 * 1000,
    ...
    }
    $ node server.js

    # FIXME(andrew): This should really be a property of npm-mismatch.
    $ vim ~/.npmrc
    registry=http://localhost:8080/

The script takes a number of packages and a number of random versions from
the environment.  It uses a seeded PRNG ("RANDOMSEED" env if you want) so that
it'll hit the cache.

    $ PACKAGES=100 VERSIONS=10 node index.js
    ... Get some coffee and a good book ...

# Interesting results

I've found a few places where the code you get from "npm install" is different
than "git clone".  I am not an expert in any of these modules, so I can't
comment on the significance.  I've ignored hits in things like docs/ and test/,
and anything that I could tell was auto-generated.

## coffee-script@1.6.2 vs github.com/jashkenas/coffeescript.git (1.6.2 tag) ***

Significant content changes.  Looks like the tag may have been mistakenly set
to an earlier point in the development.  Lots of changes to lexer!

    0 ubuntu@ip-172-31-12-66 ~/npm-mismatch/work$ diff -aur --exclude=.git --exclude=node_modules --exclude=package.json --exclude=.* git/coffee-script npm_installed/coffee-script/1.6.2/node_modules/coffee-script/ | grep -v "^Only" | diffstat
     LICENSE                            |    4 
     lib/coffee-script/browser.js       |   32 +
     lib/coffee-script/cake.js          |   11 
     lib/coffee-script/coffee-script.js |  262 +++++++++---
     lib/coffee-script/command.js       |   92 +++-
     lib/coffee-script/grammar.js       |    4 
     lib/coffee-script/helpers.js       |   98 ++++
     lib/coffee-script/index.js         |    2 
     lib/coffee-script/lexer.js         |   69 +--
     lib/coffee-script/nodes.js         |  751 +++++++++++++++++++------------------
     lib/coffee-script/optparse.js      |    8 
     lib/coffee-script/repl.js          |   39 +
     lib/coffee-script/rewriter.js      |   69 ++-
     lib/coffee-script/scope.js         |    9 
     lib/coffee-script/sourcemap.js     |   35 +
     15 files changed, 953 insertions(+), 532 deletions(-)

## yeoman-generator@0.10.3 vs github.com/yeoman/generator (v0.10.3 tag) ***

Small diff that removes an arg validation (when you npm install it).

    lib/env.js                                            |    6 +-----
    test/temp.dev/Gruntfile.js                            |    5 +++++
    test/temp.dev/app/scripts/models/application-model.js |    1 +
    test/temp/Gruntfile.js                                |    5 +++++
    4 files changed, 12 insertions(+), 5 deletions(-)

    diff -Naur '--exclude=.git' '--exclude=node_modules' '--exclude=package.json' '--exclude=.*' git/yeoman-generator/lib/env.js npm_installed/yeoman-generator/0.10.3/node_modules/yeoman-generator/lib/env.js
    --- git/yeoman-generator/lib/env.js     2015-01-23 18:38:30.253807999 +0000
    +++ npm_installed/yeoman-generator/0.10.3/node_modules/yeoman-generator/lib/env.js      2013-03-17 00:26:15.000000000 +0000
    @@ -399,11 +399,7 @@
         generator.on('end', done);
       }

    -  var requiredArgs = generator._arguments.some(function (arg) {
    -    return arg.config && arg.config.required;
    -  });
    -
    -  if (requiredArgs && !args.length) {
    +  if (options.help) {
         return console.log(generator.help());
       }

## jade@0.24.0 vs github.com/jadejs/jade (0.32.0 tag)

Pretty big diff; 9322 lines in the top-level file.

    Readme.md            |   74
    Readme_zh-cn.md      | 1041 +----
    bin/jade             |   38
    jade.js              | 9322 +++++++++++++--------------------------------------
    lib/compiler.js      |  251 -
    lib/filters.js       |  114
    lib/jade.js          |   35
    lib/lexer.js         |   77
    lib/nodes/literal.js |    5
    lib/parser.js        |  113
    lib/runtime.js       |   31
    lib/utils.js         |   47
    runtime.js           |   41
    13 files changed, 3277 insertions(+), 7912 deletions(-)

 - It is possible that the top level machine generated and order is irrelevant?
   Maybe, but that still leaves thousands of changes inside of lib/ .

    --- git/jade/lib/lexer.js       2015-01-23 18:55:39.945807999 +0000
    +++ npm_installed/jade/0.28.2/node_modules/jade/lib/lexer.js    2012-11-05 16:55:09.000000000 +0000
    .... Here is an interesting example ....
    @@ -457,7 +455,7 @@

       each: function() {
         var captures;
    -    if (captures = /^(?:- *)?(?:each|for) +([a-zA-Z_$][\w$]*)(?: *, *([a-zA-Z_$][\w$]*))? * in *([^\n]+)/.exec(this.input)) {
    +    if (captures = /^(?:- *)?(?:each|for) +(\w+)(?: *, *(\w+))? * in *([^\n]+)/.exec(this.input)) {
           this.consume(captures[0].length);
           var tok = this.tok('each', captures[1]);
           tok.key = captures[2] || '$index';

