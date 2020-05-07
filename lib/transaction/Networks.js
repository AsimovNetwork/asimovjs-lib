'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const JSUtil = require("../utils/Js");
let networkMaps = {};
let networks = [];
/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Currently only supporting "livenet"
 * (a.k.a. "mainnet") and "testnet".
 * @constructor
 */
class Network {
    constructor() { }
    toString() {
        return this.name;
    }
    ;
}
exports.Network = Network;
/**
 * @function
 * @member Networks#add
 * Will add a custom Network
 * @param {Object} data
 * @param {string} data.name - The name of the network
 * @param {string} data.alias - The aliased name of the network
 * @param {Number} data.pubkeyhash - The publickey hash prefix
 * @param {Number} data.privatekey - The privatekey prefix
 * @param {Number} data.scripthash - The scripthash prefix
 * @param {Number} data.xpubkey - The extended public key magic
 * @param {Number} data.xprivkey - The extended private key magic
 * @param {Number} data.networkMagic - The network magic number
 * @param {Number} data.port - The network port
 * @param {Array}  data.dnsSeeds - An array of dns seeds
 * @return Network
 */
exports.addNetwork = function (data) {
    var network = new Network();
    JSUtil.defineImmutable(network, {
        name: data.name,
        alias: data.alias,
        pubkeyhash: data.pubkeyhash,
        privatekey: data.privatekey,
        scripthash: data.scripthash,
        contracthash: data.contracthash,
        xpubkey: data.xpubkey,
        xprivkey: data.xprivkey
    });
    // if (data.networkMagic) {
    //     JSUtil.defineImmutable(network, {
    //         networkMagic: BufferUtil.integerAsBuffer(data.networkMagic)
    //     });
    // }
    if (data.port) {
        JSUtil.defineImmutable(network, {
            port: data.port
        });
    }
    if (data.dnsSeeds) {
        JSUtil.defineImmutable(network, {
            dnsSeeds: data.dnsSeeds
        });
    }
    _.each(network, function (value) {
        if (!_.isUndefined(value) && !_.isObject(value)) {
            networkMaps[value] = network;
        }
    });
    networks.push(network);
    return network;
};
/**
 * @function
 * @member Networks#remove
 * Will remove a custom network
 * @param {Network} network
 */
exports.removeNetwork = function (network) {
    for (var i = 0; i < networks.length; i++) {
        if (networks[i] === network) {
            networks.splice(i, 1);
        }
    }
    for (var key in networkMaps) {
        if (networkMaps[key] === network) {
            delete networkMaps[key];
        }
    }
};
/*export let mainnet = addNetwork({
    name: 'livenet',
    alias: 'mainnet',
    pubkeyhash: 0x66, // starts with f
    scripthash: 0x73, // starts with s
    contracthash: 0x63, // starts with c
    privatekey: 0x6b, // starts with k

    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    // networkMagic: 0xf9beb4d9,
    port: 8545,
    dnsSeeds: [

    ]
})*/
exports.testnet = exports.addNetwork({
    name: 'testnet',
    alias: 'regtest',
    pubkeyhash: 0x66,
    scripthash: 0x73,
    contracthash: 0x63,
    genesisicontracthash: 0x00,
    //0x64~0x3e7
    privatekey: 0x6b,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    port: 8545,
    //networkMagic: BufferUtil.integerAsBuffer(0x0b110907),
    dnsSeeds: []
});
exports.defaultNetwork = exports.testnet;
//networks.push(mainnet)
//networks.push(testnet)
/**
 * @function
 * @member Networks#get
 * Retrieves the network associated with a magic number or string.
 * @param {string|number|Network} arg
 * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
 * @return Network
 */
exports.get = function (arg, keys) {
    if (~networks.indexOf(arg)) {
        return arg;
    }
    if (keys) {
        if (!_.isArray(keys)) {
            keys = [keys];
        }
        var containsArg = function (key) {
            return networks[index][key] === arg;
        };
        for (var index in networks) {
            if (_.some(keys, containsArg)) {
                return networks[index];
            }
        }
        return undefined;
    }
    return networkMaps[arg];
};
//# sourceMappingURL=Networks.js.map