/**
 * Replace BamTemplate with your custom class name
 * Replace bam-template with your custom element tag
 */
let BamElement = (function(){  
    let baseInstanceData = {
        bam: bam,
        undefined: {},
        shadowRoot: null,
        props: {},
        template: null
    },
    instanceData = {};

    function props(viewId, data){
        if(data){
            instanceData[viewId] = _.extend({}, baseInstanceData, data);
        }
        return instanceData[viewId];
    }

    class BamElement extends HTMLElement {
        constructor() {
            super(); // always call super() fist in the ctor.
            let data = {
                shadowRoot: this.attachShadow({mode: 'open'})
            }
            this.props = data;
            this.props.trace = console.log;
        }

        get props(){
            return props(this.Id);
        }
        set props(value){
            props(this.Id, value);
        }
                
        get Id(){
            let id = this.getAttribute("id");
            if(!id){
                this.setAttribute("id", bam.randomString(6));
                return this.Id;
            }
            return id;
        }

        trace(msg) {
            this.props.trace(msg);
        }
    }

    return BamElement;
})()

module.exports = BamElement;