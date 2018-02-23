/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamElement = require('./bam-element');
let BamModel = (function(){    
    let parseData = {
        json: (el) => JSON.parse(el.innerText),
        javascript: (el) => {
            return eval(el.innerText);
        },
        gloo: (el) => {

        }
    }

    class BamModel extends BamElement {
        constructor() {
            super(); // always call super() fist in the ctor.
        }

        connectedCallback() {
            this.props.bam.model(this.id, this.data);
        }

        disconnectedCallback() {

        }

        attributeChangedCallback(attrName, oldVal, newVal) {

        }

        get data(){
            return new Promise((resolve, reject) => {                
                if(!parseData[this.format]){
                    resolve({err: "Couldn't resolve format"});
                } else {
                    resolve(parseData[this.format](this));
                }
            })
        }

        get format(){
            return this.getAttribute("format") || "json";
        }
    }

    customElements.define('bam-model', BamModel);
    return BamModel;
})()

module.exports = BamModel;