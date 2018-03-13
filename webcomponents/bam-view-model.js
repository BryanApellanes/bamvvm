/**
 * bam-view-model.js
 */
let BamElement = require('./bam-element');
let sdo = require('../data/sdo');

let BamViewModel = (function(){  
    class BamViewModel extends BamElement {
        constructor() {
            super(); // always call super() fist in the ctor.
            this.view.on('rendered', (e) => {
                this.trace(`viewModel.Id=${this.Id}: handling the rendered event from ${e.detail.view.Id}`);
                this.observe(e.detail.model);
                this.attach();
            });
        }

        connectedCallback() {
            this.trace('bam-view-model connected');
        }

        disconnectedCallback() {

        }

        attributeChangedCallback(attrName, oldVal, newVal) {

        }
        
        attach(){
            this.view.setAttribute('itemscope', 'itemscope');
            this.trace("attaching: " + this.Id);
            let viewModel = this.viewModel;
            sdo.setItem(this.view, _.extend({}, this.observable, viewModel));
        }

        get viewModelName(){
            return this.getAttribute("viewModel");
        }
        get viewModel(){
            return this.bam.getFunction(this.viewModelName);
        }

        get viewName(){
            return this.getAttribute("view");
        }

        get view(){
            let viewName = this.viewName;
            if(viewName){
                return this.props.bam.element(viewName);
            }
            return null;
        }

        get data(){
            let model = this.model;
            if(model){
                return model.data;
            }
            return Promise.resolve({model: {}});
        }

        get observable(){
            return this.props.observable;
        }
        set observable(model){
            this.props.observable = _.observe(model);
        }

        observe(model){
            this.observable = model;
        }
    }

    customElements.define('bam-view-model', BamViewModel);
    return BamViewModel;
})()

module.exports = BamViewModel;