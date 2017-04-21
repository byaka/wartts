var processStatus={
   'apiFake':false,
   'apiHost':'',
   'dataGroup':{'dinamic':{}, 'static':{}},
   'dataGroupForRender':{'dinamic':{}, 'static':{}},
   'timer':null
};

processStatus.init=function(apiHost){
   processStatus.apiHost=apiHost;
   processStatus.timer=setTimeout(processStatus.update, 100);
}

processStatus.update=function(){
   clearTimeout(processStatus.timer);
   processStatus.dataFromApi(function(){
      processStatus.timer=setTimeout(processStatus.update, 500);
   });
}

processStatus.dataFromApi=function(cb){
   var rCount=0, dataAll={}, url=[];
   if(processStatus.apiFake){ //if fakeApi enabled, we get API request from github's example
      var s='https://raw.githubusercontent.com/byaka/WarThunderTacticalScreen_discuss/master/API';
      url.push(s+'/indicators2.js');
      url.push(s+'/state2.js');
   }else{
      url.push(processStatus.apiHost+'/indicators');
      url.push(processStatus.apiHost+'/state');
   }
   var tFunc_check=function(data, status){
      rCount-=1;
      if(!data){ //empty request
         if(cb) cb();
         return;
      }
      //parse to JSON
      var data=JSON.parse(data);
      Object.merge(dataAll, data);
      if(rCount) return;
      processStatus.data2group(dataAll);
      if(cb) cb();
   }
   rCount=url.length;
   forMe(url, function(u){
      ajaxMe(u, tFunc_check);
   })
}

processStatus.data2group=function(data){
   var groups=['dinamic', 'static'];
   var oldHash={};
   forMe(groups, function(g){
      //clear group
      processStatus.dataGroup[g]={};
      //calc hash
      var s=JSON.stringify(processStatus.dataGroupForRender[g])
      if(s) oldHash[g]=s.hashCode();
      //clear rendering queue
      processStatus.dataGroupForRender[g]={};
   })
   //processing
   var static=['model'];
   var convKeyMap={
      'type':'model', 'Vy, m/s': 'vspeed', 'TAS, km/h':'speedTAS', 'IAS, km/h':'speedIAS', 'flaps, %':'flaps', 'throttle 1, %':'throttle', 'gear, %':'gears', 'radiator 1, %':'radiator', 'altitude_hour':'altitude'
   }
   var convValMap={
      'altitude':function(v){return v*0.3048},
      'flaps':function(v){return v/100},
      'throttle':function(v){return v/100},
      'gears':function(v){return v/100},
      'radiator':function(v){return v/100},
   }
   forMe(data, function(k, v){
      if(!convKeyMap[k]) return;
      k=convKeyMap[k];
      if(convValMap[k]) v=convValMap[k](v)
      var oo={'real':[]};
      oo.real.push(v);
      var g=null;
      if(static.inOf(k)) g='static';
      else g='dinamic';
      processStatus.dataGroup[g][k]=oo;
      var oor=oo.real.last();
      if(isNumber(oor)) oor=round(oor, 1);
      processStatus.dataGroupForRender[g][k]=oor;
   })
   forMe(groups, function(g){
      //to parent process
      var s=JSON.stringify(processStatus.dataGroupForRender[g]);
      if(!s || s.hashCode()!==oldHash[g])
         renderingQueue_hud(Object.make([[g, cloneMe(processStatus.dataGroupForRender[g], false, false, false)]]));
   })

}