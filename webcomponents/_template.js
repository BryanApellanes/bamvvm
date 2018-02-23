/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamTemplate = (function(){  
    class BamTemplate extends BamElement {
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

    customElements.define('bam-template', BamTemplate);
    return BamTemplate;
})()

module.exports = BamTemplate;