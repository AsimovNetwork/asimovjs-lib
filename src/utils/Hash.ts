// 'use strict';

import * as $ from './Preconditions'
import * as BufferUtil from './BitcoreBuffer';

export function sha1(buf) {
  var crypto = require('crypto');
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha1').update(buf).digest();
};

sha1.blocksize = 512;

export function sha256(buf) {
  var crypto = require('crypto');
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha256').update(buf).digest();
};

sha256.blocksize = 512;

export function sha256sha256(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return sha256(sha256(buf));
};

export function ripemd160(buf) {
  var crypto = require('crypto');
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('ripemd160').update(buf).digest();
};

export function sha256ripemd160(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return ripemd160(sha256(buf));
};

export function sha512(buf) {
  var crypto = require('crypto');
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha512').update(buf).digest();
};

sha512.blocksize = 1024;

export function hmac(hashf, data, key) {
  //http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  //http://tools.ietf.org/html/rfc4868#section-2
  $.checkArgument(BufferUtil.isBuffer(data));
  $.checkArgument(BufferUtil.isBuffer(key));
  $.checkArgument(hashf.blocksize);

  var blocksize = hashf.blocksize / 8;

  if (key.length > blocksize) {
    key = hashf(key);
  } else if (key < blocksize) {
    var fill = Buffer.alloc(blocksize);
    fill.fill(0);
    key.copy(fill);
    key = fill;
  }

  var o_key = Buffer.alloc(blocksize);
  o_key.fill(0x5c);

  var i_key = Buffer.alloc(blocksize);
  i_key.fill(0x36);

  var o_key_pad = Buffer.alloc(blocksize);
  var i_key_pad = Buffer.alloc(blocksize);
  for (var i = 0; i < blocksize; i++) {
    o_key_pad[i] = o_key[i] ^ key[i];
    i_key_pad[i] = i_key[i] ^ key[i];
  }

  return hashf(Buffer.concat([o_key_pad, hashf(Buffer.concat([i_key_pad, data]))]));
};

export function sha256hmac(data, key) {
  return hmac(sha256, data, key);
};

export function sha512hmac(data, key) {
  return hmac(sha512, data, key);
};
