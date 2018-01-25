/**
 *
 * @param projection
 * @constructor
 */
function JurassicGmlFormatter(projection) {
    this.proj = projection;
    this.doc = null;
    this.splitor = ' ';
    this.schema={
        rootName:'FeatureCollection',
        spatialReferenceName:'CRS',
        featureName:'GF',
        featureTitleName:'Title',
        featurePropertySetName:'PropertySets',
        featureGeometryName:'Shapes',
        featureGeometryCoorName:'posList'
    };
    this.namespaceURI = '';
    this.crs='';
    this.JsonFeatures ={};
}
JurassicGmlFormatter.prototype.toGeoJSON = function (xmlDoc) {
    this.doc = xmlDoc;
    this.parseJurassicGml();
};
JurassicGmlFormatter.prototype.parseJurassicGml = function(){
    var fts = this.JsonFeatures,
        rootName = this.schema.rootName,
        root = this.doc.documentElement;
    if(root&&root.localName == rootName) {
        fts.type = rootName;
        fts.features = [];
        this.namespaceURI = this.parseNamespaceURI(root);
        this.crs = this.parseCRS(root);
        fts.features = this.parseFeatures(root);
    }else{
        /*等了解了公司全部的gml格式后再添加*/
    }
    return features;
};
JurassicGmlFormatter.prototype.parseNamespaceURI = function (root) {
    return root&&root.namespaceURI;
};
JurassicGmlFormatter.prototype.parseCRS = function (root) {
    var crsName = this.schema.spatialReferenceName,
        crs = root.getElementsByTagName(crsName);
    return crs[0]?crs[0].textContent:'';
};
JurassicGmlFormatter.prototype.parseFeatures = function (root){
    var ft,
        ftName = this.schema.featureName,
        fts = [];
    for(var n = root.firstElementChild;n;n= n.nextElementSibling){
        if(n.localName = ftName){
            ft = this.formatFeature(n);
            fts.push(ft);
        }
    }
    return fts;
};
JurassicGmlFormatter.prototype.formatFeature = function (feature){
    var ft = {
            id:'',
            type:'Feature',
            properties: {},
            geometry:{}
        },
        properties = this.parseFeatureProperties(feature),
        geometry = this.parseFeatureGeometry(feature);
    ft.id = properties.id;
    ft.properties = properties;
    ft.geometry = geometry;
    return ft;
};
JurassicGmlFormatter.prototype.parseFeatureProperties = function (feature) {
    var ps = {},
        basePs = this.parseFeatureBaseProperties(feature),
        title = this.parseFeatureTitle(feature),
        propertySet = this.parseFeaturePropertySet(feature);
    ps = this.extend(ps,basePs);
    ps.title = title;
    ps.pss = propertySet;
    return ps;
};
JurassicGmlFormatter.prototype.parseFeatureBaseProperties = function (feature) {
    return this.formatElementAttributes(feature);
};
JurassicGmlFormatter.prototype.parseFeatureTitle = function (feature) {
    var titleName = this.schema.featureTitleName,
        title = feature.getElementsByTagName(titleName);
    return title[0] ? title[0].textContent : '';
};
JurassicGmlFormatter.prototype.parseFeaturePropertySet = function (feature) {
    var propertySet = {},
        propertySetName = this.schema.featurePropertySetName,
        properties = feature.getElementsByTagName(propertySetName);
    if (properties[0]) {
        propertySet = this.formatElementAttributes(properties);
    }
    return propertySet;
};
JurassicGmlFormatter.prototype.formatElementAttributes = function (element, obj) {
    obj = obj || {};
    var attrArray = element.attributes;
    var attr;
    for (var i = 0, ii = attrArray.length; i < ii; i++) {
        attr = attrArray[i];
        obj[attr.nodeName] = attr.nodeValue;
    }
    return obj;
};
JurassicGmlFormatter.prototype.extend = function (desObj, srcObj){
    for (var attr in srcObj){
        if (srcObj.hasOwnProperty(attr))
            desObj[attr] = srcObj[attr];
    }
    return desObj;
};
JurassicGmlFormatter.prototype.parseFeatureGeometry = function (feature) {
    var geometryName = this.schema.featureGeometryName,
        geometryCoorName = this.schema.featureGeometryCoorName,
        shapes = feature.getElementsByTagName(geometryName),
        geometry ={
            type:'',
            coordinates:[]
        },
        shape,
        geometryType,
        geometryCoor;
    if(shapes[0]){
        shapes = shapes[0];
        shape = shapes.firstElementChild;
        geometryType = shape.firstElementChild.localName;
        geometryCoor = this.parseCoor(shape);
        geometry.type = geometryType;
        geometry.coordinates = this.formatGeometryCoor(geometryType,geometryCoor);
    }
    return geometry;
};
JurassicGmlFormatter.prototype.parseCoor = function(shape){
    var coorName = this.schema.featureGeometryCoorName,
        coor = shape.getElementsByTagName(coorName),
        pts;
    if(coor[0]){
        coor = coor[0];
        pts = coor.textContent;
        pts = this.formatCoor(pts);
    }
    return pts;
};
JurassicGmlFormatter.prototype.formatCoor = function(pts){
    var splitor = this.splitor,
        ptArray = pts.split(splitor),
        lng,
        lat,
        coor,
        coorArray=[];
    for(var i= 0,ii=ptArray.length;i<ii;i=i+2){
        lat = parseFloat(ptArray[i]);
        lng = parseFloat(ptArray(i+1));
        coor = this.proj.toEPSG3857([lng,lat]);
        coorArray.push(coor);
    }
    return coorArray;
};
JurassicGmlFormatter.prototype.formatGeometryCoor = function(geometryType,coor){
    var type = geometryType.trim().toLocaleLowerCase(),
        formatCoor;
    switch (type){
        case 'point':
            formatCoor = coor[0];
            break;
        case 'line':
            formatCoor = coor;
            break;
        case 'polygon':
            formatCoor = [coor];
            break;
    }
    return formatCoor;
};






