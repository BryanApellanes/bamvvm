/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamElement = require('./bam-element');
let BamModel = (function(){    
    let parseData = {
        json: (el) => JSON.parse(el.props.content),
        javascript: (el) => {
            return eval(el.innerText);
        }
    }

    class BamModel extends BamElement {
        constructor() {
            super(); // always call super() fist in the ctor.
            this.props.content = this.innerHTML;
            this.props.bam.model(this.id, this.data);
        }

        connectedCallback() {            
            
        }

        disconnectedCallback() {

        }

        attributeChangedCallback(attrName, oldVal, newVal) {

        }

        get data(){
            return new Promise((resolve, reject) => {                
                if(!parseData[this.type]){
                    resolve({err: "Couldn't resolve model type"});
                } else {
                    resolve(parseData[this.type](this));
                }
            })
        }

        get type(){
            return this.getAttribute("type") || "json";
        }
    }

    customElements.define('bam-model', BamModel);
    return BamModel;
})()

module.exports = BamModel;