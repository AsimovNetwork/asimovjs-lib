import { FileManager } from './FileManager';
import { COMPILE_ERROR_TYPE } from '../Constant';

import { setupMethods } from '../utils/SolcWrap'
import { Error } from '../utils/Error'
import * as _ from 'lodash'

export interface Sources {
  [propName: string]: {
    keccak256 ? : string;
    urls ? : string[];
    content ? : string;
  };
}

export interface ByteCode {
  /**
   * The bytecode as a hex string.
   */
  object: string;
  /**
   * Opcodes list.
   */
  opcodes: string;
  /**
   * The source mapping as a string.
   */
  sourceMap: string;
}

export interface IEvmOutput {
  /**
   *  Assembly (string).
   */
  assembly: string;
  /**
   * Bytecode and related details.
   */
  bytecode: ByteCode;
  /**
   * The same layout as above.
   */
  deployedBytecode: ByteCode;
  /**
   * "delegate(address)": "5c19a95c".
   */
  methodIdentifiers: {
    [propName: string]: string;
  }
}
export interface CompiledContract {
  /**
   * Contract ABI. If empty, it is represented as an empty array.
   * See https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI
   */
  abi: any[];
  /**
   * See the Metadata Output documentation (serialised JSON string).
   */
  metadata: any;
  /**
   * User documentation (natspec).
   */
  userdoc: any;
  /**
   *  Developer documentation (natspec).
   */
  devdoc: any;
  /**
   * Intermediate representation (string).
   */
  ir: string;
  /**
   * EVM-related outputs.
   */
  evm: IEvmOutput
}

export interface CompileError {
  /**
   *  Location within the source file.
   */
  sourceLocation ? : {
    file: string;
    start: number;
    end: number;
  };

  /**
   *Mandatory: Error type, such as "TypeError", "InternalCompilerError", "Exception", etc.
   *JSONError: JSON input doesn’t conform to the required format, e.g. input is not a JSON object, the language is not supported, etc.
   *IOError: IO and import processing errors, such as unresolvable URL or hash mismatch in supplied sources.
   *ParserError: Source code doesn’t conform to the language rules.
   *DocstringParsingError: The NatSpec tags in the comment block cannot be parsed.
   *SyntaxError: Syntactical error, such as continue is used outside of a for loop.
   *DeclarationError: Invalid, unresolvable or clashing identifier names. e.g. Identifier not found
   *TypeError: Error within the type system, such as invalid type conversions, invalid assignments, etc.
   *UnimplementedFeatureError: Feature is not supported by the compiler, but is expected to be supported in future versions.
   *InternalCompilerError: Internal bug triggered in the compiler - this should be reported as an issue.
   *Exception: Unknown failure during compilation - this should be reported as an issue.
   *CompilerError: Invalid use of the compiler stack - this should be reported as an issue.
   *FatalError: Fatal error not processed correctly - this should be reported as an issue.
   *Warning: A warning, which didn’t stop the compilation, but should be addressed if possible.
   */
  type: string;
  /**
   * Mandatory: Component where the error originated, such as "general", "ewasm", etc.
   */
  component ? : string;
  /**
   * Mandatory ("error" or "warning").
   */
  severity: string;
  /**
   * Mandatory.
   */
  message ? : string;
  /**
   * The message formatted with source location.
   */
  formattedMessage ? : string;
  /**
   * Panic.
   */
  mode: string;
}

export interface CompileResult {
  errors: CompileError[];
  contracts: {
    [propName: string]: CompiledContract
  }
}



export class CompilerInput {

  private config: {
    language: string;
    sources: Sources,
    settings: any;
  };

  constructor(sources: Sources, opts: any) {
    this.config = {
      language: 'Solidity',
      sources: sources,
      settings: {
        optimizer: {
          enabled: opts.optimize === true || opts.optimize === 1,
          runs: 200
        },
        libraries: opts.libraries,
        outputSelection: {
          '*': {
            '': ['legacyAST'],
            '*': ['abi', 'metadata', 'devdoc', 'userdoc', 'evm.legacyAssembly', 'evm.bytecode', 'evm.deployedBytecode', 'evm.methodIdentifiers', 'evm.gasEstimates']
          }
        }
      }
    }
  }

  public stringify(): string {
    return JSON.stringify(this.config);
  }
}


function isValidError(error) {
  // The deferred import is not a real error
  // FIXME: maybe have a better check?
  if (/Deferred import/.exec(error.message)) {
    return false
  }

  return error.severity !== 'warning'
}


export class Compiler {

  private compilationStartTime: number
  private fileManager: FileManager
  private libs: Sources

  public optimize: boolean = false
  public compilerCore: any
  constructor(
    private compiler: any
  ) {
    this.fileManager = new FileManager();


    //already wrapped
    if (compiler.version && compiler.version()) {
      this.compilerCore = compiler
    } else if (compiler && !_.isEmpty(compiler)) {
      this.compilerCore = setupMethods(compiler)
    }
  }

  public setLibs(libs: Sources) {
    this.libs = libs
  }

  public getLibs() {
    return this.libs
  }
  /**
   * Load file and compile to JSON format compile result
   */
  public async compileSol(path: string) {
    let sources = {};

    try {

      const text = await this.fileManager.importFile(path);
      sources[path] = { content: text }

      const result = await this.compile(sources)

      let contracts = result.contracts[path] || {}
      let errors = result.errors || []

      errors.forEach(e => {
        if (e.severity == 'error') {
          throw e.formattedMessage
        }
      });

      return {
        contracts: contracts,
        source: text
      }

    } catch (err) {
      throw err
    }
  }

  /**
   * Compiler sources to JSON format compile result
   */
  public async compile(sources: Sources) {

    let sourceArray: any[] = [];

    for (let path in sources) {
      sourceArray.push({
        path: path,
        content: sources[path].content
      });
    }

    for (const item of sourceArray) {
      await this.internalCompile(sources, item.path, item.content)
    }

    return this.compileToJSON(sources, this.optimize)
  }



  private async internalCompile(sources: Sources, path: string, content: string) {

    let _missingInputs = this.gatherImports(sources, path, content);

    if (_missingInputs.length) {
      await this.loadMissingInputs(sources, _missingInputs)
    }
  }

  private async loadMissingInputs(sources: Sources, missingInputs: string[]) {
    let promiseArray: any[] = [];

    for (const path of missingInputs) {

      if (path in sources) {
        continue
      } else if (this.libs && (path in this.libs)) {
        sources[path] = this.libs[path]
        await this.internalCompile(sources, path, this.libs[path].content);
      } else {
        // console.log(path);
        let content = await this.fileManager.importFile(path);
        sources[path] = { content: content };
        await this.internalCompile(sources, path, content);
      }
    }
  }

  private gatherImports(sources: Sources, fileName: string, content: string) {

    const importRegex = /^\s*import\s*[\'\"]([^\'\"]+)[\'\"];/mg

    let importHints = [];
    let match;

    while ((match = importRegex.exec(content))) {

      let importFilePath: any = match[1]
      //relative path
      if (importFilePath.startsWith('./')) {
        let path = /(.*\/).*/.exec(fileName)
        if (path !== null) {
          importFilePath = importFilePath.replace('./', path[1])
        } else {
          importFilePath = importFilePath.slice(2)
        }
      }

      if (importFilePath.startsWith('../')) {
        let prefixes = fileName.split('/')
        let pathArray = importFilePath.split('../')
        let j = 0

        for (let len = pathArray.length, i = len - 2; i >= 0; i--) {
          if (pathArray[i] == '') {
            j++
          }
        }
        let offset = prefixes.length - 1 - j

        if (offset < 0) {
          throw Error('import relative path is exceeded')
        }
        if (offset == 0) {
          importFilePath = pathArray[pathArray.length - 1]
        } else {
          let prefix = prefixes.slice(0, prefixes.length - j - 1)
          prefix.push(pathArray[pathArray.length - 1])
          importFilePath = prefix.join('/')
        }
      }

      if (importHints.indexOf(importFilePath) === -1 && !sources[importFilePath]) {
        importHints.push(importFilePath)
      }
    }
    return importHints;
  }

  private compileToJSON(sources: Sources, optimize: boolean) {

    var missingInputs = []
    var result: CompileResult;

    try {

      var input = new CompilerInput(sources, { optimize: optimize });
      var r = this.compilerCore.compile(input.stringify(), function(path) {
        missingInputs.push(path)
        return { error: 'Deferred import' }
      });

      result = JSON.parse(r)

    } catch (exception) {

      let error: CompileError = {
        type: COMPILE_ERROR_TYPE.Exception,
        formattedMessage: 'Uncaught JavaScript exception:\n' + exception,
        severity: 'error',
        mode: 'panic'
      }
      result = {
        errors: [error],
        contracts: {}
      }
    }
    return result;
  }


  private checkError(errors: Error[]) {
    let isOk = true;

    if (errors.length) {
      errors.forEach(function(err: Error) {
        // Ignore warnings and the 'Deferred import' error as those are generated by us as a workaround
        if (/Deferred import/.exec(err.message)) {
          return false
        }
        if (isValidError(err)) {
          isOk = false
        }
      })
    }

    return isOk;
  }

}
