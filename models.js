/*
	Copyright © Bryan Apellanes 2015  
*/
var models = (function(){
    var sources = {};

    function setModel(name, data){
        sources[name] = data;
    }

    function getModel(name){
        return sources[name];
    }

    return function(){
        return {
            getModel: getModel,
            setModel: setModel
        }
    }
})();