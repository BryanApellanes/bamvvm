/* History.js
*/
module.exports = (function(){
    return function(options){
        let _ = options.lodash,
            b = options.bam,
            $ = options.jQuery,
            w = options.window,
            activator = require('../components/Activator')({jQuery: $, lodash: _, bam: b});

        return function History(appName){
            var previous = -1,
                current = -1,
                next = -1,
                pageStack = [],
                the = this;

            this.appName = appName;

            this.init = function () {
                $(w).on("popstate", function (e) {
                    var p = b.app(the.appName).pages[e.originalEvent.state];
                    if (!_.isNull(p) && !_.isUndefined(p)) {
                        p.navigatingHistory = true; // prevents the addition of a new entry into the history stack
                        b.app(the.appName).transitionToPage(e.originalEvent.state, p.stateData);
                    }
                });
                return this;
            };

            this.add = function (page) {
                if (page.navigatingHistory) {
                    delete page.navigatingHistory;
                } else {
                    previous = current;
                    ++current;
                    next = current + 1;
                    pageStack.push(page);

                    // enables the browser back button to navigate back and forth in the app
                    // works with popstate listener in the init method above
                    w.history.pushState(page.name, page.name, "#" + page.name);
                }
            };

            this.back = function () {
                if (the.canBack()) {
                    current = previous;
                    previous = previous - 1;
                    next = current + 1;
                    var page = pageStack[current];
                    page.navigatingHistory = true;
                    page.app.transitionToPage(page.name, page.stateData);
                    activator.setNavigationState(page.name);
                }
            };

            this.forward = function () {
                if (the.canForward()) {
                    previous = current;
                    current = next;
                    next = current + 1;
                    var page = pageStack[current];
                    page.navigatingHistory = true;
                    page.app.transitionToPage(page.name, page.stateData);
                    activator.setNavigationState(page.name);
                }
            };

            this.canBack = function () {
                return previous >= 0;
            };

            this.canForward = function () {
                return next > 0 && next < pageStack.length;
            };
        }
    }
})()