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
const ton_access_1 = require("@orbs-network/ton-access");
const ton_crypto_1 = require("ton-crypto");
const ton_1 = require("ton");
class TonSender {
    constructor({ network, mnemonic }) {
        this.network = network;
        this.mnemonic = mnemonic;
    }
    account() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const key = yield (0, ton_crypto_1.mnemonicToWalletKey)(this.mnemonic.split(" "));
                const wallet = ton_1.WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
                resolve({ wallet, key });
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    getBalance(address) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const endpoint = yield (0, ton_access_1.getHttpEndpoint)({ network: this.network });
                const client = new ton_1.TonClient({ endpoint });
                const balance = yield client.getBalance(address);
                resolve((0, ton_1.fromNano)(balance));
            }
            catch (e) {
                reject(e);
            }
        }));
    }
    sendTon({ address, amount, comment }) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield this.account();
                const endpoint = yield (0, ton_access_1.getHttpEndpoint)({ network: this.network });
                const client = new ton_1.TonClient({ endpoint });
                if (!(yield client.isContractDeployed(account === null || account === void 0 ? void 0 : account.wallet.address)))
                    reject("Wallet is not deployed!");
                const wallet = client.open(account === null || account === void 0 ? void 0 : account.wallet);
                const seqno = yield wallet.getSeqno();
                yield wallet.sendTransfer({
                    secretKey: account === null || account === void 0 ? void 0 : account.key.secretKey,
                    seqno: seqno,
                    messages: [
                        (0, ton_1.internal)({
                            to: address,
                            value: amount,
                            body: comment,
                            bounce: false
                        })
                    ]
                });
                resolve(seqno);
            }
            catch (e) {
                reject(e);
            }
        }));
    }
}
exports.default = TonSender;
