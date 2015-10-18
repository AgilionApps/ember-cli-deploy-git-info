/* jshint node: true */
'use strict';

var DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-git-info',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {},
      requiredConfig: [],

      setup: function(context) {
      }
    });

    return new DeployPlugin();
  }
};
