"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bn_1 = require("../utils/Bn");
function listenMessage(eventName) {
    return new Promise((resolve, reject) => {
        let callback = (event) => {
            if (event.source != window) {
                window.removeEventListener('message', callback, false);
                return;
            }
            let data = event.data;
            if (data.type == eventName) {
                let result = data.result;
                if (result.success) {
                    resolve(result.data);
                }
                else {
                    reject(result.msg);
                }
                window.removeEventListener('message', callback, false);
            }
        };
        window.addEventListener('message', callback);
    });
}
/**
 * data:{
 * type
 * result:{
 *   msg
 *   success
 *   data
 *   }
 * }
 */
function sendMessage(data) {
    let dom;
    try {
        dom = document.getElementById(AsiDOM);
    }
    catch (e) {
        throw new Error('AsiLink provider should run in browser environment');
    }
    if (!!!dom) {
        throw new Error('Please install AsiLink and refresh browser');
    }
    return new Promise((resolve, reject) => {
        let type = data.type;
        if (!data.type) {
            reject('no request type');
        }
        if (!!!dom) {
            reject('Please install AsiLink and refresh browser');
        }
        let resType = data.type.replace('GET_', 'POST_');
        let id = new Date().getTime();
        if (!data.id) {
            data.id = id;
        }
        let callback = (event) => {
            if (event.source != window) {
                window.removeEventListener('message', callback, false);
                return;
            }
            let data = event.data;
            if (data.type == resType && data.id == id) {
                let result = data.result;
                if (result.success) {
                    resolve(result.data);
                }
                else {
                    reject(result.msg);
                }
                window.removeEventListener('message', callback, false);
            }
        };
        window.addEventListener('message', callback);
        window.postMessage(data, '*');
    });
}
const AsiDOM = 'flowmask_extension_dom';
class AsiLinkProvider {
    constructor() {
        // TODO check if AsiLink is installed
    }
    callContract(data) {
        if (data.amount instanceof Bn_1.Bn) {
            data.amount = data.amount.toString();
        }
        return sendMessage({
            type: 'GET_ContractSend',
            data: data
        });
    }
    readContract(data) {
        return sendMessage({
            type: "GET_ContractRead",
            data: data
        });
    }
    SignTransaction(data) {
        return sendMessage({
            type: "GET_SignTransaction",
            data: data
        });
    }
    getAuthorAddress(licenseString) {
        return sendMessage({
            type: 'GET_FlowMask_Address',
            data: {
                fromName: licenseString
            }
        });
    }
    watchLogout() {
        return listenMessage("listenMessage");
    }
    signMessage(text) {
        return sendMessage({
            type: 'GET_Signature',
            data: {
                toSignMessage: text
            }
        });
    }
    static SendTransaction() {
    }
}
exports.AsiLinkProvider = AsiLinkProvider;
//# sourceMappingURL=AsiLinkProvider.js.map