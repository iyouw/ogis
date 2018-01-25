
function XmlParser(){
    this.dom=null;
}
XmlParser.prototype.parseXmlFromString = function(xmlstr){
    var dom = this.dom;
    try {
        if (window.DOMParser) {
            dom = (new DOMParser()).parseFromString(xmlstr, "text/xml");
        }else{
            if (window.ActiveXObject){
                dom = new ActiveXObject('Microsoft.XMLDOM');
                dom.async = false;
                if (!dom.loadXML(xmlstr))
                    throw new Error('xmlΩ‚Œˆ ß∞‹');
            }
        }
    }catch(ex){
        console&&console.log(ex);
    }
    return dom;
};

