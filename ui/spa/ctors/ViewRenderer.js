/** ViewRenderer.js 
 * 
*/
module.exports = (function(){
    "use strict"
    
    return function(options){
        let _ = options.lodash,
            $ = options.jQuery;

        function format() {
            var s = arguments[0];
            for (var i = 0; i < arguments.length - 1; i++) {
                var reg = new RegExp("\\{" + i + "\\}", "gm");
                s = s.replace(reg, arguments[i + 1]);
            }
    
            return s;
        }            

        function ViewRenderer(){} // ctor

        ViewRenderer.prototype.renderViews = function (container, appName) {
            container = container || document;

            function render(attr, isAppView) {
                var selector = format("[{0}]", attr);
                $(selector, container).each(function (i, v) {

                    var attrValue = $(v).attr(attr),
                        viewName = isAppView ? format("{0}.{1}", appName, attrValue) : attrValue,
                        viewModelName = $(v).attr("data-view-model"),
                        app = b.app(appName),
                        viewModel = app.viewModels[viewModelName],
                        ds = $(v).attr("data-source") || viewModelName,
                        viewData = viewModel != null && viewModel.view != null ? viewModel.view : null,
                        viewModelCtor = _.getFunction(viewModelName);

                    if (_.isNull(viewData)) {
                        viewData = _.isFunction(models) ? models().getModel(ds) : undefined;
                        if (_.isFunction(viewData)) {
                            viewData = viewData(viewName);
                        }
                    }

                    if ((_.isNull(viewData) || _.isUndefined(viewData)) && _.isFunction(viewModelCtor)) {
                        viewData = new viewModelCtor(v, app);
                        $(v).data("viewModel", viewData);
                        if (viewData.view) {
                            viewData = viewData.view;
                        }
                    }

                    if (!_.isUndefined(viewData) && !_.isNull(viewData) && _.isFunction(viewData.init)) {
                        var prom = viewData.init();
                        if (!_.isObject(prom) || !_.isFunction(prom.then)) {
                            throw new Error("init must return a promise");
                        }
                        prom.then(function () {
                            b.app(appName).view(viewName, viewData || {}, v).then(function(){
                                b.app(appName).attachModels();
                            });
                        })
                    } else {
                        b.app(appName).view(viewName, viewData || {}, v).then(function(){
                            b.app(appName).attachModels();
                        });
                    }
                });
            }

            render("data-app-view", true);
            render("data-view", false);
        }
            
        return ViewRenderer;
    }      
})()