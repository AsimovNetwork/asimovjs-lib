import { BigNumber, bigNumberify } from './utils/BigNumber';

/**
 * black hole address on Asimov blockchain.
 */
const AddressZero = '0x6600000000000000000000000000000000000000';
/**
 * zero value hash.
 */
const HashZero = '0x0000000000000000000000000000000000000000000000000000000000000000';
/**
 * BN -1
 */
const NegativeOne: BigNumber = bigNumberify(-1);
/**
 * BN 0
 */
const Zero: BigNumber = bigNumberify(0);
/**
 * BN 1
 */
const One: BigNumber = bigNumberify(1);
/**
 * BN 2
 */
const Two: BigNumber = bigNumberify(2);
/**
 * BN max uint256
 */
const MaxUint256: BigNumber = bigNumberify('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
/**
 * default asset type, which is Asim on Asimov MainNet.
 */
const DefaultAsset: string = '000000000000000000000000'
/**
 * Complier errors.
 */
const COMPILE_ERROR_TYPE = {
  JSONError: 'JSONError',
  IOError: 'IOError',
  ParserError: 'ParserError',
  DocstringParsingError: 'DocstringParsingError',
  SyntaxError: 'SyntaxError',
  DeclarationError: 'DeclarationError',
  TypeError: 'TypeError',
  UnimplementedFeatureError: 'UnimplementedFeatureError',
  InternalCompilerError: 'InternalCompilerError',
  Exception: 'Exception',
  CompilerError: 'CompilerError',
  FatalError: 'FatalError',
  Warning: 'Warning'
}

/**
 * Transaction object.
 */
const TRANSACTION = {
  /**
   * types of contract invocation on Asimov blockchain.
   */
  CONTRACT_TYPE: {
    /**
     * deploy a new contract instance.
     */
    CREATE: 'create',
    /**
     * call contract methods.
     */
    CALL: 'call',
    /**
     * submit a new template.
     */
    TEMPLATE: 'template',
    /**
     * vote on contract methods.
     */
    VOTE: 'vote'

  },
  /**
   * version.
   */
  DEFAULT_VERSION: 1,
  /**
   * lock time.
   */
  DEFAULT_LOCK_TIME: 0
}

/**
 * asset type of UTXO.
 */
const ASSET_TYPE = {

  /**
   * fungible asset (dividable).
   */
  DEVIDABLE: 0,

  /**
   * non fungible asset (not dividable).
   */
  UNDEVIDABLE: 1
}

/**
 * organization id is assigned when registering to Asimov blockchain, it grows incrementally from 1 to max of uint32.
 */
const DEFAULT_ORGANIZATION_ID = 0;
/**
 * address length on Asimov blockchain with 1 byte type prefix.
 *
 *    - 66 - normal account.
 *    - 63 - contract.
 */
const ADDRESS_LENGTH = 21;
/**
 * asset length on Asimov blockchain.
 *
 *    - bytes [1,4] - asset properties.
 *    - bytes [5,8] - organization id.
 *    - bytes [9,12] - asset index inside the organization.
 */
const ASSETS_LENGTH = 12;
/**
 * addresses reserved for system contracts.
 * from 0x6300000000000000000000000000000000000064 to 0x63000000000000000000000000000000000003E7.
 */
const GENESIS_CONTRACT = {
  MIN: 100,
  MAX: 999
}
/**
 * special method types in contract.
 *
 *    - view/pure - readonly method
 *    - constructor
 */
const MethodType = {
  View: 'view',
  Pure: 'pure',
  Constructor: 'constructor'
}
/**
 * system contracts.
 */
const SYSTEM_CONTRACT_ADDRESS = {
  /**
   * Genesis organization (Asimov foundation)
   */
  GenesisOrganization: '0x630000000000000000000000000000000000000064',
  /**
   * Schedule contract, DEPRECATED.
   */
  Schedule: '0x630000000000000000000000000000000000000069',
  /**
   * Consensus management.
   */
  ConsensusManagement: '0x630000000000000000000000000000000000000068',
  /**
   * Registry center.
   */
  RegistryCenter: '0x630000000000000000000000000000000000000065',
  /**
   * Template warehouse.
   */
  TemplateWarehouse: '0x630000000000000000000000000000000000000067',
  /**
   * Validator committee.
   */
  ValidatorCommittee: '0x630000000000000000000000000000000000000066'
}

/**
 * default transaction fee settings with value set to 21000 satoshis and asset type set to Asim.
 */
const DefaultFee = {
  amount: 21000,
  asset: '000000000000000000000000'
}

/**
 * gas amplifier on the estimated gas limit. gas estimation is augmented to make sure enough gas is provided to the transaction.
 */
const GasAmplifier = 1.2
/**
 * fee amplifier on the estimated fee. fee estimation is augmented to make sure enough fee is provided to the transaction.
 */
const FeeAmplifier = 1.2
/**
 * minimal gas limit set on a transaction.
 */
const MinGasLimit = 21000
/**
 * default template category. 1 represents organization.
 */
const DefaultCategory = 1
/**
 * default gas price.
 */
const DefaultGasPrice = 0.02


export {
  COMPILE_ERROR_TYPE,
  TRANSACTION,
  DEFAULT_ORGANIZATION_ID,
  ADDRESS_LENGTH,
  ASSETS_LENGTH,
  GENESIS_CONTRACT,
  ASSET_TYPE,
  SYSTEM_CONTRACT_ADDRESS,

  AddressZero,
  HashZero,
  NegativeOne,
  Zero,
  One,
  Two,
  MaxUint256,

  MethodType,
  DefaultAsset,
  DefaultFee,
  DefaultCategory,
  GasAmplifier,
  MinGasLimit,
  DefaultGasPrice,
  FeeAmplifier
}
