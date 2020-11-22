import { HmySDK } from './js/hmy.js';
import { MAINNET } from "./js/globalConfig.js"


import {default as Fs} from 'fs'

const fwrite = (name, text) => Fs.writeFileSync(name,text);

const D = console.log;

const hmy = new HmySDK(MAINNET, "MAINNET");

hmy.blockchain.Transaction

let startNumber = parseInt(process.argv[2]);
let endNumber = 5995091; //startNumber + (7 * 24 * 3600)/5;

if(isNaN(startNumber)){
	const start = new Date("2020-11-13").getTime()/1000
	const curHeader = await hmy.blockchain.Protocol.latestHeader();
	const curNumber = curHeader.result.blockNumber;
	const curTime = curHeader.result.unixtime;
	startNumber = Math.ceil(curNumber - (curTime - start) / 5);
}

if(startNumber >= endNumber){
	D("exit");
	process.exit();
}

//const startBlock = await hmy.blockchain.Transaction.getBlockByNumber(0x5b3a7a, true);


const syncStartTime = new Date().getTime();
for(let i = startNumber; i < endNumber; i++) {
	const filename = `./blocks/${i}`;
	const spentTime = (new Date().getTime()) - syncStartTime;
	const percent = (i-startNumber)/(endNumber-startNumber);

	if(spentTime > 60*1000) {
		D(i, startNumber, endNumber, percent, (spentTime/percent - spentTime)/1000);
		break;
	}
	if(Fs.existsSync(filename)) continue;
    try{
	    const countResp = await hmy.blockchain.Transaction.getBlockTransactionCountByNumber(i);
	    const count = parseInt(countResp.result);
	    if(count == 0) continue;
	    const block = await hmy.blockchain.Transaction.getBlockByNumber(i, true);
		fwrite(filename, JSON.stringify(block.result));
    }catch(e){
		D(i, startNumber, endNumber, percent, (spentTime/percent - spentTime)/1000);
	 	break
    }
}

process.exit()


//D(startNumber, startBlock.result, new Date(startBlock.result.timestamp * 1000));


