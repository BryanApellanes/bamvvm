/**
 * bam-model.js
 */
let BamElement = require('./bam-element');
let BamModel = (function(){    
    let parseData = {
        json: (el) => JSON.parse(el.props.content),
        function: (el) => {
            return bam.getFunction(el.getAttribute("call"))(el);
        }
    }

    class BamModel extends BamElement {
        constructor() {
            super(); // always call super() fist in the ctor.            
            this.props.bam.model(this.id, this.data);
        }

        connectedCallback() {            
            
        }

        disconnectedCallback() {

        }

        attributeChangedCallback(attrName, oldVal, newVal) {

        }
      
        loadData(fn){
            return this.data.then(model=> fn({model: model}));
        }

        reloadData(fn){
            this.props.data = null;
            return loadData(fn);
        }

        /**
         * A promise that resolves to the raw javascript object data.
         */
        get data(){
            if(!this.props.data){
                this.props.data = new Promise((resolve, reject) => {                
                    if(!parseData[this.type]){
                        resolve({err: "Couldn't resolve model type"});
                    } else {
                        this.trace(`model: resolving model, Id=${this.Id}, model=${this.Id}`);
                        let data = parseData[this.type](this);
                        resolve(data);
                        this.dispatchEvent(new CustomEvent('modelResolved', {model: data}));
                    }
                })
            }
            return this.props.data;
        }

        get type(){
            return this.getAttribute("type") || "json";
        }
    }

    customElements.define('bam-model', BamModel);
    return BamModel;
})()

module.exports = BamModel;