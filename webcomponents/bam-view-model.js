/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamViewModel = (function(){  
    class BamViewModel extends BamElement {
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

    customElements.define('bam-view-model', BamViewModel);
    return BamViewModel;
})()

module.exports = BamViewModel;