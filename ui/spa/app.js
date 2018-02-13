/* bam application */
(function ($, _, b, w) {
    "use strict";
    let TransitionHandler = require('./ctors/TransitionHandler'),
        Page = require('./ctors/Page')({bam: b, jQuery: $, lodash: _}),
        History = require('./ctors/History')({bam: b, jQuery: $, lodash: _, window: w}),
        ViewRenderer = require('./ctors/ViewRenderer')({jQuery: $, lodash: _}),
        viewRenderer = new ViewRenderer(),
        activator = require('./components/Activator')({jQuery: $, lodash: _, bam: b}),
        pageLoader = require('./components/PageLoader')({jQuery: $, lodash: _, bam: b});

    function run(startPageName) {
        if (_.isUndefined(startPageName)) {
            startPageName = "home";
        }
        return pageLoader.loadPages(this.name, startPageName);
    }

    function log(type, msgFormat, formatArgs){
        if(b.log){
            b.log[type](msgFormat, formatArgs);
        }else{
            if(console && console.log){
                console.log(_.format("{0}: {1}", type, _.format(msgFormat, formatArgs)));
            }
        }
    }
    
    var apps = {};

    var app = function (appName, renderInSelector) {
        if(_.isUndefined(apps[appName])){
            apps[appName] = {
                /** conf **/
                pages: {},
                currentPage: "start",
                previousPage: "start",
                pageTransitions: {},
                pageTransitionFilters: {},
                pageActivationHandlers: {},
                anyPageActivationHandlers: [],
                appData: {},
                viewModels: {},
                goodByeEffect: "fade",
                helloEffect: "fade",
                attachModels: function(){
                    attachModels(appName);
                },
                page: function(pageName){
                    if(_.isUndefined(pageName)){
                        pageName = this.currentPage;
                    }
                    return this.pages[pageName];
                },
                /**
                 * Set the data filter on the specified transition
                 * @param from
                 * @param to
                 * @param filter
                 */
                setPageTransitionFilter: function (from, to, filter) {
                    this.pageTransitionFilters.from = this.pageTransitionFilters.from || {};
                    this.pageTransitionFilters.from[from] = this.pageTransitionFilters.from[from] || {};
                    this.pageTransitionFilters.from[from].to = this.pageTransitionFilters.from[from].to || {};
                    this.pageTransitionFilters.from[from].to[to] = filter;

                    return this;
                },
                setPageTransition: function (f, t, th) {
                    this.pageTransitions.from = this.pageTransitions.from || {};
                    this.pageTransitions.from[f] = this.pageTransitions.from[f] || {};
                    this.pageTransitions.from[f].to = this.pageTransitions.from[f].to || {};
                    this.pageTransitions.from[f].to[t] = th;
                },
                createPageTransition: function (name, from, to, implFn) {
                    var th = new TransitionHandler(name, from, to, implFn);
                    th.appName = appName;
                    this.setPageTransition(from, to, th);
                    return th;
                },
                transitionToPage: function (to, data) {
                    this.pageTransition(this.currentPage, to, data);
                },
                pageTransition: function (from, to, data) {
                    if (_.isUndefined(to)) {
                        to = from;
                    }
                    data = data ||{};

                    try {
                        if (this.pageTransitionFilters.from[from].to[to]) {
                            var result = this.pageTransitionFilters.from[from].to[to](this.pageTransitions.from[from].to[to], data);
                            if (!_.isUndefined(result)) {
                                if (result == false) {
                                    return this;
                                }
                            }
                        }
                    } catch (e) {
                        // play the transition;
                    }

                    this.pageTransitions.from[from].to[to].play(data);
                    this.previousPage = from;
                    this.currentPage = to;
                    var p = this.pages[to];
                    p.app.history.add(p);
                    activator.setNavigationState(p.appName);
                    if(!_.isUndefined(data.targetState)){
                        this.goToState(data.targetState, data);
                    }

                    return this;
                },
                preLoadPages: function () {
                    var pages = this.pages,
                        app = this,
                        pageCount = 0,
                        loadedCount = 0;
                    _.each(pages, function(){
                        pageCount++;
                    });
                    _.each(pages, function (page, i) {
                        if (!page.loaded && _.isFunction(page.load)) {
                            app.pageLoading(page);
                            page.load().then(function(){
                                app.pageLoaded(page);
                                loadedCount++;
                                if(loadedCount === pageCount){
                                    app.pagesLoaded();
                                }
                            });
                        }
                    })
                },
                goToState: function (toState, data) {
                    if (toState === "" || _.isUndefined(toState)) {
                        toState = "initial";
                    }
                    this.pages[this.currentPage].transitionTo(toState, data);
                    return this;
                },
                navigateTo: function (pageName, data) {
                    this.transitionToPage(pageName, data);
                    return this;
                },
                pageActivated: function (pageName, handler) {
                    if (_.isFunction(pageName) && _.isUndefined(handler)) {
                        this.anyPageActivationHandlers.push(pageName); // its a function
                    }else if(_.isFunction(this.pageActivationHandlers[pageName])){
                        var tmp = [this.pageActivationHandlers[pageName]];
                        tmp.push(handler);
                        this.pageActivationHandlers[pageName] = tmp;
                    }else if(_.isArray(this.anyPageActivationHandlers[pageName])){
                        this.pageActivationHandlers[pageName].push(handler);
                    }else{
                        this.pageActivationHandlers[pageName] = handler;
                    }

                    return this;
                },
                anyPageActivated: function (handler) {
                    this.anyPageActivationHandlers.push(handler);
                    return this;
                },
                setViewModel: function (name, viewModel) {
                    this.viewModels[name] = viewModel;
                    return this;
                },
                defaultPageTransitionHandler: function (tx, data) {
                    var the = this,
                        app = b.app(tx.appName);
                    app.pages[tx.from].goodBye(function () {
                        app.pages[tx.to].hello(data);
                    });
                },
                defaultPageStateTransitionHandler: function (tx, data) {
                    var app = b.app(tx.appName),
                        p = app.pages[app.currentPage],
                        $content = $(app.contentSelector);
                    $("[data-state]", $content).hide(p.getStateGoodByeEffect(tx.from)).addClass("hidden");
                    $("[data-state=" + tx.to + "]", $content).removeClass("hidden").show(p.getStateHelloEffect(tx.to));
                },
                /** end conf **/
                name: appName,
                isApp: true,
                run: function(startPageName){
                    if (_.isUndefined(startPageName)) {
                        startPageName = "home";
                    }
                    return pageLoader.loadPages(this.name, startPageName);
                },
                pageCreated: function(page){}, // event handler
                pageLoading: function(page){}, // event handler
                pageLoaded: function(page){}, // event handler
                pagesLoaded: function(){},
                refresh: function(el){ 
                    var item = $(el).parentsUntil("[itemscope]").parent();
                    viewRenderer.renderViews(item, this.name);
                },
                renderViews: viewRenderer.renderViews,
                contentSelector: renderInSelector || "[data-app=" + appName + "]",
                container: function () {
                    return $(app(appName).contentSelector);
                },
                history: new History(appName).init(),
                writeTemplate: function (obj) {
                    return _.act("dust", "writeTemplate", { appName: b.app.name, json: JSON.stringify(obj) });
                },
                setGoodByeEffect: function (ef, sp) { // effect, (bool)setPages
                    if (!_.isUndefined(ef)) {
                        this.goodByeEffect = ef;
                        if (sp) {
                            _.each(this.pages, function (p) {
                                p.goodByeEffect = ef;
                                p.stateGoodByeEffect = ef;
                            })
                        }
                    }
                    return this.goodByeEffect;
                },
                setHelloEffect: function (ef, sp) {
                    if (!_.isUndefined(ef)) {
                        this.helloEffect = ef;
                        if (sp) {
                            _.each(this.pages, function (p) {
                                p.helloEffect = ef;
                                p.stateHelloEffect = ef;
                            })
                        }
                    }
                    return this.helloEffect;
                },
                log: {
                    info: function(msgFormat, formatArgs){
                        log("Info", msgFormat, formatArgs);
                    },
                    warning: function(msgFormat, formatArgs){
                        log("Warning", msgFormat, formatArgs);
                    },
                    error: function(msgFormat, formatArgs){
                        log("Error", msgFormat, formatArgs);
                    }
                }
            };
        }

        return apps[appName];
    };

    b.app = app;

    b.spin = function(el, opts){ // uses spin.js
        var config = $.extend({
            lines: 13, // The number of lines to draw
            length: 20, // The length of each line
            width: 10, // The line thickness
            radius: 30, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: '#000', // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: 'spinner', // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: '50%', // Top position relative to parent
            left: '50%' // Left position relative to parent
        }, opts || {});
        var spinner = new Spinner(config).spin(el);
        $(el).data('spinner', spinner);
        return spinner;
    };

    // b.activateApps = function () {
    //     $("[data-app]").each(function (i, o) {
    //         var appName = $(o).attr("data-app"),
    //             startPage = $(o).attr("data-start") || "home",
    //             app = b.app(appName);

    //         app.run(startPage);
    //     });
    // };

    // $(document).ready(function () {
    //     if (_ !== undefined && _.mixin !== undefined) {
    //         _.mixin(b);
    //     }

    //     b.activateApps();
    // });
    return app;
})(jQuery, _, bam, window || {});
/* end application*/
