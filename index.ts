import { getHttpEndpoint, Network } from '@orbs-network/ton-access'
import { KeyPair, mnemonicToWalletKey } from 'ton-crypto'
import { WalletContractV4, TonClient, fromNano, Address, internal } from 'ton'
export default class TonSender {
    private network: Network
    private mnemonic: string
    constructor({ network, mnemonic }: { network: Network, mnemonic: string }) {
        this.network = network
        this.mnemonic = mnemonic
    }
    account() {
        return new Promise<{ wallet: WalletContractV4, key: KeyPair }>(async (resolve, reject) => {
            try {
                const key = await mnemonicToWalletKey(this.mnemonic.split(" "))
                const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 })
                resolve({ wallet, key })
            } catch (e) {
                reject(e)
            }
        })
    }
    getBalance(address: Address) {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const endpoint = await getHttpEndpoint({ network: this.network })
                const client = new TonClient({ endpoint })
                const balance = await client.getBalance(address)
                resolve(fromNano(balance))
            } catch (e) {
                reject(e)
            }
        })
    }
    sendTon({ address, amount, comment }: { address: string, amount: string, comment?: string }) {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const account = await this.account()
                const endpoint = await getHttpEndpoint({ network: this.network })
                const client = new TonClient({ endpoint })
                if (!await client.isContractDeployed(account?.wallet.address)) reject("Wallet is not deployed!")
                const wallet = client.open(account?.wallet)
                const seqno = await wallet.getSeqno()
                await wallet.sendTransfer({
                    secretKey: account?.key.secretKey,
                    seqno: seqno,
                    messages: [
                        internal({
                            to: address,
                            value: amount,
                            body: comment,
                            bounce: false
                        })
                    ]
                })
                resolve(seqno)
            } catch (e) {
                reject(e)
            }
        })
    }
}
