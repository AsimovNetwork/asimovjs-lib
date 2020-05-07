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
const await_to_js_1 = require("await-to-js");
const Constant_1 = require("./Constant");
const Setting_1 = require("./Setting");
const Contract_1 = require("./contract/Contract");
/**
 * Contracts object provides high level API for developers to interact with a contract on Asimov blockchain
 *
 * - execute a public/external write method
 * - call a readonly method (view/pure method)
 * - vote on a public/external method
 */
class Contracts {
    /**
     * Constructor of Contracts
     * @param config configurations including ChainRPC provider and AsiLink provider
     */
    constructor(config = {}) {
        this.setting = Setting_1.Setting.getInstance();
        this._privateKey = this.setting.privateKey;
        this.chainRpcProvider = this.setting.chainRpcProvider;
        this.asiLinkProvider = this.setting.asiLinkProvider;
        if (config.chainRpcProvider) {
            this.chainRpcProvider = config.chainRpcProvider;
        }
        if (config.asiLinkProvider) {
            this.asiLinkProvider = config.asiLinkProvider;
        }
    }
    /**
     * getter of ChainRPC provider
     */
    get chainRpcProvider() {
        return this._chainRpcProvider;
    }
    /**
     * setter of ChainRPC provider
     */
    set chainRpcProvider(rpc) {
        this._chainRpcProvider = rpc;
    }
    /**
     * getter of AsiLink provider
     */
    get asiLinkProvider() {
        return this._asiLinkProvider;
    }
    /**
     * setter of AsiLink provider. AsiLink provider is set when developing Web DApps.
     */
    set asiLinkProvider(asilink) {
        this._asiLinkProvider = asilink;
    }
    /**
     * getter of private key.
     */
    get privateKey() {
        return this._privateKey;
    }
    /**
     * setter of private key. Private key is set when developing automation scripts.
     */
    set privateKey(pk) {
        this._privateKey = pk;
    }
    /**
     * get internal Contract object.
     * @param address contract address.
     */
    getContract(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let [err1, templateInfo] = yield await_to_js_1.to(this.chainRpcProvider.getContractTemplate(address));
            if (err1) {
                throw err1;
            }
            let { template_type, template_name } = templateInfo;
            let [err2, template] = yield await_to_js_1.to(this.chainRpcProvider.getContractTemplateInfoByName({
                category: template_type,
                templateName: template_name
            }));
            if (err2) {
                throw err2;
            }
            let abi = JSON.parse(template.abi);
            try {
                abi = JSON.parse(template.abi);
            }
            catch (e) {
                throw e;
            }
            let contractConfig = {
                contractAddress: address,
                abi: abi,
                asiLinkProvider: this.asiLinkProvider,
                chainRpcProvider: this.chainRpcProvider
            };
            let contract = new Contract_1.Contract(contractConfig);
            return contract;
        });
    }
    /**
     * Execute a method in contract. returns transaction id.
     * @param params Parameters to execute contract method
     */
    execute(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { address, method, args = [], assetValue = 0, assetType = Constant_1.DefaultAsset, feeValue, feeType, caller, gasLimit } = params;
            if (!address) {
                throw new Error('Contract address is not provided');
            }
            if (!method) {
                throw new Error('Contract method is not provided');
            }
            let fee = this.setting.fee;
            if (feeValue && feeType) {
                fee = {
                    amount: feeValue,
                    asset: feeType
                };
            }
            let [err, contract] = yield await_to_js_1.to(this.getContract(address));
            if (err) {
                throw err;
            }
            let callParams = {
                methodName: method,
                args: args,
                amount: assetValue,
                asset: assetType,
                privateKey: this.privateKey,
                caller: caller,
                fee: fee,
                contractType: "call",
                gasLimit: gasLimit
            };
            let [err1, res] = yield await_to_js_1.to(contract.call(callParams));
            if (err1) {
                throw err1;
            }
            return res;
        });
    }
    /**
     * Vote on a method in contract. returns transaction id.
     * @param params Parameters to vote contract method.
     */
    vote(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { address, method, args = [], voteValue = 0, assetType = Constant_1.DefaultAsset, feeValue, feeType, caller, gasLimit } = params;
            if (!address) {
                throw new Error('Contract address is not provided');
            }
            if (!method) {
                throw new Error('Contract method is not provided');
            }
            let fee = this.setting.fee;
            if (feeValue && feeType) {
                fee = {
                    amount: feeValue,
                    asset: feeType
                };
            }
            let [err, contract] = yield await_to_js_1.to(this.getContract(address));
            if (err) {
                throw err;
            }
            let callParams = {
                methodName: method,
                args: args,
                amount: 0,
                voteValue: voteValue,
                voteId: args[0],
                asset: assetType,
                privateKey: this.privateKey,
                fee: fee,
                caller: caller,
                contractType: "vote",
                gasLimit: gasLimit
            };
            let [err1, res] = yield await_to_js_1.to(contract.call(callParams));
            if (err1) {
                throw err1;
            }
            return res;
        });
    }
    /**
     * Call a readonly method in contract
     * @param params Parameters to call a readonly method.
     * @return Return value of the called method.
     */
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { address, method, args = [], caller } = params;
            if (!address) {
                throw new Error('Contract address is not provided');
            }
            if (!method) {
                throw new Error('Contract method is not provided');
            }
            let [err, contract] = yield await_to_js_1.to(this.getContract(address));
            if (err) {
                throw err;
            }
            if (!contract.isReadOnlyMethod(method, args)) {
                throw new Error(method + " is not a view or pure method");
            }
            let callParams = {
                methodName: method,
                args: args,
                privateKey: this.privateKey,
                caller: caller
            };
            let [err1, res] = yield await_to_js_1.to(contract.call(callParams));
            if (err1) {
                throw err1;
            }
            return res;
        });
    }
}
exports.Contracts = Contracts;
//# sourceMappingURL=Contracts.js.map