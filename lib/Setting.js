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
const AsiLinkProvider_1 = require("./providers/AsiLinkProvider");
const ChainRpcProvider_1 = require("./providers/ChainRpcProvider");
const Compiler_1 = require("./contract/Compiler");
const FileManager_1 = require("./contract/FileManager");
let Module = require('./compiler/asimov.js');
/**
 * default remote compiler url
 */
const DefaultRemoteCompiler = 'https://cdn.asimov.work/asimov.js';
/**
 * High level Setting object. It is referenced by other high level objects including Templates, Contracts and Transactions.
 */
class Setting {
    constructor(config) {
        if (config) {
            Setting._instance.init(config);
        }
        return Setting._instance;
    }
    /**
     * Get global Setting singleton.
     */
    static getInstance() {
        return this._instance;
    }
    /**
     * Initialize Setting object.
     * @param config Parameters to use when initializing Setting object.
     */
    init(config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setPrivateKey(config.privateKey);
            if (config.compiler) {
                this.setSolidityCompiler(config.compiler);
            }
            if (config.bundleId) {
                this.setAsiLink(config.bundleId);
            }
            if (config.url) {
                this.setRpcServer(config.url);
            }
            if (config.fee) {
                this.setTransactionFee(config.fee.amount, config.fee.asset);
            }
            if (config.remoteCompiler) {
                Module = yield FileManager_1.FileManager.importRemoteScript(config.remoteCompiler);
                this.setSolidityCompiler(new Compiler_1.Compiler(Module));
            }
            else if (!this.compiler) {
                if (!Module) {
                    Module = yield FileManager_1.FileManager.importRemoteScript(DefaultRemoteCompiler);
                }
                this.setSolidityCompiler(new Compiler_1.Compiler(Module));
            }
            this.asiLinkProvider = new AsiLinkProvider_1.AsiLinkProvider();
        });
    }
    /**
     * Set solidity compiler.
     * @param compiler the Compiler object.
     */
    setSolidityCompiler(compiler) {
        this.compiler = compiler;
    }
    /**
     * Set global private key.
     * @param privateKey the private key.
     */
    setPrivateKey(privateKey) {
        this.privateKey = privateKey;
    }
    /**
     * Set AsiLink bundle Id.
     * @param bundleId AsiLink bundle Id.
     */
    setAsiLink(bundleId) {
        this.bundleId = bundleId;
    }
    /**
     * Set global default transaction fee. If not set, it defaults to DefaultFee in Constant.ts.
     * @param assetValue asset value, calculated in satoshi.
     * @param assetType asset type, 12 byte hex format such as "000000000000000200000001".
     */
    setTransactionFee(assetValue = 0, assetType = Constant_1.DefaultAsset) {
        let fee = {
            amount: assetValue,
            asset: assetType
        };
        this.fee = fee;
    }
    /**
     * Set rpc url for ChainRPC provider.
     * @param {string} url [description]
     */
    setRpcServer(url) {
        this.chainRpcProvider = new ChainRpcProvider_1.ChainRpcProvider({
            baseURL: url
        });
    }
    /**
     * Get global private key.
     */
    static GetPrivateKey() {
        return Setting.getInstance().privateKey;
    }
}
exports.Setting = Setting;
Setting._instance = new Setting();
//# sourceMappingURL=Setting.js.map