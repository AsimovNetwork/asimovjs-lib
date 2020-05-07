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
const Constant_1 = require("./Constant");
const Setting_1 = require("./Setting");
const Transaction_1 = require("./transaction/Transaction");
const txHelper = require("./utils/TxHelper");
const await_to_js_1 = require("await-to-js");
const Bn_1 = require("./utils/Bn");
/**
 * High level Transactions object to send transactions on Asimov blockchain
 */
class Transactions {
    /**
     * Constructor of Transactions object
     * @param rpc ChainRPC provider
     */
    constructor(rpc) {
        this.setting = Setting_1.Setting.getInstance();
        this._privateKey = this.setting.privateKey;
        this._chainRpcProvider = this.setting.chainRpcProvider;
        if (rpc) {
            this.chainRpcProvider = rpc;
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
     * pick UTXOs in page.
     *
     * @param amount total value of UTXOs.
     * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
     * @param address the address to pick from.
     * @param page page number.
     */
    pickUtxos(amount, asset, address, page) {
        return __awaiter(this, void 0, void 0, function* () {
            let inputs = [];
            let total = new Bn_1.Bn(0);
            let pageCount = 1000;
            let [err, res] = yield await_to_js_1.to(this.chainRpcProvider.getUtxoInPage({
                address: address,
                asset: asset,
                from: page,
                count: pageCount
            }));
            if (err) {
                throw err;
            }
            let { utxos, count } = res;
            for (let i = 0, len = utxos.length; i < len; i++) {
                let u = utxos[i];
                if (amount.eq(0)) {
                    total.add(u.amount);
                    inputs.push(u);
                    break;
                }
                if (total.lt(amount)) {
                    total.add(u.amount);
                    inputs.push(u);
                }
            }
            if (total.lt(amount) && inputs.length < count) {
                let res = yield this.pickUtxos(amount.sub(total), asset, address, page + 1);
                inputs = inputs.concat(res);
            }
            return inputs;
        });
    }
    /**
     * pick UTXOs to vote.
     *
     * @param voteValue value to vote.
     * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
     * @param address the address to pick from.
     */
    pickVoteUtxos(voteValue, asset, address) {
        return __awaiter(this, void 0, void 0, function* () {
            let inputs = [];
            let page = 0;
            let pageCount = 1000;
            let [err, res] = yield await_to_js_1.to(this.chainRpcProvider.getUtxoInPage({
                address: address,
                asset: asset,
                from: page,
                count: pageCount
            }));
            if (err) {
                throw err;
            }
            let { utxos, count } = res;
            let [err1, res1] = yield await_to_js_1.to(this.chainRpcProvider.getUtxoInPage({
                address: address,
                asset: asset,
                from: 0,
                count: count
            }));
            if (err1) {
                throw err1;
            }
            inputs = res1.utxos;
            return inputs;
        });
    }
    /**
     * pick UTXOs as transaction fee
     * @param amount value as transaction fee.
     * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
     * @param address the address to pick from.
     */
    pickFeeUtxos(amount, asset, address) {
        return __awaiter(this, void 0, void 0, function* () {
            let total = new Bn_1.Bn(0);
            let feeInputs = yield this.pickUtxos(amount, asset, address, 0);
            //let [err, feeInputs] = await to(temp)
            if (!feeInputs.length) {
                throw new Error("There is not enough UTXO to set as transaction fee.");
            }
            feeInputs.forEach(i => {
                total.add(i.amount);
            });
            if (total.lt(amount)) {
                throw new Error("There is not enough UTXO to set as transaction fee.");
            }
            return feeInputs;
        });
    }
    /**
     * estimate transaction fee
     * @param amount value to transfer in the transaction.
     * @param asset asset type, hex format without 0x, such as "000000000000000200000001".
     * @param address the address to initiate the transaction.
     * @param outputs outputs of the transaction.
     * @param gasLimit gas limit set to the transaction.
     * @return transaction fee (value + type)
     */
    estimateFee(gasLimit, fee) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fee || !fee.amount || (fee.amount instanceof Bn_1.Bn && fee.amount.eq(0))) {
                let temp = {
                    amount: 0,
                    asset: Constant_1.DefaultAsset
                };
                let blockInfo = [];
                let [err, bestBlock] = yield await_to_js_1.to(this.chainRpcProvider.getBestBlock());
                let blockHash = bestBlock.hash;
                if (!err && blockHash) {
                    [err, blockInfo] = yield await_to_js_1.to(this.chainRpcProvider.getBlock({
                        blockHash: blockHash,
                        verbose: true,
                        verboseTx: true
                    }));
                }
                let gasPrice = txHelper.estimateGasPrice(blockInfo['rawtx']);
                temp.amount = parseInt((gasPrice * gasLimit).toFixed(0));
                if (fee && !fee.asset) {
                    temp.asset = Constant_1.DefaultAsset;
                }
                return temp;
            }
            else {
                fee.amount = new Bn_1.Bn(fee.amount);
                return fee;
            }
        });
    }
    estimateGas(tx, utxos) {
        return __awaiter(this, void 0, void 0, function* () {
            let gasLimit = 0;
            let [err, res] = yield await_to_js_1.to(this.chainRpcProvider.runTransaction({
                hex: tx.toHex(),
                utxos: utxos
            }));
            if (err) {
                gasLimit = Constant_1.MinGasLimit;
            }
            else {
                gasLimit = Math.max(Constant_1.MinGasLimit, res.gasUsed);
            }
            return gasLimit;
        });
    }
    generateChangeOutputs(inputs, changeAddress, toAmount, toAsset, fee = { asset: '', amount: 0 }) {
        let changeMap = {};
        let outputs = [];
        //TODO bignumber
        inputs.forEach(i => {
            if (changeMap[i.assets]) {
                changeMap[i.assets].add(i.amount);
            }
            else {
                changeMap[i.assets] = new Bn_1.Bn(i.amount);
            }
            //i.amount = i.amount.toString()
        });
        if (!toAmount.eq(0) && changeMap[toAsset] && changeMap[toAsset].lt(0)) {
            changeMap[toAsset].sub(toAmount);
        }
        if (fee && fee.amount && changeMap[fee.asset].lt(0)) {
            if (changeMap[fee.asset].lt(fee.amount)) {
                throw new Error("Not enough balance to pay the transaction fee.");
            }
            changeMap[fee.asset].sub(fee.amount);
        }
        //TODO bignumber
        for (let k in changeMap) {
            let v = changeMap[k];
            outputs.push({
                assets: k,
                amount: v,
                address: changeAddress
            });
        }
        return outputs;
    }
    /**
     * Construct raw transaction object.
     * @param params Parameters to construct a raw transaction object.
     * @return Transaction id
     */
    generateRawTransaction(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { from, to, asset = Constant_1.DefaultAsset, fee, gasLimit, contractType, data } = params;
            let amount = new Bn_1.Bn(params.amount);
            if (!from) {
                throw new Error("From address is not specified");
            }
            if (!to) {
                throw new Error("To address is not specified");
            }
            let total = new Bn_1.Bn(0);
            let totalAmount = new Bn_1.Bn(0);
            totalAmount.add(amount);
            let changeMap = {};
            let outputs = [{
                    data: data,
                    assets: asset,
                    amount: amount,
                    address: to,
                    contractType: contractType
                }];
            let inputs = yield this.pickUtxos(totalAmount, asset, from, 0);
            if (!inputs.length) {
                throw new Error("There is not enough UTXOs to set as transaction inputs.");
            }
            inputs.forEach(i => {
                total.add(i.amount);
            });
            if (total.lt(totalAmount)) {
                throw new Error("There is not enough UTXOs to set as transaction inputs.");
            }
            let _outputs = outputs.concat(this.generateChangeOutputs(inputs, from, amount, asset));
            //estimate gas
            let tx = new Transaction_1.Transaction({
                inputs: inputs,
                outputs: _outputs,
                gasLimit: 0
            });
            if (!gasLimit) {
                gasLimit = yield this.estimateGas(tx, inputs);
            }
            fee = yield this.estimateFee(gasLimit, fee);
            let originInputsAmount = inputs.length;
            let originOutputsAmount = outputs.length;
            if (fee.asset == asset) {
                totalAmount.add(fee.amount);
                //TODO bignumber
                //totalAmount = totalAmount + fee.amount
            }
            inputs = yield this.pickUtxos(totalAmount, asset, from, 0);
            let feeAmount = new Bn_1.Bn(fee.amount);
            if (fee.asset !== asset && !feeAmount.eq(0)) {
                let feeInputs = yield this.pickFeeUtxos(feeAmount, fee.asset, from);
                inputs = inputs.concat(feeInputs);
            }
            outputs = outputs.concat(this.generateChangeOutputs(inputs, from, amount, asset, fee));
            gasLimit += txHelper.estimateIncreasedGas(inputs.length - originInputsAmount, outputs.length - originOutputsAmount);
            tx = new Transaction_1.Transaction({
                inputs: inputs,
                outputs: outputs,
                gasLimit: gasLimit
            });
            return tx;
        });
    }
    /**
     * Construct vote transaction object.
     * @param params Parameters to construct a vote transaction object.
     * @return Transaction id
     */
    generateVoteTransaction(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { from, to, asset = Constant_1.DefaultAsset, fee, gasLimit, contractType, data, voteId } = params;
            let amount = new Bn_1.Bn(params.amount);
            let voteValue = new Bn_1.Bn(params.voteValue);
            let total = new Bn_1.Bn(0);
            let changeMap = {};
            let outputs = [{
                    data: data,
                    assets: asset,
                    amount: new Bn_1.Bn(0),
                    address: to,
                    contractType: contractType
                }];
            if (!from) {
                throw new Error("From address is not specified");
            }
            if (!to) {
                throw new Error("To address is not specified");
            }
            let inputs = [];
            inputs = yield this.pickVoteUtxos(voteValue, asset, from);
            let totalVote = new Bn_1.Bn(0);
            let temp = [];
            inputs.forEach(i => {
                let noVote = false;
                if (i.locks) {
                    i.locks.forEach(lock => {
                        let { lockAddress, id } = txHelper.parseLockId(lock.id);
                        if (lockAddress == to && id == voteId) {
                            if (lock.amount < i.amount) {
                                totalVote.add(i.amount);
                                totalVote.sub(lock.amount);
                                temp.push(i);
                            }
                            else {
                                noVote = true;
                            }
                        }
                    });
                }
                if (!noVote) {
                    totalVote.add(i.amount);
                    temp.push(i);
                }
            });
            inputs = temp;
            if (!inputs.length) {
                throw new Error("There are not enough UTXOs to vote.");
            }
            //concat change ouputs
            let _outputs = outputs.concat(this.generateChangeOutputs(inputs, from, new Bn_1.Bn(0), asset));
            //estimate gas
            let tx = new Transaction_1.Transaction({
                inputs: inputs,
                outputs: _outputs,
                gasLimit: 0
            });
            if (!gasLimit) {
                gasLimit = yield this.estimateGas(tx, inputs);
            }
            // estimate fee from gas limit
            fee = yield this.estimateFee(gasLimit, fee);
            let originInputsAmount = inputs.length;
            let originOutputsAmount = outputs.length;
            let feeAmount = new Bn_1.Bn(fee.amount);
            if (fee.asset !== asset && feeAmount.eq(0)) {
                let feeInputs = yield this.pickFeeUtxos(feeAmount, fee.asset, from);
                inputs = inputs.concat(feeInputs);
            }
            else if (totalVote.lte(fee.amount)) {
                throw new Error("There are not enough UTXOs to vote.");
            }
            outputs = outputs.concat(this.generateChangeOutputs(inputs, from, new Bn_1.Bn(0), asset, fee));
            gasLimit += txHelper.estimateIncreasedGas(inputs.length - originInputsAmount, outputs.length - originOutputsAmount);
            tx = new Transaction_1.Transaction({
                inputs: inputs,
                outputs: outputs,
                gasLimit: gasLimit
            });
            return tx;
        });
    }
    /**
     * Construct a normal transaction and send it on Asimov blockchain.
     * @param params Parameters to send a transaction on Asimov blockchain.
     * @return Transaction id
     */
    send(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let { address, amount, asset = Constant_1.DefaultAsset, feeValue, feeType } = params;
            if (!amount) {
                throw new Error("Can not transfer asset with 0 amount to " + address);
            }
            let fee = this.setting.fee;
            if (feeValue && feeType) {
                fee = {
                    amount: feeValue,
                    asset: feeType
                };
            }
            let from = txHelper.getAddressByPrivateKey(this.privateKey);
            let txParams = {
                from: from,
                to: address,
                amount: amount,
                asset: asset,
                fee: fee
            };
            let [err1, tx] = yield await_to_js_1.to(this.generateRawTransaction(txParams));
            if (err1) {
                throw err1;
            }
            let rawTx = tx.sign([this.privateKey]).toHex();
            let [err2, res] = yield await_to_js_1.to(this.chainRpcProvider.sendRawTransaction(rawTx));
            if (err2) {
                throw err2;
            }
            return res;
        });
    }
    /**
     * Check whether a transaction is confirmed on chain.
     * @param txId transaction id.
     * @return true or false
     */
    check(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            let [err, res] = yield await_to_js_1.to(this.chainRpcProvider.getRawTransaction({
                txId: txId,
                verbose: true
            }));
            if (err) {
                throw err;
            }
            let { confirmations } = res;
            if (confirmations > 0) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    /**
     * Fetch transaction details.
     * @param txId transaction id.
     * @return Transaction details.
     */
    fetch(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            let [err, res] = yield await_to_js_1.to(this.chainRpcProvider.getTransactionReceipt(txId));
            if (err) {
                throw err;
            }
            return res;
        });
    }
}
exports.Transactions = Transactions;
//# sourceMappingURL=Transactions.js.map