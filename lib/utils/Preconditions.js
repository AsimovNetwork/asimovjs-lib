'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
// module.exports = {
function checkState(condition, message) {
    if (!condition) {
        throw Error('Invalid state: ' + message);
    }
}
exports.checkState = checkState;
function checkArgument(condition, argumentName, message, docsPath) {
    if (!condition) {
        throw Error('Invalid Argument' + (argumentName ? (': ' + argumentName) : '') +
            (message ? (' Documentation: ' + 'http://bitcore.io/' + message) : ''));
    }
}
exports.checkArgument = checkArgument;
function checkArgumentType(argument, type, argumentName) {
    argumentName = argumentName || '(unknown name)';
    if (_.isString(type)) {
        if (type === 'Buffer') {
            var buffer = require('buffer'); // './buffer' fails on cordova & RN
            if (!buffer.Buffer.isBuffer(argument)) {
                throw Error('Invalid Argument for ' + argumentName + ', expected ' + type + ' but got ' + typeof (argument));
            }
        }
        else if (typeof argument !== type) {
            throw Error('Invalid Argument for ' + argumentName + ', expected ' + type + ' but got ' + typeof (argument));
        }
    }
    else {
        if (!(argument instanceof type)) {
            throw Error('Invalid Argument for ' + argumentName + ', expected ' + type.name + ' but got ' + typeof (argument));
        }
    }
}
exports.checkArgumentType = checkArgumentType;
//# sourceMappingURL=Preconditions.js.map