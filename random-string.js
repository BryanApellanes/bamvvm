module.exports = function randomString(l){
    var val = "",
        chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    for(var i = 0; i < l;i++){
        if(Math.random() > .5){
            val += chars[Math.floor(Math.random() * 26)];
        }else{
            val += chars[Math.floor(Math.random() * 26)].toUpperCase();
        }
    }
    return val;
};