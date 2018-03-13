/**
 * bam-element.js
 */
let BamElement = (function(bam){  
    let baseProps = {
        bam: bam,
        shadowRoot: null,
        template: null
    },
    instanceProps = {},
    instanceEventHandlers = {};

    function props(elementId, data){
        if(data){
            instanceProps[elementId] = _.extend({}, baseProps, data);
        }
        return instanceProps[elementId];
    }

    class BamElement extends HTMLElement {
        constructor() {
            super(); // always call super() fist in the ctor.
            let data = {
                shadowRoot: this.attachShadow({mode: 'open'})
            }
            this.props = data;
            this.props.trace = console.log;
            this.props.bam.element(this.Id, this);
            this.props.content = this.innerHTML;
        }

        get bam(){
            return this.props.bam;
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

        trigger(eventName, data){
            this.dispatchEvent(new CustomEvent(eventName, {detail: data}));
        }

        on(eventName, fn){
            this.addEventListener(eventName, fn);
        }

        trace(msg) {
            this.props.trace(msg);
        }
    }

    return BamElement;
})(bam)

module.exports = BamElement;