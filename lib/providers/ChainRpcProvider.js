"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonRpcProvider_1 = require("./JsonRpcProvider");
const Constant_1 = require("../Constant");
// Chain Rpc Provider
class ChainRpcProvider extends JsonRpcProvider_1.JsonRpcProvider {
    constructor(config) {
        super(config);
        this.config = config;
    }
    GetBlockChainInfo() {
        return this.send('GetBlockChainInfo');
    }
    getBlockHash(blockHeight) {
        return this.send('getBlockHash', { blockHeight: blockHeight });
    }
    upTime() {
        return this.send('upTime');
    }
    getBestBlock() {
        return this.send('getBestBlock');
    }
    getBlock(params) {
        return this.send('getBlock', params);
    }
    getBlockHeader(params) {
        return this.send('getBlockHeader', params);
    }
    getBalance(address) {
        return this.send('getBalance', { address: address });
    }
    getBalances(addresses) {
        return this.send('getBalances', { addresses: addresses });
    }
    getBlockList(params) {
        return this.send('getBlockList', params);
    }
    getBlockListByHeight(params) {
        return this.send('getBlockListByHeight', params);
    }
    getUtxoByAddress(params) {
        return new Promise((resolve, reject) => {
            this.send('getUtxoByAddress', params).then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getUtxoInPage(params) {
        return new Promise((resolve, reject) => {
            this.send('getUtxoInPage', params).then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
    }
    getGenesisContractNames() {
        return this.send('getGenesisContractNames');
    }
    getConnectionCount() {
        return this.send('getConnectionCount');
    }
    getInfo() {
        return this.send('getInfo');
    }
    getNetTotals() {
        return this.send('getNetTotals');
    }
    createRawTransaction(params) {
        return this.send('createRawTransaction', params);
    }
    decodeRawTransaction(txHex) {
        return this.send('decodeRawTransaction', {
            txHex: txHex
        });
    }
    calculateContractAddress(params) {
        return this.send('calculateContractAddress', params);
    }
    decodeScript(hexScript) {
        return this.send('decodeScript', {
            hexScript: hexScript
        });
    }
    getGenesisContract(contractAddress) {
        return this.send('getGenesisContract', {
            contractAddress: contractAddress
        });
    }
    getContractAddressesByAssets(assets) {
        return this.send('getContractAddressesByAssets', {
            assets: assets
        });
    }
    getContractTemplateList(params) {
        return this.send('getContractTemplateList', {
            approved: true,
            category: params.category,
            page: params.page,
            pageSize: params.pageSize
        });
    }
    getContractTemplateName(contractAddress) {
        return this.send('getContractTemplateName', {
            contractAddress: contractAddress
        });
    }
    getContractTemplate(contractAddress) {
        return this.send('getContractTemplate', {
            contractAddress: contractAddress
        });
    }
    getMPosCfg() {
        return this.send('getMPosCfg');
    }
    callReadOnlyFunction(params) {
        return this.send('callReadOnlyFunction', params);
    }
    getRawTransaction(params) {
        return this.send('getRawTransaction', params);
    }
    getVirtualTransactions(params) {
        return this.send('getVirtualTransactions', params);
    }
    getTransactionReceipt(txId) {
        return this.send('getTransactionReceipt', {
            txId: txId
        });
    }
    sendRawTransaction(rawTx) {
        return this.send('sendRawTransaction', {
            rawTx: rawTx
        });
    }
    searchRawTransactions(params) {
        return this.send('searchRawTransactions', params);
    }
    searchAllRawTransactions(params) {
        return this.send('searchAllRawTransactions', params);
    }
    getTransactionsByAddresses(params) {
        return this.send('getTransactionsByAddresses', params);
    }
    getMempoolTransactions(txIds = []) {
        return this.send('getMempoolTransactions', {
            txIds: txIds
        });
    }
    notifyNewTransactions() {
        return this.send('notifyNewTransactions');
    }
    test(params) {
        return this.send('test', params);
    }
    getContractTemplateInfoByName(params) {
        return this.send('getContractTemplateInfoByName', params);
    }
    getContractTemplateInfoByKey(params) {
        return this.send('getContractTemplateInfoByKey', params);
    }
    estimateGas(params) {
        return new Promise((resolve, reject) => {
            this.send('estimateGas', params).then(res => {
                if (res <= Constant_1.MinGasLimit) {
                    resolve(Constant_1.MinGasLimit);
                }
                else {
                    resolve(res);
                }
            }).catch(e => {
                reject(e);
            });
        });
    }
    runTransaction(params) {
        return this.send('runTransaction', params);
    }
}
exports.ChainRpcProvider = ChainRpcProvider;
//# sourceMappingURL=ChainRpcProvider.js.map