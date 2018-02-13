/**
 * PageLoader.js
 */
module.exports = (function(){
    return function(options){
        let b = options.bam,
            _ = options.lodash,
            $ = options.jQuery,
            Page = require('../ctors/Page')({bam: b, jQuery: $, lodash: _});

        function act(ctrlr, actn, data, options) {
            var config = {
                url:  window.location.protocol + "//" + window.location.host + "/" + ctrlr + "/" + actn,
                dataType: "json",
                data: JSON.stringify(data),
                global: false,
                type: "POST",
                contentType: "application/json; charset=utf-8"
            };
    
            if (_.isFunction(options)) {
                config.success = options;
            } else {
                $.extend(config, options);
            }
    
            return $.ajax(config).promise();
        }

        let pageLoader = {
            loadPages: function(appName, startPageName){
                return act("meta", "pages", { bamAppName: appName }).done(function (result) {
                    if (!_.isNull(result)) {
                        var vals = result,
                            app = b.app(appName),
                            loader = new Promise((resolve, reject) => {
                                // instantiate all pages (not yet loaded)
                                _.each(vals, function (cp, i) {
                                    // create the page
                                    app.pages[cp] = new Page(cp, app);
                                    app.createPageTransition(cp + "To" + cp, cp, cp, app.defaultPageTransitionHandler);
                                    app.pageCreated(app.pages[cp]);
                                    _.each(_.rest(vals, i + 1), function (np) {
                                        var currentToNextName = cp + "To" + np,
                                            nextToCurrentName = np + "To" + cp;
                                        // create a transition to all the other pages
                                        app.createPageTransition(currentToNextName, cp, np, app.defaultPageTransitionHandler);
                                        // and back again
                                        app.createPageTransition(nextToCurrentName, np, cp, app.defaultPageTransitionHandler);
                                    });
                                });
                                resolve();
                            })
                            .then(function(){
                                app.createPageTransition(startPageName + "To" + startPageName, startPageName, startPageName, function(tx, data){
                                    var page = b.app(tx.appName).pages[tx.to];
                                    page.load().done(function(){
                                        page.hello();//page.loadStates(data).then((data) => page.hello(data));
                                    });
                                });
                                app.pageTransition(startPageName, startPageName).preLoadPages();
                            });                        
                    } else {
                        $(b.app(appName).contentSelector).text(result.Message);
                    }
                })
            }
        }
        return pageLoader;
    }
})()