import { default as graphviz } from 'graphviz'
import {default as Fs} from 'fs'

var G = graphviz.digraph("G");
G.set('rankdir', 'LR');

class Item {
    name;
    gnode;
    edges;
    constructor(name){
        this.name = name;
        this.gnode = G.addNode(this.name);
        this.edges = {}
    }

    linkTo(to) {
        const edge = G.addEdge( this.gnode, to.gnode );
        this.edges[to.name] = edge;
        return edge;
    }

    getLink(to) {
        return this.edges[to.name];
    }
};

const itemDefine = {};
//const links = [];

export function getNode(node){
    let name = node;
    if(node instanceof Item) name = node.name;

    if(itemDefine[name])
        return itemDefine[name];
    const newItem = new Item(name);
    itemDefine[name] = newItem;
    return newItem;
}

export function toFile(type='dot', use='dot', file=`blocks_${use}.${type}`) {
    //G.setGraphVizPath( "/tmp/" );
    //G.output( "png", "blocks.png" );
    if(type == 'dot')
        Fs.writeFileSync(file, G.to_dot()); // run `dot -K dot -T svg -O blocks_dot.dot`
    G.output({type, use}, file);
}