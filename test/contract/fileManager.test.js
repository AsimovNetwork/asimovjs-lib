'use strict';
var expect = require('chai').expect;
var should = require('chai').should();

var FileManager = require('../../lib/index').FileManager
var testnet = require('../../lib/index').testnet
var TxHelper = require('../../lib/index').TxHelper
var ChainRpcProvider = require('../../lib/index').ChainRpcProvider
var AsiLinkProvider = require('../../lib/index').AsiLinkProvider
// var file = require('fs')
// var path = require('path')
// var solFilePath = path.resolve(__dirname, './tutorial.sol')

describe('FileManager', function() {
  var fileManager = new FileManager()

  it('import not exist file from  github', function() {
    return fileManager.importFile('github.com/evilcc2018/dapp-bin/pai-experimental/3rd/math.sol').then(res => {
      expect(res).to.be.equal('Not Found')
    })
  })

  it('import file from github', function() {
    let text = 'pragma solidity 0.4.25;\n\n/**\n    @dev a contract needs to inherit TEMPLATE directly or indirectly to run on asimov chain\n     the standard precedure to develop/run a contract on asimov goes as:\n     1. write a smart contract in SOLIDITY version 0.4.25\n     2. create a TEMPLATE on asimov based on the above source code (using IDE tool)\n     3. deploy a contract INSTANCE based on the TEMPLATE (using IDE tool)\n     4. call contract function by returned address\n\n    @dev before creating a TEMPLATE on asimov for business usage\n     we recommend to write full testcases and have them passed (using IDE tool)\n */\n\nimport "github.com/seeplayerone/dapp-bin/library/template.sol";\n\n/**\n    @dev Registry is a system contract on asimov chain, a contract needs to register before issuing assets\n */ \ninterface Registry {\n     function registerOrganization(string organizationName, string templateName) external returns(uint32);\n}\n\n/**\n    @dev this tutorial demostrates the EXCLUSIVE asset instructions of asimov\n     1. register an organization to asimov blockchain\n     2. create/mint UTXO assets \n     3. transfer UTXO assets\n     4. check balance\n */\ncontract Tutorial is Template {\n    /// black hole\n    address hole = 0x660000000000000000000000000000000000000000;\n    /// registry system contract\n    address registry = 0x630000000000000000000000000000000000000065;\n\n    bool private registered = false;\n\n    /// asset properties\n    uint private properties = 0;\n    /// asset index\n    uint private index = 1;\n    /// organization id, assigned after registration\n    uint private orgnizationID = 0;\n    /// assettype of UTXO => 32bit properteis + 32 bit organization id + 32 bit asset index\n    uint private assettype;\n\n    /// total supply \n    uint private totalSupply = 0;\n\n    string organizationName;\n\n    constructor(string _name) public {\n        organizationName = _name;\n    }\n\n    /**\n        @dev mint assets with given amount\n     */\n    function mint(uint amount) public returns (uint){\n        if(registered) {\n            /// @dev instruction to mint more on an existing asset\n            flow.mintAsset(index, amount);\n        } else {\n            /// register the organization (contract) before issuing assets\n            Registry reg = Registry(registry);\n            /// template name is given when submitting a TEMPLATE using IDE tool\n            orgnizationID = reg.registerOrganization(organizationName, templateName);\n\n            registered = true;\n\n            uint64 temp1 = uint64(0) << 32 | uint64(orgnizationID);\n            uint96 temp2 = uint96(temp1) << 32 | uint96(index);\n\n            assettype = temp2;\n            \n            /// @dev instruction to create a new asset with given amount\n            /// properties = 0 which means this is a fungible asset\n            /// index = 1 which means this is the first asset created by this oraganization\n            ///  an organization can create multiple assets with different indexes\n            flow.createAsset(properties, index, amount);\n        }\n        \n        totalSupply = totalSupply + amount;\n\n        return assettype;\n    }\n\n    /**\n        @dev transfer an asset using `transfer` instruction\n     */\n    function transfer(address to, uint amount) public {\n        /// @dev instruction to transfer asset from a contract (with gas limit to 2300)\n        to.transfer(amount, assettype);\n    }\n\n    /**\n        @dev transfer an asset using `call.value` instruction\n     */\n    function callValue(address to, uint amount) public {\n        /// @dev instruction to transfer asset from a contract using raw call\n        to.call.value(amount, assettype)();\n    }\n\n    /**\n        @dev burn issued assets by sending them to the black hole\n     */\n    function burn() public payable {\n        hole.transfer(msg.value, msg.assettype);\n        totalSupply = totalSupply - msg.value;\n    }\n\n    /**\n        @dev check balance of this contract\n     */\n    function checkBalance() public view returns (uint) {\n        /// @dev instruction to check balance of a given assettype on an address \n        return flow.balance(this, assettype);\n    }\n\n    /**\n        @dev check total supply of the asset\n     */\n    function checkTotalSupply() public view returns (uint) {\n        return totalSupply;\n    }\n}\n\n'
    return fileManager.importFile('github.com/seeplayerone/dapp-bin/testnet-tutorial/tutorial.sol').then(res => {
      expect(res).to.be.equal(text)
    })
  })

  it('load remote script',function(){

    FileManager.importRemoteScript('https://cdn.asimov.work/asimov.js').then(res=>{
      expect(!!res).to.be.equal(true)
    })
  })

})
