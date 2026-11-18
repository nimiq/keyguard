/* eslint-disable import/no-extraneous-dependencies */
const {
    networks,
    payments,
    address,
    script,
    Psbt,
} = require('bitcoinjs-lib');
const { BIP32Factory } = require('bip32');
const { ECPairFactory } = require('ecpair');
const ecc = require('@bitcoinerlab/secp256k1');
/* eslint-enable import/no-extraneous-dependencies */

module.exports = {
    bip32: BIP32Factory(ecc),
    networks,
    payments,
    address,
    script,
    Psbt,
    ECPair: ECPairFactory(ecc), // Used in swap-iframe to recreate keypairs from stored privatekeys
};
