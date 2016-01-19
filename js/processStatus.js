var processStatus={
   'apiFake':false,
   'apiHost':'',
   'dataGroup':{'dinamic':{}, 'static':{}},
   'dataGroupForRender':{'dinamic':{}, 'static':{}},
   'timer':null
};

processStatus.init=function(apiHost){
   processStatus.apiHost=apiHost;
   processStatus.timer=setTimeout(function(){
      clearTimeout(processStatus.timer);
      processStatus.dataFromApi();
      processStatus.timer=setTimeout(arguments.callee, 50);
   }, 500);
}

processStatus.dataFromApi=function(){
   var url=processStatus.apiHost+'/indicators';
   if(processStatus.apiFake) //if fakeApi enabled, we get API request from github's example
      url='https://raw.githubusercontent.com/byaka/WarThunderTacticalScreen_discuss/master/API/indicators2.js';
   ajaxMe(url, function(data, status, r) {
      if(!data) //empty request
         return print('EMPTY_STATE');
      //parse to JSON
      var data=JSON.parse(data);
      processStatus.data2group(data);
   })
}

processStatus.data2group=function(data){
   var groups=['dinamic', 'player', 'static'];
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
   var static=['type'];
   var convKeyMap={
      'type':'model', 'vario': 'vspeed', 'speed':'speed'
   }
   var convValMap={
      'speed':function(v){return v*3.6}
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
      if(!s || s.hashCode()!=oldHash[g])
         renderingQueue_hud(Object.make([[g, cloneMe(processStatus.dataGroupForRender[g])]]));
   })

}