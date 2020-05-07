'use strict';

import * as _ from "lodash";

// module.exports = {
  export function checkState(condition, message) {
    if (!condition) {
      throw Error('Invalid state: '+message)
    }
  }
  export function checkArgument(condition, argumentName?: any, message?: string, docsPath?: string) {
    if (!condition) {
      throw Error('Invalid Argument' + (argumentName ? (': ' + argumentName) : '') +
      (message ? (' Documentation: ' + 'http://bitcore.io/' + message) : ''))
    }
  }
  export function checkArgumentType(argument, type, argumentName) {
    argumentName = argumentName || '(unknown name)';
    if (_.isString(type)) {
      if (type === 'Buffer') {
        var buffer = require('buffer'); // './buffer' fails on cordova & RN
        if (!buffer.Buffer.isBuffer(argument)) {
          throw Error('Invalid Argument for ' + argumentName + ', expected ' + type + ' but got ' + typeof(argument))
        }
      } else if (typeof argument !== type) {
        throw Error('Invalid Argument for ' + argumentName + ', expected ' + type + ' but got ' + typeof(argument))
      }
    } else {
      if (!(argument instanceof type)) {
        throw Error('Invalid Argument for ' + argumentName + ', expected ' + type.name + ' but got ' + typeof(argument))
      }
    }
  }
// };
