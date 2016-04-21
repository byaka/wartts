var renderMap={
   'image':{
      'air_player':'img/player.png',
      'air_default':'img/plane_default.png',
      'air_bomber':'img/plane_bomber.png',
      'ground_default':'img/ground_default.png',
      'ground_wheeled':'img/ground_wheeled.png',
      'ground_airdefence':'img/ground_airdefence.png',
      'ground_tank':'img/ground_tank.png',
      'sea_default':'img/sea_default.png',
      'respawn_bomber':'img/respawn_bomber.png',
      'respawn_fighter':'img/respawn_fighter.png',
      'respawn_tank':'img/respawn_tank.png',
      'capture_default':'img/capture_default.png',
      'windrose':'img/windrose.png'
   },
   'color':{'friend':'#0dff0d', 'ally':'#1040ff', 'enemy':'#ff0d0d', 'neutral':'#f0f0f0'},
   'imageColoringBlacklist':['air_player', 'windrose'],
   'layerDrawer':{}
};

renderMap.init=function(){
   //load and prepare images
   forMe(renderMap.image, function(name, url){
      if(!url) return;
      else if(renderMap.imageColoringBlacklist.inOf(name)){
         initQueue.push(name);
         var img=new Image();
         img.onload=function(){
            renderMap.image[name]=this;
            initQueue.splice(initQueue.indexOf(name), 1);
         }
         img.src=url;
      }else{
         initQueue.push(name);
         imageColoring(url, renderMap.color, function(r){
            renderMap.image[name]=r;
            initQueue.splice(initQueue.indexOf(name), 1);
         })
      }
   })
}

renderMap.rotateCanvas=function(canvas, canvasCtx, setts, angle, angleInRad, x, y){
   angle=angleInRad? angle: angle*deg2rad;
   if(x===undefined)
      x=setts.angleTrans? setts.angleTransX: setts.left+(setts.width*setts.zoom)/2;
   if(y===undefined)
      y=setts.angleTrans? setts.angleTransY: setts.top+(setts.height*setts.zoom)/2;
   // x=(x===undefined)? setts.left+(setts.width*setts.zoom)/2: x;
   // y=(y===undefined)? setts.top+(setts.height*setts.zoom)/2: y;
   canvasCtx.translate(x, y);
   canvasCtx.rotate(angle);
   canvasCtx.translate(-x, -y)
   return {'x':x, 'y':y, 'r':angle};
}

renderMap.rotateCoords=function(x, y, angle, angleInRad){
   angle=angleInRad? angle: angle*deg2rad;
   var angleCos=Math.cos(angle), angleSin=Math.sin(angle);
   var x2=  angleCos*x + angleSin*y;
   var y2= -angleSin*x + angleCos*y;
   return {'x':x2, 'y':y2, 'r':angle};
}

renderMap.layerDrawer.background=function(canvas, canvasCtx, data, setts, clear){
   //clear canvas
   if(clear)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
   var img=data.img;
   if(!img) return;
   //rotate coords
   var rotated=renderMap.rotateCoords(setts.left, setts.top, -setts.angle);
   //calc coords
   var x=rotated.x;
   var y=rotated.y;
   //cal size
   var w=img.width*setts.zoom;
   var h=img.height*setts.zoom;
   //save canvas's state
   canvasCtx.save();
   //rotate map
   renderMap.rotateCanvas(canvas, canvasCtx, setts, rotated.r, true);
   //draw image with scalling
   // canvasCtx.mozImageSmoothingEnabled=false;
   // canvasCtx.webkitImageSmoothingEnabled=false;
   // canvasCtx.msImageSmoothingEnabled=false;
   // canvasCtx.imageSmoothingEnabled=false;
   canvasCtx.drawImage(img, x, y, w, h);
   //restore state
   canvasCtx.restore();
}

renderMap.layerDrawer.player=function(canvas, canvasCtx, data, setts, clear){
   data=isArray(data)? data: [data];
   //clear canvas
   if(clear)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
   var imgW=28, imgH=28, imgDX=-imgW/2, imgDY=-imgH/2;
   //rotate coords
   var rotated=renderMap.rotateCoords(setts.left, setts.top, -setts.angle);
   var mapW=setts.width*setts.zoom, mapH=setts.height*setts.zoom;
   //iterate objects
   forMe(data, function(o){
      if(!renderMap.image[o.icon]) return;
      var img=renderMap.image[o.icon];
      if(!img) return;
      //calc coords
      var x=mapW*o.x+rotated.x;
      var y=mapH*o.y+rotated.y;
      //save canvas's state
      canvasCtx.save();
      //rotate map
      renderMap.rotateCanvas(canvas, canvasCtx, setts, rotated.r, true);
      //rotate canvas by direction's angle from position's point
      renderMap.rotateCanvas(canvas, canvasCtx, setts, o.dir, true, x, y);
      //draw future path
      canvasCtx.globalAlpha=0.6;
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, y+imgDY);
      canvasCtx.lineTo(x, y+imgDY-200*setts.zoom)
      canvasCtx.closePath()
      canvasCtx.lineWidth=1;
      canvasCtx.strokeStyle=renderMap.color.neutral;
      canvasCtx.lineCap="round";
      canvasCtx.setLineDash([5, 15]);
      canvasCtx.stroke()
      //draw image with scalling
      canvasCtx.globalAlpha=0.9;
      canvasCtx.drawImage(img, x+imgDX, y+imgDY, imgW, imgH);
      //draw windrose
      // canvasCtx.globalAlpha=0.5;
      // var wrw=200*Math.sqrt(1+setts.zoom);
      // canvasCtx.drawImage(renderMap.image.windrose, x-wrw/2, y-wrw/2, wrw, wrw);
      //restore state
      canvasCtx.restore();
   })
}

renderMap.layerDrawer.static=function(canvas, canvasCtx, data, setts, clear){
   data=isArray(data)? data: [data];
   //clear canvas
   if(clear)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
   var imgW=22, imgH=22, imgDX=-imgW/2, imgDY=-imgH/2;
   var imgBigW=30, imgBigH=30, imgBigDX=-imgBigW/2, imgBigDY=-imgBigH/2;
   //rotate coords
   var rotated=renderMap.rotateCoords(setts.left, setts.top, -setts.angle);
   var mapW=setts.width*setts.zoom, mapH=setts.height*setts.zoom;
   var airfieldZoom=3.0*Math.sqrt(1+setts.zoom);
   //iterate objects
   forMe(data, function(o){
      var isRespawn=o.icon.inOf('respawn_');
      var isCapture=o.icon.inOf('capture_');
      var isAirfield=o.icon.inOf('airfield_');
      var isBig=isRespawn || isCapture;
      if(isAirfield){
         //calc coords
         var x=[mapW*o.x[0]+rotated.x, mapW*o.x[1]+rotated.x];
         var y=[mapH*o.y[0]+rotated.y, mapH*o.y[1]+rotated.y];
      }else{
         if(!renderMap.image[o.icon]) return;
         var img=renderMap.image[o.icon][o.color];
         if(!img) return;
         //calc coords
         var x=mapW*o.x+rotated.x;
         var y=mapH*o.y+rotated.y;
      }
      //save canvas's state
      canvasCtx.save();
      //rotate map
      renderMap.rotateCanvas(canvas, canvasCtx, setts, rotated.r, true);
      if(isAirfield){
         canvasCtx.beginPath();
         canvasCtx.moveTo(x[0], y[0]);
         canvasCtx.lineTo(x[1], y[1])
         canvasCtx.closePath()
         canvasCtx.lineWidth=airfieldZoom;
         canvasCtx.strokeStyle=renderMap.color[o.color]|| o.color|| 'white';
         canvasCtx.stroke()
      }else{
         if(isRespawn)
            canvasCtx.globalAlpha=0.3;
         else
            canvasCtx.globalAlpha=(o.color==='enemy')? 0.9: 0.7;
         //rotate canvas by direction's angle from position's point
         renderMap.rotateCanvas(canvas, canvasCtx, setts, o.dir, true, x, y);
         //draw image with scalling
         canvasCtx.drawImage(img, x+(isBig? imgBigDX: imgDX), y+(isBig? imgBigDY: imgDY), (isBig? imgBigW: imgW), (isBig? imgBigH: imgH));
      }
      //restore state
      canvasCtx.restore();
   })
}

renderMap.layerDrawer.dinamic=function(canvas, canvasCtx, data, setts, clear){
   data=isArray(data)? data: [data];
   //clear canvas
   if(clear)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
   var imgW=22, imgH=22, imgDX=-imgW/2, imgDY=-imgH/2;
   //rotate coords
   var rotated=renderMap.rotateCoords(setts.left, setts.top, -setts.angle);
   var mapW=setts.width*setts.zoom, mapH=setts.height*setts.zoom;
   var airfieldZoom=3.0*Math.sqrt(1+setts.zoom);
   //iterate objects
   forMe(data, function(o){
      var isAirfield=['airfield_default'].inOf(o.icon);
      if(isAirfield){
         //calc coords
         var x=[mapW*o.x[0]+rotated.x, mapW*o.x[1]+rotated.x];
         var y=[mapH*o.y[0]+rotated.y, mapH*o.y[1]+rotated.y];
      }else{
         if(!renderMap.image[o.icon]) return;
         var img=renderMap.image[o.icon][o.color];
         if(!img) return;
         //calc coords
         var x=mapW*o.x+rotated.x;
         var y=mapH*o.y+rotated.y;
      }
      //save canvas's state
      canvasCtx.save();
      //rotate map
      renderMap.rotateCanvas(canvas, canvasCtx, setts, rotated.r, true);
      if(isAirfield){
         canvasCtx.beginPath();
         canvasCtx.moveTo(x[0], y[0]);
         canvasCtx.lineTo(x[1], y[1])
         canvasCtx.closePath()
         canvasCtx.lineWidth=airfieldZoom;
         canvasCtx.strokeStyle=renderMap.color[o.color]|| o.color|| 'white';
         canvasCtx.stroke()
      }else{
         canvasCtx.globalAlpha=(o.color=='enemy')? 0.9: 0.7;
         //rotate canvas by direction's angle from position's point
         renderMap.rotateCanvas(canvas, canvasCtx, setts, o.dir, true, x, y);
         //draw image with scalling
         canvasCtx.drawImage(img, x+imgDX, y+imgDY, imgW, imgH);
      }
      //restore state
      canvasCtx.restore();
   })
}

renderMap.layerDrawer.debug=function(canvas, canvasCtx, data, setts, clear){
   data=isArray(data)? data: [data];
   //clear canvas
   if(clear)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
   var imgW=22, imgH=22, imgDX=-imgW/2, imgDY=-imgH/2;
   //rotate coords
   var rotated=renderMap.rotateCoords(setts.left, setts.top, -setts.angle);
   var mapW=setts.width*setts.zoom, mapH=setts.height*setts.zoom;
   //iterate objects
   forMe(data, function(o, i){
      //save canvas's state
      canvasCtx.save();
      //rotate map
      s=renderMap.rotateCanvas(canvas, canvasCtx, setts, rotated.r, true);
      if(!i){
         canvasCtx.fillStyle='red';
         // print('ROTATING_POINT', s.x, s.y)
         canvasCtx.fillRect(s.x+rotated.x, s.y+rotated.y, 5, 5);
      }
      if(o.type==='polygon'){
         canvasCtx.beginPath();
         forMe(o.point, function(p, i){
            //calc coords
            var x=mapW*p[0]+rotated.x, y=mapH*p[1]+rotated.y;
            if(!i) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y)
         })
         canvasCtx.closePath()
         canvasCtx.lineWidth=1;
         canvasCtx.strokeStyle=renderMap.color[o.color]|| o.color|| 'white';
         canvasCtx.stroke()
      }else if(o.type==='dot'){
         canvasCtx.fillStyle=renderMap.color[o.color]|| o.color|| 'white';
         canvasCtx.fillRect(o.x+rotated.x, o.y+rotated.y, o.size|| 1, o.size|| 1);
      }
      //restore state
      canvasCtx.restore();
   })
}


