var initQueue=[];
var settings={
   'debug':false,
   'apiHost':'http://localhost:8111',
   'apiFake':false
}
var debug=false;
var domLink={};
var renderingSettings={
   'map':{'zoom':1, 'zoomMin':0.2, 'zoomMax':4, 'zoomStep':0.1, 'force':false, 'left':0, 'top':0, 'width':0, 'height':0, 'angle':0},
   'hud':{'force':false},
};
var renderingQueue={'map':{}, 'hud':{}};
var renderingQueueOld={'map':{}, 'hud':{}};

function loadJs(url, cb){
   // console.log('>>> loadJS', url)
   initQueue.push(url);
   var js=document.createElement("script");
   js.type="text/javascript";
   js.onload=js.onreadystatechange=function(){
      if(this.readyState && this.readyState=="loading") return; //IEfix
      if(cb) cb();
      initQueue.splice(initQueue.indexOf(url), 1);
   }
   js.onerror=function(){
      console.log('!!!ERROR loading some resources failed', url);
   }
   js.charset='utf-8';
   js.src=url;
   document.getElementsByTagName("head")[0].appendChild(js);
}

function init_part1(){
   loadJs('libs/hamster.js');
   loadJs('libs/gaugEx.js');
   loadJs('js/prepareImage.js');
   loadJs('js/processMap.js');
   loadJs('js/processStatus.js');
   loadJs('js/renderMap.js');
   loadJs('js/renderHud.js');
   init_settings();
   //wait for all resources ready
   var initTimer=setInterval(function(){
      if(initQueue.length){
         if(settings.debug) console.log('>> waiting for initQueue');
         return;
      }
      clearInterval(initTimer);
      init_part2();
   }, 300);
}

function init_settings(){
   var url=parseURL();
   if(Object.keys(url.params).inOf('fakeApi')) settings.apiFake=true;
}

function init_part2(){
   domLink.mapLayer={};
   domLink.map=$('#map');
   domLink.mapLayer.dinamic=$('#mapLayer_dinamic .canvas')[0];
   domLink.mapLayer.dinamicCtx=domLink.mapLayer.dinamic.getContext('2d');
   domLink.mapLayer.static=$('#mapLayer_static .canvas')[0];
   domLink.mapLayer.staticCtx=domLink.mapLayer.static.getContext('2d');
   domLink.mapLayer.player=$('#mapLayer_player .canvas')[0];
   domLink.mapLayer.playerCtx=domLink.mapLayer.player.getContext('2d');
   domLink.mapLayer.background=$('#mapLayer_background .canvas')[0];
   domLink.mapLayer.backgroundCtx=domLink.mapLayer.background.getContext('2d');
   //
   renderMap.init();
   renderHud.init();
   //wait for all resources ready
   var initTimer=setInterval(function(){
      if(initQueue.length){
         if(settings.debug) console.log('>> waiting for initQueue');
         return;
      }
      clearInterval(initTimer);
      inited();
   }, 300);
}

function inited(){
//==events
   Hamster(domLink.map[0]).wheel(function(e, d, dx, dy){
      e.preventDefault();
      var old=renderingSettings.map.zoom;
      renderingSettings.map.zoom+=renderingSettings.map.zoomStep*d;
      correctZoom();
      //
      if(renderingSettings.map.zoom==old) return;
      renderingSettings.map.force=true;
      print('ZOOM', renderingSettings.map.zoom);
   })

   domLink.map.on('mousedown', function(e){
      if(e.which!==1 && !e.isTrigger) return;
      e.preventDefault();
      var tmp={};
      tmp.startX=e.pageX;
      tmp.startY=e.pageY;
      tmp.deltaX=0;
      tmp.deltaY=0;
      tmp.hX=tmp.startX-renderingSettings.map.left;
      tmp.hY=tmp.startY-renderingSettings.map.top;
      var grid=5;
      $(window).on('mousemove', function(e){
         e.preventDefault();
         var dx=Math.floor((tmp.startX-e.pageX)/grid)*grid;
         var dy=Math.floor((tmp.startY-e.pageY)/grid)*grid;
         if(tmp.deltaX==dx && tmp.deltaY==dy) return false;
         tmp.deltaX=dx;
         tmp.deltaY=dy;
         renderingSettings.map.left=tmp.startX-tmp.hX-tmp.deltaX;
         renderingSettings.map.top=tmp.startY-tmp.hY-tmp.deltaY;
         renderingSettings.map.force=true;
      });
      $(window).on('mouseup', function(e){
         $(window).off('mousemove');
         $(window).off('mouseup');
      });
   });
//==run cicles
   processMap.apiFake=settings.apiFake;
   processMap.init(settings.apiHost);
   processStatus.apiFake=settings.apiFake;
   processStatus.init(settings.apiHost);
   animationReady(function(time){
   //==map layers
      forMe(['dinamic', 'background', 'player', 'static'], function(l){
         //clear rendering queue
         var data=renderingQueue.map[l];
         renderingQueue.map[l]=null;
         if(!data && renderingSettings.map.force)
            data=renderingQueueOld.map[l];
         if(data){ //call rendering if data exist
            renderingQueueOld.map[l]=data;
            renderMap[l](domLink.mapLayer[l], domLink.mapLayer[l+'Ctx'], data, renderingSettings.map, true);
         }
      })
   //==HUD
      forMe(['dinamic'], function(l){
         //clear rendering queue
         var data=renderingQueue.hud[l];
         renderingQueue.hud[l]=null;
         if(!data && renderingSettings.hud.force)
            data=renderingQueueOld.hud[l];
         if(data){ //call rendering if data exist
            renderingQueueOld.hud[l]=data;
            renderHud[l](data, renderingSettings.hud);
         }
      })
   //==next frame and other
      renderingSettings.map.force=false;
      animationReady(arguments.callee);
   });
}

function correctZoom(){
   if(renderingSettings.map.zoom<renderingSettings.map.zoomMin) renderingSettings.map.zoom=renderingSettings.map.zoomMin;
   if(renderingSettings.map.zoom>renderingSettings.map.zoomMax) renderingSettings.map.zoom=renderingSettings.map.zoomMax;
}

function renderingQueue_objects(data){
   if(data.dinamic)
      renderingQueue.map.dinamic=data.dinamic;
   if(data.player)
      renderingQueue.map.player=data.player;
   if(data.static)
      renderingQueue.map.static=data.static;
}

function renderingQueue_hud(data){
   if(data.dinamic)
      renderingQueue.hud.dinamic=data.dinamic;
   if(data.static)
      renderingQueue.hud.static=data.static;
}

function renderingQueue_map(data){
   clearTimeout(renderingQueue_map.timer);
   initQueue.push('__map__');
   var anticache=randomEx();
   var url=settings.apiHost+'/map.img?%s'.format(anticache);
   if(settings.apiFake) url='img/map.jpg';
   var img=new Image();
   img.id=anticache;
   img.onload=function(){
      img.onload=null;
      if(this.width<100){ //to early, map not loaded yet
         initQueue.splice(initQueue.indexOf('__map__'), 1);
         renderingQueue_map.timer=setTimeout(renderingQueue_map, 5000);
         return;
      }
      renderingQueue.map.background={'img':this, 'saturate':0.5, 'anticache':this.id};
      renderingSettings.map.force=true;
      //saturate background
      var s='grayscale(%s%%)'.format((1-renderingQueue.map.background.saturate)*100)
      forMe(['filter', '-webkit-filter', '-moz-filter', '-ms-filter', '-o-filter'], function(n){domLink.mapLayer.background.style[n]=s});
      //save image size
      var w=this.width, h=this.height;
      renderingSettings.map.width=w;
      renderingSettings.map.height=h;
      //correct size of layers
      var mapW=domLink.map.innerWidth(), mapH=domLink.map.innerHeight();
      forMe(['dinamic', 'background', 'player', 'static'], function(l){
         domLink.mapLayer[l].width=mapW;
         domLink.mapLayer[l].height=mapH;
         // renderingQueueOld.map[l]=null;
      })
      //calc auto-zoom
      autoZoom('fitByObjects', w, h, mapW, mapH, function(z){
         renderingSettings.map.zoom=z;
         correctZoom();
      });
       //complited
      initQueue.splice(initQueue.indexOf('__map__'), 1);
   }
   img.src=url;
}

function autoZoom(type, mapW, mapH, wrapW, wrapH, cb){
   clearTimeout(autoZoom.timer);
   if(type=='fitByMax'){
      var mapSZ=max(mapW, mapH), wrapSZ=max(wrapW, wrapH);
      var z=wrapSZ/mapSZ;
   }else if(type=='fitByMin'){
      var mapSZ=max(mapW, mapH), wrapSZ=min(wrapW, wrapH);
      var z=wrapSZ/mapSZ;
   }else if(type=='fitByObjects'){
      if(!renderingQueueOld.map.dinamic || !renderingQueueOld.map.player || !renderingQueueOld.map.static){
         autoZoom.timer=setTimeout(function(){
            autoZoom(type, mapW, mapH, wrapW, wrapH, cb);
         }, 500)
         return;
      }
      print('READY FOR ZOOM')
      var tArr0=[].concat(renderingQueueOld.map.dinamic, renderingQueueOld.map.player, renderingQueueOld.map.static);
      var minX=99999999, minY=99999999, maxX=0, maxY=0;
      forMe(tArr0, function(o){
         if(isArray(o.x)){
            minX=min(minX, o.x[0], o.x[1]);
            minY=min(minY, o.y[0], o.y[1]);
            maxX=min(maxX, o.x[0], o.x[1]);
            maxY=min(maxY, o.y[0], o.y[1]);
         }else{
            minX=min(minX, o.x);
            minY=min(minY, o.y);
            maxX=min(maxX, o.x);
            maxY=min(maxY, o.y);
         }
      })
      mapW=Math.abs(mapW*(maxX-minX));
      mapH=Math.abs(mapH*(maxY-minY));
      print('>', mapW, mapH)
      var mapSZ=max(mapW, mapH), wrapSZ=min(wrapW, wrapH);
      var z=wrapSZ/mapSZ;
   }
   if(cb) cb(z);
   return z;
}

documentReady(init_part1);

