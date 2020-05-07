'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI
const AbiCoder_1 = require("./AbiCoder");
const BigNumber_1 = require("./BigNumber");
const Bytes_1 = require("./Bytes");
const Property_1 = require("./Property");
const AddressUtil_1 = require("./AddressUtil");
const Utf8_1 = require("./Utf8");
const Keccak256_1 = require("./Keccak256");
const errors = require("./Error");
function id(text) {
    return Keccak256_1.keccak256(Utf8_1.toUtf8Bytes(text));
}
exports.id = id;
///////////////////////////////
class _Indexed {
    constructor(hash) {
        Property_1.setType(this, 'Indexed');
        Property_1.defineReadOnly(this, 'hash', hash);
    }
}
class Description {
    constructor(info) {
        Property_1.setType(this, 'Description');
        for (var key in info) {
            Property_1.defineReadOnly(this, key, Property_1.deepCopy(info[key], true));
        }
        Object.freeze(this);
    }
}
class _DeployDescription extends Description {
    encode(bytecode, params) {
        if (!Bytes_1.isHexString(bytecode)) {
            errors.throwError('invalid contract bytecode', errors.INVALID_ARGUMENT, {
                arg: 'bytecode',
                value: bytecode
            });
        }
        errors.checkArgumentCount(params.length, this.inputs.length, ' in Interface constructor');
        try {
            return (bytecode + AbiCoder_1.defaultAbiCoder.encode(this.inputs, params).substring(2));
        }
        catch (error) {
            errors.throwError('invalid constructor argument', errors.INVALID_ARGUMENT, {
                arg: error.arg,
                reason: error.reason,
                value: error.value
            });
        }
        return null;
    }
}
class _FunctionDescription extends Description {
    encode(params) {
        errors.checkArgumentCount(params.length, this.inputs.length, ' in interface function ' + this.name);
        try {
            return this.sighash + AbiCoder_1.defaultAbiCoder.encode(this.inputs, params).substring(2);
        }
        catch (error) {
            errors.throwError('invalid input argument', errors.INVALID_ARGUMENT, {
                arg: error.arg,
                reason: error.reason,
                value: error.value
            });
        }
        return null;
    }
    decode(data) {
        try {
            return AbiCoder_1.defaultAbiCoder.decode(this.outputs, Bytes_1.arrayify(data));
        }
        catch (error) {
            errors.throwError('invalid data for function output', errors.INVALID_ARGUMENT, {
                arg: 'data',
                errorArg: error.arg,
                errorValue: error.value,
                value: data,
                reason: error.reason
            });
        }
    }
}
class Result extends Description {
}
class _EventDescription extends Description {
    encodeTopics(params) {
        if (params.length > this.inputs.length) {
            errors.throwError('too many arguments for ' + this.name, errors.UNEXPECTED_ARGUMENT, { maxCount: params.length, expectedCount: this.inputs.length });
        }
        let topics = [];
        if (!this.anonymous) {
            topics.push(this.topic);
        }
        params.forEach((arg, index) => {
            let param = this.inputs[index];
            if (!param.indexed) {
                if (arg != null) {
                    errors.throwError('cannot filter non-indexed parameters; must be null', errors.INVALID_ARGUMENT, { argument: (param.name || index), value: arg });
                }
                return;
            }
            if (arg == null) {
                topics.push(null);
            }
            else if (param.type === 'string') {
                topics.push(id(arg));
            }
            else if (param.type === 'bytes') {
                topics.push(Keccak256_1.keccak256(arg));
            }
            else if (param.type.indexOf('[') !== -1 || param.type.substring(0, 5) === 'tuple') {
                errors.throwError('filtering with tuples or arrays not implemented yet; bug us on GitHub', errors.NOT_IMPLEMENTED, { operation: 'filter(array|tuple)' });
            }
            else {
                if (param.type === 'address') {
                    AddressUtil_1.getAddress(arg);
                }
                topics.push(Bytes_1.hexZeroPad(Bytes_1.hexlify(arg), 32).toLowerCase());
            }
        });
        // Trim off trailing nulls
        while (topics.length && topics[topics.length - 1] === null) {
            topics.pop();
        }
        return topics;
    }
    decode(data, topics) {
        // Strip the signature off of non-anonymous topics
        if (topics != null && !this.anonymous) {
            topics = topics.slice(1);
        }
        let inputIndexed = [];
        let inputNonIndexed = [];
        let inputDynamic = [];
        this.inputs.forEach(function (param, index) {
            if (param.indexed) {
                if (param.type === 'string' || param.type === 'bytes' || param.type.indexOf('[') >= 0 || param.type.substring(0, 5) === 'tuple') {
                    inputIndexed.push({ type: 'bytes32', name: (param.name || '') });
                    inputDynamic.push(true);
                }
                else {
                    inputIndexed.push(param);
                    inputDynamic.push(false);
                }
            }
            else {
                inputNonIndexed.push(param);
                inputDynamic.push(false);
            }
        });
        if (topics != null) {
            var resultIndexed = AbiCoder_1.defaultAbiCoder.decode(inputIndexed, Bytes_1.concat(topics));
        }
        var resultNonIndexed = AbiCoder_1.defaultAbiCoder.decode(inputNonIndexed, Bytes_1.arrayify(data));
        var result = {};
        var nonIndexedIndex = 0, indexedIndex = 0;
        this.inputs.forEach(function (input, index) {
            if (input.indexed) {
                if (topics == null) {
                    result[index] = new _Indexed(null);
                }
                else if (inputDynamic[index]) {
                    result[index] = new _Indexed(resultIndexed[indexedIndex++]);
                }
                else {
                    result[index] = resultIndexed[indexedIndex++];
                }
            }
            else {
                result[index] = resultNonIndexed[nonIndexedIndex++];
            }
            if (input.name) {
                result[input.name] = result[index];
            }
        });
        result.length = this.inputs.length;
        return new Result(result);
    }
}
class _TransactionDescription extends Description {
}
class _LogDescription extends Description {
}
function addMethod(method) {
    switch (method.type) {
        case 'constructor':
            {
                let description = new _DeployDescription({
                    inputs: method.inputs,
                    payable: (method.payable == null || !!method.payable)
                });
                if (!this.deployFunction) {
                    this.deployFunction = description;
                }
                break;
            }
        case 'function':
            {
                let signature = AbiCoder_1.formatSignature(method).replace(/tuple/g, '');
                let sighash = id(signature).substring(0, 10);
                let description = new _FunctionDescription({
                    inputs: method.inputs,
                    outputs: method.outputs,
                    gas: method.gas,
                    payable: (method.payable == null || !!method.payable),
                    type: ((method.constant) ? 'call' : 'transaction'),
                    name: method.name,
                    signature: signature,
                    sighash: sighash,
                });
                // Expose the first (and hopefully unique named function)
                if (method.name) {
                    if (this.functions[method.name] == null) {
                        Property_1.defineReadOnly(this.functions, method.name, description);
                    }
                    else {
                        errors.warn('WARNING: Multiple definitions for ' + method.name);
                    }
                }
                // Expose all methods by their signature, for overloaded functions
                if (this.functions[description.signature] == null) {
                    Property_1.defineReadOnly(this.functions, description.signature, description);
                }
                break;
            }
        case 'event':
            {
                let signature = AbiCoder_1.formatSignature(method).replace(/tuple/g, '');
                let description = new _EventDescription({
                    name: method.name,
                    signature: signature,
                    inputs: method.inputs,
                    topic: id(signature),
                    anonymous: (!!method.anonymous)
                });
                // Expose the first (and hopefully unique) event name
                if (method.name && this.events[method.name] == null) {
                    Property_1.defineReadOnly(this.events, method.name, description);
                }
                // Expose all events by their signature, for overloaded functions
                if (this.events[description.signature] == null) {
                    Property_1.defineReadOnly(this.events, description.signature, description);
                }
                break;
            }
        case 'fallback':
            // Nothing to do for fallback
            break;
        default:
            errors.warn('WARNING: unsupported ABI type - ' + method.type);
            break;
    }
}
class Interface {
    constructor(abi) {
        errors.checkNew(this, Interface);
        if (typeof (abi) === 'string') {
            try {
                abi = JSON.parse(abi);
            }
            catch (error) {
                errors.throwError('could not parse ABI JSON', errors.INVALID_ARGUMENT, {
                    arg: 'abi',
                    errorMessage: error.message,
                    value: abi
                });
            }
            if (!Array.isArray(abi)) {
                errors.throwError('invalid abi', errors.INVALID_ARGUMENT, { arg: 'abi', value: abi });
                return null;
            }
        }
        Property_1.defineReadOnly(this, 'functions', {});
        Property_1.defineReadOnly(this, 'events', {});
        // Convert any supported ABI format into a standard ABI format
        let _abi = [];
        abi.forEach((fragment) => {
            if (typeof (fragment) === 'string') {
                fragment = AbiCoder_1.parseSignature(fragment);
            }
            // @TODO: We should probable do some validation; create abiCoder.formatSignature for checking
            _abi.push(fragment);
        });
        Property_1.defineReadOnly(this, 'abi', Property_1.deepCopy(_abi, true));
        _abi.forEach(addMethod, this);
        // If there wasn't a constructor, create the default constructor
        if (!this.deployFunction) {
            addMethod.call(this, { type: 'constructor', inputs: [] });
        }
        Property_1.setType(this, 'Interface');
    }
    parseTransaction(tx) {
        var sighash = tx.data.substring(0, 10).toLowerCase();
        for (var name in this.functions) {
            if (name.indexOf('(') === -1) {
                continue;
            }
            var func = this.functions[name];
            if (func.sighash === sighash) {
                var result = AbiCoder_1.defaultAbiCoder.decode(func.inputs, '0x' + tx.data.substring(10));
                return new _TransactionDescription({
                    args: result,
                    decode: func.decode,
                    name: func.name,
                    signature: func.signature,
                    sighash: func.sighash,
                    value: BigNumber_1.bigNumberify(tx.value || '0'),
                });
            }
        }
        return null;
    }
    parseLog(log) {
        for (var name in this.events) {
            if (name.indexOf('(') === -1) {
                continue;
            }
            var event = this.events[name];
            if (event.anonymous) {
                continue;
            }
            if (event.topic !== log.topics[0]) {
                continue;
            }
            // @TODO: If anonymous, and the only method, and the input count matches, should we parse and return it?
            return new _LogDescription({
                decode: event.decode,
                name: event.name,
                signature: event.signature,
                topic: event.topic,
                values: event.decode(log.data, log.topics)
            });
        }
        return null;
    }
    static isInterface(value) {
        return Property_1.isType(value, 'Interface');
    }
    static isIndexed(value) {
        return Property_1.isType(value, 'Indexed');
    }
}
exports.Interface = Interface;
//# sourceMappingURL=Interface.js.map