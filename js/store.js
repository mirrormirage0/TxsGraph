import Vue from 'vue';
//import axios from 'axios';

const store = {
  data: {
    gasLimit: "0x7a1200",
    gasPrice: "0x3b9aca00", // 1 Gwei
    callValue: "0x0",
    waitConfirm: true,
  },
  txConfig() {
    return {
      gas: this.data.gasLimit,
      gasPrice: this.data.gasPrice,
      value: this.data.callValue,
      waitConfirm: this.data.waitConfirm,
    };
  },
};

Vue.prototype.$store = store;

export default store;
