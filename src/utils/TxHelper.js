import { AbiCoder } from './AbiCoder'
import { Interface } from './Interface'
import { toUtf8Bytes, toUtf8String } from './Utf8'
import { hexlify } from './Bytes';
import { ABIMethod } from '../contract/ABIMethod'
import { Output } from '../transaction/Output'
import { PrivateKey } from '../transaction/Privatekey'
import { Address } from '../transaction/Address'
import * as _ from 'lodash'
import {
  DefaultGasPrice,
  FeeAmplifier
} from '../Constant'

export function makeFullTupleTypeDefinition(typeDef) {
  if (typeDef && typeDef.type.indexOf('tuple') === 0 && typeDef.components) {
    var innerTypes = typeDef.components.map((innerType) => {
      if (innerType && innerType.type.indexOf('tuple') === 0 && innerType.components) {
        return makeFullTupleTypeDefinition(innerType)
      } else {
        return innerType.type
      }
    })
    return `tuple(${innerTypes.join(',')})${extractSize(typeDef.type)}`
  }
  return typeDef.type
}

export function encodeParams(funABI, args) {
  var types = []

  if (funABI && funABI.inputs && funABI.inputs.length) {
    for (var i = 0; i < funABI.inputs.length; i++) {
      var type = funABI.inputs[i].type
      types.push(type.indexOf('tuple') === 0 ? makeFullTupleTypeDefinition(funABI.inputs[i]) : type)
      if (args.length < types.length) {
        args.push('')
      }
    }
  }

  // NOTE: the caller will concatenate the bytecode and this
  //       it could be done here too for consistency
  var abiCoder = new AbiCoder()
  return abiCoder.encode(types, args)
}

export function encodeFunctionId(funABI) {
  if (funABI.type === 'fallback') return '0x'
  var abi = new Interface([funABI])
  abi = abi.functions[funABI.name]
  return abi.sighash
}

// Sorts the list of ABI entries. Constant functions will appear first,
// followed by non-constant functions. Within those t wo groupings, functions
// will be sorted by their names.
export function sortAbiFunction(contractabi) {

  return contractabi.sort(function(a, b) {
    if (a.constant === true && b.constant !== true) {
      return 1
    } else if (b.constant === true && a.constant !== true) {
      return -1
    }
    // If we reach here, either a and b are both constant or both not; sort by name then
    // special case for fallback and constructor
    if (a.type === 'function' && typeof a.name !== 'undefined') {
      return a.name.localeCompare(b.name)
    } else if (a.type === 'constructor' || a.type === 'fallback') {
      return 1
    }
  })
}

export function getConstructorInterface(abi) {
  var funABI = { 'name': '', 'inputs': [], 'type': 'constructor', 'outputs': [] }
  if (typeof abi === 'string') {
    try {
      abi = JSON.parse(abi)
    } catch (e) {
      // console.log('exception retrieving ctor abi ' + abi)
      return funABI
    }
  }

  for (var i = 0; i < abi.length; i++) {
    if (abi[i].type === 'constructor') {
      funABI.inputs = abi[i].inputs || []
      break
    }
  }

  return funABI
}

export function serializeInputs(fnAbi) {
  var serialized = '('
  if (fnAbi.inputs && fnAbi.inputs.length) {
    serialized += fnAbi.inputs.map((input) => { return input.type }).join(',')
  }
  serialized += ')'
  return serialized
}

export function extractSize(type) {
  var size = type.match(/([a-zA-Z0-9])(\[.*\])/)
  return size ? size[2] : ''
}

export function getFunction(abi, fnName) {
  for (var i = 0; i < abi.length; i++) {
    var fn = abi[i]
    if (fn.type === 'function' && fnName === fn.name + '(' + fn.inputs.map((value) => {
        if (value.components) {
          // we extract the size (if array) and append it later
          var size = extractSize(value.type)
          return `(${value.components.map((value) => { return value.type }).join(',')})${size}`
        } else {
          return value.type
        }
      }).join(',') + ')') {
      return fn
    }
  }
  return null
}

export function getFallbackInterface(abi) {
  for (var i = 0; i < abi.length; i++) {
    if (abi[i].type === 'fallback') {
      return abi[i]
    }
  }
}

// *
//  * return the contract obj of the given @arg name. Uses last compilation result.
//  * return null if not found
//  * @param {String} contractName    - contract name
//  * @returns contract obj and associated file: { contract, file } or null

// export function getContract(contractName, contracts) {
//   for (var file in contracts) {
//     if (contracts[file][contractName]) {
//       return { object: contracts[file][contractName], file: file }
//     }
//   }
//   return null
// }


export function inputParametersDeclarationToString(abiInputs) {
  var inputs = (abiInputs || []).map((inp) => inp.type + ' ' + inp.name)
  return inputs.join(', ')
}

export function len2Hex(value, len) {
  let value_hex = value.toString(16);
  len = len * 2;
  if (value_hex.length <= len) {
    for (let i = 0, l = len - value_hex.length; i < l; i++) {
      value_hex = '0' + value_hex;
    }
  }
  return value_hex;
}

/**
 * function to generate bytecode to deploy a contract through template warehouse on asimov
 *
 * @param {*} category template category, defaults to 1 which represents organization
 * @param {*} name template name, globally unique
 * @param {*} constructor constructor method
 * @param {*} args constructor arguments
 */
export function generateDeployContractData(category, name, constructor, args) {
  let max = 65535;
  let template_type_hex = '0001';
  if (category >= max) {
    template_type_hex = 'ffff';
  } else {
    let hex = category.toString(16);
    for (let i = 0, len = hex.length; i < 4 - len; i++) {
      hex = '0' + hex;
    }
    template_type_hex = hex;
  }
  let bytes_name = toUtf8Bytes(name);
  let name_hex = hexlify(bytes_name).replace('0x', '');
  let name_length_hex = len2Hex(bytes_name.length, 4);
  let argsBytes = encodeParams(constructor, args)
  let argsHash = argsBytes.toString('hex').replace('0x', '');

  return [template_type_hex, name_length_hex, name_hex, argsHash].join('');
}

/**
 * function to generate bytecode to submit a new template to template warehouse on asimov
 *
 * @param {*} category template category, defaults to 1 which represents organization
 * @param {*} name template name, globally unique
 * @param {*} bytecode bytecode of the contract to submit as template
 * @param {*} abi abi of the contract to submit as template
 * @param {*} source source code of the contract to submit as template
 */
export function generateCreateTemplateData(category, name, bytecode, abi, source) {
  let max = 65535;
  let template_type_hex = '0001';
  let res = []
  if (category >= max) {
    template_type_hex = 'ffff';
  } else {
    let hex = category.toString(16);
    for (let i = 0, len = hex.length; i < 4 - len; i++) {
      hex = '0' + hex;
    }
    template_type_hex = hex;
  }
  let name_bytes = toUtf8Bytes(name);
  let name_hex = hexlify(name_bytes).replace('0x', '');
  let name_length_hex = len2Hex(name_bytes.length, 4);

  let bytecode_hex = bytecode
  let bytecode_length_hex = len2Hex(bytecode.length / 2, 4);

  let abi_bytes = toUtf8Bytes(abi);
  let abi_hex = hexlify(abi_bytes).replace('0x', '');
  let abi_length_hex = len2Hex(abi_bytes.length, 4);

  let source_bytes = toUtf8Bytes(source);
  let source_hex = hexlify(source_bytes).replace('0x', '');
  let source_length_hex = len2Hex(source_bytes.length, 4);

  res.push(template_type_hex);
  res.push(name_length_hex);
  res.push(bytecode_length_hex);
  res.push(abi_length_hex);
  res.push(source_length_hex);
  res.push(name_hex);
  res.push(bytecode_hex);
  res.push(abi_hex);
  res.push(source_hex);

  return res.join('')

}
export function encodeCallData(methodABI, params) {
  let encode = encodeParams(methodABI, params)
  let argsHash = encode.toString('hex');
  let data = encodeFunctionId(methodABI).replace('0x', '') + argsHash.replace('0x', '');
  return data;
}

export function getAddressByPrivateKey(privateKey) {
  if (privateKey) {
    let pk = new PrivateKey(privateKey.replace('0x', ''))
    return new Address(pk.publicKey).toString()
  }
  return ''
}

export function parseLockId(lockId) {
  if (!lockId) {
    return {}
  }
  const lockAddr = lockId.slice(0, 44)
  let locks = lockId.slice(-8).split("");
  let id = locks[6] + locks[7] + locks[4] + locks[5] + locks[2] + locks[3] + locks[0] + locks[1];
  id = parseInt(id, 16);
  return {
    lockAddress: lockAddr,
    id: id
  }
}

/**
 * estimate fee of the transaction based on inputs, outputs and gas limit
 * price = fee / (tx size * 21 + gas limit)
 * input length = 32<txid>+4<vout>+1<signature length>+107<signature>+4<ffffffff>
 * change output length = 8<amount>+1<pkscript length>+26<pkscript>+1<asset length>+12<asset>+1<data length>
 * gas limit length = 4
 * lock time length =4
 *
 * @param {*} inputs inputs of the transaction
 * @param {*} outputs outputs of the transaction
 * @param {*} gasLimit gas limit set on the transaction
 */
export function estimateFee(inputs, outputs, gasLimit) {
  const len = 100
  const inputLen = 148
  const changeOutLen = 49
  const gasLimitLen = 4
  const lockTimeLen = 4
  let count = Math.max(len, inputs.length)
  let total = count * inputLen

  if (_.isArray(outputs)) {
    outputs.forEach(o => {
      let buf = new Output(o).toBufferWriter().toBuffer()
      total += buf.length
    })
  }

  total += changeOutLen
  total += gasLimitLen
  total += lockTimeLen

  return parseInt(((total * 21 + gasLimit) * DefaultGasPrice * FeeAmplifier).toFixed(0))

}

/**
 * estimate gas used in a transaction
 *
 * @param  {[type]} inputs inputs of the transaction
 * @param  {[type]} outputs outputs of the transaction
 * @param  {[type]} contractGasLimit the minimal gas required to run a contract
 */
/** @type number */
export function estimateGas( /** @type any[] */ inputs, /** @type any[] */ outputs, /** @type number */ contractGasLimit) {
  let size = 0
  size += inputs.length * 148

  if (_.isArray(outputs)) {
    outputs.forEach(o => {
      let buf = new Output(o).toBufferWriter().toBuffer()
      size += buf.length
    })
  }

  return size * 21 + contractGasLimit
}

export function estimateIncreasedGas(inputsAmount, outputsAmount) {
  const inputLen = 148
  const outputlen = 148
  return (inputsAmount * inputLen + outputlen * outputsAmount) * 21
}

export function estimateGasPrice( /** @type any[] */ txs) {
  let totalGasPrice = 0
  if (txs.length) {
    txs.forEach(tx => {
      let amount = 0
      tx.vin.forEach(i => {
        amount += i.prevOut.value
      })
      tx.vout.forEach(o => {
        amount -= o.value
      })
      if (amount > 0) {
        totalGasPrice += amount / tx.gasLimit
      }
    })

  }
  return parseInt((totalGasPrice / txs.length).toFixed(0)) || DefaultGasPrice
}
