'use strict';

var should = require('chai').should();
const DefaultRemoteCompiler = 'https://cdn.asimov.work/asimov.js';
var FileManager_1 = require('../../lib/index').FileManager;
var Compiler_1 = require('../../lib/index').Compiler;

describe('SolcWrap', function() {

  it('set up methods', function() {
    FileManager_1.importRemoteScript(DefaultRemoteCompiler).then(Module => {
      let compiler = new Compiler_1(Module);
      should.exist(compiler);
    });
  });
});
