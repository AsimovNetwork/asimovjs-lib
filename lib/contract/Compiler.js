"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FileManager_1 = require("./FileManager");
const Constant_1 = require("../Constant");
const SolcWrap_1 = require("../utils/SolcWrap");
const _ = require("lodash");
class CompilerInput {
    constructor(sources, opts) {
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
        };
    }
    stringify() {
        return JSON.stringify(this.config);
    }
}
exports.CompilerInput = CompilerInput;
function isValidError(error) {
    // The deferred import is not a real error
    // FIXME: maybe have a better check?
    if (/Deferred import/.exec(error.message)) {
        return false;
    }
    return error.severity !== 'warning';
}
class Compiler {
    constructor(compiler) {
        this.compiler = compiler;
        this.optimize = false;
        this.fileManager = new FileManager_1.FileManager();
        //already wrapped
        if (compiler.version && compiler.version()) {
            this.compilerCore = compiler;
        }
        else if (compiler && !_.isEmpty(compiler)) {
            this.compilerCore = SolcWrap_1.setupMethods(compiler);
        }
    }
    setLibs(libs) {
        this.libs = libs;
    }
    getLibs() {
        return this.libs;
    }
    /**
     * Load file and compile to JSON format compile result
     */
    compileSol(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let sources = {};
            try {
                const text = yield this.fileManager.importFile(path);
                sources[path] = { content: text };
                const result = yield this.compile(sources);
                let contracts = result.contracts[path] || {};
                let errors = result.errors || [];
                errors.forEach(e => {
                    if (e.severity == 'error') {
                        throw e.formattedMessage;
                    }
                });
                return {
                    contracts: contracts,
                    source: text
                };
            }
            catch (err) {
                throw err;
            }
        });
    }
    /**
     * Compiler sources to JSON format compile result
     */
    compile(sources) {
        return __awaiter(this, void 0, void 0, function* () {
            let sourceArray = [];
            for (let path in sources) {
                sourceArray.push({
                    path: path,
                    content: sources[path].content
                });
            }
            for (const item of sourceArray) {
                yield this.internalCompile(sources, item.path, item.content);
            }
            return this.compileToJSON(sources, this.optimize);
        });
    }
    internalCompile(sources, path, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let _missingInputs = this.gatherImports(sources, path, content);
            if (_missingInputs.length) {
                yield this.loadMissingInputs(sources, _missingInputs);
            }
        });
    }
    loadMissingInputs(sources, missingInputs) {
        return __awaiter(this, void 0, void 0, function* () {
            let promiseArray = [];
            for (const path of missingInputs) {
                if (path in sources) {
                    continue;
                }
                else if (this.libs && (path in this.libs)) {
                    sources[path] = this.libs[path];
                    yield this.internalCompile(sources, path, this.libs[path].content);
                }
                else {
                    // console.log(path);
                    let content = yield this.fileManager.importFile(path);
                    sources[path] = { content: content };
                    yield this.internalCompile(sources, path, content);
                }
            }
        });
    }
    gatherImports(sources, fileName, content) {
        const importRegex = /^\s*import\s*[\'\"]([^\'\"]+)[\'\"];/mg;
        let importHints = [];
        let match;
        while ((match = importRegex.exec(content))) {
            let importFilePath = match[1];
            //relative path
            if (importFilePath.startsWith('./')) {
                let path = /(.*\/).*/.exec(fileName);
                if (path !== null) {
                    importFilePath = importFilePath.replace('./', path[1]);
                }
                else {
                    importFilePath = importFilePath.slice(2);
                }
            }
            if (importFilePath.startsWith('../')) {
                let prefixes = fileName.split('/');
                let pathArray = importFilePath.split('../');
                let j = 0;
                for (let len = pathArray.length, i = len - 2; i >= 0; i--) {
                    if (pathArray[i] == '') {
                        j++;
                    }
                }
                let offset = prefixes.length - 1 - j;
                if (offset < 0) {
                    throw Error('import relative path is exceeded');
                }
                if (offset == 0) {
                    importFilePath = pathArray[pathArray.length - 1];
                }
                else {
                    let prefix = prefixes.slice(0, prefixes.length - j - 1);
                    prefix.push(pathArray[pathArray.length - 1]);
                    importFilePath = prefix.join('/');
                }
            }
            if (importHints.indexOf(importFilePath) === -1 && !sources[importFilePath]) {
                importHints.push(importFilePath);
            }
        }
        return importHints;
    }
    compileToJSON(sources, optimize) {
        var missingInputs = [];
        var result;
        try {
            var input = new CompilerInput(sources, { optimize: optimize });
            var r = this.compilerCore.compile(input.stringify(), function (path) {
                missingInputs.push(path);
                return { error: 'Deferred import' };
            });
            result = JSON.parse(r);
        }
        catch (exception) {
            let error = {
                type: Constant_1.COMPILE_ERROR_TYPE.Exception,
                formattedMessage: 'Uncaught JavaScript exception:\n' + exception,
                severity: 'error',
                mode: 'panic'
            };
            result = {
                errors: [error],
                contracts: {}
            };
        }
        return result;
    }
    checkError(errors) {
        let isOk = true;
        if (errors.length) {
            errors.forEach(function (err) {
                // Ignore warnings and the 'Deferred import' error as those are generated by us as a workaround
                if (/Deferred import/.exec(err.message)) {
                    return false;
                }
                if (isValidError(err)) {
                    isOk = false;
                }
            });
        }
        return isOk;
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map