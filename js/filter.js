import Vue from 'vue'

export function short(text){
    const maxlen = 18;
    if(text.length<=maxlen)
        return text;
    const charLen = maxlen - 3;
    const start = Math.ceil(charLen / 2);
    return `${text.slice(0,start)}...${text.slice(start-charLen)}`;
}

export function head(text){
    const maxlen = 10;
    if(text.length<=maxlen)
        return text;
    const charLen = maxlen - 3;
    return `${text.slice(0,charLen)}...`;
}

Vue.filter('short', short);
Vue.filter('head', head);