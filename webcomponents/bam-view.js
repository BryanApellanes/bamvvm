let BamElement = require("./bam-element");

let BamView = (function(){
    class BamView extends BamElement {        
        constructor() {
            super(); // always call super() fist in the ctor.
        }

        connectedCallback() {            
            this.resolveModel().then(model => {
                this.render(model);
            })
        }
    
        disconnectedCallback() {
    
        }
    
        attributeChangedCallback(attrName, oldVal, newVal) {
            //alert(`${attrName} changed:  old=${oldValue} new=${newVal}`);
        }

        render(model) { 
            let shadowRoot = this.props.shadowRoot;    
            let renderer = this.renderer;

            function _render(err, result) {
                if(err){
                    throw new Error("Failed to render template: " + err);
                }
                let tmp = document.createElement('template');
                tmp.innerHTML = result;
                shadowRoot.appendChild(tmp.content.cloneNode(true));
            }            
            
            if (model.err) {
                shadowRoot.innerHTML = `<h2>${model.err}</h2>`;
            } else {                
                if (this.view) {                              
                    renderer.render(this.view, model, _render);
                } else if (this.innerHTML && !this.props.template) {  
                    this.props.template = this.innerHTML;
                    renderer.renderSource(this.props.template, model, _render);
                } else if (this.props.template){
                    renderer.renderSource(this.props.template, model, _render);
                } else {
                    shadowRoot.innerHTML = "<h2>No template content or view attribute specified</h2>";
                }
            }
        }

        resolveModel(){
            return new Promise((resolve, reject) => {
                let modelName = this.getAttribute("model") || "default";
                //resolve();
                bam.model(modelName).then(model=> resolve(model));
            })            
        }
        
        get view(){    
            return this.getAttribute("view");
        }
        set view(vewName){
            this.setAttribute("view");
        }

        get name(){
            return this.props.bam.attributeOrRandom(this, "name");
        }

        get renderer(){
            let rendererName = this.getAttribute("renderer") || "dust",
                bam = this.props.bam;                
            
            return bam.renderer(rendererName) || dust;
        }
    }

    customElements.define('bam-view', BamView);  
    return BamView;
})()
