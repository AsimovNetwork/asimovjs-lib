'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('process');
/* secure random bytes that sometimes throws an error due to lack of entropy */
function getRandomBuffer(size) {
    if (process.browser)
        return getRandomBufferBrowser(size);
    else
        return getRandomBufferNode(size);
}
exports.getRandomBuffer = getRandomBuffer;
;
function getRandomBufferNode(size) {
    var crypto = require('crypto');
    return crypto.randomBytes(size);
}
exports.getRandomBufferNode = getRandomBufferNode;
;
function getRandomBufferBrowser(size) {
    if (!window.crypto && !window.msCrypto)
        throw new Error('window.crypto not available');
    if (window.crypto && window.crypto.getRandomValues)
        var crypto = window.crypto;
    else if (window.msCrypto && window.msCrypto.getRandomValues) //internet explorer
        var crypto = window.msCrypto;
    else
        throw new Error('window.crypto.getRandomValues not available');
    var bbuf = new Uint8Array(size);
    crypto.getRandomValues(bbuf);
    var buf = Buffer.from(bbuf);
    return buf;
}
exports.getRandomBufferBrowser = getRandomBufferBrowser;
;
/* insecure random bytes, but it never fails */
function getPseudoRandomBuffer(size) {
    var b32 = 0x100000000;
    var b = Buffer.alloc(size);
    var r;
    for (var i = 0; i <= size; i++) {
        var j = Math.floor(i / 4);
        var k = i - j * 4;
        if (k === 0) {
            r = Math.random() * b32;
            b[i] = r & 0xff;
        }
        else {
            b[i] = (r = r >>> 8) & 0xff;
        }
    }
    return b;
}
exports.getPseudoRandomBuffer = getPseudoRandomBuffer;
;
//# sourceMappingURL=Random.js.map