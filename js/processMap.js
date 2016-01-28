var processMap={
   'apiFake':false,
   'apiHost':'',
   'dataGroup':{'dinamic':[], 'player':[], 'static':[]},
   'dataGroupForRender':{'dinamic':[], 'player':[], 'static':[]},
   'timer':null,
   'mapHash':{}
};

processMap.init=function(apiHost){
   processMap.apiHost=apiHost;
   processMap.timer=setTimeout(processMap.update, 500);
}

processMap.update=function(){
   clearTimeout(processMap.timer);
   processMap.dataFromApi(function(){
      processMap.timer=setTimeout(processMap.update, 50);
   });
   if(getms(true)-processMap.isMapChanged.lastTime>2000){
      processMap.isMapChanged.lastTime=getms(true);
      processMap.isMapChanged();
   }
}

processMap.isMapChanged=function(){
   // var url=processMap.apiHost+'/mission.json';
   // if(processMap.apiFake) //if fakeApi enabled, we get API request from github's example
   //    url='https://raw.githubusercontent.com/byaka/WarThunderTacticalScreen_discuss/master/API/mission.js';
   // ajaxMe(url, function(data, status, r){
   //    processMap.isMapChanged.lastTime=getms(true);
   //    if(!data) //empty request
   //       return;
   //    // var data=JSON.parse(data);
   //    var missionHash=data.hashCode();
   //    if(processMap.missionHash!==missionHash){
   //       processMap.missionHash=missionHash;
   //       print('MAP CHANGED')
   //       renderingQueue_map()
   //    }
   //    processMap.isMapChanged.lastTime=getms(true);
   // })
   var rCount=0, dataAll={}, url=[];
   if(processMap.apiFake){ //if fakeApi enabled, we get API request from github's example
      var s='https://raw.githubusercontent.com/byaka/WarThunderTacticalScreen_discuss/master/API';
      url.push(s+'/mission.js');
      url.push(s+'/mapInfo.js');
   }else{
      url.push(processMap.apiHost+'/mission.json');
      url.push(processMap.apiHost+'/map_info.json');
   }
   var tFunc_check=function(data, status, r, p){
      processMap.isMapChanged.lastTime=getms(true);
      rCount-=1;
      // var data=JSON.parse(data);
      dataAll[p.url]=data;
      if(rCount) return;
      var changed=false;
      forMe(dataAll, function(u, d){
         var h=d.hashCode();
         if(changed) return processMap.mapHash[u]=h;
         else if(processMap.mapHash[u]==h) return;
         processMap.mapHash[u]=h;
         print('MAP CHANGED');
         changed=true;
         renderingQueue_map();
         processMap.isMapChanged.lastTime=getms(true);
      })
   }
   rCount=url.length;
   forMe(url, function(u){
      ajaxMe(u, tFunc_check);
   })
}
processMap.isMapChanged.lastTime=0;

processMap.dataFromApi=function(cb){
   var rCount=0, dataAll=[], url=[];
   if(processMap.apiFake){ //if fakeApi enabled, we get API request from github's example
      var s='https://raw.githubusercontent.com/byaka/WarThunderTacticalScreen_discuss/master/API';
      url.push(s+'/mapObjects.js');
   }else{
      url.push(processMap.apiHost+'/map_obj.json');
   }
   var tFunc_check=function(data, status){
      rCount-=1;
      if(!data){ //empty request
         if(cb) cb();
         return;
      }
      //parse to JSON
      var data=JSON.parse(data);
      dataAll=dataAll.concat(data);
      // Object.merge(dataAll, data);
      if(rCount) return;
      processMap.data2group(dataAll);
      if(cb) cb();
   }
   rCount=url.length;
   forMe(url, function(u){
      ajaxMe(u, tFunc_check);
   })
}

processMap.data2group=function(data){
   var groups=['dinamic', 'player', 'static'];
   var oldHash={};
   forMe(groups, function(g){
      //clear group
      processMap.dataGroup[g]=[];
      //calc hash
      var s=JSON.stringify(processMap.dataGroupForRender[g])
      if(s) oldHash[g]=s.hashCode();
      //clear rendering queue
      processMap.dataGroupForRender[g]=[];
   })
   //processing
   forMe(data, function(o){
      if(o.icon=='Player')
         processMap.data2group_player(o, 'self');
      else if(['aircraft', 'ground_model', 'airfield'].inOf(o.type))
         processMap.data2group_dinamic(o);
      else if(['capture_zone', 'respawn_base_bomber', 'respawn_base_fighter'].inOf(o.type))
         processMap.data2group_static(o);
   })
   forMe(groups, function(g){
      //to parent process
      var s=JSON.stringify(processMap.dataGroupForRender[g]);
      if(!s || s.hashCode()!=oldHash[g])
         renderingQueue_objects(Object.make([[g, cloneMe(processMap.dataGroupForRender[g])]]));
   })
}

processMap.calcRel=function(o, oo){
   //get relation-ship
   if(['#fffffa'].inOf(o.color.toLowerCase())) oo.isNeutral=true;
   else if(['#1952ff'].inOf(o.color.toLowerCase())) oo.isEnemy=false;
   else if(['#ff0d00', '#e10b00', '#f40c00'].inOf(o.color.toLowerCase())) oo.isEnemy=true;
   return oo;
}

processMap.data2group_player=function(o, id){
   var oo={'typeMain':'', 'typeSub':'', 'id':id, 'x':{'real':[]}, 'y':{'real':[]}, 'dir':{'real':[]}};
   if(o.type=='aircraft'){
      oo.typeMain='air';
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }
   processMap.dataGroup.player.push(oo);
   //prep for render
   var oor={'icon':'', 'color':oo.id, 'x':oo.x.real.last(), 'y':oo.y.real.last(), 'dir':oo.dir.real.last()};
   oor.icon='%s_player'.format(oo.typeMain);
   processMap.dataGroupForRender.player.push(oor);
}

processMap.data2group_dinamic=function(o){
   var oo={'typeMain':'', 'typeSub':'', 'isNeutral':'', 'isEnemy':'', 'isFriend':'', 'x':{'real':[]}, 'y':{'real':[]}, 'dir':{'real':[]}};
   if(o.type=='aircraft'){
      oo.typeMain='air';
      //get sub-type
      if(o.icon=='Bomber') oo.typeSub='bomber';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }else if(o.type=='ground_model'){
      if(['Ship'].inOf(o.icon)) oo.typeMain='sea';
      else oo.typeMain='ground';
      if(o.icon=='Wheeled') oo.typeSub='wheeled';
      else if(o.icon=='Airdefence') oo.typeSub='airdefence';
      else if(o.icon=='Tracked') oo.typeSub='tank';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }else if(o.type=='airfield'){
      oo.typeMain='airfield';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push([o.sx, o.ex]);
      oo.y.real.push([o.sy, o.ey]);
      oo.dir.real.push(null);
   }
   if(!oo.typeMain) return;
   processMap.dataGroup.dinamic.push(oo);
   //prep for render
   var oor={'icon':'', 'color':'', 'x':oo.x.real.last(), 'y':oo.y.real.last(), 'dir':oo.dir.real.last()};
   if(oo.isNeutral) oor.color='neutral';
   else if(oo.isFriend) oor.color='friend'
   else oor.color=oo.isEnemy? 'enemy': 'ally';
   oor.icon='%s_%s'.format(oo.typeMain, (oo.typeSub|| 'default'));
   processMap.dataGroupForRender.dinamic.push(oor);
}

processMap.data2group_static=function(o){
   var oo={'typeMain':'', 'typeSub':'', 'isNeutral':'', 'isEnemy':'', 'isFriend':'', 'x':{'real':[]}, 'y':{'real':[]}, 'dir':{'real':[]}};
   if(o.type.inOf('respawn_base')){
      oo.typeMain='respawn';
      //get sub-type
      if(o.icon.inOf('_bomber')) oo.typeSub='bomber';
      else if(o.icon.inOf('_fighter')) oo.typeSub='fighter';
      else if(o.icon.inOf('_tank')) oo.typeSub='tank';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }else if(o.type.inOf('capture_zone')){
      oo.typeMain='capture';
      //get sub-type
      // if(o.icon.inOf('_bomber')) oo.typeSub='bomber';
      // else if(o.icon.inOf('_fighter')) oo.typeSub='fighter';
      // else if(o.icon.inOf('_tank')) oo.typeSub='tank';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }
   if(!oo.typeMain) return;
   processMap.dataGroup.static.push(oo);
   //prep for render
   var oor={'icon':'', 'color':'', 'x':oo.x.real.last(), 'y':oo.y.real.last(), 'dir':oo.dir.real.last()};
   if(oo.isNeutral) oor.color='neutral';
   else if(oo.isFriend) oor.color='friend'
   else oor.color=oo.isEnemy? 'enemy': 'ally';
   oor.icon='%s_%s'.format(oo.typeMain, (oo.typeSub|| 'default'));
   processMap.dataGroupForRender.static.push(oor);
}