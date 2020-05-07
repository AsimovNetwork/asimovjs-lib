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
const txHelper = require("./utils/TxHelper");
const ProviderFacade_1 = require("./providers/ProviderFacade");
const Constant_1 = require("./Constant");
const await_to_js_1 = require("await-to-js");
/// TODO Reverse dependency, should be optimized
const Transactions_1 = require("./Transactions");
class TemplateWarehouse extends ProviderFacade_1.ProviderFacade {
    constructor(args) {
        super(args);
        this.args = args;
        this.initialized = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chainRpcProvider) {
                throw new Error('Can not init due to missing chain rpc provider');
            }
            let [err, res] = yield await_to_js_1.default(this.chainRpcProvider.getGenesisContract(Constant_1.SYSTEM_CONTRACT_ADDRESS.TemplateWarehouse));
            if (err) {
                throw err;
            }
            this.warehouseAddress = res.addressHex;
            this.warehouseAbiInfo = JSON.parse(res.abiInfo);
            this.warehouseByteCode = res.code;
            for (let i = 0, len = this.warehouseAbiInfo.length; i < len; i++) {
                let a = this.warehouseAbiInfo[i];
                if (a.name == 'create') {
                    this.createAbi = a;
                    this.createAbiHash = txHelper.encodeFunctionId(a);
                }
            }
            this.initialized = true;
            this.transactions = new Transactions_1.Transactions(this.chainRpcProvider);
        });
    }
    checkInit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                let [err, result] = yield await_to_js_1.default(this.init());
                if (err) {
                    throw err;
                }
            }
        });
    }
    createTemplate(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInit();
            const data = params.data || txHelper.generateCreateTemplateData(params.category, params.name, params.bytecode, params.abi, params.source);
            if (params.privateKey) {
                let from = txHelper.getAddressByPrivateKey(params.privateKey);
                let [err2, tx] = yield await_to_js_1.default(this.transactions.generateRawTransaction({
                    to: this.warehouseAddress,
                    from: from,
                    amount: 0,
                    asset: Constant_1.DefaultAsset,
                    fee: params.fee,
                    gasLimit: params.gasLimit,
                    contractType: "template",
                    data: data
                }));
                if (err2) {
                    throw err2;
                }
                let rawTx = tx.sign([params.privateKey]).toHex();
                let [err3, res] = yield await_to_js_1.default(this.chainRpcProvider.sendRawTransaction(rawTx));
                if (err3) {
                    throw err3;
                }
                return res;
            }
            else {
                if (!this.asiLinkProvider) {
                    throw new Error('Can not create template due to missing AsiLink provider');
                }
                if (!data) {
                    throw new Error('Can not create template due to missing binary data');
                }
                let callParams = {
                    to: this.warehouseAddress,
                    data: data,
                    type: 'template'
                };
                let [err, res] = yield await_to_js_1.default(this.asiLinkProvider.callContract(callParams));
                if (err) {
                    throw err;
                }
                return res;
            }
        });
    }
    deploy(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInit();
            if (!params.templateId && !params.templateName) {
                throw new Error('template id or template name is not specified');
            }
            // get template
            let res, err;
            if (params.templateId) {
                [err, res] = yield await_to_js_1.default(this.chainRpcProvider.getContractTemplateInfoByKey({
                    key: params.templateId
                }));
            }
            else {
                [err, res] = yield await_to_js_1.default(this.chainRpcProvider.getContractTemplateInfoByName({
                    templateName: params.templateName,
                    category: params.category || Constant_1.DefaultCategory
                }));
            }
            if (err) {
                throw err;
            }
            let { abi, template_name, category, } = res;
            let abiJson = JSON.parse(abi);
            let constructorABI = {};
            abiJson.forEach(i => {
                if (i.type == 'constructor') {
                    constructorABI = i;
                }
            });
            if (!constructorABI) {
                throw new Error('no constructor abi found');
            }
            if (constructorABI.inputs && (constructorABI.inputs.length !== params.arguments.length)) {
                throw new Error('input parameters length does not match the constructor arguments length!');
            }
            let data = txHelper.generateDeployContractData(category, template_name, constructorABI, params.arguments);
            //deploy contract
            if (params.privateKey) {
                let from = txHelper.getAddressByPrivateKey(params.privateKey);
                let [err2, tx] = yield await_to_js_1.default(this.transactions.generateRawTransaction({
                    to: from,
                    from: from,
                    amount: params.amount,
                    asset: params.asset,
                    fee: params.fee,
                    gasLimit: params.gasLimit,
                    contractType: "create",
                    data: data
                }));
                if (err2) {
                    throw err2;
                }
                let rawTx = tx.sign([params.privateKey]).toHex();
                let [err3, res] = yield await_to_js_1.default(this.chainRpcProvider.sendRawTransaction(rawTx));
                if (err3) {
                    throw err3;
                }
                return res;
            }
            else {
                if (!this.asiLinkProvider) {
                    throw new Error('can not deploy contract instance due to missing AsiLink provider');
                }
                if (!data) {
                    throw new Error('can not deploy contract instance due to missing binary data');
                }
                let callParams = {
                    amount: params.amount,
                    data: data,
                    type: 'create'
                };
                let [err, res] = yield await_to_js_1.default(this.asiLinkProvider.callContract(callParams));
                if (err) {
                    throw err;
                }
                return res;
            }
        });
    }
    // TODO: whether private key should be passed in?
    create(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkInit();
            if (params.category == undefined) {
                throw new Error('Template category is undefined');
            }
            if (!params.name) {
                throw new Error('Template name is not specified');
            }
            if (!params.bytecode) {
                throw new Error('Template bytecode is not specified');
            }
            if (!params.abi) {
                throw new Error('Template abi is not specified');
            }
            if (!params.source) {
                throw new Error('Template source is not specified');
            }
            const data = txHelper.generateCreateTemplateData(params.category, params.name, params.bytecode, params.abi, params.source);
            // send transaction directly
            if (params.privateKey) {
                let address = txHelper.getAddressByPrivateKey(params.privateKey);
                let [err1, tx] = yield await_to_js_1.default(this.transactions.generateRawTransaction({
                    from: address,
                    to: this.warehouseAddress,
                    amount: 0,
                    asset: Constant_1.DefaultAsset,
                    fee: params.fee,
                    data: data,
                    contractType: "template",
                    gasLimit: params.gasLimit
                }));
                if (err1) {
                    throw err1;
                }
                let rawTx = tx.sign([params.privateKey]).toHex();
                let [err2, res] = yield await_to_js_1.default(this.chainRpcProvider.sendRawTransaction(rawTx));
                if (err2) {
                    throw err2;
                }
                return res;
            }
            else {
                if (!this.asiLinkProvider) {
                    throw new Error('can not create template due to missing AsiLink provider');
                }
                let callParams = {
                    to: this.warehouseAddress,
                    data: data,
                    type: 'template'
                };
                let [err, res] = yield await_to_js_1.default(this.asiLinkProvider.callContract(callParams));
                if (err) {
                    throw err;
                }
                return res;
            }
        });
    }
}
exports.TemplateWarehouse = TemplateWarehouse;
//# sourceMappingURL=TemplateWarehouse.js.map