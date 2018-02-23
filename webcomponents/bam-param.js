/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamParam = (function(){  
    class BamParam extends BamElement {
        constructor() {
            super(); // always call super() fist in the ctor.
        }

        connectedCallback() {

        }

        disconnectedCallback() {

        }

        attributeChangedCallback(attrName, oldVal, newVal) {

        }

    }

    customElements.define('bam-param', BamParam);
    return BamParam;
})()

module.exports = BamParam;