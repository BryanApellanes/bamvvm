let dataSources = (function(bam, dao, _, win){
    "use strict"
    let loaders = {};

    return {                
        load: (sourceName, loader) => {
            if(_.isFunction(loader)){
                loaders[sourceName] = loader;
            } else {                
                return new Promise((resolve, reject) => {
                    let loaderPromise = loader(sourceName);
                    if(!_.isFunction(loaderPromise.then)){
                        reject(new Error(`Loader for ${sourceName} did not return a promise`));
                    }
                    loaderPromise
                        .then(data => resolve(data))
                        .catch(e=> reject(e));
                })
            }
        }
    }
})(bam, dao, _, window || {})

module.exports = dataSources;