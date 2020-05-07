'use strict';
var expect = require('chai').expect;
var should = require('chai').should();

var FileManager = require('../../lib/index').FileManager
var testnet = require('../../lib/index').testnet
var TxHelper = require('../../lib/index').TxHelper
var ChainRpcProvider = require('../../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../../lib/index').AsiLinkProvider
const DefaultRemoteCompiler = 'https://cdn.asimov.work/asimov.js'


describe('Compiler', function() {
  // var Module = await FileManager.importRemoteScript(DefaultRemoteCompiler)
  // var compiler = new Compiler(Module)

  // it('compile solidity file',function(){
  //    return compiler.compileSol('./test.sol').then(res=>{
  //      console.log(res)
  //   })
  // })
})
