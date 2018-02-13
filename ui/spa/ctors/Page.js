/** Page.js
 * @constructor
 * @param n
 * @param app
 */

module.exports = (function(){
    return function(options){
        let b = options.bam,
            $ = options.jQuery,
            _ = options.lodash,
            TransitionHandler = require('./TransitionHandler'),
            ViewRenderer = require('./ViewRenderer')({jQuery: $, lodash: _}),
            activator = require('../components/Activator')({jQuery: $, lodash: _, bam: b}),
            randomString = require('../../../random-string'),
            viewRenderer = new ViewRenderer();            

        return function Page(n, app) {
            var the = this;
        
            this.name = n;
            this.currentState = "initial";
            this.previousState = the.currentState;
            this.states = [];
            this.stateTransitions = {};
            this.stateTransitionFilters = {};
            this.uiState = null;
            this.goodByeEffect = app.goodByeEffect;
            this.helloEffect = app.helloEffect;
            this.stateGoodByeEffects = {};
            this.stateHelloEffects = {};
            this.stateGoodByeEffect = app.goodByeEffect;
            this.stateHelloEffect = app.helloEffect;
            this.contentSelector = app.contentSelector;
            this.title = null;
            this.content = null;
            this.loaded = false;
            this.isActivated = false; // set by b.activate, determines if plugins have been activated and activation handlers called
            this.appName = app.name;
            this.linkTags = [];
            this.app = app;
        
            function detachStyleSheetLinks(){
                _.each(the.linkTags, function(link){
                    $(link).detach();
                });
            }
        
            function attachStyleSheetLinks(){
                _.each(the.linkTags, function(link){
                    $("head").append(link);
                });
            }
            /**
             * data set by transitionTo (which is called by b.setState) to
             * allow data passing from state to state
             * @type {{}}
             */
            this.stateData = {};
        
            this.load = function () {
                return $.ajax({
                    url: window.location.protocol + "//" + window.location.host + "/" + the.name + ".html?nocache=" + randomString(4),
                    dataType: "html",
                    success: function (html) {
                        var p = document.createElement("iframe");
                        $(p).append(html);
                        the.title = $("title", p).text().trim();
                        $("title", p).remove();
                        $("link", p).each(function (i, v) {
                            the.linkTags.push(v);
                        });
                        the.content = $(p);
                        the.loaded = true;
                    }
                }).promise();
            };
        
            this.hello = function (d, noEffect) { // data, play effect
                var _hello = function (_d) {
                    var $container = $(the.contentSelector);
                    document.title = the.title;
        
                    if (the.uiState != null && the.isActivated) {
                        $container.replaceWith(the.uiState);
                        if(noEffect){
                            $container.show();
                        }else{
                            $container.show(the.helloEffect);
                        }
                        attachStyleSheetLinks();
                        the.activate(_d);
                    } else {
                        if(noEffect){
                            $container.empty().append(the.content.html()).show();
                            attachStyleSheetLinks();
                            the.loadStates(_d);
                        }else{
                            $container.empty();
                            $container.hide().append(the.content.html());
                            $container.show({
                                effect: the.helloEffect,
                                complete: function () {
                                    attachStyleSheetLinks();
                                    the.loadStates(_d);
                                }
                            });
                        }
                    }
                };
        
                if (the.loaded) {
                    _hello(d);
                } else {
                    the.load()
                        .done(function () {
                            _hello(d);
                        });
                }
            };
        
            /**
             * Play the hide effect and call the specified complete handler.
             * This method is called by the default TransitionHandler and
             * should be called by custom implementations (of the TransitionHandler)
             * if a hide effect is not provided.
             * @param complete function
             */
            this.goodBye = function (complete, noEffect) {
                if (_.isUndefined(complete)) {
                    complete = function () { };
                }
                var $container = $(the.contentSelector);
                if (the.isActivated) {
                    var uiClone = $container.clone();
        
                    the.uiState = $container.detachAndReplaceWith(uiClone);
                    detachStyleSheetLinks();
                }
                if(noEffect){
                    $container.hide();
                    complete();
                }else{
                    $(the.contentSelector).show().hide({
                        effect: the.goodByeEffect,
                        complete: complete
                    });
                }
            };
        
            /**
             * Load all states in the current page and prepare transitions between
             * each
             */
            this.loadStates = function (data) {
                return new Promise((resolve, reject) => {                
                    var app = the.app;
                    the.states = ["initial"];
                    $("[data-state]", $(the.contentSelector)).each(function (i, v) {
                        var state = $(v).hide().attr("data-state");
                        if (!_.contains(the.states, state)) {
                            the.states.push(state);
                        }
                    });
        
                    // create a state transition between all states including state to self
                    _.each(the.states, function (state, index) { 
                        the.setStateTransition(state, state, app.defaultPageStateTransitionHandler);
                        _.each(_.rest(the.states, index + 1), function (nextState) { 
                            the.setStateTransition(state, nextState, app.defaultPageStateTransitionHandler);
                            the.setStateTransition(nextState, state, app.defaultPageStateTransitionHandler);
                        })
                    });
        
                    var effect = the.getStateHelloEffect("initial");
                    $("[data-state=initial]", app.container()).show(effect);
                    the.activate(data)
                        .then((data) => resolve(data))
                        .catch((ex) => reject(ex));
                })
            };
        
            this.activate = function (data) {
                let the = this;
                return new Promise((resolve, reject) => {
                    try {                                 
                        activator.activate(the, data);
                        resolve({page: the, data: data});
                    } catch(ex){
                        reject(ex);
                    }
                })
            };
        
            /**
             * Set the name of the effect to use when the specified state
             * goes goodBye (is hidden/transitions away).
             * @param state
             * @param e
             */
            this.setStateGoodByeEffect = function (state, e) {
                the.stateGoodByeEffects[state] = e;
            };
        
            this.getStateGoodByeEffect = function (state) {
                return the.stateGoodByeEffects[state] || the.stateGoodByeEffect;
            };
        
            /**
             * Set the name of the effect to use when the specified state
             * says hello (is shown/transitions to).
             * @param state
             * @param e
             */
            this.setStateHelloEffect = function (state, e) {
                the.stateHelloEffects[state] = e;
            };
        
            this.getStateHelloEffect = function (state) {
                return the.stateHelloEffects[state] || the.stateHelloEffect;
            };
        
            this.setStateTransition = function (f, t, impl) {
                the.stateTransitions.from = the.stateTransitions.from || {};
                the.stateTransitions.from[f] = the.stateTransitions.from[f] || {};
                the.stateTransitions.from[f].to = the.stateTransitions.from[f].to || {};
                the.stateTransitions.from[f].to[t] = the.stateTransitions.from[f].to[t] || {};
                var th = new TransitionHandler(f + "To" + t, f, t, impl);
                th.appName = the.appName;
                the.stateTransitions.from[f].to[t] = th;
            };
        
            /**
             * Set a filter to be run when transitioning from the specified
             * state f to the specified state t.  Can be used to stop the transition
             * or direct to a different state by analyzing the current page state. If
             * the function signature used is (string, function) the filter will be
             * added for "any" state to the specified state.
             * @param f
             * @param t
             * @param filter
             */
            this.setStateTransitionFilter = function (f, t, filter) {
                if (_.isUndefined(filter) && _.isFunction(t) && _.isString(f)) {
                    // f = "to"
                    // t = filter function
                    _.each(the.states, function (st, i) {
                        the.setStateTransitionFilter(st, f, t);
                    });
                } else {
                    the.stateTransitionFilters.from = the.stateTransitionFilters.from || {};
                    the.stateTransitionFilters.from[f] = the.stateTransitionFilters.from[f] || {};
                    the.stateTransitionFilters.from[f].to = the.stateTransitionFilters.from[f].to || {};
                    the.stateTransitionFilters.from[f].to[t] = the.stateTransitionFilters.from[f].to[t] || {};
                    the.stateTransitionFilters.from[f].to[t] = filter;
                }
            };
        
            this.transitionTo = function (ts, data) {
                if (_.isUndefined(data)) {
                    data = the.stateData;
                }
                if (the.stateTransitions.from &&
                    the.stateTransitions.from[the.currentState] &&
                    the.stateTransitions.from[the.currentState].to &&
                    the.stateTransitions.from[the.currentState].to[ts]) {
                    try {
                        if (_.isFunction(the.stateTransitionFilters.from[the.currentState].to[ts])) {
                            var result = the.stateTransitionFilters.from[the.currentState].to[ts](the.stateTransitions.from[the.currentState].to[ts], data);
                            if (!_.isUndefined(result)) {
                                if (result == false) {
                                    return;
                                } else if (_.isString(result) && !_.isUndefined(the.stateTransitions.from[the.currentState].to[result])) {
                                    ts = result;
                                }
                            }
                        }
                    } catch (e) {
                        // play the transition
                    }
                    the.stateTransitions.from[the.currentState].to[ts].play(data);
                    the.stateData = data;
                    the.setState(ts);
                }
            };
        
            this.setState = function (s) {
                the.previousState = the.currentState;
                the.currentState = s;
            }
        }    
    }
})() 

 