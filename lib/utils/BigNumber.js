'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *  BigNumber
 *
 *  A wrapper around the BN.js object. We use the BN.js library
 *  because it is used by elliptic, so it is required regardles.
 *
 */
const BN = require("bn.js");
const Bytes_1 = require("./Bytes");
const Property_1 = require("./Property");
const Bn_1 = require("./Bn");
const errors = require("./Error");
const BN_1 = new BN.BN(-1);
function toHex(bn) {
    let value = bn.toString(16);
    if (value[0] === '-') {
        if ((value.length % 2) === 0) {
            return '-0x0' + value.substring(1);
        }
        return "-0x" + value.substring(1);
    }
    if ((value.length % 2) === 1) {
        return '0x0' + value;
    }
    return '0x' + value;
}
function toBN(value) {
    return _bnify(bigNumberify(value));
}
function toBigNumber(bn) {
    return new BigNumber(toHex(bn));
}
function _bnify(value) {
    let hex = value._hex;
    if (hex[0] === '-') {
        return (new Bn_1.Bn(hex.substring(3), 16)).mul(BN_1);
    }
    return new Bn_1.Bn(hex.substring(2), 16);
}
class BigNumber {
    constructor(value) {
        errors.checkNew(this, BigNumber);
        Property_1.setType(this, 'BigNumber');
        if (typeof (value) === 'string') {
            if (Bytes_1.isHexString(value)) {
                if (value == '0x') {
                    value = '0x0';
                }
                Property_1.defineReadOnly(this, '_hex', value);
            }
            else if (value[0] === '-' && Bytes_1.isHexString(value.substring(1))) {
                Property_1.defineReadOnly(this, '_hex', value);
            }
            else if (value.match(/^-?[0-9]*$/)) {
                if (value == '') {
                    value = '0';
                }
                Property_1.defineReadOnly(this, '_hex', toHex(new BN.BN(value)));
            }
            else {
                errors.throwError('invalid BigNumber string value', errors.INVALID_ARGUMENT, { arg: 'value', value: value });
            }
        }
        else if (typeof (value) === 'number') {
            if (parseInt(String(value)) !== value) {
                errors.throwError('underflow', errors.NUMERIC_FAULT, { operation: 'setValue', fault: 'underflow', value: value, outputValue: parseInt(String(value)) });
            }
            try {
                Property_1.defineReadOnly(this, '_hex', toHex(new BN.BN(value)));
            }
            catch (error) {
                errors.throwError('overflow', errors.NUMERIC_FAULT, { operation: 'setValue', fault: 'overflow', details: error.message });
            }
        }
        else if (value instanceof BigNumber) {
            Property_1.defineReadOnly(this, '_hex', value._hex);
        }
        else if (value.toHexString) {
            Property_1.defineReadOnly(this, '_hex', toHex(toBN(value.toHexString())));
        }
        else if (value._hex && Bytes_1.isHexString(value._hex)) {
            Property_1.defineReadOnly(this, '_hex', value._hex);
        }
        else if (Bytes_1.isArrayish(value)) {
            Property_1.defineReadOnly(this, '_hex', toHex(new BN.BN(Bytes_1.hexlify(value).substring(2), 16)));
        }
        else {
            errors.throwError('invalid BigNumber value', errors.INVALID_ARGUMENT, { arg: 'value', value: value });
        }
    }
    fromTwos(value) {
        return toBigNumber(_bnify(this).fromTwos(value));
    }
    toTwos(value) {
        return toBigNumber(_bnify(this).toTwos(value));
    }
    abs() {
        if (this._hex[0] === '-') {
            return toBigNumber(_bnify(this).mul(BN_1));
        }
        return this;
    }
    add(other) {
        return toBigNumber(_bnify(this).add(toBN(other)));
    }
    sub(other) {
        return toBigNumber(_bnify(this).sub(toBN(other)));
    }
    div(other) {
        let o = bigNumberify(other);
        if (o.isZero()) {
            errors.throwError('division by zero', errors.NUMERIC_FAULT, { operation: 'divide', fault: 'division by zero' });
        }
        return toBigNumber(_bnify(this).div(toBN(other)));
    }
    mul(other) {
        return toBigNumber(_bnify(this).mul(toBN(other)));
    }
    mod(other) {
        return toBigNumber(_bnify(this).mod(toBN(other)));
    }
    pow(other) {
        return toBigNumber(_bnify(this).pow(toBN(other)));
    }
    maskn(value) {
        return toBigNumber(_bnify(this).maskn(value));
    }
    eq(other) {
        return _bnify(this).eq(toBN(other));
    }
    lt(other) {
        return _bnify(this).lt(toBN(other));
    }
    lte(other) {
        return _bnify(this).lte(toBN(other));
    }
    gt(other) {
        return _bnify(this).gt(toBN(other));
    }
    gte(other) {
        return _bnify(this).gte(toBN(other));
    }
    isZero() {
        return _bnify(this).isZero();
    }
    toNumber() {
        try {
            return _bnify(this).toNumber();
        }
        catch (error) {
            errors.throwError('overflow', errors.NUMERIC_FAULT, { operation: 'setValue', fault: 'overflow', details: error.message });
        }
        return null;
    }
    toString() {
        return _bnify(this).toString(10);
    }
    toHexString() {
        return this._hex;
    }
    static isBigNumber(value) {
        return Property_1.isType(value, 'BigNumber');
    }
}
exports.BigNumber = BigNumber;
function bigNumberify(value) {
    if (BigNumber.isBigNumber(value)) {
        return value;
    }
    return new BigNumber(value);
}
exports.bigNumberify = bigNumberify;
//# sourceMappingURL=BigNumber.js.map