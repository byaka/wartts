function gaugEx(elem, p){
   p=p|| {};
   var shape=p.shape|| [0, 180, 30]
   var size=p.size|| [0.5, 0.5, 0.5];
   var adjust=p.adjust|| [0, 100, 0];
   var colors=p.colors|| 'red';
   var padding=(p.padding===undefined)? 10: p.padding;
   var o={
      'canvas':elem,
      'canvasCtx':elem.getContext("2d"),
      '_value':null,
      'arcFrom':shape[0], 'arcTo':shape[1], 'arcWidth':shape[2],
      'arcX':size[0], 'arcY':size[1], 'arcRadius':size[2],
      'min':adjust[0], 'max':adjust[1], 'zero':adjust[2],
      'invert':p.invert,
      'padding':padding,
      'arrow':p.arrow|| [0.8, 0.2],
      'arrowColor':p.arrowColor|| 'black',
      'arrowWidth':p.arrowWidth|| 2,
      'colors':colors
   };
   o.value=function(v, redraw){
      if(!arguments.length)
         return (o._value===null)? o.zero: o._value;
      o._value=v;
      if(redraw) o.redraw();
      return o;
   }
   o.redraw=function(){
      //calc value
      var arcSize=Math.abs(o.arcFrom-o.arcTo);
      var step=arcSize/(o.max-o.min);
      var v=o._value;
      if(v===null) v=o.zero;
      else if(v<o.min) v=o.min;
      else if(v>o.max) v=o.max;
      //if(o.invert) v=-v;
      if(o.invert) v=(o.max+o.min)-v;
      v=(v-o.min)*-step;
      v=(v-90)*deg2rad;
      //calc params
      var color=o.colors;
      if(isArray(color)){
         //calculate color
      }
      var w=o.canvas.width, h=o.canvas.height;
      o.canvasCtx.clearRect(0, 0, w, h);
      w-=o.padding*2;
      h-=o.padding*2;
      var arcRadius=o.arcRadius*Math.min(w, h), arcX=o.padding+o.arcX*w, arcY=o.padding+o.arcY*h, arcFrom=-o.arcFrom*deg2rad, arcTo=-o.arcTo*deg2rad;
      var arrowStart=0, arrowSize=0;
      if(o.arrow.length>1){
         arrowStart=o.arrow[0]*arcRadius;
         arrowSize=o.arrow[1]*arcRadius;
      }else arrowSize=o.arrow[0]*arcRadius;
      //draw arc
      o.canvasCtx.beginPath();
      o.canvasCtx.arc(arcX, arcY, arcRadius, arcFrom, arcTo, true);
      o.canvasCtx.arc(arcX, arcY, arcRadius-o.arcWidth, arcTo, arcFrom, false);
      o.canvasCtx.closePath();
      o.canvasCtx.fillStyle=color;
      o.canvasCtx.fill();
      //draw arrow
      o.canvasCtx.save()
      o.canvasCtx.translate(arcX, arcY);
      o.canvasCtx.rotate(arcFrom+v);
      o.canvasCtx.beginPath();
      o.canvasCtx.moveTo(0, arrowStart);
      o.canvasCtx.lineTo(0, arrowStart+arrowSize);
      o.canvasCtx.closePath();
      o.canvasCtx.strokeStyle=o.arrowColor;
      o.canvasCtx.lineWidth=o.arrowWidth;
      o.canvasCtx.stroke();
      o.canvasCtx.restore();
      return o;
   }
   o.redraw();
   return o;
}
