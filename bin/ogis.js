// closure
(function($,ol,proj4) {
    // jrsc namespace
    window.jrsc = {};
    jrsc.getCurrentPath = function () {
        var path = $('script:last').attr('src');
        path = path.substr(0, path.lastIndexOf('/') + 1);
        return path;
    };
    jrsc.path = jrsc.getCurrentPath();
    // math namespace
    jrsc.math = {};
    jrsc.math.isNumber = function (variable) {
        var isNum = parseFloat(variable);
        if (isNum.toString() == 'NaN') {
            isNum = false;
        } else {
            isNum = true;
        }
        return isNum;
    };
    //coordinate namespace
    jrsc.coordinate = {};
    jrsc.coordinate.toEPSG3857 = function (coordinate) {
        return proj4('EPSG:3857', coordinate);
    };
    jrsc.coordinate.parseFromNum = function (num1, num2, proj) {
        var coor = null,
            isNum = jrsc.math.isNumber;
        if (num1 && num2 && isNum(num1) && isNum(num2)) {
            coor = [num1, num2];
            if (proj && typeof proj == 'function')
                coor = proj(coor);
        }
        return coor;
    };
    jrsc.coordinate.parseFromArray = function (array, proj, isLatFirst) {
        var coors = [],
            len = array.length,
            coor,
            lng,
            lat;
        isLatFirst = isLatFirst || true;
        for (var i = 0; i < len; i = i + 2) {
            lng = isLatFirst ? array[i + 1] : array[i];
            lat = isLatFirst ? array[i] : array[i + 1];
            coor = jrsc.coordinate.parseFromNum(lng, lat, proj);
            coor && coors.push(coor);
        }
        return coors;
    };
    jrsc.coordinate.parseFromStringArray = function (strArray, proj) {
        var coors = [],
            len = strArray.length,
            str,
            num;
        for (var i = 0; i < len; i++) {
            str = strArray[i];
            num = parseFloat(str);
            coors.push(num);
        }
        coors = jrsc.coordinate.parseFromArray(coors, proj);
        return coors;
    };
    jrsc.coordinate.parseFromString = function (str, proj, spliter) {
        var coors,
            strArray;
        spliter = spliter || /\s+/g;
        strArray = str.split(spliter);
        coors = jrsc.coordinate.parseFromStringArray(strArray, proj);
        return coors;
    };
    //xml namespace
    jrsc.xml = {};
    jrsc.xml.parseFromString = function (xmlstr) {
        var dom = this.dom;
        try {
            if (window.DOMParser) {
                dom = (new DOMParser()).parseFromString(xmlstr, "text/xml");
            } else {
                if (window.ActiveXObject) {
                    dom = new ActiveXObject('Microsoft.XMLDOM');
                    dom.async = false;
                    if (!dom.loadXML(xmlstr))
                        throw new Error('xml解析失败');
                }
            }
        } catch (ex) {
            console && console.log(ex);
        }
        return dom;
    };
    jrsc.xml.cloneAttributes = function (element, obj) {
        var attrs = element.attributes,
            attr;
        if(attrs.length>0) {
            obj = obj || {};
            for (var i = 0, ii = attrs.length; i < ii; i++) {

                attr = attrs[i];
                obj[attr.nodeName] = attr.nodeValue;
            }
        }
        return obj;
    };
    // geometry namespace
    jrsc.geom = {};
    jrsc.geom.type = ['Point','MultiPoint','LineString','LinearRing','MultiLineString','Polygon','MultiPolygon','GeometryCollection'];
    jrsc.geom.typeDic = {
        Point:'Point',
        MultiPoint:'MultiPoint',
        LineString:'LineString',
        LinearRing:'LinearRing',
        MultiLineString:'MultiLineString',
        Polygon:'Polygon',
        MultiPolygon:'MultiPolygon',
        GeometryCollection:'GeometryCollection'
    };
    jrsc.geom.isGeometryType = function(type){
        var is = false;
        if(type&&typeof type == 'string'){
            is = jrsc.geom.typeDic[type]?true:false;
        }
        return is;
    };
    jrsc.geom.isBaseGeometryType = function(type){

    };
    jrsc.geom.isGeometryTypeCommon = function(type,filter){

    };
    jrsc.geom.buildGeometry = function(type,coordinates){
        var geometry,
            isGeometryType = jrsc.geom.isGeometryType(type),
            isCoordinates = Array.isArray(coordinates);
        if(isGeometryType&&isCoordinates){
            geometry = jrsc.geom.buildGeometryCommon(type,coordinates);
        }
        return geometry;
    };
    jrsc.geom.buildGeometryCommon = function(type,coordinates){
        var geometry = {};
        geometry.type = type;
        geometry.coordinates = coordinates;
        return geometry;
    };
    // gml namespace
    jrsc.gml = {};
    jrsc.gml.buildGeometry = function (type, coordinates) {
        var geometry;
        if(type&&typeof(type) == 'string'&&coordinates && Array.isArray(coordinates)){
            geometry.type = type;
            geometry.coordinates = coordinates;
        }
        return geometry;
    };
    jrsc.gml.buildFeatureOfGeoJSON = function(geometry,properties){
        var feature;
        if(geometry&&geometry.type&&(geometry.coordinates||geometry.geometries)){
            feature = {};
            feature.type = 'Feature';
            feature.geometry = geometry;
            feature.properties = properties;
            if(properties&&properties.id){
                feature.id = properties.id;
            }
        }
        return feature;
    };
    jrsc.gml.getParser = function (type) {
        var parser;
        type = type.trim();
        switch (type) {
            case 'Point':
                parser = jrsc.gml.parsePoint;
                break;
            case 'MultiPoint':
                parser = jrsc.gml.parseMultiPoint;
                break;
            case 'LineString':
                parser = jrsc.gml.parseLineString;
                break;
            case 'LinearRing':
                parser = jrsc.gml.parseLineRing;
                break;
            case 'MultiLinearString':
                parser = jrsc.gml.parseMultiLineString;
                break;
            case 'Polygon':
                parser = jrsc.gml.parsePolygon;
                break;
            case 'MultiPolygon':
                parser = jrsc.gml.parsePolygon;
                break;
        }
        return parser;
    };
    jrsc.gml.parseFrame = function (element) {
        var geometry = null,
            type = element.localName,
            collection = element.firstElementChild,
            parser = null,
            item;
        if (collection) {
            for (var n = collection.firstElementChild; n; n = n.nextElementSibling) {
                if (!parser)
                    parser = jrsc.gml.getParser(n.localName);
                item = parser && parser(n);
                if (item) {
                    if (!geometry)
                        geometry = jrsc.geom.buildGeometry(type, []);
                    geometry.coordinates.push(item.coordinates);
                }
            }
        }
        return geometry;
    };
    jrsc.gml.parsePoint = function (element) {
        var geometry = null,
            type = element.localName,
            coors = element.firstElementChild.textContent;
        coors = jrsc.coordinate.parseFromString(coors, jrsc.coordinate.toEPSG3857);
        if (coors.length == 1)
            geometry = jrsc.geom.buildGeometry(type, coors[0]);
        return geometry;
    };
    jrsc.gml.parseMultiPoint = function (element) {
        return jrsc.gml.parseFrame(element);
    };
    jrsc.gml.parseLineString = function (element) {
        var geometry = null,
            type = element.localName,
            coors = element.firstElementChild.textContent;
        coors = jrsc.coordinate.parseFromString(coors, jrsc.coordinate.toEPSG3857);
        if (coors.length > 1)
            geometry = jrsc.geom.buildGeometry(type, coors);
        return geometry;
    };
    jrsc.gml.parseLineRing = function (element) {
        var geometry = null,
            type = element.localName,
            coors = element.firstElementChild.textContent;
        coors = jrsc.coordinate.parseFromString(coors, jrsc.coordinate.toEPSG3857);
        var coorStart = coors[0],
            coorEnd = coors[coors.length - 1];
        if (coors.length > 4 && coorStart[0] == coorEnd[0] && coorStart[1] == coorEnd[1])
            geometry = jrsc.geom.buildGeometry(type, coors);
        return geometry;
    };
    jrsc.gml.parseMultiLineString = function (element) {
        return jrsc.gml.parseFrame(element);
    };
    jrsc.gml.parsePolygon = function (element) {
        return jrsc.gml.parseFrame(element);
    };
    jrsc.gml.parseMultiPolygon = function (element) {
        var geometry = jrsc.gml.parseFrame(element);
        geometry.type = 'MultiPolygon';
        return geometry;
    };
    jrsc.gml.parseGeometry = function (element) {
        var geomNode = element.firstElementChild,
            type = geomNode.localName,
            parser;
        if (type == 'MultiSurface')
            type = 'MultiPolygon';
        parser = jrsc.gml.getParser(type)
        return parser && parser(geomNode);
    };
    jrsc.gml.parseGeometryCollection = function (element) {
        var geometries = [],
            geometry;
        for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
            geometry = jrsc.gml.parseGeometry(n);
            geometry && geometries.push(geometry);
        }
        if (geometries.length == 1) {
            geometries = geometries[0];
        } else if (geometries.length > 1) {
            geometries = {type: 'GeometryCollection', geometries: geometries};
        } else {
            geometries = null;
        }
        return geometries;
    };
    jrsc.gml.parseFeatureToGeoJSON = function (element) {
        var feature,
            properties,
            title,
            geometry,
            localName;
        properties = jrsc.xml.cloneAttributes(element, properties);
        for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
            localName = n.localName;
            if (localName == 'Title') {
                title= n.textContent;
            } else if (localName == 'PropertySets') {
                properties = jrsc.xml.cloneAttributes(n, properties);
            } else {
                geometry = jrsc.gml.parseGeometryCollection(n);
            }
        }
        if(properties)
            properties.title = title;
        if(geometry)
            feature = jrsc.gml.buildFeatureOfGeoJSON(geometry,properties);
        return feature;
    };
    jrsc.gml.parseDocToGeoJSON = function (doc) {
        var features = [],
            feature,
            root;
        root = doc.documentElement;
        if (root.localName = 'FeatureCollection') {
            for (var n = root.firstElementChild; n; n = n.nextElementSibling) {
                if (n.localName == 'GF') {
                    feature = jrsc.gml.parseFeatureToGeoJSON(n);
                    feature && features.push(feature);
                }
            }
        }
        if(features.length >0){
            features = {
                type:'FeatureCollection',
                features:features
            }
        }
        return features;
    };
    // ogis namespace
    var OGIS_DEFAULT_OPTIONS = {
        _Ogis_Group_Layer_Controller: {
            button: {id: 'ogis_group_button_layer_controller', img: 'groupbtn.png', text: '图层管理'},
            drop: {id: 'ogis_group_drop_layer_controller', html: ''}
        }
    };
    jrsc.Ogis = Ogis;
    jrsc.Ogis.CONFIG = OGIS_DEFAULT_OPTIONS;
    function Ogis(element, options) {
        this.element$ = $(element);
        this.options = $.extend({}, OGIS_DEFAULT_OPTIONS, options);
        this.mapModel = {
            baseLayerUrl: '',
            extent: null,
            map: null
        };
        this.menuModel = {
            dic: {
                menu: {},
                menuItem: {},
                binding: {}
            },
            data: {
                menus: []
            }
        };
        this.groupModel = {
            dic: {
                btn: {},
                drop: {},
                binding: {}
            },
            data: {
                btns: [],
                drops: []
            }
        };
        this.layerModel = {
            dic: {
                layer: {},
                frozenLayer: {}
            },
            data: {},
            currentLayer: null,
            controlPanelId: ''
        };
        this.featureModel = {
            dic: {
                selected: {},
                olFeature:{}
            },
            data: {
                selected: []
            }
        };
        this.domDic = {};
        this.basePath = jrsc.path;
        this.suffix = this.getSuffix();
        this.init();
    };
    //init
    Ogis.prototype.init = function () {
        this.initModel();
        this.render();
        this.initMap();
        this.registerEvent();
    };
    //init model
    Ogis.prototype.initModel = function () {
        this.initMapModel();
        this.initMenuModel();
        this.initGroupModel();
        this.initLayerModel();
    };
    Ogis.prototype.initMapModel = function () {
        var opt = this.options.map;
        var model = this.mapModel;
        if (opt) {
            if (opt.baseLayerUrl)
                model.baseLayerUrl = opt.baseLayerUrl;
            if (opt.extent)
                model.extent = opt.extent;
        }
    };
    // init menuModel
    Ogis.prototype.initMenuModel = function () {
        var opt = this.options.contextMenu;
        var model = this.menuModel;
        if (opt) {
            if (opt.menus) {
                model.data.menus = opt.menus;
            }
            if (opt.binding)
                model.dic.binding = opt.binding;
            this.createIndexer(model.dic.menu, model.data.menus);
            this.resolveMenuItemDic(model.dic.menuItem, model.data.menus);
        }
    };
    Ogis.prototype.resolveMenuItemDic = function (dic, menus) {
        var menu;
        for (var i = 0, ii = menus.length; i < ii; i++) {
            menu = menus[i];
            if (menu.menuItems) {
                this.createIndexer(dic, menu.menuItems);
            }
        }
        return dic;
    };
    //init groupButtonModel
    Ogis.prototype.initGroupModel = function () {
        var opt = this.options.group;
        var model = this.groupModel;
        if (opt) {
            if (opt.buttons)
                model.data.btns = opt.buttons;
            if (opt.drops)
                model.data.drops = opt.drops;
            if (opt.binding)
                model.dic.binding = opt.binding;
            this.addLayerController(model);
            this.createIndexer(model.dic.btn, opt.buttons);
            this.createIndexer(model.dic.btn, model.data.btns);
            this.createIndexer(model.dic.drop, model.data.drops);
        }
    };
    Ogis.prototype.initLayerModel = function () {
        var model = this.layerModel;
        var layerController = this.options._Ogis_Group_Layer_Controller;
        model.controlPanelId = layerController.panelId;
    };
    Ogis.prototype.addLayerController = function (model) {
        var layerController = this.options._Ogis_Group_Layer_Controller;
        var button = layerController.button;
        button.img = this.basePath + 'theme/' + button.img;
        var drop = layerController.drop;
        drop.html = this.buildGroupDropLayerControllerPanelHtml(layerController.panelId);
        model.data.btns.push(button);
        model.data.drops.push(drop);
        model.dic.binding[button.id] = drop.id;
    };
    //render
    Ogis.prototype.render = function () {
        var ogis = this.buildHtml();
        this.element$.html(ogis);
    };
    Ogis.prototype.buildHtml = function () {
        var frame = '<div class ="ogis" id="' + this.addSuffix('ogis') + '" >';
        frame += '<div class="ogis-map" id="' + this.addSuffix('ogis_map') + '"></div>';
        frame += this.buildVerticalOverlayHtml();
        frame += this.buildHorizontalOverlayHtml();
        frame += '</div>';
        return frame;
    };
    Ogis.prototype.buildVerticalOverlayHtml = function () {
        var overlay = '<div class="ogis-vertical-overlay" id="' + this.addSuffix('ogis_vertical_overlay') + '">';
        overlay += this.buildBaseOverlayHtml();
        overlay += this.buildContextMenuOverlayHtml();
        overlay += '</div>';
        return overlay;
    };
    Ogis.prototype.buildHorizontalOverlayHtml = function () {
        return this.buildOverlayHtml('horizontal');
    };
    Ogis.prototype.buildOverlayHtml = function (orientation) {
        var overlay = '<div class="ogis-' + orientation + '-overlay" id="' + this.addSuffix('ogis_' + orientation + '_overlay') + '"></div>';
        return overlay;
    };
    Ogis.prototype.buildBaseOverlayHtml = function () {
        var overlay = '<div class="ogis-overlay-layer" id="' + this.addSuffix('ogis_overlay_base') + '">';
        overlay += this.buildSearchComponentHtml();
        overlay += this.buildGroupComponentHtml();
        overlay += '</div>';
        return overlay;
    };
    Ogis.prototype.buildContextMenuOverlayHtml = function () {
        var html = '<div class="ogis-overlay-layer" id="' + this.addSuffix('ogis_overlay_context_menu') + '">';
        html += this.buildContextMenusHtml();
        html += '</div>';
        return html;
    };
    Ogis.prototype.buildSearchComponentHtml = function () {
        var component = '<div class="ogis-search" id="' + this.addSuffix('ogis_search') + '">';
        component += '<div class="ogis-search-display" id="' + this.addSuffix('ogis_search_display') + '">';
        component += '<div class="ogis-search-display-interact" id="' + this.addSuffix('ogis_search_display-interact') + '">';
        component += '<input type="text" placeholder="搜目标 搜矿区 搜井位" class="ogis-search-display-interact-input" id="' + this.addSuffix('ogis_search_display_interact_input') + '"/>';
        component += '</div>';
        component += '<div class="ogis-search-drops" id="' + this.addSuffix('ogis_search_drops') + '"></div>';
        component += '</div>';
        component += '<button type="button" class="ogis-search-button" id="' + this.addSuffix('ogis_search_button') + '">搜索</button>';
        component += '</div>';
        return component;
    };
    // group
    Ogis.prototype.buildGroupComponentHtml = function () {
        var component = '<div class="ogis-group" id="' + this.addSuffix('ogis_group') + '">';
        component += this.buildGroupButtonsHtml();
        component += this.buildGroupDropsHtml();
        component += '</div>';
        return component;
    };
    // group buttons
    Ogis.prototype.buildGroupButtonsHtml = function () {
        var group = '<ul class="ogis-group-buttons" id="' + this.addSuffix('gis_group_buttons') + '">';
        group += this.resolveGroupButtons();
        group += '</ul>';
        return group;
    };
    Ogis.prototype.resolveGroupButtons = function () {
        var html = '',
            buttonArray = this.groupModel.data.btns,
            button;
        if (buttonArray) {
            for (var i = 0, ii = buttonArray.length; i < ii; i++) {
                button = buttonArray[i];
                html += this.buildGroupButtonHtml(button);
                if (i < ii - 1)
                    html += this.buildGroupSplitBar();
            }
        }
        return html;
    };
    Ogis.prototype.buildGroupButtonHtml = function (button) {
        var html = '<li class="ogis-group-button" id="' + this.addSuffix(button.id) + '">';
        html += '<img style="border:none" src="' + button.img + '"/>';
        html += '<span>' + button.text + '</span>';
        html += '</li>';
        return html;
    };
    Ogis.prototype.buildGroupSplitBar = function () {
        return '<li class="ogis-group-split-bar"></li>';
    };
    //group drops
    Ogis.prototype.buildGroupDropsHtml = function () {
        var drops = '<div class="ogis-group-drops" id="' + this.addSuffix('ogis_group_drops') + '">';
        drops += this.resolveGroupDrop();
        drops += '</div>';
        return drops;
    };
    Ogis.prototype.resolveGroupDrop = function () {
        var html = '',
            dropArray = this.groupModel.data.drops,
            drop;
        if (dropArray) {
            for (var i = 0, ii = dropArray.length; i < ii; i++) {
                drop = dropArray[i];
                html += this.buildGroupDropHtml(drop);
            }
        }
        return html;
    };
    Ogis.prototype.buildGroupDropHtml = function (drop) {
        var html = '<div class="ogis-group-drop" id="' + this.addSuffix(drop.id) + '">';
        html += '<div class="ogis-group-drop-header">';
        html += '<button class="ogis-group-drop-closer">X</button>';
        html += '</div>';
        html += '<div class ="ogis-group-drop-content">';
        html += drop.html;
        html += '</div>';
        html += '</div>';
        return html;
    };
    Ogis.prototype.buildGroupDropLayerControllerPanelHtml = function (panelId) {
        return '<ul class="ogis_group_drop_layer_controller_panel" id="' + this.addSuffix(panelId) + '"></ul>';
    };
    // context menu
    Ogis.prototype.buildContextMenusHtml = function () {
        var html = '';
        html += this.resolveContextMenus();
        return html;
    };
    Ogis.prototype.resolveContextMenus = function () {
        var html = '',
            menuArray = this.menuModel.data.menus,
            menu;
        for (var i = 0, ii = menuArray.length; i < ii; i++) {
            menu = menuArray[i];
            html += this.buildContextMenuHtml(menu);
        }
        return html;
    };
    Ogis.prototype.buildContextMenuHtml = function (menu) {
        var html = '<ul class="ogis-context-menu" id="' + this.addSuffix(menu.id) + '">';
        html += this.resolveMenuItems(menu.menuItems);
        html += '</ul>';
        return html;
    };
    Ogis.prototype.resolveMenuItems = function (menuItems) {
        var html = '',
            menuItem;
        for (var i = 0, ii = menuItems.length; i < ii; i++) {
            menuItem = menuItems[i];
            html += this.buildMenuItemHtml(menuItem);
        }
        ;
        return html;
    };
    Ogis.prototype.buildMenuItemHtml = function (menuItem) {
        var img = menuItem.img || '';
        var html = '<li class="ogis-context-menu-item" id="' + this.addSuffix(menuItem.id) + '">';
        html += '<img src="' + img + '" />';
        html += '<span>' + menuItem.text + '</span>';
        return html;
    };
    //layer
    Ogis.prototype.addVecLayer = function (id,name, isVisible, isFrozen) {
        var layer = this.addLayerToMap(id,name,isVisible, isFrozen);
        this.addLayerToModel(layer);
        this.addLayerToControlPanel(id,name,isVisible, isFrozen);
    };
    Ogis.prototype.addLayerToMap = function (id,name,isVisible, isFrozen) {
        var map = this.mapModel.map,
            layer = this.buildVecLayer(id,name,isVisible, isFrozen);
        map.addLayer(layer);
        return layer;
    };
    Ogis.prototype.addLayerToModel = function (layer) {
        var model = this.layerModel.dic,
            id = layer.get('id'),
            isFrozen = layer.get('isFrozen');
        model.layer[id] = layer;
        if (isFrozen) {
            model.frozenLayer[id] = layer;
        } else {
            delete model.frozenLayer[id];
        }
    };
    Ogis.prototype.addLayerToControlPanel = function (id,name ,isVisible, isFrozen) {
        var layer = this.buildLayerControllerPanelItemHtml(id,name, isVisible, isFrozen),
            panelId = this.layerModel.controlPanelId,
            panel$ = this.getDom$(panelId);
        panel$.append(layer);
    };
    Ogis.prototype.buildLayerControllerPanelItemHtml = function (id,name, isVisible, isFrozen) {
        var visible = isVisible ? 'ogis-map-layer-visible-yes' : 'ogis-map-layer-visible-no',
            frozen = isFrozen ? 'ogis-map-layer-frozen-yes' : 'ogis-map-layer-frozen-no';
        var html = '<li class="ogis-map-layer-list-item" id="' + this.addSuffix(id) + '">';
        html += '<div class="ogis-left-panel">';
        html += '<span>' + name + '</span>';
        html += '</div>';
        html += '<div class="ogis-right-panel">';
        html += '<button class="ogis-map-layer-list-item-control ogis-map-layer-visual ' + visible + '"></button>';
        html += '<button class="ogis-map-layer-list-item-control ogis-map-layer-frozen ' + frozen + '"></button>';
        html += '<button class="ogis-map-layer-list-item-control ogis-map-layer-filter"></button>';
        html += '</div>';
        html += '</li>';
        return html;
    };
    Ogis.prototype.buildVecLayer = function (id,name, isVisible, isFrozen) {
        var layer = new ol.layer.Vector(),
            style = Ogis.getStyleFunction();
        layer.setStyle(style);
        if (id)
            layer.set('id', id);
        if(name)
            layer.set('name',name);
        if (isVisible)
            layer.setVisible(isVisible);
        if (isFrozen)
            layer.set('isFrozen', isFrozen);
        return layer;
    };
    Ogis.prototype.changeLayerVisibleOnClick = function (ev) {
        var target$ = this.getEventTarget(ev);
        this.changeLayerVisibleByTarget(target$);
    };
    Ogis.prototype.changeLayerVisibleByTarget = function (target$) {
        var layerId = target$.closest('.ogis-map-layer-list-item').attr('id');
        var isVisible = this.changeLayerControlPanelVisibleState(target$);
        this.changeMapLayerVisibleById(layerId, isVisible);
    };
    Ogis.prototype.changeMapLayerVisibleById = function (layerId, isVisible) {
        var model = this.layerModel.dic.layer,
            layerId = this.toRawId(layerId),
            layer = model[layerId];
        if (layer) {
            layer.setVisible(isVisible);
        }
    };
    Ogis.prototype.changeLayerControlPanelVisibleState = function (target$) {
        var yes = 'ogis-map-layer-visible-yes',
            no = 'ogis-map-layer-visible-no';
        return this.changeStateByClass(target$, yes, no);
    };
    Ogis.prototype.changeStateByClass = function (target$, yesClass, noClass) {
        var is = false;
        if (target$.hasClass(yesClass)) {
            target$.removeClass(yesClass);
            target$.addClass(noClass);
        } else {
            target$.removeClass(noClass);
            target$.addClass(yesClass);
            is = true;
        }
        return is;
    };
    Ogis.prototype.changeLayerFrozenOnClick = function (ev) {
        var target$ = this.getEventTarget(ev);
        this.changeLayerFrozenByTarget(target$);
    };
    Ogis.prototype.changeLayerFrozenByTarget = function (target$) {
        var layerId = target$.closest('ogis-map-layer-list-item').attr('id');
        var isVisible = this.changeLayerControlPanelFrozenState(target$);
        this.changeMapLayerFrozenById(layerId, isVisible);
    };
    Ogis.prototype.changeLayerControlPanelFrozenState = function (target$) {
        var yes = 'ogis-map-layer-frozen-yes',
            no = 'ogis-map-layer-frozen-no';
        return this.changeStateByClass(target$, yes, no);
    };
    Ogis.prototype.changeMapLayerFrozenById = function (layerId, isVisible) {
        var model = this.layerModel.dic;
        layer = model.layer[layerId];
        if (layer) {
            layer.set('isVisible', isVisible);
            if (isVisible) {
                model.frozenLayer[layerId] = layer;
            } else {
                delete model.frozenLayer[layerId];
            }
        }
    };
    Ogis.prototype.triggerFilterClickOnClick = function (ev) {
    };
    Ogis.prototype.setLayerSource = function (url, sendData) {
    };
    Ogis.prototype.buildSourceLoader = function (url, sendData, dataHandler) {
        var self = this;
        return function (extent, resoluation, projection) {
            $.ajax({
                url: url,
                contentType: 'application/json',
                data: JSON.stringify(sendData),
                success: function (res) {

                },
                error: self.log
            })
        }
    };
    Ogis.prototype.addFeaturesToLayer = function (layerId, features) {
        var layer = this.layerModel.dic.layer[layerId];
        var source = layer.getSource();
        if (!source) {
            source = new ol.source.Vector();
            layer.setSource(source);
        }
        features = this.buildFeaturesFromGeoJSON(features);
        source.addFeatures(features);
    };
    Ogis.prototype.buildFeaturesFromGeoJSON = function(featureGeoJSON){
        var olFeatures = [],
            olFeature,
            type = featureGeoJSON.type,
            features = featureGeoJSON.features;
        if(type && type == 'FeatureCollection'&&features&&Array.isArray(features)){
            for(var i= 0,ii=features.length;i<ii;i++){
                olFeature = features[i];
                olFeature = this.buildFeatureFromGeoJSON(olFeature);
                olFeature&&olFeatures.push(olFeature);
            }
        }
        return olFeatures;
    };
    Ogis.prototype.buildFeatureFromGeoJSON = function(feature){
        var olFeature,
            labelPoint,
            geometry = feature.geometry,
            olGeometryBuilder = this.getGeometryBuilder(geometry.type);
        if(geometry.type == 'GeometryCollection'){
            geometry = new olGeometryBuilder(geometry.geometries);
        }else{
            geometry = new olGeometryBuilder(geometry.coordinates);
        }
        if(geometry){
            labelPoint = geometry.getExtent();
            labelPoint = ol.extent.getCenter(labelPoint);
            olFeature = new ol.Feature({
                geometry:geometry,
                labelPoint:new ol.geom.Point(labelPoint),
                name:feature.properties.title
            });
            olFeature.setProperties(feature.properties);
        };
        return  olFeature;
    };
    Ogis.prototype.buildFeatures = function (rawFeature) {
        var features = [],
            feature;
        for (var i = 0, ii = rawFeature.length; i < ii; i++) {
            feature = rawFeature[i];
            feature = this.buildFeature(feature);
            feature && features.push(feature);
        }
        return features;
    };
    Ogis.prototype.buildFeature = function (feature) {
        var geometry = feature.geometry,
            olGeometry,
            labelGeometry,
            olFeature,
            builder;
        if (geometry) {
            olGeometry = this.buildOlGeomery(geometry);
            labelGeometry = new ol.geom.Point(olGeometry.getCenter);
            olFeature = new ol.Feature({
                geometry: olGeometry,
                labelPoint: labelGeometry,
                name: feature.title
            });
        }
        return olFeature;
    };
    Ogis.prototype.getGeometryBuilder = function (type) {
        var builder;
        type = type.trim();
        switch (type) {
            case 'Point':
                builder = ol.geom.Point;
                break;
            case 'MultiPoint':
                builder = ol.geom.MultiPoint;
                break;
            case 'LineString':
                builder = ol.geom.LineString;
                break;
            case 'LinearRing':
                builder = ol.geom.LineRing;
                break;
            case 'MultiLinearString':
                builder = ol.geom.MultiLineString;
                break;
            case 'Polygon':
                builder = ol.geom.Polygon;
                break;
            case 'MultiPolygon':
                builder = ol.geom.Polygon;
                break;
            case 'GeometryCollection':
                builder = ol.geom.GeometryCollection;
                break;
        }
        return builder;
    };
    Ogis.prototype.addFeaturesToLayerByRemote = function(layerId,url,sendData){
        var self = this;
        $.ajax({
            url:url,
            type:'POST',
            data:JSON.stringify(sendData),
            contentType:'application/json',
            success:function(res){
                var doc = jrsc.xml.parseFromString(res);
                var features = jrsc.gml.parseDocToGeoJSON(doc);
                self.addFeaturesToLayer(layerId,features);
            },
            error:self.log
        })
    };
    Ogis.prototype.addVecLayerByRemote = function(id,name, isVisible, isFrozen,url,arg){
        this.addVecLayer(id,name,isVisible,isFrozen);
        this.addFeaturesToLayerByRemote(id,url,arg);
    };
    //map
    Ogis.prototype.initMap = function () {
        var model = this.mapModel;
        var baseLayer = this.initMapBaseLayer();
        var view = new ol.View();
        var target = this.addSuffix('ogis_map');
        var map = new ol.Map({
            target: target,
            controls: [],
            layers: [baseLayer],
            view: view
        });
        view.fit(model.extent, map.getSize());
        model.map = map;
    };
    Ogis.prototype.initMapBaseLayer = function () {
        var url = this.mapModel.baseLayerUrl;
        var layer = new ol.layer.Tile();
        var source = new ol.source.XYZ({
            url: url
        });
        layer.setSource(source);
        return layer;
    };
    Ogis.prototype.initFeatureOverlay = function(map){

    };
    //registerEvent
    Ogis.prototype.registerEvent = function () {
        this.registerGroupEvent();
        this.registerContextMenuEvent();
        this.registerLayerControlPanelEvent();
    };
    Ogis.prototype.registerGroupEvent = function () {
        var self = this;
        $(document).on('click', '.ogis-group-button', function (ev) {
            self.showGroupDropOnClick(ev);
        }).on('click', '.ogis-group-drop-closer', function (ev) {
            self.shutGroupDropOnClick(ev);
        });
    };
    Ogis.prototype.registerContextMenuEvent = function () {
        var self = this;
        var viewport = this.mapModel.map.getViewport();
        $(viewport).on('contextmenu', function (ev) {
            ev.preventDefault();
            self.showContextMenuOnClick(ev);
        }).on('click', function (ev) {
            self.hideContextMenu();
        });
        $(document).on('click', '.ogis-context-menu-item', function (ev) {
            self.invokeContextMenuItemOnClick(ev);
            self.hideContextMenu();
        });
    };
    Ogis.prototype.registerLayerControlPanelEvent = function () {
        var self = this;
        $(document).on('click', '.ogis-map-layer-visual', function (ev) {
            self.changeLayerVisibleOnClick(ev);
        }).on('click', '.ogis-map-layer-frozen', function (ev) {
            self.changeLayerFrozenOnClick(ev);
        }).on('click', '.ogis-map-layer-filter', function (ev) {
            self.triggerFilterClickOnClick(ev);
        })
    };

    Ogis.prototype.showGroupDropOnClick = function (ev) {
        var targetId = this.getEventTarget(ev).attr('id');
        this.showGroupDropByButtonId(targetId);
    };
    Ogis.prototype.showGroupDropByButtonId = function (id) {
        id = this.toRawId(id);
        var dropId = this.groupModel.dic.binding[id];
        var drop$ = this.getDom$(dropId);
        $('.ogis-group-drop').not(drop$).hide();
        drop$.slideToggle();
    };
    Ogis.prototype.shutGroupDropOnClick = function (ev) {
        this.getEventTarget(ev).closest('.ogis-group-drop').fadeOut();
    };

    Ogis.prototype.showContextMenuOnClick = function (ev) {
        var map = this.mapModel.map;
        var pos = map.getEventPixel(ev);
        var coor = map.getEventCoordinate(ev);
        var feature = this.findFeatureAtCoordinate(coor);
        this.showContextMenuByFeature(feature, pos);
        this.selectFeature(feature);
    };
    Ogis.prototype.findFeatureAtCoordinate = function (coor){

    };
    Ogis.prototype.showContextMenuByFeature = function (feature, pos) {
        var type = feature.getProperties();
        type = type.type;
        var menuId = this.menuModel.dic.binding[type];
        if (menuId) {
            this.showContextMenuById(menuId, pos);
        }
    };
    Ogis.prototype.showContextMenuById = function (menuId, pos) {
        var menu$ = this.getDom$(menuId);
        var startX = pos[0];
        var startY = pos[1];
        if (startX && startY) {
            this.showDom$(menu$, startX, startY);
        }
    };
    Ogis.prototype.selectFeature = function (feature) {

    };
    Ogis.prototype.invokeContextMenuItemOnClick = function (ev) {
        var id = this.getEventTarget(ev).attr('id');
        this.invokeContextMenuItemById(id);
    };
    Ogis.prototype.invokeContextMenuItemById = function (id) {
        var menuModel = this.menuModel;
        id = self.toRawId(id);
        var menuItem = menuModel.dic.menuItem[id];
        menuItem && menuItem.click && typeof menuItem.click == 'function' && menuItem.click({});
    };
    Ogis.prototype.hideContextMenu = function () {
        $('.ogis-context-menu').fadeOut();
    };
    // utilities
    Ogis.prototype.createIndexer = function (dic, array, prefix, indexName) {
        var item,
            key;
        indexName = indexName || 'id';
        // maybe  we should check array is an instance of Array
        for (var i = 0, ii = array.length; i < ii; i++) {
            item = array[i];
            if (item[indexName]) {
                key = prefix ? prefix + '_' + item[indexName] : item[indexName];
                dic[key] = item;
            }
        }
        return dic;
    };
    Ogis.prototype.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
    Ogis.prototype.getSuffix = function () {
        return new Date().getTime();
    };
    Ogis.prototype.addSuffix = function (base) {
        var suffix = this.suffix,
            reg = /_$/g;
        if (!reg.test(base))
            base += '_';
        return base + suffix;
    };
    Ogis.prototype.removeSuffix = function (base) {
        var length = this.suffix.toString().length;
        var reg = new RegExp('_\\d{' + length + '}', 'g');
        base = base.replace(reg, '');
        return base;
    };
    Ogis.prototype.toJQueryId = function (id) {
        var reg = /^#/g;
        if (!reg.test(id))
            id = '#' + id;
        return id;
    };
    Ogis.prototype.toRawId = function (id) {
        var reg = /^#/g;
        if (reg.test(id))
            id = id.replace(reg, '');
        id = this.removeSuffix(id);
        return id;
    };
    Ogis.prototype.getEventTarget = function (ev) {
        return $(ev.currentTarget);
    };
    Ogis.prototype.log = function (msg) {
        console && console.log(msg);
    };
    Ogis.prototype.clampNum = function (start, end, offset, margin) {
        var num,
            margin = margin || 5,
            distance = start + offset - end;
        if (distance > 0) {
            num = start - distance - margin;
        } else if (distance == 0) {
            num = start - margin;
        } else {
            num = start;
        }
        return num;
    };
    Ogis.prototype.getDom$ = function (id) {
        var dic = this.domDic,
            dom;
        dom = dic[id];
        if (!dom) {
            var jId = this.toJQueryId(id);
            jId = this.addSuffix(jId);
            dom = dic[id] = $(jId);
        }
        return dom;
    };
    Ogis.prototype.showDom$ = function (dom$, startX, startY) {
        var thisDom$ = this.getDom$('ogis');
        var thisWidth = thisDom$.prop('clientWidth');
        var thisHeight = thisDom$.prop('clientHeight');
        var domWidth = dom$.prop('clientWidth');
        var domHeight = dom$.prop('clientHeight');
        var left = this.clampNum(startX, thisWidth, domWidth);
        var top = this.clampNum(startY, thisHeight, domHeight);
        dom$.css({left: left, top: top});
        dom$.fadeIn();
    };
    Ogis.getStyleFunction =function(){
        var styleFunction =function(feature,resolution){
            var text = feature.get('title');
            var style = new ol.style.Style({
                text:new ol.style.Text({
                    textAlign:'center',
                    text:text,
                    fill:new ol.style.Fill({
                        color:[0,0,0,0.8]
                    }),
                    stroke:new ol.style.Stroke({
                        width:1,
                        color:[0,0,0,0.8]
                    })
                }),
                fill:new ol.style.Fill({
                    color:[210,230,255,0.2]
                }),
                stroke:new ol.style.Stroke({
                    color:[0,25,180,1],
                    width:1
                }),
                image:new ol.style.Circle({
                    radius:5,
                    stroke: new ol.style.Stroke({
                        width:1,
                        color:[120,23,68,1]
                    })
                })
            });
            return [style];
        };
        return styleFunction;
    }
    Ogis.getSelectedStyle = function(){

    }
})(window.jQuery,window.ol,window.proj4);


