"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BufferWriter_1 = require("../utils/encoding/BufferWriter");
const _ = require("lodash");
class TxContract {
    constructor(config = {}) {
        this.config = config;
        this.gasLimit = 21000;
        if (!_.isUndefined(config.gasLimit)) {
            this.gasLimit = config.gasLimit;
        }
    }
    toBufferWriter(writer) {
        if (!writer) {
            writer = new BufferWriter_1.BufferWriter();
        }
        //gasLimit 4 bytes
        writer.writeInt32LE(this.gasLimit || 0);
        return writer;
    }
    toBuffer() {
        var writer = new BufferWriter_1.BufferWriter();
        return this.toBufferWriter(writer).toBuffer();
    }
    toHex() {
        return this.toBuffer().toString('hex');
    }
    static fromBufferReader(reader) {
        let gasLimit = reader.readInt32LE();
        return new TxContract({
            gasLimit: gasLimit
        });
    }
}
exports.TxContract = TxContract;
//# sourceMappingURL=TxContract.js.map