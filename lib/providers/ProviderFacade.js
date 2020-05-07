"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AsiLinkProvider_1 = require("./AsiLinkProvider");
const ChainRpcProvider_1 = require("./ChainRpcProvider");
class ProviderFacade {
    constructor(args = {}) {
        if (typeof (window) !== 'undefined') {
            if (args.asiLinkProvider) {
                this.asiLinkProvider = args.asiLinkProvider;
            }
            else {
                this.asiLinkProvider = new AsiLinkProvider_1.AsiLinkProvider();
            }
        }
        if (args.chainRpcProvider) {
            this.chainRpcProvider = args.chainRpcProvider;
        }
        else if (args.chainRpcInfo) {
            this.chainRpcProvider = new ChainRpcProvider_1.ChainRpcProvider(args.chainRpcInfo);
        }
    }
    set chainRpcProvider(provider) {
        this._chainRpcProvider = provider;
    }
    get chainRpcProvider() {
        return this._chainRpcProvider;
    }
    set asiLinkProvider(provider) {
        this._asiLinkProvider = provider;
    }
    get asiLinkProvider() {
        return this._asiLinkProvider;
    }
}
exports.ProviderFacade = ProviderFacade;
//# sourceMappingURL=ProviderFacade.js.map