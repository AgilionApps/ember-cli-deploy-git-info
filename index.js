/* jshint node: true */
'use strict';

var DeployPluginBase = require('ember-cli-deploy-plugin');
var RSVP             = require('rsvp');
var cp               = require('child_process');

// Executes a command, returns the value wrapped in a promise.
// If error code is returned promise resolved okay with value null.
function execP(cmd) {
  return new RSVP.Promise(function(resolve, reject) {
    cp.exec(cmd, function(error, stdout, stderr) {
      resolve(error ? null : stdout.trim());
    });
  });
}

module.exports = {
  name: 'ember-cli-deploy-git-info',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        branchEnvVars: ['TRAVIS_BRANCH', 'CIRCLE_BRANCH', 'CI_BRANCH']
      },
      requiredConfig: [],

      setup: function(context) {
        this.log('Finding git info for commit');
        return execP('git rev-parse --short HEAD').then(function(commit) {
          return RSVP.hash({
            commit:              commit,
            fullCommit:          execP('git rev-parse HEAD'),
            lastTag:             this._lastTag(),
            commitsSinceLastTag: this._commitsSinceLastTag(),
            branch:              this._getBranch(),
            subject:             execP('git show -s --format=%s ' + commit),
            body:                execP('git show -s --format=%b ' + commit),
            rawBody:             execP('git show -s --format=%B ' + commit),
            committer:           execP('git show -s --format=%cN ' + commit),
            committerEmail:      execP('git show -s --format=%cE ' + commit),
            author:              execP('git show -s --format=%aN ' + commit),
            authorEmail:         execP('git show -s --format=%aE ' + commit),
            commiterDate:        execP('git show -s --format=%cd ' + commit)
          });
        }.bind(this)).then(function(hash) {
          this.log('Git info avaiable in context["git-info"]')
          return {'git-info': hash};
        }.bind(this));
      },

      _getBranch: function() {
        return execP('git symbolic-ref --short -q HEAD').then(function(branch) {
          return branch || this._envBranch();
        }.bind(this));
      },

      _envBranch: function() {
        return this.readConfig('branchEnvVars').
          map(function(branch) { return process.env[branch]; }).
          filter(function(b) { return b; }).
          shift();
      },

      _lastTag: function() {
        return execP('git describe --tags').then(function(describe) {
          return describe ? describe.split('-').slice(0, -2).join('-') : null;
        });
      },

      _commitsSinceLastTag: function() {
        return execP('git describe --tags').then(function(describe) {
          return describe ? describe.split('-').reverse()[1] : null;
        });
      }

    });

    return new DeployPlugin();
  }
};
