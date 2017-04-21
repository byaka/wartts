var renderHud={
   'domLink':{}, 'gauge':{}
};

renderHud.init=function(){
   // altitude
   renderHud.domLink.altitudeValue=$('.hud #altitude #value');
   // v-speed
   renderHud.domLink.vspeed=$('.hud #vspeed #canvas')[0];
   renderHud.domLink.vspeedValue=$('.hud #vspeed #value');
   renderHud.gauge.vspeed=gaugEx(renderHud.domLink.vspeed, {'shape':[90, 270, 10], 'size':[1, 0.5, 1], 'adjust':[-50, 50, 0], 'colors':'#92ffbe', 'invert':true, 'padding':5, 'arrow':[0.6, 0.4], 'arrowWidth':10, 'arrowColor':'#000'});
   // speed TAS
   renderHud.domLink.speedTAS=$('.hud #speed #canvas.tas')[0];
   renderHud.domLink.speedTASValue=$('.hud #speed #value.tas');
   renderHud.gauge.speedTAS=gaugEx(renderHud.domLink.speedTAS, {'shape':[0, 180, 10], 'size':[0.5, 1, 1], 'adjust':[0, 700, 0], 'colors':{0:'#ffffff', 50:'#FF9292', 200:'#FFED60', 250:'#92FFBE', 700:'#92FFBE'}, 'invert':true, 'padding':5, 'arrow':[0.8, 0.25], 'arrowWidth':10, 'arrowColor':'#000'});
   // speed IAS
   renderHud.domLink.speedIAS=$('.hud #speed #canvas.ias')[0];
   renderHud.domLink.speedIASValue=$('.hud #speed #value.ias');
   renderHud.gauge.speedIAS=gaugEx(renderHud.domLink.speedIAS, {'shape':[0, 180, 3], 'size':[0.5, 1, 1], 'adjust':[0, 700, 0], 'colors':{0:'#ffffff', 50:'#FF9292', 200:'#FFED60', 250:'#92FFBE', 700:'#92FFBE'}, 'invert':true, 'padding':5, 'arrow':[0.95, 0.05], 'arrowWidth':10, 'arrowColor':'#000'});
   // flaps
   renderHud.domLink.flaps=$('.hud #flaps #canvas')[0];
   renderHud.gauge.flaps=gaugEx(renderHud.domLink.flaps, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 0.15:'#92FFBE', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});
   // gears
   renderHud.domLink.gears=$('.hud #gears #canvas')[0];
   renderHud.gauge.gears=gaugEx(renderHud.domLink.gears, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 0.15:'#92FFBE', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});
   // throttle percents
   renderHud.domLink.throttle=$('.hud #throttle #canvas')[0];
   renderHud.gauge.throttle=gaugEx(renderHud.domLink.throttle, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 1:'#92FFBE'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});
   // radiator percents
   renderHud.domLink.radiator=$('.hud #radiator #canvas')[0];
   renderHud.gauge.radiator=gaugEx(renderHud.domLink.radiator, {'shape':[30, 300, 10], 'size':[0.5, 0.5, 0.5], 'adjust':[0, 1, 0], 'colors':{0:'#ffffff', 1:'#FF9292'}, 'invert':false, 'padding':0, 'arrow':[0.55, 0.45], 'arrowWidth':10, 'arrowColor':'#000'});

}

renderHud.dinamic=function(data, setts){
   var prefMap={};
   var suffMap={};
   var valMap={
      'altitude': function(v){return round(v, 0)},
      'speedTAS': function(v){return round(v, 0)},
      'speedIAS': function(v){return round(v, 0)}
   };
   forMe(data, function(k, v){
      if(['altitude', 'speedTAS', 'speedIAS', 'vspeed', 'flaps', 'throttle', 'gears', 'radiator'].inOf(k)){
         v=(valMap[k])? valMap[k](v): v;
         if(renderHud.domLink[k+'Value'])
            renderHud.domLink[k+'Value'].text((prefMap[k]||'')+v+(suffMap[k]||''));
         if(renderHud.gauge[k])
            renderHud.gauge[k].value(v, true);
      }
   })
}