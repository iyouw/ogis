/**
 * Created by Luck on 2017/4/13.
 */
var OGIS_DEFAULT_CONFIG = {
    tool:{
        groupButton:[
            {id:'ogislayermanagebtn',img:'../src/image/mm.png',text:'图层管理'}
        ],
        drops:[
            {id:'ogislayermanage',html:'<ul id="ogis-layer-manager" class="ogis-layer-manager"></ul>'}
        ],
        binding:{
            ogislayermanagebtn:'ogislayermanage'
        }
    },
    layerManager:{
        css:{
            visible:{yes:'ogis-layer-manager-layer-visible-btn-yes',no:'ogis-layer-manager-layer-visible-btn-no'},
            frozen:{yes:'ogis-layer-manager-layer-frozen-btn-yes',no:'ogis-layer-manager-layer-frozen-btn-no'},
            filter:'ogis-layer-manager-layer-filter-btn'
        }
    },
    map:{
        baseLayerUrl:'../src/TerrainWith/{z}/{x}/{y}.jpg',
        extent:[]
    }
};
//类构造器
function Ogis(element,options){
    this.element$ = $(element);
    this.options = $.extend({},OGIS_DEFAULT_CONFIG,options);
    this.dir = '';
    this.map = null;
    this.layerManager={
        dom$:'',
        layerDic:{},
        frozenDic:{},
        currentLayer:''
    };
    this.init();
}
Ogis.prototype.init = function(){
    this.prepare();
    this.render();
    this.setUp();
    this.registerDefaultEvent();
};
Ogis.prototype.prepare = function(){
    this.prepareLayerManager();
};
Ogis.prototype.prepareLayerManager = function(){
    var tool = this.options.tool;
    var layerManageBtn = this.buildLayerManageBtn(),
        layerManageDrop = this.buildLayerManagerDrop();
    if(!tool.binding[layerManageBtn.id]){
        tool.groupButton.push(layerManageBtn);
        tool.drops.push(layerManageDrop);
        tool.binding[layerManageBtn.id] = layerManageDrop.id;
    }
};
Ogis.prototype.setUp = function(){
    this.layerManager.dom$ = $('#ogislayermanager');
};
//渲染
Ogis.prototype.render = function(){
    this.renderOgisFrame();
    this.renderMap();
};
Ogis.prototype.renderOgisFrame = function(){
    this.element$.empty();
    var ogis = this.buildOgisFrameHtml();
    this.element$.append(ogis);
};
Ogis.prototype.renderMap = function(){
    var extent = this.options.map.extent;
    var baseLayer = this.buildBaseLayer();
    var view = new ol.View();
    var map = new ol.Map({
        target:'ogis_map',
        controls:[],
        layers:[baseLayer],
        view:view
    });
    view.fit(extent,map.getSize());
    this.map = map;
};
//html生成
Ogis.prototype.buildOgisFrameHtml = function(){
    var frame = '<div class="ogis-container">';
    frame += '<div id="ogis_map" class="ogis-map"></div>';
    frame += this.buildBaseOverlayHtml();
    frame += '<div class="ogis-overlayers">';
    frame += '<div class="ogis-overlayers-container"></div>';
    frame += '</div>';
    frame += '</div>';
    return frame;
};
Ogis.prototype.buildBaseOverlayHtml = function(){
    var baseLayer = '';
    baseLayer += this.buildSearchBarHtml();
    baseLayer += this.buildToolBarHtml();
    return baseLayer;
};
Ogis.prototype.buildSearchBarHtml = function(){
    var searchBar = '<div class="ogis-searchbar">';
    searchBar += '<div class="ogis-searchbar-container">';
    searchBar += '<input class="ogis-searchbar-input" type="text" placeholder="搜油藏 搜圈闭 搜矿区" />';
    searchBar += '<div class="ogis-searchbar-drop-container"></div>';
    searchBar += '</div>';
    searchBar += '<button class="ogis-searchbar-search-btn" type="button">搜索</button>';
    searchBar += '</div>';
    return searchBar;
};
Ogis.prototype.buildToolBarHtml =function(){
    var toolbar = '<div class="ogis-toolbar">';
    toolbar += '<div class="ogis-toolbar-container">';
    toolbar += '<ul class="ogis-toolbar-group-btns">';
    toolbar += this.buildToolbarBtnGroupHtml();
    toolbar += '</ul>';
    toolbar += '<div class="ogis-toolbar-drop-container">';
    toolbar += this.buildToolbarDropsHtml();
    toolbar += '</div>';
    return toolbar;
};
Ogis.prototype.buildToolbarBtnGroupHtml = function(){
    var btn,
        btnsHtml = '',
        btns = this.options.tool.groupButton;
    for(var i= 0,ii=btns.length;i<ii;i++){
        btn = btns[i];
        btnsHtml += this.buildToolbarBtnHtml(btn.id,btn.img,btn.text);
        if(i<ii-1) {
            btnsHtml += this.buildToolbarSplitorHtml();
        }
    }
    return btnsHtml;
};
Ogis.prototype.buildToolbarBtnHtml = function(id,img,text){
    var btn = '<li class="ogis-toolbar-group-item ogis-toolbar-group-btn" id="' + id + '">';
    btn += '<img src="' + img + '"/>';
    btn += '<span>' + text + '</span>';
    btn += '</li>';
    return btn;
};
Ogis.prototype.buildToolbarSplitorHtml=function(){
    return '<li class="ogis-toolbar-group-item ogis-toolbar-group-splitor"></li>';
};
Ogis.prototype.buildToolbarDropsHtml =function(){
    var dropsHtml = '',
        drop,
        drops =this.options.tool.drops;
    for(var i= 0,ii=drops.length;i<ii;i++){
        drop = drops[i];
        dropsHtml += this.buildToolbarDropHtml(drop);
    }
    return dropsHtml;
};
Ogis.prototype.buildToolbarDropHtml = function(drop){
    var dropHtml = '<div class="ogis-toolbar-drop" id="' +drop.id +'">';
    dropHtml += this.buildToolbarDropHeaderHtml();
    dropHtml += drop.html;
    dropHtml +='</div>';
    return  dropHtml;
};
Ogis.prototype.buildToolbarDropHeaderHtml = function(){
    var header = '<div class="ogis-toolbar-drop-header">';
    header += '<button class="ogis-image-btn ogis-toolbar-drop-closer" type="button">X</button>';
    header += '</div>';
    return header;
};
Ogis.prototype.buildLayerManagerHtml = function(){
    return  '<ul id="ogislayermanager" class="ogis-layer-manager"></ul>';
};
Ogis.prototype.builderLayerItemHtml = function(layerItem){
    var css = this.options.layerManager.css;
    var visible = layerItem.isVisible?css.visible.yes:css.visible.no,
        frozen =  layerItem.isFrozen ? css.frozen.yes:css.frozen.no,
        filter = css.filter;
    var name = layerItem.name || layerItem.get('name');
    var layerItemHtml = '<li class="ogis-layer-manager-layer" id="' + name + '">';
    layerItemHtml += '<span>' + name + '</span>';
    layerItemHtml += '<button type="button" class="ogis-image-btn ogis-layer-manager-layer-visible-btn '+ visible +'" ></button>';
    layerItemHtml += '<button type="button" class="ogis-image-btn ogis-layer-manager-layer-frozen-btn '+ frozen +'" ></button>';
    layerItemHtml += '<button type="button" class="ogis-image-btn ogis-layer-manager-layer-filter-btn '+ filter + '" ></button>';
    layerItemHtml += '</li>';
    return layerItemHtml;
};
//事件注册
Ogis.prototype.registerDefaultEvent = function(){
    var self = this;
    $(document).on('click','.ogis-toolbar-group-btn',function(ev){
        self.manageToolGroupBtnClick(ev);
    })
    .on('click','.ogis-toolbar-drop-closer',function(ev){
        self.hideToolbarDrop(ev);
    })
    .on('click','.ogis-layer-manager-layer-visible-btn',function(ev){
        self.manageVisibleLayer(ev);
    })
    .on('click','.ogis-layer-manager-layer-frozen-btn',function(ev){
        self.manageFrozenLayer(ev);
    })
    .on('click','.ogis-layer-manager-layer-filter-btn',function(ev){
        self.manageFilterLayer(ev);
    })
};
//功能函数
Ogis.prototype.manageToolGroupBtnClick = function(ev){
    var dropBinding = this.options.tool.binding;
    var target = $(ev.currentTarget);
    var id = target.attr('id');
    var dropId = '#' + dropBinding[id];
    $('.ogis-toolbar-drop').not(dropId).hide();
    $(dropId).slideToggle();
};
Ogis.prototype.hideToolbarDrop = function(ev){
    var target = $(ev.currentTarget);
    target.closest('.ogis-toolbar-drop').slideUp();
};
Ogis.prototype.addLayerToLayerManager = function(layerItem){
    var layer = this.builderLayerItemHtml(layerItem);
    this.layerManager.dom$.append(layer);
};
Ogis.prototype.buildLayerManageBtn = function(){
    return {
        id:'ogislayermanagebtn',
        img:'../src/image/mm.png',
        text:'图层管理'
    }
};
Ogis.prototype.buildLayerManagerDrop = function(){
    var drop = {
        id:'ogislayermanagedrop',
        html:''
    };
    drop.html = this.buildLayerManagerHtml();
    return drop;
};
Ogis.prototype.buildBaseLayer = function(){
    var baseLayerUrl = this.options.map.baseLayerUrl;
    var baseLayer = new ol.layer.Tile();
    var baseLayerSource = new ol.source.XYZ({
        url:baseLayerUrl
    });
    baseLayer.setSource(baseLayerSource);
    return baseLayer;
};
Ogis.prototype.manageVisibleLayer = function(ev){
    var target$ = $(ev.currentTarget),
        layer$ = target$.closest('.ogis-layer-manager-layer'),
        layerName = layer$.attr('id');
    var isVisible = this.changeLayerVisibleBtn(target$);
    var layer = this.layerManager.layerDic[layerName];
    layer.setVisible(isVisible);
};
Ogis.prototype.changeLayerVisibleBtn = function(target$){
    return this.changeLayerButton(target$,'visible');
};
Ogis.prototype.changeLayerButton = function(target$,buttonName){
    var is = false,
        btnCss = this.options.layerManager.css[buttonName],
        yes = btnCss.yes,
        no = btnCss.no;
    if(target$.hasClass(yes)){
        target$.removeClass(yes);
        target$.addClass(no);
        is = false;
    }else{
        target$.removeClass(no);
        target$.addClass(yes);
        is = true;
    }
    return is;
};
Ogis.prototype.manageFrozenLayer = function(ev){
    var target$ = $(ev.currentTarget),
        layer$ = target$.closest('.ogis-layer-manager-layer'),
        layerName = layer$.attr('id');
    var layerDic = this.layerManager.layerDic;
    var frozenDic = this.layerManager.frozenDic;
    var isFrozen = this.changeLayerFrozenBtn(target$);
    if(isFrozen){
        frozenDic[layerName] = layerDic[layerName];
    }else{
        delete frozenDic[layerName];
    }
};
Ogis.prototype.changeLayerFrozenBtn = function(target$){
    return this.changeLayerButton(target$,'frozen');
};
Ogis.prototype.manageFilterLayer = function(ev){
    var target$ = $(ev.currentTarget),
        layer$ = target$.closest('.ogis-layer-manager-layer'),
        layerName = layer$.attr('id');
    var layerDic = this.layerManager.layerDic;
    var layer = layerDic[layerName];
    $.triggerHandler('click.layerManager.filter.ogis',layer);
};
//api
Ogis.prototype.getFeatures = function(url,dataHandler,sendData,method){
    var self = this;
    var loader = function(extent,resoulution,projection){
            $.ajax({
                url:url,
                type:method || 'POST',
                data:sendData,
                success:handleFeature,
                error:self.errorMessage
            })
    };
    var handleFeature = function(res){
        var featureJson = dataHandler.resolve(res);
        var formatter = new ol.format.GeoJSON();
        var features = formatter.readFeatures(featureJson);
        source.addFeatures(features);
    };
    var source = new ol.source.Vector({loader:loader});
    return source;
};
Ogis.prototype.errorMessage = function(arg){
    console&&console.log(arg);
};
Ogis.prototype.addLayerVec = function (name, isVisible, isFrozen) {
    var layerArgs = {
        name: name,
        isVisible: isVisible,
        isFrozen: isFrozen
    };
    var layer = this.buildVectorLayer(name, isVisible, isFrozen);
    this.map.addLayer(layer);
    this.addLayerToLayerManager(layerArgs);
    this.layerManager.layerDic[name] = layer;
    return layer;
};
Ogis.prototype.buildVectorLayer = function(name,isVisible,isFrozen){
    var layer = new ol.layer.Vector();
    layer.set('name',name);
    layer.set('isVisible',isVisible);
    layer.setVisible(isVisible);
    layer.set('isFrozen',isFrozen);
    return layer;
};
Ogis.prototype.addLayer = function(name,url,dataHandler,sendData,method,isVisible,isFrozen){
    var layer = this.addLayerVec(name,isVisible,isFrozen);
    var source = this.getFeatures(url,dataHandler,sendData,method);
    layer.setSource(source);
    return layer;
};
Ogis.prototype.addFeatures = function (layerName, url, dataHandler, sendData, method) {
    var layer = this.layerManager.layerDic[layerName];
    var source = this.getFeatures(url, dataHandler, sendData, method);
    layer.setSource(source);
    return layer;
}










