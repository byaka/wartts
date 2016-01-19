var renderHud={
   'domLink':{}, 'gauge':{}
};

renderHud.init=function(){
   renderHud.domLink.vspeed=$('#hud #vspeed #canvas')[0];
   renderHud.domLink.vspeedValue=$('#hud #vspeed #value');
   renderHud.gauge.vspeed=gaugEx(renderHud.domLink.vspeed, {'shape':[90, 270, 10], 'size':[1, 0.5, 1], 'adjust':[-50, 50, 0], 'colors':'#92ffbe', 'invert':true, 'padding':5, 'arrow':[0.6, 0.4], 'arrowWidth':10, 'arrowColor':'#000'});

   renderHud.domLink.speed=$('#hud #speed #canvas')[0];
   renderHud.domLink.speedValue=$('#hud #speed #value');
   renderHud.gauge.speed=gaugEx(renderHud.domLink.speed, {'shape':[0, 180, 10], 'size':[0.5, 1, 1], 'adjust':[0, 700, 0], 'colors':'#92FFBE', 'invert':true, 'padding':5, 'arrow':[0.8, 0.25], 'arrowWidth':10, 'arrowColor':'#000'});
}

renderHud.dinamic=function(data, setts){
   var prefMap={};
   var suffMap={'vspeed':' м/с', 'speed':' км/ч'};
   var valMap={
      'speed': function(v){return round(v, 0)}
   };
   forMe(data, function(k, v){
      if(['speed', 'vspeed'].inOf(k)){
         v=(valMap[k])? valMap[k](v): v;
         renderHud.domLink[k+'Value'].text((prefMap[k]||'')+v+(suffMap[k]||''));
         renderHud.gauge[k].value(v, true);
      }
   })
}