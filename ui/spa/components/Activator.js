/**
 * Activator.js
 */
module.exports = (function(){
    return function(options){
        let _ = options.lodash,
            $ = options.jQuery,
            b = options.bam,
            ViewRenderer = require('../ctors/ViewRenderer')({jQuery: $, lodash: _}),
            viewRenderer = new ViewRenderer();

        let activator = {            
            activate: function(page, d) {
                var app = page.app;
                
                new Promise((resolve, reject) => {
                    viewRenderer.renderViews(document, page.appName);
                    resolve();
                }).then(()=>{
                    app.container().activate();
        
                    activator.activateNavigation(page.appName);
        
                    activator.activateBackButtons(page.appName);
        
                    activator.activateForwardButtons(page.appName);
        
                    activator.activateStateEvents(page.appName);
        
                    _.each(page.linkTags, function (v) { // populated by .load
                        $(v).remove();
                        $("head").append(v);
                    });
        
                    if (_.isFunction(app.pageActivationHandlers[page.name])) {
                        app.pageActivationHandlers[page.name](page, d);
                    } else if (_.isArray(app.pageActivationHandlers[page.name])) {
                        _.each(app.pageActivationHandlers[page.name], function(fn){
                            fn(page, d);
                        });
                    }
                    _.each(app.anyPageActivationHandlers, function (fn) {
                        fn(page, d);
                    });
        
                    activator.attachModels(page.appName);
                    page.isActivated = true;
                })
            },
            activateNavigation: function(appName){
                $("[data-navigate-to]", b.app(appName).container()).each(function (i, v) {
                    var tp = $(v).attr("data-navigate-to"),
                        navOn = $(v).attr("data-navigate-on") || "click",
                        data = $.dataSetOptions(v);
                    $(v).off(navOn).on(navOn, function (ev) {
                        b.app(appName).navigateTo(tp, data);
                        ev.preventDefault();
                    })
                });
            },
            activateBackButtons: function(appName){
                var $back = $("[data-navigate=back][data-app-name=" + appName + "]");
                $back.each(function (i, v) {
                    $(v).off("click").on("click", function (ev) {
                        b.app(appName).history.back();
                        activator.setNavigationState(appName);
                        ev.preventDefault();
                    })
                });
            },
            activateForwardButtons: function(appName){
                var $forward = $("[data-navigate=forward][data-app-name=" + appName + "]");
                $forward.each(function (i, v) {
                    $(v).off("click").on("click", function (ev) {
                        b.app(appName).history.forward();
                        activator.setNavigationState(appName);
                        ev.preventDefault();
                    })
                });
            },
            activateStateEvents: function(appName){
                var app = b.app(appName);
                $("[data-set-state]", app.container()).each(function (i, v) {
                    var s = $(v).attr("data-set-state"),
                        on = $(v).attr("data-set-state-on") || "click",
                        data = $.dataSetOptions(v);
                    $(v).off(on).on(on, function (ev) {
                        b.app(appName).goToState(s, data);
                        ev.preventDefault();
                    })
                });
            },
            setNavigationState: function(appName){
                var $back = $("[data-navigate=back][data-app=" + appName + "]"),
                    $forward = $("[data-navigate=forward][data-app=" + appName + "]");
                if (!b.app(appName).history.canForward()) {
                    $forward.addClass("disabled");
                } else {
                    $forward.removeClass("disabled");
                }
        
                if (!b.app(appName).history.canBack()) {
                    $back.addClass("disabled");
                } else {
                    $back.removeClass("disabled");
                }
            },
            attachModels: function(appName){
                var app = b.app(appName);
                $("[itemscope],[data-view-model]").each(function (i, scopeElement) {
                    var viewModelName = $(scopeElement).attr("data-view-model") || null;
                    if (!_.isNull(viewModelName)) {
                        var viewModel = app.viewModels[viewModelName],
                            viewModelCtor = _.getFunction(viewModelName);
                        if (_.isUndefined(viewModel) && _.isFunction(viewModelCtor)) {
                            viewModel = $(scopeElement).data("viewModel"); // check if it has been constructed by the render phase
                            if (!_.isObject(viewModel)) {
                                viewModel = new viewModelCtor(scopeElement, app);
                                $(scopeElement).data("viewModel", viewModel);
                            }
                        }
                        if (!_.isUndefined(viewModel)) {
                            if (viewModel.model) {
                                viewModel = viewModel.model;
                            }
                            if (_.isFunction(viewModel.init)) {
                                viewModel.init();
                            }
                            if (_.isFunction(viewModel.activate)) {
                                viewModel.activate(scopeElement);
                            }
                            if (!_.isUndefined($(scopeElement).attr("itemscope"))) {
                                _.setItem(scopeElement, viewModel);
                            }
                            app.setViewModel(viewModelName, viewModel);
                        }
                    }
                });
        
                if(_.isFunction(app.onModelsAttached)){
                    app.onModelsAttached();
                }
            }
        }

        return activator;
    }
})()