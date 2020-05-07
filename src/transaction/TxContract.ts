import { BufferWriter } from "../utils/encoding/BufferWriter"
import { BufferReader } from "../utils/encoding/BufferReader"

import * as _ from "lodash"

export interface TxContractConfig {
  gasLimit ? : number
}

export class TxContract {
  public gasLimit: number = 21000

  constructor(public config: TxContractConfig = {}) {
    if (!_.isUndefined(config.gasLimit)) {
      this.gasLimit = config.gasLimit
    }
  }

  public toBufferWriter(writer ? : BufferWriter) {
    if (!writer) {
      writer = new BufferWriter();
    }
    //gasLimit 4 bytes
    writer.writeInt32LE(this.gasLimit || 0);
    return writer;
  }

  public toBuffer() {
    var writer = new BufferWriter();
    return this.toBufferWriter(writer).toBuffer();
  }

  public toHex(): string {
    return this.toBuffer().toString('hex');
  }

  static fromBufferReader(reader: BufferReader) {
    let gasLimit = reader.readInt32LE()
    return new TxContract({
      gasLimit: gasLimit
    })
  }
}
