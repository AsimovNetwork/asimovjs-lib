'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Bn_1 = require("./Bn");
const BufferUtil = require("./BitcoreBuffer");
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var ecPoint = ec.curve.point.bind(ec.curve);
var ecPointFromX = ec.curve.pointFromX.bind(ec.curve);
/**
 *
 * Instantiate a valid secp256k1 Point from the X and Y coordinates.
 *
 * @param {BN|String} x - The X coordinate
 * @param {BN|String} y - The Y coordinate
 * @link https://github.com/indutny/elliptic
 * @augments elliptic.curve.point
 * @throws {Error} A validation error if exists
 * @returns {Point} An instance of Point
 * @constructor
 */
class Point {
    constructor(x, y, isRed) {
        let point = ecPoint(x, y, isRed);
        Object.assign(this, point);
        this._getX = point.getX();
        this._getY = point.getY();
        this.validate();
    }
    /**
     *
     * Instantiate a valid secp256k1 Point from only the X coordinate
     *
     * @param {boolean} odd - If the Y coordinate is odd
     * @param {BN|String} x - The X coordinate
     * @throws {Error} A validation error if exists
     * @returns {Point} An instance of Point
     */
    static fromX(odd, x) {
        try {
            var point = ecPointFromX(x, odd);
        }
        catch (e) {
            throw new Error('Invalid X');
        }
        point.validate();
        return point;
    }
    ;
    /**
     *
     * Will return a secp256k1 ECDSA base point.
     *
     * @link https://en.bitcoin.it/wiki/Secp256k1
     * @returns {Point} An instance of the base point.
     */
    static getG() {
        return ec.curve.g;
    }
    ;
    /**
     *
     * Will return the max of range of valid private keys as governed by the secp256k1 ECDSA standard.
     *
     * @link https://en.bitcoin.it/wiki/Private_key#Range_of_valid_ECDSA_private_keys
     * @returns {BN} A BN instance of the number of points on the curve
     */
    static getN() {
        return new Bn_1.Bn(ec.curve.n.toArray());
    }
    ;
    // public _getX = this.getX;
    /**
     *
     * Will return the X coordinate of the Point
     *
     * @returns {BN} A BN instance of the X coordinate
     */
    getX() {
        return new Bn_1.Bn(this._getX.toArray());
    }
    ;
    // public _getY = this.getY;
    /**
     *
     * Will return the Y coordinate of the Point
     *
     * @returns {BN} A BN instance of the Y coordinate
     */
    getY() {
        return new Bn_1.Bn(this._getY.toArray());
    }
    ;
    /**
     *
     * Will determine if the point is valid
     *
     * @link https://www.iacr.org/archive/pkc2003/25670211/25670211.pdf
     * @param {Point} An instance of Point
     * @throws {Error} A validation error if exists
     * @returns {Point} An instance of the same Point
     */
    validate() {
        // if (this.isInfinity()){
        //   throw new Error('Point cannot be equal to Infinity');
        // }
        var p2;
        try {
            p2 = ecPointFromX(this.getX(), this.getY().isOdd());
        }
        catch (e) {
            throw new Error('Point does not lie on the curve');
        }
        if (p2.y.cmp(this.y) !== 0) {
            throw new Error('Invalid y value for curve.');
        }
        //todo: needs test case
        // if (!(this.mul(Point.getN()).isInfinity())) {
        //   throw new Error('Point times N must be infinity');
        // }
        return this;
    }
    ;
    static pointToCompressed(point) {
        var xbuf = point.getX().toBuffer({ size: 32 });
        var ybuf = point.getY().toBuffer({ size: 32 });
        var prefix;
        var odd = ybuf[ybuf.length - 1] % 2;
        if (odd) {
            prefix = Buffer.from([0x03]);
        }
        else {
            prefix = Buffer.from([0x02]);
        }
        return BufferUtil.concat([prefix, xbuf]);
    }
    ;
}
exports.Point = Point;
//# sourceMappingURL=Point.js.map