"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const await_to_js_1 = require("await-to-js");
const errors = require("../utils/Error");
const jsonbigint = require("json-bigint");
const JSONBigInt = jsonbigint({ 'storeAsString': true });
class JsonRpcProvider {
    constructor(config) {
        this.config = config;
        this.idNonce = 0;
        this.api = axios_1.default.create(config);
    }
    request(method, params = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                method,
                params,
                id: this.idNonce++
            };
            let [err, res] = yield await_to_js_1.to(this.api.post("/?m=" + method, config, {
                transformResponse: data => JSONBigInt.parse(data)
            }));
            if (err) {
                let message = '';
                if (err.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    message = err.response.toString();
                }
                else {
                    // Something happened in setting up the request that triggered an Error
                    message = err.message;
                }
                throw new Error(message);
            }
            if (res.status === 401) {
                // body is empty
                throw new Error(yield res.statusText);
            }
            // 404 if method doesn't exist
            if (res.status === 404) {
                throw new Error(`unknown method: ${method}`);
            }
            if (res.status !== 200) {
                if (res.headers["content-type"] !== "application/json") {
                    const body = yield res.data;
                    throw new Error(`${res.status} ${res.statusText}\n${res.data}`);
                }
                const resData = yield res.data;
                if (resData.error) {
                    const { code, message, } = resData.error;
                    throw new Error(`[${code}] ${message}`);
                }
                else {
                    throw new Error(String(resData));
                }
            }
            const { result, error } = yield res.data;
            if (error) {
                throw new Error(error.code + ', ' + error.message);
            }
            return result;
        });
    }
    Request(axiosRequestConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let http = axios_1.default.create(axiosRequestConfig);
            return http.post(axiosRequestConfig.url, axiosRequestConfig.params);
        });
    }
    static Get(axiosRequestConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let http = axios_1.default.create(axiosRequestConfig);
            return http.get(axiosRequestConfig.url);
        });
    }
    send(method, params) {
        switch (method) {
            case 'test':
                return this.request('asimov_test', [params.caller, params.byteCode, params.args, params.callData, params.abi]);
            case 'getBlockChainInfo':
                return this.request('asimov_getBlockChainInfo', []);
            case 'getBlockHash':
                return this.request('asimov_getBlockHash', [params.blockHeight]);
            case 'upTime':
                return this.request('asimov_upTime', []);
            case 'getBestBlock':
                return this.request('asimov_getBestBlock', []);
            case 'getBlock':
                return this.request('asimov_getBlock', [params.blockHash, !!params.verbose, !!params.verboseTx]);
            case 'getBlockHeader':
                return this.request('asimov_getBlockHeader', [params.blockHash, !!params.verbose]);
            case 'getBalance':
                return this.request('asimov_getBalance', [params.address]);
            case 'getBalances':
                return this.request('asimov_getBalances', [params.addresses]);
            case 'getBlockList':
                return this.request('asimov_getBlockList', [params.start, params.offset, params.vinExtra, params.startTime, params.endTime]);
            case 'getBlockListByHeight':
                return this.request('asimov_getBlockListByHeight', [params.start, params.offset]);
            case 'getUtxoByAddress':
                return this.request('asimov_getUtxoByAddress', [params.addresses, params.asset]);
            case 'getGenesisContractNames':
                return this.request('asimov_getGenesisContractNames', []);
            case 'getConnectionCount':
                return this.request('asimov_getConnectionCount', []);
            case 'getInfo':
                return this.request('asimov_getInfo', []);
            case 'getNetTotals':
                return this.request('asimov_getNetTotals', []);
            case 'createRawTransaction':
                return this.request('asimov_createRawTransaction', [params.txType, params.inputs, params.outputs, params.lockTime]);
            case 'decodeRawTransaction':
                return this.request('asimov_decodeRawTransaction', [params.txHex]);
            case 'calculateContractAddress':
                return this.request('asimov_calculateContractAddress', [params.inputs, params.outputs]);
            case 'decodeScript':
                return this.request('asimov_decodeScript', [params.hexScript]);
            case 'getGenesisContract':
                return this.request('asimov_getGenesisContract', [params.contractAddress]);
            case 'getContractAddressesByAssets':
                return this.request('asimov_getContractAddressesByAssets', [params.assets]);
            case 'getContractTemplateList':
                return this.request('asimov_getContractTemplateList', [params.approved, params.category, params.page, params.pageSize]);
            case 'getContractTemplateName':
                return this.request('asimov_getContractTemplateName', [params.contractAddress]);
            case 'getContractTemplate':
                return this.request('asimov_getContractTemplate', [params.contractAddress]);
            case 'getMPosCfg':
                return this.request('asimov_getMPosCfg', []);
            case 'callReadOnlyFunction':
                return this.request('asimov_callReadOnlyFunction', [params.callerAddress, params.contractAddress, params.data, params.name, params.abi]);
            case 'getRawTransaction':
                return this.request('asimov_getRawTransaction', [params.txId, !!params.verbose, !!params.vinExtra]);
            case 'getVirtualTransactions':
                return this.request('asimov_getVirtualTransactions', [params.blockHash, !!params.verbose, !!params.vinExtra]);
            case 'getTransactionReceipt':
                return this.request('asimov_getTransactionReceipt', [params.txId]);
            case 'sendRawTransaction':
                return this.request('asimov_sendRawTransaction', [params.rawTx]);
            case 'signRawTransaction':
                return this.request('asimov_signRawTransaction', [params.rawTx, params.inputsm, params.sigHashType]);
            case 'searchRawTransactions':
                return this.request('asimov_searchRawTransactions', [params.address, !!params.verbose, params.start, params.offset, !!params.vinExtra, !!params.reverse, params.filterAddresses]);
            case 'searchAllRawTransactions':
                return this.request('asimov_searchAllRawTransactions', [params.addresses, !!params.verbose, !!params.vinExtra, !!params.reverse]);
            case 'getTransactionsByAddresses':
                return this.request('asimov_getTransactionsByAddresses', [params.addresses, params.start, params.offset]);
            case 'getMempoolTransactions':
                return this.request('asimov_getMempoolTransactions', [params.txIds]);
            case 'notifyNewTransactions':
                return this.request('asimov_notifyNewTransactions', [params.txns]);
            case 'getContractTemplateInfoByName':
                return this.request('asimov_getContractTemplateInfoByName', [params.category, params.templateName]);
            case 'getContractTemplateInfoByKey':
                return this.request('asimov_getContractTemplateInfoByKey', [params.key]);
            case 'getUtxoInPage':
                return this.request('asimov_getUtxoInPage', [params.address, params.asset, params.from, params.count]);
            case 'estimateGas':
                return this.request('asimov_estimateGas', [params.caller, params.contractAddress, params.amount, params.asset, params.data, params.callType, params.voteValue || 0]);
            case 'runTransaction':
                return this.request('asimov_runTransaction', [params.hex, params.utxos]);
            default:
                break;
        }
        errors.throwError(method + ' not implemented', errors.NOT_IMPLEMENTED, { operation: method });
        return null;
    }
}
exports.JsonRpcProvider = JsonRpcProvider;
//# sourceMappingURL=JsonRpcProvider.js.map