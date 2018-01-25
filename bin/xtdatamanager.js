
function XtDataManager(config) {
    this.config = config;
    this.controlLayerDic = null;
    this.filterDic = null;
    this.boTreeArgDic = null;
    this.boTreeArg = null;
};
XtDataManager.prototype.getConfig = function () {
    return this.config;
}
XtDataManager.prototype.getDefaultBo = function () {
    return this.config.DefaultBO;
}
XtDataManager.prototype.getControlLayerDic = function () {
    var layerDic = this.controlLayerDic;
    if (!layerDic) {
        this.controlLayerDic = layerDic = this.resolveControlLayerDic();
    }
    return layerDic;
};
XtDataManager.prototype.resolveControlLayerDic = function () {
    var baseLayers = this.config.BOTLayers,
        layerDic = {},
        layer,
        formatLayer,
        newLayer;
    var keyName = 'type';
    var isControlLayer = function (layer, targetPropertyName) {
        var filterArray = [""];
        var targetPropertyName = targetPropertyName || 'LayerName';
        var is = false,
            filter;
        for (var i = 0, ii = filterArray.length; i < ii; i++) {
            filter = filterArray[i];
            if (layer[targetPropertyName] != filter) {
                is = true;
                break;
            }
        }
        return is;
    }
    for (var i = 0, ii = baseLayers.length; i < ii; i++) {
        layer = baseLayers[i];
        if (isControlLayer(layer)) {
            formatLayer = this.formatControlLayer(layer);
            layerDic[formatLayer[keyName]] = formatLayer;
        }
    }
    return layerDic;
};
XtDataManager.prototype.getControlLayers = function () {
    var controlLayerDic = this.getControlLayerDic();
    var layers = [],
        layer;
    for (var key in controlLayerDic) {
        if (controlLayerDic.hasOwnProperty(key)) {
            layer = controlLayerDic[key];
            layers.push(layer);
        }
    }
    return layers;
};
XtDataManager.prototype.formatControlLayer = function (layer) {
    var formatLayer = {};
    formatLayer.name = layer.LayerName;
    formatLayer.type = layer.BOT;
    formatLayer.isVisible = layer.DefaultLayer;
    formatLayer.isFrozen = false;
    return formatLayer;
};
XtDataManager.prototype.getQueryFilterDic = function () {
    var dic = this.filterDic;
    if (!dic) {
        this.filterDic = dic = this.resolveQueryFilterDic();
    }
    return dic;
};
XtDataManager.prototype.resolveQueryFilterDic = function () {
    var rawData = this.config.PropertyData,
        filterDic = {},
        filter,
        formatFilter;
    keyName = 'type';
    for (var i = 0, ii = rawData.length; i < ii; i++) {
        filter = rawData[i];
        formatFilter = this.formatFilter(filter);
        filterDic[formatFilter[keyName]] = formatFilter;
    }
    return filterDic;
};
XtDataManager.prototype.formatFilter = function (filter) {
    var fields = filter.DefaultProperty,
        formatFields = [],
        field,
        formatField,
        formatFilter;
    for (var i = 0, ii = fields.length; i < ii; i++) {
        field = fields[i];
        formatField = this.formatField(field,filter);
        formatField && formatFields.push(formatField);
    }
    formatFilter = this.buildFormatFilter(filter, formatFields);
    return formatFilter;
};
XtDataManager.prototype.buildFormatFilter = function (filter, formatFields) {
    var formatFilter = {};
    formatFilter.type = filter.BOT;
    formatFilter.domain = filter.AppDomain;
    formatFilter.filter = formatFields.length > 0 ? { $and: formatFields} : null;
    return formatFilter;
};
XtDataManager.prototype.formatField = function (field, filter) {
    var domain = filter.AppDomain,
        formatField;
    var isCondition = function (fieldValue) {
        var is = true,
            filters = ['', 'all'],
            filter;
        for (var i = 0, ii = filters.length; i < ii; i++) {
            filter = filters[i];
            fieldValue = fieldValue.trim().toLowerCase();
            if (filter == fieldValue) {
                is = false;
                break;
            }
        }
        return is;
    }
    if (isCondition(field.defaultValue)) {
        formatField = this.buildFormatField(field, domain);
    }
    return formatField;
};
XtDataManager.prototype.buildFormatField = function (field, domain) {
    var formatField = {};
    var key = domain + '.' + field.name;
    var value = { $eq: field.defaultValue };
    formatField[key] = value;
    return formatField;
};
XtDataManager.prototype.getQueryFilters = function () {
    var filterDic = this.getQueryFilterDic(),
        filters,
        filter;
    for (var key in filterDic) {
        if (filterDic.hasOwnProperty(key)) {
            filter = filterDic[key];
            filters.push(filter);
        }
    }
    return filter;
};
XtDataManager.prototype.getBoTreeQueryArgs = function () {
    var argDic = this.getBoTreeQueryArgsDic();
    var structQueryArg = this.constructBoTreeQueryArgs(argDic);
    return structQueryArg;
};
XtDataManager.prototype.constructBoTreeQueryArgs = function (argDic) {
    var downToUp = ['井', '圈闭', '二级单元', '一级单元', '盆地'],
        root = ['盆地', '地震工区', '矿区'],
        tree = [],
        nodeName,
        parentName,
        parent,
        node;
    var copy = this.clone(this.getBoTreeQueryArgsDic());
    for (var i = 0, ii = downToUp.length - 1; i < ii; i++){
        nodeName = downToUp[i];
        parentName = downToUp[i + 1];
        node = copy[nodeName];
        parent = copy[parentName];
        parent.children.push(node);
    }
    for (i = 0, ii = root.length; i < ii; i++) {
        nodeName = root[i];
        node = copy[nodeName];
        tree.push(node);
    }
    return tree;
};
XtDataManager.prototype.getBoTreeQueryArgsDic = function () {
    var dic = this.boTreeArgDic;
    if (!dic) {
        this.boTreeArgDic = dic = this.resolveBoTreeQueryArgsDic();
    }
    return dic;
}
XtDataManager.prototype.resolveBoTreeQueryArgsDic = function () {
    var botBosArray = this.config.BOTBosArray,
        treeArgDic = {},
        botBos,
        treeArg;
    for (var i = 0, ii = botBosArray.length; i < ii; i++) {
        botBos = botBosArray[i];
        treeArg = this.resolveTreeArg(botBos);
        treeArgDic[treeArg.bot] = treeArg;
    }
    treeArg = this.buildTreeArg('圈闭');
    treeArg.relation = 'F';
    treeArgDic[treeArg.bot] = treeArg;
    treeArg = this.buildTreeArg('井');
    treeArg.relation = 'F';
    treeArgDic[treeArg.bot] = treeArg;
    return treeArgDic;
};
XtDataManager.prototype.resolveTreeArg = function (botBos) {
    var treeArg = this.buildTreeArg();
    treeArg.bot = botBos.BOT;
    treeArg.bos = botBos.BOs;
    treeArg.filter = botBos.Filter;
    treeArg.relation = 'F';
    return treeArg;
};
XtDataManager.prototype.buildTreeArg = function (name) {
    return {
        bot: name ||'',
        bos: null,
        filter: null,
        relation: '',
        children: []
    }
};
XtDataManager.prototype.clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};