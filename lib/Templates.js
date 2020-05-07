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
const Setting_1 = require("./Setting");
const TemplateWarehouse_1 = require("./TemplateWarehouse");
const Constant_1 = require("./Constant");
/**
 * High level Templates object used to submit new templates and deploy contract instances on Asimov blockchain.
 */
class Templates {
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
        this.templateWarehouse = new TemplateWarehouse_1.TemplateWarehouse({
            chainRpcProvider: this.chainRpcProvider,
            asiLinkProvider: this.asiLinkProvider
        });
        this.compiler = this.setting.compiler;
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
     * getter of internal Complier object
     */
    get compiler() {
        return this._compiler;
    }
    /**
     * setter of internal Complier object
     */
    set compiler(compiler) {
        this._compiler = compiler;
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
     * Submit a template on Asimov blockchain.
     * @param params Parameters used to submit a template.
     * @return Transaction id/template id.
     */
    submitTemplate(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.source && !params.path) {
                throw new Error('source file object or path is not specified!');
            }
            if (!params.templateName) {
                throw new Error('template name is not specified!');
            }
            if (!this.privateKey) {
                throw new Error('private key is not specified in setting!');
            }
            let compileResult, err;
            if (params.path) {
                [err, compileResult] = yield await_to_js_1.to(this.compiler.compileSol(params.source || params.path));
                if (err) {
                    throw err;
                }
            }
            if (params.source) {
                let sources = {};
                sources[params.templateName] = {
                    content: params.source
                };
                if (!this.compiler) {
                    throw new Error('compiler is not specified!');
                }
                this.compiler.setLibs(params.libs || {});
                [err, compileResult] = yield await_to_js_1.to(this.compiler.compile(sources));
                if (err) {
                    throw err;
                }
            }
            let contracts = compileResult.contracts;
            let source = compileResult.source;
            let contract = contracts[params.contractName] || contracts[0];
            let byteCode = contract.evm.bytecode.object;
            let abi = contract.abi;
            let createParams = {
                category: Constant_1.DefaultCategory,
                name: params.templateName,
                bytecode: byteCode,
                abi: JSON.stringify(abi),
                source: source,
                privateKey: this.privateKey,
                fee: params.fee || this.setting.fee,
                gasLimit: params.gasLimit
            };
            let [err1, res] = yield await_to_js_1.to(this.templateWarehouse.createTemplate(createParams));
            if (err1) {
                throw err1;
            }
            return res;
        });
    }
    /**
     * Deploy a contract instance from a template on Asimov blockchain.
     * @param params Parameters used to deploy a contract instance.
     * @return Transaction id.
     */
    deployContract(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.privateKey) {
                throw new Error('private key is not specified in setting!');
            }
            let deployParams = {
                templateId: params.templateId,
                arguments: params.constructorArguments || [],
                privateKey: this.privateKey,
                amount: params.amount || 0,
                asset: params.asset || Constant_1.DefaultAsset,
                fee: params.fee || this.setting.fee,
                gasLimit: params.gasLimit
            };
            let [err, res] = yield await_to_js_1.to(this.templateWarehouse.deploy(deployParams));
            if (err) {
                return err;
            }
            return res;
        });
    }
}
exports.Templates = Templates;
//# sourceMappingURL=Templates.js.map