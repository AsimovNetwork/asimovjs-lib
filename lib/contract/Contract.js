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
const txHelper = require("../utils/TxHelper");
const Constant_1 = require("../Constant");
const ProviderFacade_1 = require("../providers/ProviderFacade");
const AbiCoder_1 = require("../utils/AbiCoder");
/// TODO Reverse dependency, should be optimized
const Transactions_1 = require("../Transactions");
const await_to_js_1 = require("await-to-js");
class Contract extends ProviderFacade_1.ProviderFacade {
    constructor(args = {}) {
        super({
            asiLinkProvider: args.asiLinkProvider,
            chainRpcProvider: args.chainRpcProvider
        });
        this.args = args;
        this.methodABIs = {};
        this.eventABIs = {};
        if (!args.abi) {
            throw new Error("No abi provided");
        }
        const keyCollisions = new Set();
        for (const method of args.abi) {
            if (method.type == "constructor") {
                this.constructorABI = method;
                continue;
            }
            if (method.type !== "function") {
                continue;
            }
            const key = `${method.name}#${method.inputs.length}`;
            const sig = `${method.name}(${method.inputs.map((input) => input.type).join(",")})`;
            if (this.methodABIs[key]) {
                // Detected ambiguity for this arity. User must use method signature
                // to select the method.
                keyCollisions.add(key);
            }
            else {
                this.methodABIs[key] = method;
            }
            this.methodABIs[sig] = method;
        }
        for (const key of keyCollisions) {
            delete this.methodABIs[key];
        }
        this.byteCode = args.byteCode;
        this.contractAddress = args.contractAddress;
        this.abi = args.abi;
        this.abiString = JSON.stringify(args.abi);
        this.chainRpcProvider = args.chainRpcProvider;
        this.asiLinkProvider = args.asiLinkProvider;
        this.transactions = new Transactions_1.Transactions(this.chainRpcProvider);
    }
    isReadOnlyMethodABI(methodABI) {
        let type = methodABI.stateMutability;
        if (type == Constant_1.MethodType.View || type == Constant_1.MethodType.Pure) {
            return true;
        }
        return false;
    }
    isReadOnlyMethod(methodName, args) {
        let methodABI = this.findMethodABI(methodName, args);
        return this.isReadOnlyMethodABI(methodABI);
    }
    /**
     * *
     * @param  {string}     selector [description]
     * @param  {any[]   =        []}          args [description]
     * @return {ABIMethod}          [description]
     *
     *     Solidity allows method name overloading. If there's no ambiguity, allow
     * the name of the method as selector. If there is ambiguity (same number
     * of arguments, different types), must use the method signature.
     *
     * Example:
     *
     *   foo(uint a, uint b)
     *
     *   The method name is `foo`.
     *   The method signature is `foo(uint, uint)`
     */
    findMethodABI(selector, args = []) {
        // Find method by method signature
        const method = this.methodABIs[selector];
        if (method) {
            return method;
        }
        // Find method by method name
        const key = `${selector}#${args.length}`;
        return this.methodABIs[key];
    }
    /**
     * call a contract method
     *
     * @param params Parameters to call a contract method
     */
    call(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.contractAddress) {
                throw new Error("No contract address provided");
            }
            let methodName = params.methodName;
            let args = params.args;
            let methodABI = this.findMethodABI(methodName, args);
            let data = txHelper.encodeCallData(methodABI, args);
            let amount = params.amount || 0;
            let asset = params.asset;
            let toSignMessage = params.toSignMessage;
            let from = params.caller || txHelper.getAddressByPrivateKey(params.privateKey);
            if (this.isReadOnlyMethodABI(methodABI)) {
                let readyOnlyParams = {
                    callerAddress: from,
                    contractAddress: this.contractAddress,
                    data: data,
                    name: methodName,
                    abi: this.abiString
                };
                if (this.chainRpcProvider) {
                    if (!readyOnlyParams.callerAddress) {
                        throw new Error('Caller is missing');
                    }
                    return this.chainRpcProvider.callReadOnlyFunction(readyOnlyParams);
                }
                else {
                    if (!this.asiLinkProvider) {
                        throw new Error('AsiLink provider is not setup');
                    }
                    return this.asiLinkProvider.readContract(readyOnlyParams);
                }
            }
            else if (params.privateKey) {
                if (!this.chainRpcProvider) {
                    throw new Error('Chain RPC provider is not setup');
                }
                let tx, err;
                // differentiate vote call and normal call
                if (params.contractType == "vote") {
                    let voteParams = {
                        from: from,
                        to: this.contractAddress,
                        amount: 0,
                        voteId: params.voteId,
                        voteValue: params.voteValue,
                        asset: params.asset,
                        fee: params.fee,
                        contractType: params.contractType,
                        gasLimit: params.gasLimit,
                        data: data
                    };
                    [err, tx] = yield await_to_js_1.default(this.transactions.generateVoteTransaction(voteParams));
                    if (err) {
                        throw err;
                    }
                }
                else {
                    let txParams = {
                        from: from,
                        to: this.contractAddress,
                        amount: params.amount,
                        asset: params.asset,
                        fee: params.fee,
                        contractType: params.contractType,
                        gasLimit: params.gasLimit,
                        data: data
                    };
                    [err, tx] = yield await_to_js_1.default(this.transactions.generateRawTransaction(txParams));
                    if (err) {
                        throw err;
                    }
                }
                let rawTx = tx.sign([params.privateKey]).toHex();
                let [err4, res] = yield await_to_js_1.default(this.chainRpcProvider.sendRawTransaction(rawTx));
                if (err4) {
                    throw err4;
                }
                return res;
            }
            else {
                if (!this.asiLinkProvider) {
                    throw new Error('AsiLink provider is not setup');
                }
                let callParams = {
                    to: this.contractAddress,
                    data: data,
                    amount: amount,
                    from: from,
                    toSignMessage: toSignMessage,
                    type: params.contractType
                };
                return this.asiLinkProvider.callContract(callParams);
            }
        });
    }
    preCall(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let constructorArgs = params.constructorArgs || [];
            let bytecode = this.byteCode;
            let abi = this.abiString;
            let caller = params.caller;
            let callData = [];
            let constructorArgsStr = '';
            if (!(params.methods && params.methods.length)) {
                throw new Error("Method is not provided");
            }
            if (!caller) {
                throw new Error("Caller is missing");
            }
            if (!this.chainRpcProvider) {
                throw new Error("Chain RPC provider is not setup");
            }
            if (this.constructorABI) {
                let coder = new AbiCoder_1.AbiCoder();
                constructorArgsStr = coder.encode(this.constructorABI.inputs, constructorArgs);
            }
            params.methods.forEach((method, idx) => {
                let args = method.args || [];
                let methodName = method.name;
                let methodABI = this.findMethodABI(methodName, args);
                if (!methodABI) {
                    throw new Error("No method ABI found of " + methodName);
                }
                let data = txHelper.encodeCallData(methodABI, args);
                callData.push({
                    name: methodName,
                    data: data,
                    caller: method.caller,
                    amount: method.amount,
                    args: method.args,
                    voteValue: method.voteValue
                });
            });
            return this.chainRpcProvider.test({
                caller: caller,
                byteCode: bytecode,
                args: constructorArgsStr,
                callData: callData,
                abi: abi
            });
        });
    }
}
exports.Contract = Contract;
//# sourceMappingURL=Contract.js.map