var processMap={
   'apiFake':false,
   'apiHost':'',
   'dataGroup':{'dinamic':[], 'player':[], 'static':[]},
   'dataGroupForRender':{'dinamic':[], 'player':[], 'static':[]},
   'grid':{},
   'timer':null,
   'mapHash':{}
};

processMap.init=function(apiHost){
   processMap.apiHost=apiHost;
   processMap.timer=setTimeout(processMap.update, 100);
}

processMap.update=function(){
   clearTimeout(processMap.timer);
   processMap.dataFromApi(function(){
      processMap.timer=setTimeout(processMap.update, 100);
   });
   if(getms(true)-processMap.isMapChanged.lastTime>5000){
      processMap.isMapChanged.lastTime=getms(true);
      processMap.isMapChanged();
   }
}

processMap.isMapChanged=function(){
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
      dataAll[p.url]=data;
      if(rCount) return;
      var changed=false;
      forMe(dataAll, function(u, d){
         if(!d) return;
         var h=d.hashCode();
         if(processMap.mapHash[u]==h) return;
         processMap.mapHash[u]=h;
         if(u.inOf('/mapInfo.js') || u.inOf('/map_info.json')){
            // get grid settings
            var data=JSON.parse(d);
            processMap.grid={
               'min':data.map_min,
               'max':data.map_max,
               'zero':data.grid_zero,
               'step':data.grid_steps
            };
            processMap.calc_coord2meter();
         }
         changed=true;
      })
      if(!changed) return;
      print('MAP CHANGED');
      if(window.mapChangedCB){
         if(isFunction(mapChangedCB)) mapChangedCB();
         else if(isArray(mapChangedCB)) mapChangedCB=forMe(mapChangedCB, function(f){
            return f()? f: null;
         }, null, true);
      }
      renderingQueue_mapBackground();
      processMap.isMapChanged.lastTime=getms(true);
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
      url.push(s+'/mapObjects7.js');
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
         processMap.data2group_player(o, 'neutral');
      else if(processMap.calcRel(o)==='friend')
         processMap.data2group_player(o, 'friend');
      else if(Math.abs(o.ex)>=1 || Math.abs(o.ey)>=1 || Math.abs(o.sx)>=1 || Math.abs(o.sy)>=1 || Math.abs(o.x)>=1 || Math.abs(o.y)>=1)
         return; //invisible
      else if(['aircraft', 'ground_model', 'airfield'].inOf(o.type))
         processMap.data2group_dinamic(o);
      else if(['capture_zone', 'respawn_base_bomber', 'respawn_base_fighter', 'defending_point', 'bombing_point'].inOf(o.type)) //, 'respawn_base_tank'
         processMap.data2group_static(o);
   })
   forMe(groups, function(g){
      //to parent process
      var s=JSON.stringify(processMap.dataGroupForRender[g]);
      if(!s || s.hashCode()!=oldHash[g])
         renderingQueue_mapObjects(Object.make([[g, cloneMe(processMap.dataGroupForRender[g], false, false, false)]]));
   })
}

processMap.calcRel=function(o, oo){
   //get relation-ship
   var c=o.color.toLowerCase();
   if(['#fffffa'].inOf(c)) oo? oo.isNeutral=true: oo='neutral';
   else if(['#60ff37', '#aaff8e'].inOf(c)) oo? oo.isFriend=true: oo='friend';
   else if(['#1952ff'].inOf(c)) oo? oo.isEnemy=false: oo='ally';
   else if(['#ff0d00', '#e10b00', '#f40c00'].inOf(c)) oo? oo.isEnemy=true: oo='enemy';
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
   }else if(o.type=='ground_model'){
      oo.typeMain='ground';
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

   // calc distance from player
   if(id=='neutral' && processMap.grid.coord2meter){
      forMe(processMap.dataGroupForRender.dinamic, function(oor2){
         oor2.distance=Math.sqrt((oor2.x-oor.x)**2+(oor2.y-oor.y)**2);
         oor2.distance=oor2.distance*processMap.grid.coord2meter[0];
         // print(oor.x, oor2.x)
         // print(oor2.distance)
      })
   }

}

processMap.data2group_dinamic=function(o){
   var oo={'typeMain':'', 'typeSub':'', 'isNeutral':'', 'isEnemy':'', 'isFriend':'', 'x':{'real':[]}, 'y':{'real':[]}, 'dir':{'real':[]}};
   if(o.type==='aircraft'){
      oo.typeMain='air';
      //get sub-type
      if(o.icon==='Bomber') oo.typeSub='bomber';
      else if(o.icon==='Assault') oo.typeSub='assault';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }else if(o.type==='ground_model'){
      if(['Ship'].inOf(o.icon)) oo.typeMain='sea';
      else oo.typeMain='ground';
      if(o.icon==='Wheeled') oo.typeSub='wheeled';
      else if(o.icon==='Airdefence') oo.typeSub='airdefence';
      else if(o.icon==='Tracked') oo.typeSub='tank';
      else if(o.icon==='LightTank') oo.typeSub='light';
      else if(o.icon==='MediumTank') oo.typeSub='medium';
      else if(o.icon==='HeavyTank') oo.typeSub='heavy';
      else if(o.icon==='DestroyerTank') oo.typeSub='destroyer';
      processMap.calcRel(o, oo);
      //get coords
      oo.x.real.push(o.x);
      oo.y.real.push(o.y);
      //calc direction
      oo.dir.real.push(Math.atan2(o.dx, -o.dy));
   }else if(o.type==='airfield'){
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
   var oor={'icon':'', 'color':'', 'x':oo.x.real.last(), 'y':oo.y.real.last(), 'dir':oo.dir.real.last(), 'distance':null};
   // calc distance from player
   var player=processMap.dataGroupForRender.player.inObj('color', 'neutral', true);  //get self player, not friend
   if(player && processMap.grid.coord2meter){
      var d=Math.sqrt((oor.x-player.x)**2+(oor.y-player.y)**2);
      oor.distance=d*processMap.grid.coord2meter[0];
   }
   // others
   if(oo.isNeutral) oor.color='neutral';
   else if(oo.isFriend) oor.color='friend';
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

processMap.calc_coord2meter=function(){
   var sizeX=Math.abs(processMap.grid.min[0])+Math.abs(processMap.grid.max[0]);
   var size2mX=processMap.grid.step[0]/1000;
   var coord2sizeX=1/sizeX;
   var coord2mX=coord2sizeX*size2mX;
   coord2mX=coord2mX*1000/2;  //! видимо в формуле гдето ошибка, без этой поправки значения не сходятся
   var coord2mY=coord2mX;
   processMap.grid.coord2meter=[coord2mX, coord2mY];
}
