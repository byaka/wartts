var initQueue=[];
var settings={
   'debug':false,
   'apiHost':'',
   'apiHostTmpl':'http://%s:8111', // 192.168.2.33   localhost
   'apiFake':false
};
var domLink={};
var renderingSettings={
   'map':{'zoom':1, 'zoomMin':0.5, 'zoomMax':7, 'zoomStep':0.01, 'left':0, 'top':0, 'width':0, 'height':0, 'angle':0, 'angleTrans':false, 'angleTransX':0, 'angleTransY':0, 'backgroundSaturate':0.3, 'force':false},
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
   if(Object.keys(url.params).inOf('debug')) settings.debug=true;
   settings.apiHost=settings.apiHostTmpl.format(url.params.api|| 'localhost');
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
   domLink.mapLayer.debug=$('#mapLayer_debug .canvas')[0];
   domLink.mapLayer.debugCtx=domLink.mapLayer.debug.getContext('2d');
   domLink.loading=$('#loading');
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
      var s=renderingSettings.map.zoom+renderingSettings.map.zoomStep*d;
      autoZoom('fitByObjects', {
         'mapW':renderingSettings.map.width,
         'mapH':renderingSettings.map.height,
         'wrapW':domLink.map.innerWidth(),
         'wrapH':domLink.map.innerHeight()
      }, function(p){
         p.zoom=renderingSettings.map.zoom+renderingSettings.map.zoomStep*d;
      });
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
         autoPan('set', {'x':tmp.startX-tmp.hX-tmp.deltaX, 'y':tmp.startY-tmp.hY-tmp.deltaY})
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
   domLink.loading.addClass('disabled');
   animationReady(function(time){
   //==map layers
      forMe(['dinamic', 'background', 'player', 'static', 'debug'], function(l){
         //clear rendering queue
         if(!renderMap.layerDrawer[l])
            return print('!! Unknown map-layer', l);
         var data=renderingQueue.map[l];
         renderingQueue.map[l]=null;
         if(!data && renderingSettings.map.force)
            data=renderingQueueOld.map[l];
         if(data){ //call rendering if data exist
            renderingQueueOld.map[l]=data;
            renderMap.layerDrawer[l](domLink.mapLayer[l], domLink.mapLayer[l+'Ctx'], data, renderingSettings.map, true);
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

function renderingQueue_mapObjects(data, type){
   var tFunc0=function(l, tArr){
      if(!['player', 'static', 'dinamic', 'debug'].inOf(l)) return;
      if(!renderingQueue.map[l]){
         renderingQueue.map[l]=isArray(tArr)? tArr: [tArr];
      }else if(isArray(renderingQueue.map[l])){
         if(isArray(tArr))
            renderingQueue.map[l]=renderingQueue.map[l].concat(tArr);
         else
            renderingQueue.map[l].push(tArr);
      }else print('! somethink goes wrong');
   }
   forMe(data, tFunc0);
}

function renderingQueue_hud(data){
   if(data.dinamic)
      renderingQueue.hud.dinamic=data.dinamic;
   if(data.static)
      renderingQueue.hud.static=data.static;
}

function renderingQueue_mapBackground(data){
   clearTimeout(renderingQueue_mapBackground.timer);
   initQueue.push('__map__');
   var anticache=randomEx();
   var url=settings.apiHost+'/map.img?'+anticache;
   if(settings.apiFake) url='img/map.jpg';
   print('MAP_LOADING');
   var img=new Image();
   img.id=anticache;
   img.onload=function(){
      img.onload=null;
      if(this.width<100){ //to early, map not loaded yet
         initQueue.splice(initQueue.indexOf('__map__'), 1);
         renderingQueue_mapBackground.timer=setTimeout(renderingQueue_mapBackground, 5000);
         return;
      }
      renderingQueue.map.background={'img':this, 'saturate':renderingSettings.map.backgroundSaturate, 'anticache':this.id};
      //saturate background
      var s='grayscale(%s%%)'.format((1-renderingQueue.map.background.saturate)*100);
      forMe(['filter', '-webkit-filter', '-moz-filter', '-ms-filter', '-o-filter'], function(n){
         domLink.mapLayer.background.style[n]=s;
      });
      //save image size
      var w=this.width, h=this.height;
      renderingSettings.map.width=w;
      renderingSettings.map.height=h;
      //correct size of layers
      var mapW=domLink.map.innerWidth(), mapH=domLink.map.innerHeight();
      forMe(['dinamic', 'background', 'player', 'static', 'debug'], function(l){
         domLink.mapLayer[l].width=mapW;
         domLink.mapLayer[l].height=mapH;
         // renderingQueueOld.map[l]=null;
      })
      //calc auto-zoom
      autoZoom('fitByObjects', {'mapW':w, 'mapH':h, 'wrapW':mapW, 'wrapH':mapH});
       //complited
      initQueue.splice(initQueue.indexOf('__map__'), 1);
   }
   img.src=url;
}

function correctZoom(zoom){
   if(arguments.length){
      if(zoom<renderingSettings.map.zoomMin) return renderingSettings.map.zoomMin;
      if(zoom>renderingSettings.map.zoomMax) return renderingSettings.map.zoomMax;
      return zoom;
   }else{
      if(renderingSettings.map.zoom<renderingSettings.map.zoomMin)
         renderingSettings.map.zoom=renderingSettings.map.zoomMin;
      if(renderingSettings.map.zoom>renderingSettings.map.zoomMax)
         renderingSettings.map.zoom=renderingSettings.map.zoomMax;
   }
}

function autoZoom(type, p, cb, isAutoPan, isAutoForce){
   isAutoPan=isAutoPan===false? false: true;
   isAutoForce=isAutoForce===false? false: true;
   if(autoZoom.timer) print('READY FOR ZOOM');
   clearTimeout(autoZoom.timer);
   autoZoom.timer=null;
   if(type==='set'){ //nothing to change
   }else if(type==='fitByMax'){
      var mapSZ=max(p.mapW, p.mapH), wrapSZ=max(p.wrapW, p.wrapH);
      p.zoom=wrapSZ/mapSZ;
   }else if(type==='fitByMin'){
      var mapSZ=max(p.mapW, p.mapH), wrapSZ=min(p.wrapW, p.wrapH);
      p.zoom=wrapSZ/mapSZ;
   }else if(type==='fitByObjects'){
      // if(!renderingQueueOld.map.dinamic && !renderingQueueOld.map.player && !renderingQueueOld.map.static){
      if(!renderingQueueOld.map.player){
         autoZoom.timer=setTimeout(function(){
            autoZoom(type, p, cb, isAutoPan, isAutoForce);
         }, 1000);
         return;
      }
      var tArr0=[].concat(renderingQueueOld.map.dinamic, renderingQueueOld.map.player, renderingQueueOld.map.static);
      var minX=99999999, minY=99999999, maxX=0, maxY=0;
      forMe(tArr0, function(o){
         if(isArray(o.x)){
            minX=min(minX, o.x[0], o.x[1]);
            minY=min(minY, o.y[0], o.y[1]);
            maxX=max(maxX, o.x[0], o.x[1]);
            maxY=max(maxY, o.y[0], o.y[1]);
         }else{
            minX=min(minX, o.x);
            minY=min(minY, o.y);
            maxX=max(maxX, o.x);
            maxY=max(maxY, o.y);
         }
      })
      if(settings.debug)
         renderingQueue_mapObjects({
            'debug':{point:[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]], type:'polygon'}
         });
      p.x=minX;
      p.y=minY;
      p.mapW=Math.abs(p.mapW*(maxX-minX));
      p.mapH=Math.abs(p.mapH*(maxY-minY));
      // var mapSZ=max(p.mapW, p.mapH), wrapSZ=min(p.wrapW, p.wrapH);
      if(p.wrapW-p.mapW<p.wrapH-p.mapH)
         var mapSZ=p.mapW, wrapSZ=p.wrapW;
      else
         var mapSZ=p.mapH, wrapSZ=p.wrapH;
      p.zoom=wrapSZ/mapSZ;
      p.zoom-=5*renderingSettings.map.zoomStep;
   }
   p.zoom=correctZoom(p.zoom);
   if(cb) cb(p);
   p.zoom=correctZoom(p.zoom);
   // print('AUTO_ZOOM', type, p);
   if(isNaN(p.zoom))
      return print('!!! ERROR AUTO_ZOOM');
   var oldZ=renderingSettings.map.zoom;
   renderingSettings.map.zoom=p.zoom;
   if(isAutoPan)
      autoPan('center', p, null, isAutoForce);
   if(isAutoForce && oldZ!==p.zoom)
      renderingSettings.map.force=true;
   return p.zoom;
}

function autoPan(type, p, cb, isAutoForce){
   isAutoForce=isAutoForce===false? false: true;
   renderingSettings.map.angleTrans=false;
   if(type==='set'){ //nothing to change
   }else if(type==='center'){
      var w1=p.mapW*p.zoom, w2=p.wrapW-w1;
      var h1=p.mapH*p.zoom, h2=p.wrapH-h1;
      p.x=-1*renderingSettings.map.width*p.zoom*p.x;
      p.y=-1*renderingSettings.map.height*p.zoom*p.y;
      p.x+=w2/2;
      p.y+=h2/2;
      renderingSettings.map.angleTransX=(w2+w1)/2-p.x;
      renderingSettings.map.angleTransY=(h2+h1)/2-p.y;
      renderingSettings.map.angleTrans=true;
   }
   if(cb) cb(p);
   // print('AUTO_PAN', type, p);
   if(isNaN(p.x) || isNaN(p.y))
      return print('!!! ERROR AUTO_PAN');
   var oldX=renderingSettings.map.left, oldY=renderingSettings.map.top;
   renderingSettings.map.left=p.x;
   renderingSettings.map.top=p.y;
   if(isAutoForce && (oldX!==p.x || oldY!==p.y))
      renderingSettings.map.force=true;
}

documentReady(init_part1);

