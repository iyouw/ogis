
function JurassicGmlResolver(xmlParser,jurassicGmlFormatter){
    this.xmlParser = xmlParser;
    this.gmlFormatter = jurassicGmlFormatter;
}
JurassicGmlResolver.prototype.resolve = function(xmlstr){
    var doc = this.xmlParser.parseXmlFromString(xmlstr);
    var featureArray = this.gmlFormatter.toGeoJSON(doc);
    return featureArray;
};
