import { Harmony } from '@harmony-js/core';
//import stakingAPIs from './stakingAPIs.json';
import {default as Fs} from 'fs'
//const Fs=require('fs');

const File = (name) => {return Fs.readFileSync(name);}
const Json = JSON.parse;
const JsonFile = (name)=>Json(File(name));
const stakingAPIs = JsonFile('./js/stakingAPIs.json');

export const MathWallet = 'harmony';
export const OneWallet = 'onewallet';

export let walletActived = OneWallet;
export function switchWallet(wallet){
  walletActived = wallet;
}

function getWallet(){
  return window[walletActived];
}

function getWalletName(){
  return walletActived == OneWallet ? 'OneWallet' : 'MathWallet';
}

export class HmySDK extends Harmony {
  GAS_PRICE = new this.utils.Unit(1).asGwei().toHex(); // 1Gwei
  constructor(config, name) {
    super(config.url, {
      chainType: config.chainType,
      chainId: config.chainId,
      shardID: config.shardID,
    });
    this.ExtendRPC();
    this.address = null;
    this.config = config;
    this.name = name;
  }

  ExtendRPC() {
    stakingAPIs.map(mod => {
      const modname = mod.name.split(' ')[0];
      const methodsObj = {};
      mod.methods.map(method => {
        const names = method.split('_');
        const namespace = names.length > 1 ? names[0] : undefined;
        const name =  names.length > 1 ? names[1] : names[0];
        methodsObj[name] = (...args) => {
          return this.messenger
            .send(method, [...args], namespace)
            .then(result => result.getRaw);
        };
      });
      this.blockchain[modname] = methodsObj;
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async walletInit() {
    let retry = 0;
    while (!getWallet() && retry++ < 2) await this.sleep(1000);
    if (!getWallet()) throw { message: `please install ${getWalletName()}` };
  }

  async login() {
    await this.walletInit();
    const account = await getWallet().getAccount();
    this.address = account.address;
    return account;
    //return {address:'one16xh2u9r4677egx4x3s0u966ave90l37hh7wq72'}
  }

  async logout() {
    await this.walletInit();
    this.address = null;
    return getWallet().forgetIdentity();
  }

  delegate(from, to, amount) {
    const tx = this.stakings
      .delegate({
        delegatorAddress: from,
        validatorAddress: to,
        amount: new this.utils.Unit(amount).asWei().toHex(),
      })
      .setTxParams({
        gasPrice: this.GAS_PRICE,
        gasLimit: '0x0927c0',
        chainId: this.chainId,
      })
      .build();
    tx.setFromAddress(from);
    window.dtx = tx;
    return tx;
  }

  withdrawReward(from) {
    const tx = this.stakings
      .collectRewards({
        delegatorAddress: from,
      })
      .setTxParams({
        gasPrice: this.GAS_PRICE,
        gasLimit: '0x0927c0',
        chainId: this.chainId,
      })
      .build();
    tx.setFromAddress(from);
    window.rtx = tx;
    return tx;
  }

  undelegate(from, to, amount) {
    const tx = this.stakings
      .undelegate({
        delegatorAddress: from,
        validatorAddress: to,
        amount: new this.utils.Unit(amount).asWei().toHex(),
      })
      .setTxParams({
        gasPrice: this.GAS_PRICE,
        gasLimit: '0x0927c0',
        chainId: this.chainId,
      })
      .build();
    tx.setFromAddress(from);
    window.udtx = tx;
    return tx;
  }

  transfer(from, to, amount) {
    const tx = this.transactions.newTx({
      from,
      //  token send to
      to,
      // amount to send
      value: new this.utils.Unit(amount).asWei().toHex(),
      // gas limit, you can use string
      gasLimit: '210000',
      // send token from shardID
      shardID: 0,
      // send token to toShardID
      toShardID: 0,
      // gas Price, you can use Unit class, and use Gwei, then remember to use toWei(), which will be transformed to BN
      gasPrice: this.GAS_PRICE,
    });
    window.tx = tx;
    return tx;
  }

  ContractAt(
    abi,
    to,
    options = {
      from: this.address ? this.crypto.fromBech32(this.address) : '',
    }
  ) {
    const contract = this.contracts.createContract(abi, to, options);
    contract.SDK = this;
    contract.updateWallet = function(){
        this.wallet.signTransaction = getWallet().signTransaction; // or importPrivate
        this.options.from = this.SDK.crypto.fromBech32(this.SDK.address);
    }
    if (getWallet())
      contract.wallet.signTransaction = getWallet().signTransaction; // or importPrivate
    const decodeParameters = (abi, hexdata) => {
      if (0 == abi.length) return [];
      const params = contract.abiCoder.decodeParameters(abi, hexdata);
      params.length = abi.length;
      //for (let i = 0; i < abi.length; i++) {
      //  if (abi[i].type.startsWith('address'))
      //    params[i] = this.crypto.toBech32(params[i]);
      //}
      return Array.from(params);
    };
    for (const name in contract.abiModel.getMethods()) {
      const method = contract.abiModel.getMethod(name);
      method.decodeInputs = hexData => decodeParameters(method.inputs, hexData);
      method.decodeOutputs = hexData => decodeParameters(method.outputs, hexData);
    }

    contract.decodeInput = hexData => {
      const no0x = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
      const sig = no0x.slice(0, 8).toLowerCase();
      const method = contract.abiModel.getMethod('0x' + sig);
      if (!method) return false;
      const argv = method.decodeInputs('0x' + no0x.slice(8));
      const obj = contract.methods['0x' + sig](...argv);

      for (let i = 0; i < obj.params.length; i++) {
        if (obj.abiItem.inputs[i].type == 'address')
          obj.params[i] = this.crypto.toBech32(obj.params[i]);
      }
      obj.toString = () => {
        let str = obj.abiItem.name + '(';
        for (let i = 0; i < obj.params.length; i++) {
          if (i > 0) str += ', ';
          str += obj.params[i];
        }
        str += ')';
        return str;
      };
      return obj;
    };
    return contract;
  }

  ContractDeploy(abi, code, _arguments) {
    const contractObj = this.ContractAt(abi, '0x');
    return contractObj.deploy({
      data: code,
      arguments: _arguments,
    });
  }

  async txSignSend(tx) {
    await getWallet().signTransaction(tx);
    const ret = await tx.sendTransaction();
    if (ret[1] != tx.id) throw { message: ret[1] };
    return tx;
  }

}
