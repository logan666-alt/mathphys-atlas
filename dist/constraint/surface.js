/* Original constraint-surface renderer, mounted only on its resource page. */
(function(){
  'use strict';
  let dispose=function(){};
  const markup="\n<div id=\"constraint-pvt\">\n  <h3>状态曲面 pv = nRt</h3>\n  <div class=\"parameters\">\n    <label class=\"form-label\">\n      <span class=\"parameter-head\"><span>压强 p（kPa）</span><output id=\"pvt-p-value\" class=\"tabular-nums\">100</output></span>\n      <input id=\"pvt-p\" class=\"form-range\" type=\"range\" min=\"40\" max=\"180\" step=\"1\" value=\"100\" aria-label=\"压强 p，单位 kPa\">\n    </label>\n    <label class=\"form-label\">\n      <span class=\"parameter-head\"><span>体积 v（L）</span><output id=\"pvt-v-value\" class=\"tabular-nums\">25.0</output></span>\n      <input id=\"pvt-v\" class=\"form-range\" type=\"range\" min=\"10\" max=\"45\" step=\"0.1\" value=\"25\" aria-label=\"体积 v，单位 L\">\n    </label>\n  </div>\n  <div class=\"options\">\n    <div class=\"fixed-field\">\n      <label class=\"form-label\" for=\"pvt-fixed\">固定量</label>\n      <select id=\"pvt-fixed\" class=\"form-select\">\n        <option value=\"t\">t · 等温</option>\n        <option value=\"v\">v · 等容</option>\n        <option value=\"p\">p · 等压</option>\n      </select>\n    </div>\n    <label class=\"form-check\"><input id=\"pvt-slice\" class=\"form-check-input\" type=\"checkbox\" checked><span class=\"form-check-label\">截平面</span></label>\n    <label class=\"form-check\"><input id=\"pvt-tangent\" class=\"form-check-input\" type=\"checkbox\" checked><span class=\"form-check-label\">切平面</span></label>\n  </div>\n  <div class=\"legend text-small\" aria-label=\"三条截线的颜色\">\n    <span class=\"legend-item\"><i class=\"swatch series-t\" aria-hidden=\"true\"></i>固定 t · 等温</span>\n    <span class=\"legend-item\"><i class=\"swatch series-v\" aria-hidden=\"true\"></i>固定 v · 等容</span>\n    <span class=\"legend-item\"><i class=\"swatch series-p\" aria-hidden=\"true\"></i>固定 p · 等压</span>\n  </div>\n  <div class=\"point-readout tabular-nums\" id=\"pvt-point\"></div>\n  <div class=\"scene\">\n    <canvas id=\"pvt-scene\" tabindex=\"0\" role=\"img\" aria-keyshortcuts=\"ArrowLeft ArrowRight ArrowUp ArrowDown + - Home\" aria-label=\"理想气体 p、v、t 状态曲面，显示当前点、三条截线及切平面\">可旋转的 p、v、t 状态曲面。</canvas>\n  </div>\n  <div class=\"lower\">\n    <div>\n      <div class=\"projection-head\">\n        <span class=\"weight-medium\">当前截线的二维投影</span>\n        <button id=\"pvt-swap\" class=\"button outline small\" type=\"button\" aria-pressed=\"false\">交换横纵轴</button>\n      </div>\n      <svg id=\"pvt-projection\" class=\"projection\" role=\"img\" aria-label=\"当前截线和切线斜率\"></svg>\n      <div id=\"pvt-projection-value\" class=\"projection-value text-small tabular-nums\" aria-live=\"polite\"></div>\n    </div>\n    <div class=\"derivatives\" aria-live=\"polite\">\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-t\" aria-hidden=\"true\"></i><span>(∂v/∂p)<sub>t</sub> = −v/p</span></span>\n        <output id=\"pvt-dt\" class=\"tabular-nums weight-medium\"></output>\n      </div>\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-v\" aria-hidden=\"true\"></i><span>(∂p/∂t)<sub>v</sub> = nR/v</span></span>\n        <output id=\"pvt-dv\" class=\"tabular-nums weight-medium\"></output>\n      </div>\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-p\" aria-hidden=\"true\"></i><span>(∂t/∂v)<sub>p</sub> = p/nR</span></span>\n        <output id=\"pvt-dp\" class=\"tabular-nums weight-medium\"></output>\n      </div>\n      <div class=\"product weight-medium\"><span>循环乘积</span><output id=\"pvt-product\" class=\"tabular-nums\">−1.000</output></div>\n    </div>\n  </div>\n  <span id=\"pvt-accessible\" class=\"sr-only\" aria-live=\"polite\"></span>\n</div>\n";
  function mount(){
    dispose();

    const root = document.getElementById('constraint-pvt');
    if (!root) return;
    const controller = new AbortController();
    const on = function (node, type, handler, options) { node.addEventListener(type, handler, Object.assign({}, options, {signal:controller.signal})); };
    let frameId = 0;
    const find = function (id) { return root.querySelector('#' + id); };
    const canvas = find('pvt-scene');
    const ctx = canvas.getContext('2d');
    const projection = find('pvt-projection');
    const defaults = {version:2,p:100,v:25,fixed:'t',slice:true,tangent:true,swap:false,az:0.60,el:0.55,zoom:1};
    let state = Object.assign({}, defaults);
    let colors = {};
    let themeKey = '';
    let renderPending = false;
    let saveTimer = null;
    let width = 0;
    let height = 0;
    let unitScale = 0;
    const GAS = 8.314; // nR for n = 1 mol, in kPa·L/K.
    const axisScale = [100,25,2500/GAS]; // Drawing scale for the three physical axes.
    const units = {p:'kPa',v:'L',t:'K'};
    const plotPoint = function (a) { return a.map(function(value,i){return value/axisScale[i];}); };
    const center = [1,1,1.75];
    const minCoord = 0.22;
    const maxCoord = 2;
    const dot = function (a,b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; };
    const add = function (a,b) { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; };
    const mul = function (a,k) { return [a[0]*k,a[1]*k,a[2]*k]; };
    const norm = function (a) { return Math.hypot(a[0],a[1],a[2]); };
    const normalize = function (a) { return mul(a,1/norm(a)); };
    const clamp = function (x,a,b) { return Math.max(a,Math.min(b,x)); };
    const fmt = function (x,d) { return (Math.abs(x)<0.5*Math.pow(10,-d)?0:x).toFixed(d).replace('-','−'); };
    const tangents = function () { return {t:[state.p,-state.v,0],v:[1,0,state.v/GAS],p:[0,1,state.p/GAS]}; };
    const plotTangents = function () { return Object.fromEntries(Object.entries(tangents()).map(function(entry){return [entry[0],plotPoint(entry[1])];})); };
    const point = function () { return [state.p,state.v,state.p*state.v/GAS]; };
    function readState() {
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      const oldVolume=Number(params.get('v'));
      const legacy=params.has('u')||['u','w'].includes(params.get('fixed'))||(!params.has('p')&&params.has('v')&&oldVolume>=0.4&&oldVolume<=1.8);
      const numeric=function(key){const value=params.get(key);return value!==null&&value.trim()!==''&&Number.isFinite(Number(value))?Number(value):null;};
      const pressure=numeric(legacy?'u':'p'),volume=numeric('v');
      if(pressure!==null)state.p=clamp(pressure*(legacy?100:1),40,180);
      if(volume!==null)state.v=clamp(volume*(legacy?25:1),10,45);
      ['az','el','zoom'].forEach(function(k){
        const value=numeric(k);if(value===null)return;
        state[k]=k==='el'?clamp(value,-1.25,1.35):k==='zoom'?clamp(value,0.62,2.5):value%(Math.PI*2);
      });
      const fixed=legacy?({u:'p',v:'v',w:'t'}[params.get('fixed')]):params.get('fixed');
      if(['p','v','t'].includes(fixed))state.fixed=fixed;
      ['slice','tangent','swap'].forEach(function(k){if(['0','1'].includes(params.get(k)))state[k]=params.get(k)==='1';});
    }
    function save() {
      if(!location.hash.startsWith('#/resource/constraint-surface'))return;
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      ['u','normal'].forEach(function(k){params.delete(k);});
      ['p','v','az','el','zoom'].forEach(function(k){
        if(Math.abs(state[k]-defaults[k])<0.0001)params.delete(k);
        else params.set(k,state[k].toFixed(k==='p'||k==='v'?2:3));
      });
      if(state.fixed===defaults.fixed)params.delete('fixed');else params.set('fixed',state.fixed);
      ['slice','tangent','swap'].forEach(function(k){if(state[k]===defaults[k])params.delete(k);else params.set(k,state[k]?'1':'0');});
      const query=params.toString();history.replaceState(null,'','#/resource/constraint-surface'+(query?'?'+query:''));
    }
    function scheduleSave() { clearTimeout(saveTimer);saveTimer=setTimeout(save,220); }
    function resolveColor(token) {
      const probe=document.createElement('span');
      probe.style.color='var('+token+')';
      probe.style.display='none';
      root.appendChild(probe);
      const value=getComputedStyle(probe).color;
      probe.remove();
      return value;
    }
    function refreshTheme() {
      colors={
        fg:resolveColor('--foreground'),
        bg:resolveColor('--background'),
        muted:resolveColor('--muted-foreground'),
        border:resolveColor('--border'),
        t:resolveColor('--viz-series-1'),
        v:resolveColor('--viz-series-2'),
        p:resolveColor('--viz-series-3')
      };
      themeKey=Object.values(colors).join('|');
    }
    function project(p) {
      const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2];
      const right=Math.cos(state.az)*x-Math.sin(state.az)*y;
      const horizontal=Math.sin(state.az)*x+Math.cos(state.az)*y;
      const vertical=Math.cos(state.el)*z-Math.sin(state.el)*horizontal;
      const depth=Math.cos(state.el)*horizontal+Math.sin(state.el)*z;
      return {x:width*0.5+right*unitScale,y:height*0.50-vertical*unitScale,d:depth};
    }
    function line3(points,color,lineWidth,alpha,dash) {
      if (points.length<2) return;
      ctx.save();
      ctx.globalAlpha=alpha==null?1:alpha;
      ctx.strokeStyle=color;
      ctx.lineWidth=lineWidth;
      ctx.lineJoin='round';
      ctx.lineCap='round';
      ctx.setLineDash(dash||[]);
      ctx.beginPath();
      points.forEach(function(p,i) { const q=project(p); if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y); });
      ctx.stroke();
      ctx.restore();
    }
    function arrow3(origin,direction,length,color,lineWidth) {
      const end=add(origin,mul(normalize(direction),length));
      const a=project(origin),b=project(end);
      line3([origin,end],color,lineWidth,1);
      const angle=Math.atan2(b.y-a.y,b.x-a.x);
      const size=9;
      ctx.fillStyle=color;
      ctx.beginPath();
      ctx.moveTo(b.x,b.y);
      ctx.lineTo(b.x-size*Math.cos(angle-0.4),b.y-size*Math.sin(angle-0.4));
      ctx.lineTo(b.x-size*Math.cos(angle+0.4),b.y-size*Math.sin(angle+0.4));
      ctx.closePath();
      ctx.fill();
      return end;
    }
    function curveFor(key) {
      const temperature=point()[2],list=[];
      let low=key==='p'?5.5:22,high=key==='p'?50:200;
      if(key==='t'){low=Math.max(low,GAS*temperature/50);high=Math.min(high,GAS*temperature/5.5);}
      for(let i=0;i<=100;i++){
        const value=low+(high-low)*i/100;
        const coordinates=key==='t'?[value,GAS*temperature/value,temperature]:key==='v'?[value,state.v,state.v*value/GAS]:[state.p,value,state.p*value/GAS];
        list.push(plotPoint(coordinates));
      }
      return list;
    }
    function drawScene() {
      const rect=canvas.getBoundingClientRect();
      width=Math.max(1,rect.width);
      height=Math.max(1,rect.height);
      const ratio=Math.min(window.devicePixelRatio||1,2);
      if(canvas.width!==Math.round(width*ratio) || canvas.height!==Math.round(height*ratio)) {
        canvas.width=Math.round(width*ratio);
        canvas.height=Math.round(height*ratio);
      }
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.clearRect(0,0,width,height);
      unitScale=Math.min(width/4.3,height/4.1)*state.zoom;
      const p=plotPoint(point());
      const ts=plotTangents();
      const primitives=[];
      let planeLabelPoint=null;
      const pushFace=function(vertices,color,opacity) {
        primitives.push({vertices:vertices,color:color,opacity:opacity,depth:vertices.reduce(function(s,v){return s+project(v).d;},0)/vertices.length});
      };
      const pushLine=function(vertices,color,opacity,lineWidth,dash) {
        primitives.push({vertices:vertices,color:color,opacity:opacity,lineWidth:lineWidth,dash:dash,depth:vertices.reduce(function(s,v){return s+project(v).d;},0)/vertices.length});
      };
      const patch=function(map,n,color,opacity) {
        for(let i=0;i<n;i++) for(let j=0;j<n;j++) {
          const a=map(i/n,j/n),b=map((i+1)/n,j/n),c=map((i+1)/n,(j+1)/n),d=map(i/n,(j+1)/n);
          pushFace([a,b,c],color,opacity);
          pushFace([a,c,d],color,opacity);
        }
      };
      patch(function(a,b) {
        const pressure=100*(minCoord+(maxCoord-minCoord)*a),volume=25*(minCoord+(maxCoord-minCoord)*b);
        return plotPoint([pressure,volume,pressure*volume/GAS]);
      },24,colors.fg,0.07);
      for(let i=0;i<=8;i++) {
        const fixed=minCoord+(maxCoord-minCoord)*i/8;
        for(let j=0;j<24;j++) {
          const a=minCoord+(maxCoord-minCoord)*j/24,b=minCoord+(maxCoord-minCoord)*(j+1)/24;
          pushLine([[fixed,a,fixed*a],[fixed,b,fixed*b]],colors.fg,0.17,0.8);
          pushLine([[a,fixed,fixed*a],[b,fixed,fixed*b]],colors.fg,0.17,0.8);
        }
      }
      if(state.slice) {
        const map=function(a,b) {
          const sliceHeight=state.fixed==='v'?p[1]*2+0.25:p[0]*2+0.25;
          const c1=0.05+2.15*a,c2=0.05+(state.fixed==='t'?2.15:sliceHeight)*b;
          return state.fixed==='t'?[c1,c2,p[2]]:state.fixed==='v'?[c1,p[1],c2]:[p[0],c1,c2];
        };
        patch(map,7,colors[state.fixed],0.065);
        pushLine([map(0,0),map(1,0),map(1,1),map(0,1),map(0,0)],colors[state.fixed],0.42,1.1);
      }
      if(state.tangent) {
        const first=normalize(ts.v);
        const second=normalize([
          ts.p[0]-dot(ts.p,first)*first[0],
          ts.p[1]-dot(ts.p,first)*first[1],
          ts.p[2]-dot(ts.p,first)*first[2]
        ]);
        const map=function(a,b) {return add(p,add(mul(first,(a-0.5)*1.75),mul(second,(b-0.5)*1.75)));};
        patch(map,6,colors.fg,0.11);
        pushLine([map(0,0),map(1,0),map(1,1),map(0,1),map(0,0)],colors.fg,0.65,1,[5,4]);
        planeLabelPoint=map(1,1);
      }
      for(let i=0;i<=4;i++) {
        const a=i*0.5;
        pushLine([[a,0,0],[a,2,0]],colors.fg,0.09,0.8);
        pushLine([[0,a,0],[2,a,0]],colors.fg,0.09,0.8);
      }
      primitives.sort(function(a,b){return a.depth-b.depth;});
      primitives.forEach(function(item) {
        if(item.lineWidth) {
          line3(item.vertices,item.color,item.lineWidth,item.opacity,item.dash);
        } else {
          ctx.save();ctx.globalAlpha=item.opacity;ctx.fillStyle=item.color;ctx.beginPath();
          item.vertices.forEach(function(v,i){const q=project(v);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});
          ctx.closePath();ctx.fill();ctx.restore();
        }
      });
      const axisEnds=[[2.25,0,0],[0,2.25,0],[0,0,2.7]];
      axisEnds.forEach(function(e) { arrow3([0,0,0],e,norm(e),colors.muted,1.2); });
      ctx.font='400 '+getComputedStyle(root).fontSize+' '+getComputedStyle(root).fontFamily;
      const labels=[];
      function labelAt(position,text,preferred) {
        const pos=project(position);
        const textWidth=ctx.measureText(text).width;
        const lineHeight=parseFloat(getComputedStyle(root).fontSize)+5;
        const options=preferred||[[9,-10],[9,18],[-textWidth-9,-10],[-textWidth-9,18],[9,-28],[-textWidth-9,32]];
        let best=null;
        let bestPenalty=Infinity;
        options.forEach(function(offset) {
          const x=clamp(pos.x+offset[0],5,width-textWidth-6);
          const y=clamp(pos.y+offset[1],lineHeight,height-6);
          const box={x:x-3,y:y-lineHeight+2,t:textWidth+6,h:lineHeight};
          let penalty=0;
          labels.forEach(function(other) {
            if(box.x<other.x+other.t+4 && box.x+box.t+4>other.x && box.y<other.y+other.h+4 && box.y+box.h+4>other.y) penalty+=100;
          });
          penalty+=Math.abs(x-pos.x-offset[0])+Math.abs(y-pos.y-offset[1]);
          if(penalty<bestPenalty){bestPenalty=penalty;best={x:x,y:y,box:box};}
        });
        labels.push(best.box);
        ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeStyle=colors.bg;
        ctx.strokeText(text,best.x,best.y);
        ctx.fillStyle=colors.fg;ctx.fillText(text,best.x,best.y);
      }
      axisEnds.forEach(function(e,i){labelAt(e,['p / kPa','v / L','t / K'][i]);});
      if(planeLabelPoint)labelAt(planeLabelPoint,'切平面');
      ['t','v','p'].forEach(function(key){line3(curveFor(key),colors[key],key===state.fixed?3.8:1.9,key===state.fixed?1:0.72);});
      const tangentEnds={};
      ['t','v','p'].forEach(function(key) {
        const direction=normalize(ts[key]);
        line3([add(p,mul(direction,-0.43)),p],colors[key],key===state.fixed?2.5:1.5,0.9,[4,3]);
        tangentEnds[key]=arrow3(p,ts[key],key===state.fixed?0.86:0.69,colors[key],key===state.fixed?3.5:2.4);
      });
      const screenP=project(p);
      ctx.fillStyle=colors.bg;ctx.beginPath();ctx.arc(screenP.x,screenP.y,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=colors.fg;ctx.beginPath();ctx.arc(screenP.x,screenP.y,4.5,0,Math.PI*2);ctx.fill();
      labelAt(p,'P',[[10,-13],[10,22],[-20,-13],[-20,22]]);
      labelAt(tangentEnds[state.fixed],'固定 '+state.fixed);
      canvas.dataset.camera=JSON.stringify({az:state.az,el:state.el,zoom:state.zoom});
      canvas.dataset.geometry=JSON.stringify({point:point(),tangents:tangents(),gas:GAS,axisScale:axisScale});
    }
    function svgNode(tag,attrs,text) {
      const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
      Object.entries(attrs||{}).forEach(function(entry){node.setAttribute(entry[0],entry[1]);});
      if(text!=null)node.textContent=text;
      return node;
    }
    function drawProjection() {
      const svgWidth=Math.max(260,projection.getBoundingClientRect().width);
      const svgHeight=projection.getBoundingClientRect().height;
      projection.setAttribute('viewBox','0 0 '+svgWidth+' '+svgHeight);
      projection.replaceChildren();
      const p=point(),ts=tangents();
      let xIndex,yIndex,xName,yName;
      if(state.fixed==='t'){xIndex=0;yIndex=1;xName='p';yName='v';}
      else if(state.fixed==='v'){xIndex=2;yIndex=0;xName='t';yName='p';}
      else{xIndex=1;yIndex=2;xName='v';yName='t';}
      if(state.swap){const i=xIndex;xIndex=yIndex;yIndex=i;const n=xName;xName=yName;yName=n;}
      const x0=p[xIndex],y0=p[yIndex],t=ts[state.fixed],slope=t[yIndex]/t[xIndex];
      const halfSpan=x0*0.28;
      const dx=halfSpan*0.6;
      const dy=slope*dx;
      function curveY(x) {
        if(state.fixed==='t')return GAS*p[2]/x;
        if(state.fixed==='v')return xName==='t'?GAS*x/state.v:state.v*x/GAS;
        return xName==='v'?state.p*x/GAS:GAS*x/state.p;
      }
      const curve=[];
      for(let i=0;i<=64;i++) {
        const x=x0-halfSpan+2*halfSpan*i/64;
        curve.push([x,curveY(x)]);
      }
      const tangentStart=[x0-halfSpan,y0-slope*halfSpan];
      const tangentEnd=[x0+halfSpan,y0+slope*halfSpan];
      const extentPoints=curve.concat([tangentStart,tangentEnd,[x0+dx,y0],[x0+dx,y0+dy]]);
      const xs=extentPoints.map(function(p){return p[0];}),ys=extentPoints.map(function(p){return p[1];});
      const xMin=Math.min.apply(null,xs),xMax=Math.max.apply(null,xs);
      const yMin=Math.min.apply(null,ys),yMax=Math.max.apply(null,ys);
      const margin={l:64,r:20,t:21,b:48};
      const plotWidth=svgWidth-margin.l-margin.r,plotHeight=svgHeight-margin.t-margin.b;
      const xSpan=(xMax-xMin)*1.35,ySpan=(yMax-yMin)*1.35;
      const xMid=(xMin+xMax)/2,yMid=(yMin+yMax)/2;
      const domainX=[xMid-xSpan/2,xMid+xSpan/2],domainY=[yMid-ySpan/2,yMid+ySpan/2];
      const X=function(x){return margin.l+(x-domainX[0])*plotWidth/xSpan;};
      const Y=function(y){return margin.t+plotHeight-(y-domainY[0])*plotHeight/ySpan;};
      const color='var(--viz-series-'+({t:1,v:2,p:3}[state.fixed])+')';
      projection.appendChild(svgNode('title',{},'固定 '+state.fixed+' 的截线投影，横轴 '+xName+'，纵轴 '+yName));
      projection.appendChild(svgNode('desc',{},'实线是截线，虚线是 P 处切线；直角三角形的增量取在切线上，斜率 '+fmt(slope,3)));
      projection.appendChild(svgNode('rect',{x:margin.l,y:margin.t,width:plotWidth,height:plotHeight,fill:'none',stroke:'var(--border)','data-chart-frame':''}));
      for(let i=0;i<3;i++){
        const value=domainX[0]+(domainX[1]-domainX[0])*(0.18+i*0.32);
        const pos=X(value);
        projection.appendChild(svgNode('line',{x1:pos,y1:margin.t,x2:pos,y2:margin.t+plotHeight,stroke:'var(--border)','stroke-width':0.8}));
        projection.appendChild(svgNode('text',{x:pos,y:margin.t+plotHeight+20,'text-anchor':'middle',class:'text-small'},fmt(value,2)));
        const valueY=domainY[0]+(domainY[1]-domainY[0])*(0.18+i*0.32);
        const posY=Y(valueY);
        projection.appendChild(svgNode('line',{x1:margin.l,y1:posY,x2:margin.l+plotWidth,y2:posY,stroke:'var(--border)','stroke-width':0.8}));
        projection.appendChild(svgNode('text',{x:margin.l-7,y:posY+4,'text-anchor':'end',class:'text-small'},fmt(valueY,2)));
      }
      projection.appendChild(svgNode('text',{x:margin.l+plotWidth/2,y:svgHeight-6,'text-anchor':'middle',class:'axis-title','data-axis':'x'},xName+' / '+units[xName]));
      projection.appendChild(svgNode('text',{x:16,y:margin.t+plotHeight/2,'text-anchor':'middle',transform:'rotate(-90 16 '+(margin.t+plotHeight/2)+')',class:'axis-title','data-axis':'y'},yName+' / '+units[yName]));
      projection.appendChild(svgNode('path',{d:curve.map(function(p,i){return(i?'L':'M')+X(p[0])+','+Y(p[1]);}).join(' '),fill:'none',stroke:color,'stroke-width':2.5,opacity:0.55}));
      projection.appendChild(svgNode('line',{x1:X(tangentStart[0]),y1:Y(tangentStart[1]),x2:X(tangentEnd[0]),y2:Y(tangentEnd[1]),stroke:color,'stroke-width':2,'stroke-dasharray':'6 4','data-tangent-slope':slope}));
      const a=[X(x0),Y(y0)],b=[X(x0+dx),Y(y0)],c=[X(x0+dx),Y(y0+dy)];
      projection.appendChild(svgNode('path',{d:'M'+a.join(',')+'L'+b.join(',')+'L'+c.join(','),fill:'none',stroke:'var(--foreground)','stroke-width':1.5,'data-slope-triangle':''}));
      const sy=dy>=0?-1:1;
      projection.appendChild(svgNode('path',{d:'M'+(b[0]-7)+','+b[1]+'L'+(b[0]-7)+','+(b[1]+sy*7)+'L'+b[0]+','+(b[1]+sy*7),fill:'none',stroke:'var(--foreground)','stroke-width':1}));
      projection.appendChild(svgNode('text',{x:(a[0]+b[0])/2,y:a[1]+(dy>=0?20:-9),'text-anchor':'middle'},'d'+xName));
      projection.appendChild(svgNode('text',{x:b[0]+8,y:(b[1]+c[1])/2+4,'text-anchor':'start'},'d'+yName));
      projection.appendChild(svgNode('circle',{cx:a[0],cy:a[1],r:4,fill:'var(--foreground)'}));
      projection.appendChild(svgNode('text',{x:a[0]-8,y:a[1]+(dy>=0?18:-10),'text-anchor':'end'},'P'));
      projection.appendChild(svgNode('text',{x:margin.l+5,y:15,class:'text-small'},'实线：截线  ·  虚线：切线'));
      const subscript=state.fixed;
      find('pvt-projection-value').innerHTML='(∂'+yName+'/∂'+xName+')<sub>'+state.fixed+'</sub> = '+fmt(slope,3)+' '+units[yName]+'/'+units[xName];
      projection.dataset.axes=xName+','+yName;
      projection.dataset.slope=String(slope);
      projection.dataset.fixed=subscript;
      projection.setAttribute('aria-label','固定 '+subscript+'；纵坐标 '+yName+'，横坐标 '+xName+'；P 处切线斜率 '+fmt(slope,3));
    }
    function updateLabels() {
      const coordinates=point();
      find('pvt-p').value=state.p;find('pvt-v').value=state.v;
      find('pvt-p-value').textContent=fmt(state.p,0);find('pvt-v-value').textContent=fmt(state.v,1);
      find('pvt-fixed').value=state.fixed;
      ['slice','tangent'].forEach(function(k){find('pvt-'+k).checked=state[k];});
      find('pvt-swap').setAttribute('aria-pressed',state.swap?'true':'false');
      find('pvt-point').textContent='P：p = '+fmt(state.p,0)+' kPa，v = '+fmt(state.v,1)+' L，t = '+fmt(coordinates[2],2)+' K';
      const d1=-state.v/state.p,d2=GAS/state.v,d3=state.p/GAS;
      find('pvt-dt').textContent=fmt(d1,3)+' L/kPa';
      find('pvt-dv').textContent=fmt(d2,3)+' kPa/K';
      find('pvt-dp').textContent=fmt(d3,3)+' K/L';
      find('pvt-product').textContent=fmt(d1*d2*d3,3);
      const summary='压强 '+fmt(state.p,0)+' kPa，体积 '+fmt(state.v,1)+' L，绝对温度 '+fmt(coordinates[2],2)+' K。固定 '+state.fixed+'。三个循环偏导分别为 '+fmt(d1,3)+' L/kPa，'+fmt(d2,3)+' kPa/K，'+fmt(d3,3)+' K/L，乘积为负一。';
      find('pvt-accessible').textContent=summary;
      canvas.setAttribute('aria-label',summary+' 可拖动旋转，滚轮缩放；聚焦后可用方向键、加减号和 Home 控制视角。');
    }
    function drawAll() {
      renderPending=false;
      if(controller.signal.aborted)return;
      updateLabels();
      drawScene();
      drawProjection();
    }
    function requestDraw() {
      if(renderPending)return;
      renderPending=true;
      frameId=requestAnimationFrame(drawAll);
    }
    ['p','v'].forEach(function(k) {
      on(find('pvt-'+k),'input',function(event){state[k]=Number(event.target.value);requestDraw();scheduleSave();});
      on(find('pvt-'+k),'change',save);
    });
    on(find('pvt-fixed'),'change',function(event){state.fixed=event.target.value;requestDraw();save();});
    ['slice','tangent'].forEach(function(k){on(find('pvt-'+k),'change',function(event){state[k]=event.target.checked;requestDraw();save();});});
    on(find('pvt-swap'),'click',function(){state.swap=!state.swap;requestDraw();save();});
    const pointers=new Map();let pinchDistance=null;
    on(canvas,'pointerdown',function(event){canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.classList.add('dragging');if(pointers.size===2){const pair=Array.from(pointers.values());pinchDistance=Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y);}});
    on(canvas,'pointermove',function(event){
      if(!pointers.has(event.pointerId))return;
      const previous=pointers.get(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(pointers.size===1){state.az+=(event.clientX-previous.x)*0.009;state.el=clamp(state.el+(event.clientY-previous.y)*0.007,-1.25,1.35);}
      else{const pair=Array.from(pointers.values()),distance=Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y);if(pinchDistance>0)state.zoom=clamp(state.zoom*distance/pinchDistance,0.62,2.5);pinchDistance=distance;}
      requestDraw();
    });
    const endPointer=function(event){pointers.delete(event.pointerId);pinchDistance=null;if(!pointers.size)canvas.classList.remove('dragging');save();};
    on(canvas,'pointerup',endPointer);on(canvas,'pointercancel',endPointer);
    on(canvas,'wheel',function(event){event.preventDefault();state.zoom=clamp(state.zoom*Math.exp(-event.deltaY*0.001),0.62,2.5);requestDraw();scheduleSave();},{passive:false});
    on(canvas,'keydown',function(event){
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='ArrowLeft')state.az-=0.12;
      if(event.key==='ArrowRight')state.az+=0.12;
      if(event.key==='ArrowUp')state.el=clamp(state.el+0.08,-1.25,1.35);
      if(event.key==='ArrowDown')state.el=clamp(state.el-0.08,-1.25,1.35);
      if(event.key==='+'||event.key==='=')state.zoom=clamp(state.zoom*1.1,0.62,2.5);
      if(event.key==='-')state.zoom=clamp(state.zoom/1.1,0.62,2.5);
      if(event.key==='Home'){state.az=defaults.az;state.el=defaults.el;state.zoom=defaults.zoom;}
      requestDraw();save();
    });
    readState();refreshTheme();save();
    const resize=new ResizeObserver(requestDraw);resize.observe(root);
    const mutation=new MutationObserver(function(){const previous=themeKey;refreshTheme();if(previous!==themeKey)requestDraw();});
    mutation.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const themeChange=function(){refreshTheme();requestDraw();};media.addEventListener('change',themeChange);
    dispose=function(){clearTimeout(saveTimer);cancelAnimationFrame(frameId);controller.abort();resize.disconnect();mutation.disconnect();media.removeEventListener('change',themeChange);};
    drawAll();
  }
  window.ConstraintSurface={markup:markup,mount:mount,unmount:function(){dispose();dispose=function(){};}};
})();
