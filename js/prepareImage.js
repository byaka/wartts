var tmpCanvas1=window.tmpCanvas1|| document.createElement("canvas");
var tmpCanvasCtx1=window.tmpCanvasCtx1|| window.tmpCanvas1.getContext("2d");
var tmpCanvas2=window.tmpCanvas2|| document.createElement("canvas");
var tmpCanvasCtx2=window.tmpCanvasCtx2|| window.tmpCanvas2.getContext("2d");

function imageColoring(url, color, cb){
   var res={};
   var img=new Image();
   img.onload=function(){
      this.onload=null;
      res['default']=this;
      image2canvas(this);
      forMe(color, function(id, c){
         var data={'img':new Image(), 'original':canvas2pixels(), 'new':canvas2pixels()};
         data.img.onload=function(){
            res[id]=this;
            if(Object.keys(res).length<Object.keys(color).length) return;
            tmpCanvasCtx1.clearRect(0, 0, tmpCanvas1.width, tmpCanvas1.height);
            cb(res);
         }
         if(isString(c)) c=hex2rgb(c);
         changeColor(data, c);
      })
   }
   img.src=url;
}

function imageSaturation(url, s, cb){
   var tFunc=function(e, img){
      if(!img){
         this.onload=null;
         img=this;
      }
      image2canvas(img);
      var data={'img':new Image(), 'original':canvas2pixels(), 'new':canvas2pixels()};
      data.img.onload=function(){
         res=this;
         tmpCanvasCtx1.clearRect(0, 0, tmpCanvas1.width, tmpCanvas1.height);
         cb(res);
      }
      changeSaturation(data, s);
   }
   var res=null;
   if(isString(url)){
      var img=new Image();
      img.onload=tFunc;
      img.src=url;
   }else{
      tFunc(null, url);
   }
}


function image2canvas(img){
   tmpCanvas1.width=img.width;
   tmpCanvas1.height=img.height;
   tmpCanvasCtx1.clearRect(0, 0, tmpCanvas1.width, tmpCanvas1.height);
   tmpCanvasCtx1.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, img.width, img.height);
}

function canvas2pixels(){
   return tmpCanvasCtx1.getImageData(0, 0, tmpCanvas1.width, tmpCanvas1.height);
}

function hex2rgb(hex){
   var l=parseInt(hex.replace(/^#/, ""), 16);
   return {
      r:(l >>> 16) & 0xff,
      g:(l >>> 8) & 0xff,
      b:l & 0xff
   };
}

function changeColor(data, color){
   for(var i=0, l=data.original.data.length; i<l; i+=4){
      if(data.new.data[i+3]>0){ // If it's not a transparent pixel
         data.new.data[i]=data.original.data[i]/255*color.r;
         data.new.data[i+1]=data.original.data[i+1]/255*color.g;
         data.new.data[i+2]=data.original.data[i+2]/255*color.b;
      }
   }
   tmpCanvas2.width=tmpCanvas1.width;
   tmpCanvas2.height=tmpCanvas1.height;
   tmpCanvasCtx2.clearRect(0, 0, tmpCanvas2.width, tmpCanvas2.height);
   tmpCanvasCtx2.putImageData(data.new, 0, 0);
   data.img.src=tmpCanvas2.toDataURL("image/png");
}

function changeSaturation(data, sv){
   var luR = 0.3086; // constant to determine luminance of red. Similarly, for green and blue
   var luG = 0.6094;
   var luB = 0.0820;

   var az = (1 - sv)*luR + sv;
   var bz = (1 - sv)*luG;
   var cz = (1 - sv)*luB;
   var dz = (1 - sv)*luR;
   var ez = (1 - sv)*luG + sv;
   var fz = (1 - sv)*luB;
   var gz = (1 - sv)*luR;
   var hz = (1 - sv)*luG;
   var iz = (1 - sv)*luB + sv;

   for(var i=0, l=data.new.data.length; i<l; i+=4){
       var red = data.new.data[i]; // Extract original red color [0 to 255]. Similarly for green and blue below
       var green = data.new.data[i + 1];
       var blue = data.new.data[i + 2];

       var saturatedRed = (az*red + bz*green + cz*blue);
       var saturatedGreen = (dz*red + ez*green + fz*blue);
       var saturateddBlue = (gz*red + hz*green + iz*blue);

       data.new.data[i] = saturatedRed;
       data.new.data[i + 1] = saturatedGreen;
       data.new.data[i + 2] = saturateddBlue;
   }
   tmpCanvas2.width=tmpCanvas1.width;
   tmpCanvas2.height=tmpCanvas1.height;
   tmpCanvasCtx2.clearRect(0, 0, tmpCanvas2.width, tmpCanvas2.height);
   tmpCanvasCtx2.putImageData(data.new, 0, 0);
   data.img.src=tmpCanvas2.toDataURL("image/png");
}