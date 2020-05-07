"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
/**
 * Determines whether a string contains only hexadecimal values
 *
 * @name JSUtil.isHexa
 * @param {string} value
 * @return {boolean} true if the string is the hexa representation of a number
 */
var isHexa_1 = function isHexa(value) {
    if (!_.isString(value)) {
        return false;
    }
    return /^[0-9a-fA-F]+$/.test(value);
};
/**
 * @namespace JSUtil
 */
// module.exports = {
/**
 * Test if an argument is a valid JSON object. If it is, returns a truthy
 * value (the json object decoded), so no double JSON.parse call is necessary
 *
 * @param {string} arg
 * @return {Object|boolean} false if the argument is not a JSON string.
 */
function isValidJSON(arg) {
    var parsed;
    if (!_.isString(arg)) {
        return false;
    }
    try {
        parsed = JSON.parse(arg);
    }
    catch (e) {
        return false;
    }
    if (typeof (parsed) === 'object') {
        return true;
    }
    return false;
}
exports.isValidJSON = isValidJSON;
exports.isHexa = isHexa_1;
exports.isHexaString = isHexa_1;
/**
 * Clone an array
 */
function cloneArray(array) {
    return [].concat(array);
}
exports.cloneArray = cloneArray;
/**
 * Define immutable properties on a target object
 *
 * @param {Object} target - An object to be extended
 * @param {Object} values - An object of properties
 * @return {Object} The target object
 */
function defineImmutable(target, values) {
    Object.keys(values).forEach(function (key) {
        Object.defineProperty(target, key, {
            configurable: false,
            enumerable: true,
            value: values[key]
        });
    });
    return target;
}
exports.defineImmutable = defineImmutable;
/**
 * Checks that a value is a natural number, a positive integer or zero.
 *
 * @param {*} value
 * @return {Boolean}
 */
function isNaturalNumber(value) {
    return typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value &&
        value >= 0;
}
exports.isNaturalNumber = isNaturalNumber;
// };
//# sourceMappingURL=Js.js.map