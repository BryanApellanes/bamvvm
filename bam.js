/*
* Copyright 2014, Bryan Apellanes
* Available via the MIT or new BSD license.
*
* Bam simple single page application framework
*/
const thirdPartyPath = '../3rdParty/';
var bam = function(appName){
    var app;
    if(bam.app){
        app = bam.app(appName);
    }
    return app;
};
bam.ctor = bam.ctor || {};

module.exports = (function(){
    "use strict"

    return function(deps){
        let _bam = bam,
            _dao = deps.dao,
            $ = deps.jQuery,
            _ = deps.lodash,
            window = deps.window,
            forge = deps.forge,
            dst = deps.dust;
        
            var appPath = "",
                appRoot = "http://gloo-test.bamapps.net",
                localAppRoot = appRoot,
                proxyRoots = {},
                verb = "POST",
                crossDomain = false,
                dataTypes = {
                    xml: "xml",
                    html: "html",
                    htm: "html",
                    json: "json",
                    jsonp: "jsonp",
                    text: "text"
                };
        
            _bam.throwIf = function(ifTrue, message){
                if(ifTrue){
                    throw new Error(message);
                }
            }
        
            /**
             * Sets the name of the current application.
             * Should be used specifically to help determine
             * whether the app is in the root or deployed as a
             * subdirectory
             * @param {String} n The name to set the application name to
             */
            _bam.setAppPath = function (n) {
                var m = n.match("/$");
                if ((m === null || m === undefined) && !(n === null || n === undefined)) {
                    n = n + "/";
                }
                appPath = n;
            };
        
            /**
             * Gets a random letter from a to z
             *
             * @return {String}
             */
            _bam.randomLetter = function () {
                var chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
                return chars[Math.floor(Math.random() * 26)];
            };
        
            /**
             * Gets a random number from 0 to 9
             *
             * @return {number}
             */
            _bam.randomNumber = function(){
                var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
                return nums[Math.floor(Math.random() * 10)];
            };
        
            /**
             *  Gets a random boolean
             *
             * @return {Boolean}
             */
            _bam.randomBool = function(){
                return Math.random() > .5;
            };
        
            /**
             * Gets a random string of the specified length
             *
             * @param {number} l the length of the string to return
             * @return {String}
             */
            _bam.randomString = function(l){
                var val = "";
                for(var i = 0; i < l;i++){
                    if(_bam.randomBool()){
                        val += _bam.randomLetter();
                    }else{
                        val += _bam.randomLetter().toUpperCase();
                    }
                }
                return val;
            };
        
            /**
             * Gets a date from the specified string
             *
             * @param s a json date string
             * @return {Date}
             */
            _bam.toDate = function(s) {
                return new Date(parseInt(s.substr(6)));
            };
        
            /**
             * Gets a local date/time from the specified string
             *
             * @param s
             * @return {Date}
             */
            _bam.toLocal = function(s) {
                return new Date(_bam.toDate(s).toLocaleString() + " UTC");
            };
        
            /**
             * Gets the root of the current app by appending the appName to the http
             * protocol and host.
             *
             * @return {String}
             */
            _bam.getAppRoot = function () {
                return appRoot + appPath;
            };
        
            _bam.setAppRoot = function (root, path) {
                appRoot = root;
                if (!_.isUndefined(path)) {
                    appPath = path;
                }
                if(appRoot !== localAppRoot){
                    crossDomain = true;
                    verb = "GET";
                }
            };
        
            _bam.proxyRoot = function(proxyName, root, path){                                
                if (!_.isUndefined(proxyName) && proxyRoots[proxyName] && _.isUndefined(root)) {
                    return  proxyRoots[proxyName];                    
                } else {
                    if(_.isUndefined(path)){
                        path = appPath;
                    }
                    proxyRoots[proxyName] = {};
                    proxyRoots[proxyName].appRoot = root;
                    proxyRoots[proxyName].appPath = path;
                    proxyRoots[proxyName].toString = function(){
                        return this.appRoot + this.appPath;
                    };

                    return _bam.proxyRoot(proxyName);
                }
            };
        
            /**
             * Renders the specified data using the specified dust template.
             * @param viewName
             * @param data
             * @param opts element or selector to have the data object attached automatically; function if
             *              the developer intends to handle the data in a different way
             */
            _bam.view = function (viewName, data, opts) {
                var def = $.Deferred(function(){
                    var promise = this;
                    dst.render(viewName, data, function(e, r){
                        if(e){
                            promise.reject(e);
                        } else {
                            if (_.isString(opts) || _.isElement(opts)) { // assume its jquery selector or element
                                $(function(){
                                    $(opts).html(r).activate().data(viewName, data);
                                });
                            } else if (_.isFunction(opts)) { // assume its the complete handler
                                opts(r);
                            }
        
                            promise.resolve(r);
                        }
                    });
                });
        
                return def.promise();
            };
        
            _bam.promise = function(fn){
                var args = [].splice.call(arguments, 0);
                fn = args.splice(0, 1)[0];
                return $.Deferred(function(){
                    var prom = this;
                    fn(prom.resolve, prom.reject, args);
                }).promise();
            };
            /**
             * Alias for view
             * @type {Function}
             */
            _bam.render = _bam.view;
        
            _bam.construct = function(ctorName){
                if(_bam.ctor[ctorName]){
                    return new _bam.ctor[ctorName];
                }
                return false;
            };
        
            function getInvokeConfig(args, urlFormat, format) {
                var strings = [],
                    dataType = dataTypes[format] || "text",
                    url = _.format(urlFormat, format);
        
                for (var i = 0; i < args.length; i++) {
                    strings.push(JSON.stringify(args[i]));
                }
                var params = JSON.stringify(strings), /* stringifying twice */
                    data = JSON.stringify({ jsonParams: params });
        
                return {
                    url: url,
                    dataType: dataType,
                    data: data,
                    global: false,
                    crossDomain: crossDomain,
                    type: verb,
                    contentType: "application/json; charset=utf-8"
                };
            }
        
            function setViewName(config){
                if(_.isString(config.view)){
                    var vn = _.endsWith(config.url, "&") ? config.view: "&" + config.view;
                    config.url = config.url + vn;
                }
            }
        
            /**
             *  Invokes on className the specified method passing the
             *  specified args.
             *
             * @param className - the name of the class
             * @param method - the name of the method
             * @param args - an array of arguments
             * @param format - json or html: this parameter is assigned to the value of dataType of the config that gets passed to $.ajax
             * @param options - default configuration overrides
             * @returns jQuery promise
             */
            _bam.invoke = function (className, method, args, format, options) {
                if (!$.isArray(args)) {
                    var a = [];
                    a.push(args);
                    args = a;
                }
        
                var root = _bam.proxyRoot(_bam[className].proxyName),
                    urlFormat = root + className + "/" + method + ".{0}?nocache=" + _bam.randomString(4) + "&",
                    config = getInvokeConfig(args, urlFormat, format);
        
                $.extend(config, options);
        
                if(!crossDomain) {
                    setViewName(config);
                    return $.ajax(config);
                }else {
                    var url = _.format(urlFormat + "callback=?", "jsonp");
                    config.url = url;
                    setViewName(config);
        
                    return $.getJSON(url, { jsonParams: config.data });
                }
            };
        
            _bam.preventDefault = function(ev){
                if (ev.preventDefault) {
                    ev.preventDefault();
                }
                else {
                    ev.returnValue = false;
                }
            };
        
            _bam.withoutExtension = function(path){
                return path.replace(/\.[^/.]+$/, "");
            };
        
            _bam.tools = function(){
                return {
                    bam: _bam,
                    dao: _dao,
                    jQuery: $,
                    lodash: _,
                    forge: forge,
                    dust: dst,
                    window: window
                }
            }

            let cross = {                
            }
            _bam.deps = function(name, val){
                cross[name] = val;
                return cross[name];
            }

            _bam.activatePlugins = function () {
                $("[data-plugin]").dataSet().dataSetPlugins();
                $("body").dataSetEvents();
            };
        
            $.fn.activate = function(opts){
                return $(this).each(function(){
                    $(this).dataSet().dataSetPlugins().dataSetEvents();
                })
            };
        
            if(_ !== undefined && _.mixin !== undefined){
                _.mixin(_bam);
            }        
        
            return _bam;
    }
})()