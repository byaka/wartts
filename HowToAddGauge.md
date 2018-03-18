_**For now no "easy" way to add gauges without editing sources.**_


## Creating DOM structure
Simple gauge without text value looks like:
```html
 <div id="throttle" class="gauge" style="position: relative; width: 70px; height: 100%; float: left; background-color: rgba(0, 0, 0, 0.4);">
    <canvas id="canvas" width="50" height="50" style="opacity: 0.8; margin-top: 5px; margin-bottom: 10px; margin-left: 10px;"></canvas>
    <div id="title" style="color: #999; text-align: center; font-size: 15px; margin-top: -10px;">Engine</div>
 </div>
```

Or another one with text value:
```html
 <div id="vspeed" class="gauge" style="position: relative; width: 200px; height: 100%; float: left; background-color: rgba(0, 0, 0, 0.4);">
    <canvas id="canvas" width="60" height="120" style="opacity: 0.8;"></canvas>
    <div id="value" style="position: absolute; width: 120px; height: 40px; line-height: 40px; color: #ccc; left: 40px; top: 25px; text-align: center; font-size: 40px; font-weight: bold;"></div>
    <div id="suffix" style="position: absolute; width: 100px; height: 30px; line-height: 30px; color: #777; left: 50px; top: 65px; text-align: center; font-size: 25px; font-weight: bold;">m/s</div>
    <div id="title" style="color: #999; text-align: center; font-size: 17px; margin-top: -10px;">Vertical speed</div>
 </div>
```
You can place it anywhere in [index.html](https://github.com/byaka/wartts/blob/master/index.html), but i recomend one of [.hud](https://github.com/byaka/wartts/blob/master/index.html#L16) wrappers.

## Selecting data source
If you want to create gauge from one of Wartts's status variables (wartts recieve them from game's api) like speed, throttle etc, watch this section.

App collects all data from [/indicators](https://github.com/byaka/WarThunderTacticalScreen_discuss/blob/master/API/indicators2.js) and [/state](https://github.com/byaka/WarThunderTacticalScreen_discuss/blob/master/API/state2.js) APIs and merges them together so no matter where data came from.

Some names there not clear and also some values need to be converted. For this check [convKeyMap](https://github.com/byaka/wartts/blob/master/js/processStatus.js#L64) and [convValMap](https://github.com/byaka/wartts/blob/master/js/processStatus.js#L67).

## Preparing environment
Now we let to know Wartts about our gauges.

Simple gauge without text value looks like:
```javascript
renderHud.domLink.throttle=$('.hud #throttle #canvas')[0];
renderHud.gauge.throttle=gaugEx(renderHud.domLink.throttle, {
   'shape':[30, 300, 10],
   'size':[0.5, 0.5, 0.5],
   'adjust':[0, 1, 0],
   'colors':{0:'#ffffff', 1:'#92FFBE'},
   'invert':false,
   'padding':0,
   'arrow':[0.55, 0.45],
   'arrowWidth':10,
   'arrowColor':'#000'
});
```

Or another one with text value:
```javascript
renderHud.domLink.vspeed=$('.hud #vspeed #canvas')[0];
renderHud.domLink.vspeedValue=$('.hud #vspeed #value');
renderHud.gauge.vspeed=gaugEx(renderHud.domLink.vspeed, {
   'shape':[90, 270, 10],
   'size':[1, 0.5, 1],
   'adjust':[-50, 50, 0],
   'colors':'#92ffbe',
   'invert':true,
   'padding':5,
   'arrow':[0.6, 0.4],
   'arrowWidth':10,
   'arrowColor':'#000'
});
```
If you want to use data from Wartts's status variables for your gauge, in `renderHud.gauge.<name>` and `renderHud.domLink.<name>` use same name like your prefered variable.

You can place this code anywhere, but i recomend [renderHud.init()](https://github.com/byaka/wartts/blob/master/js/renderHud.js#L5).

## Redrawing
Now you need to redraw gauge if it's value changed.

If you use data from Wartts's status variables, app can do it automatically. All you need to do - place name of your gauge [here](https://github.com/byaka/wartts/blob/master/js/renderHud.js#L44). Also if you want to show text value and need to adjust it (re-rounding it for example), check [this](https://github.com/byaka/wartts/blob/master/js/renderHud.js#L38).

But if you use your own data and\or want to control redrawing manually:
```javascript
renderHud.gauge.<name>.value();  //returns current value of gauge
renderHud.gauge.<name>.value(<value>, true);  //set new value and force redrawing
renderHud.domLink[<name>+'Value'].text();  //returns current text value of gauge
renderHud.domLink[<name>+'Value'].text(<value>)  //set new text value and force redrawing
```

