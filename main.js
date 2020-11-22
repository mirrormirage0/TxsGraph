import {default as Fs} from 'fs'
import { getNode,toFile } from './graphviz.js'
//const Fs=require('fs');

const File = (name) => {return Fs.readFileSync(name);}
const Json = JSON.parse;
const JsonFile = (name)=>Json(File(name));

function getBlock(n) {
    const filename = `./blocks/${n}`;
    return Fs.existsSync(filename)?JsonFile(filename):null;
}

function txFilter(tx) {
    const value = parseInt(tx.value)/1e18;
    return value > 2e5;
    
}
const D = console.log;

const dir = Fs.readdirSync('./blocks')
dir.sort();

dir.forEach(blockNo=>{
    const block = getBlock(blockNo);
    const txs = block.transactions.filter(txFilter);
    txs.forEach(tx=>{
        // 'one1wx6p8kjucu5llqz79h9pmn0qf55772m2d2xt26' may be owned by a exchange
        //if(tx.to == 'one1wx6p8kjucu5llqz79h9pmn0qf55772m2d2xt26' || tx.from == 'one1wx6p8kjucu5llqz79h9pmn0qf55772m2d2xt26') return;
        const from = getNode(tx.from);
        const to = getNode(tx.to);
        if(from.getLink(to)) return; // have it
        const edge = from.linkTo(to);
        edge;
    })
});

toFile('svg', 'dot');

