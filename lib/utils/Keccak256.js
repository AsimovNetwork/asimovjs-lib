'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const sha3 = require("js-sha3");
const Bytes_1 = require("./Bytes");
// Imported Types
function keccak256(data) {
    return '0x' + sha3.keccak_256(Bytes_1.arrayify(data));
}
exports.keccak256 = keccak256;
//# sourceMappingURL=Keccak256.js.map