var renderHud={
   'domLink':{}, 'gauge':{}
};

renderHud.init=function(){
   renderHud.domLink.vspeed=$('.hud #vspeed #canvas')[0];
   renderHud.domLink.vspeedValue=$('.hud #vspeed #value');
   renderHud.gauge.vspeed=gaugEx(renderHud.domLink.vspeed, {'shape':[90, 270, 10], 'size':[1, 0.5, 1], 'adjust':[-50, 50, 0], 'colors':'#92ffbe', 'invert':true, 'padding':5, 'arrow':[0.6, 0.4], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.speed=$('.hud #speed #canvas')[0];
   renderHud.domLink.speedValue=$('.hud #speed #value');
   renderHud.gauge.speed=gaugEx(renderHud.domLink.speed, {'shape':[0, 180, 10], 'size':[0.5, 1, 1], 'adjust':[0, 700, 0], 'colors':'#92FFBE', 'invert':true, 'padding':5, 'arrow':[0.8, 0.25], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.flaps=$('.hud #flaps #canvas')[0];
   renderHud.gauge.flaps=gaugEx(renderHud.domLink.flaps, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 0.15:'#92FFBE', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.gears=$('.hud #gears #canvas')[0];
   renderHud.gauge.gears=gaugEx(renderHud.domLink.gears, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 0.15:'#92FFBE', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.throttle=$('.hud #throttle #canvas')[0];
   renderHud.gauge.throttle=gaugEx(renderHud.domLink.throttle, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 1:'#92FFBE'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.radiator=$('.hud #radiator #canvas')[0];
   renderHud.gauge.radiator=gaugEx(renderHud.domLink.radiator, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});

}

renderHud.dinamic=function(data, setts){
   var prefMap={};
   var suffMap={};
   var valMap={
      'speed': function(v){return round(v, 0)}
   };
   forMe(data, function(k, v){
      if(['speed', 'vspeed', 'flaps', 'throttle', 'gears', 'radiator'].inOf(k)){
         v=(valMap[k])? valMap[k](v): v;
         if(renderHud.domLink[k+'Value'])
            renderHud.domLink[k+'Value'].text((prefMap[k]||'')+v+(suffMap[k]||''));
         if(renderHud.gauge[k])
            renderHud.gauge[k].value(v, true);
      }
   })
}