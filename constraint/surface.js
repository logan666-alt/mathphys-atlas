/* Original constraint-surface renderer, mounted only on its resource page. */
(function(){
  'use strict';
  let dispose=function(){};
  const markup="<div id=\"constraint-uv-w\">\n  \n  <h3>约束曲面 uv = w</h3>\n  <div class=\"parameters\">\n    <label class=\"form-label\">\n      <span class=\"parameter-head\"><span>u₀</span><output id=\"uv-u-value\" class=\"tabular-nums\">1.00</output></span>\n      <input id=\"uv-u\" class=\"form-range\" type=\"range\" min=\"0.4\" max=\"1.8\" step=\"0.01\" value=\"1\" aria-label=\"点 P 的 u 坐标\">\n    </label>\n    <label class=\"form-label\">\n      <span class=\"parameter-head\"><span>v₀</span><output id=\"uv-v-value\" class=\"tabular-nums\">1.00</output></span>\n      <input id=\"uv-v\" class=\"form-range\" type=\"range\" min=\"0.4\" max=\"1.8\" step=\"0.01\" value=\"1\" aria-label=\"点 P 的 v 坐标\">\n    </label>\n  </div>\n  <div class=\"options\">\n    <div class=\"fixed-field\">\n      <label class=\"form-label\" for=\"uv-fixed\">当前固定</label>\n      <select id=\"uv-fixed\" class=\"form-select\">\n        <option value=\"w\">w · 等温截线</option>\n        <option value=\"v\">v · 等容截线</option>\n        <option value=\"u\">u · 等压截线</option>\n      </select>\n    </div>\n    <label class=\"form-check\"><input id=\"uv-slice\" class=\"form-check-input\" type=\"checkbox\" checked><span class=\"form-check-label\">截平面</span></label>\n    <label class=\"form-check\"><input id=\"uv-tangent\" class=\"form-check-input\" type=\"checkbox\" checked><span class=\"form-check-label\">切平面</span></label>\n    <label class=\"form-check\"><input id=\"uv-normal\" class=\"form-check-input\" type=\"checkbox\" checked><span class=\"form-check-label\">法向量</span></label>\n  </div>\n  <div class=\"legend text-small\" aria-label=\"截线与切向量颜色\">\n    <span class=\"legend-item\"><i class=\"swatch series-w\" aria-hidden=\"true\"></i>固定 w：uv = w₀ · t<sub>w</sub></span>\n    <span class=\"legend-item\"><i class=\"swatch series-v\" aria-hidden=\"true\"></i>固定 v：w = v₀u · t<sub>v</sub></span>\n    <span class=\"legend-item\"><i class=\"swatch series-u\" aria-hidden=\"true\"></i>固定 u：w = u₀v · t<sub>u</sub></span>\n  </div>\n  <div class=\"point-readout tabular-nums\" id=\"uv-point\">P = (1.00, 1.00, 1.00) · 截平面 w = 1.00</div>\n  <div class=\"scene\">\n    <canvas id=\"uv-scene\" tabindex=\"0\" role=\"img\" aria-keyshortcuts=\"ArrowLeft ArrowRight ArrowUp ArrowDown + - Home\" aria-label=\"可旋转缩放的约束曲面，显示 P 点、三条截线、三条切向量、切平面及法向量\">三维曲面及局部几何；可以使用上方滑块和选择框改变状态。</canvas>\n  </div>\n  <div class=\"local-readout text-small tabular-nums\">\n    <span id=\"uv-plane-value\">切平面：1.00δu + 1.00δv − δw = 0</span>\n    <span id=\"uv-normal-value\">∇F = (1.00, 1.00, −1)</span>\n  </div>\n  <div class=\"lower\">\n    <div>\n      <div class=\"projection-head\">\n        <span class=\"weight-medium\">当前截线的二维投影</span>\n        <button id=\"uv-swap\" class=\"button outline small\" type=\"button\" aria-pressed=\"false\">交换横纵轴</button>\n      </div>\n      <svg id=\"uv-projection\" class=\"projection\" role=\"img\" aria-label=\"截线、局部切线及斜率增量三角形\"></svg>\n      <div id=\"uv-projection-value\" class=\"projection-value text-small tabular-nums\" aria-live=\"polite\"></div>\n    </div>\n    <div class=\"derivatives\" aria-live=\"polite\">\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-w\" aria-hidden=\"true\"></i><span>(∂v/∂u)<sub>w</sub> = −v₀/u₀</span></span>\n        <output id=\"uv-dw\" class=\"tabular-nums weight-medium\">−1.000</output>\n      </div>\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-v\" aria-hidden=\"true\"></i><span>(∂u/∂w)<sub>v</sub> = 1/v₀</span></span>\n        <output id=\"uv-dv\" class=\"tabular-nums weight-medium\">1.000</output>\n      </div>\n      <div class=\"derivative-row\">\n        <span class=\"derivative-label\"><i class=\"swatch series-u\" aria-hidden=\"true\"></i><span>(∂w/∂v)<sub>u</sub> = u₀</span></span>\n        <output id=\"uv-du\" class=\"tabular-nums weight-medium\">1.000</output>\n      </div>\n      <div class=\"product weight-medium\"><span>三项循环乘积</span><output id=\"uv-product\" class=\"tabular-nums\">−1.000</output></div>\n      <div id=\"uv-vector-value\" class=\"active-detail text-small tabular-nums\"></div>\n      <div id=\"uv-dot-value\" class=\"text-small tabular-nums\">∇F·t<sub>w</sub> = ∇F·t<sub>v</sub> = ∇F·t<sub>u</sub> = 0</div>\n    </div>\n  </div>\n  <span id=\"uv-accessible\" class=\"sr-only\" aria-live=\"polite\"></span>\n  \n</div>\n";
  function mount(){
    dispose();

    const root = document.getElementById('constraint-uv-w');
    if (!root) return;
    const controller = new AbortController();
    const on = function (node, type, handler, options) { node.addEventListener(type, handler, Object.assign({}, options, {signal:controller.signal})); };
    let frameId = 0;
    const find = function (id) { return root.querySelector('#' + id); };
    const canvas = find('uv-scene');
    const ctx = canvas.getContext('2d');
    const projection = find('uv-projection');
    const defaults = {version:1,u:1,v:1,fixed:'w',slice:true,tangent:true,normal:true,swap:false,az:0.60,el:0.55,zoom:1};
    let state = Object.assign({}, defaults);
    let colors = {};
    let themeKey = '';
    let renderPending = false;
    let saveTimer = null;
    let width = 0;
    let height = 0;
    let unitScale = 0;
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
    const signed = function (x,d) { return (x>=0?'+':'') + fmt(x,d); };
    const vectorText = function (a) { return '('+a.map(function(x){return fmt(x,2);}).join(', ')+')'; };
    const tangents = function () { return {w:[state.u,-state.v,0],v:[1,0,state.v],u:[0,1,state.u]}; };
    const point = function () { return [state.u,state.v,state.u*state.v]; };
    function readState() {
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      ['u','v','az','el','zoom'].forEach(function(k){
        if(!params.has(k)||params.get(k).trim()==='')return;
        const value=Number(params.get(k));if(!Number.isFinite(value))return;
        state[k]=(k==='u'||k==='v')?clamp(value,0.4,1.8):k==='el'?clamp(value,-1.25,1.35):k==='zoom'?clamp(value,0.62,2.5):value%(Math.PI*2);
      });
      if(['u','v','w'].includes(params.get('fixed')))state.fixed=params.get('fixed');
      ['slice','tangent','normal','swap'].forEach(function(k){if(['0','1'].includes(params.get(k)))state[k]=params.get(k)==='1';});
    }
    function save() {
      if(!location.hash.startsWith('#/resource/constraint-surface'))return;
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      ['u','v','az','el','zoom'].forEach(function(k){
        if(Math.abs(state[k]-defaults[k])<0.0001)params.delete(k);
        else params.set(k,state[k].toFixed(k==='u'||k==='v'?2:3));
      });
      if(state.fixed===defaults.fixed)params.delete('fixed');else params.set('fixed',state.fixed);
      ['slice','tangent','normal','swap'].forEach(function(k){if(state[k]===defaults[k])params.delete(k);else params.set(k,state[k]?'1':'0');});
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
        w:resolveColor('--viz-series-1'),
        v:resolveColor('--viz-series-2'),
        u:resolveColor('--viz-series-3')
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
      const p=point();
      const list=[];
      let low=minCoord,high=maxCoord;
      if(key==='w') {
        low=Math.max(minCoord,p[2]/maxCoord);
        high=Math.min(maxCoord,p[2]/minCoord);
      }
      for(let i=0;i<=100;i++) {
        const s=low+(high-low)*i/100;
        list.push(key==='w'?[s,p[2]/s,p[2]]:key==='v'?[s,state.v,state.v*s]:[state.u,s,state.u*s]);
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
      const p=point();
      const ts=tangents();
      const normal=[state.v,state.u,-1];
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
        const u=minCoord+(maxCoord-minCoord)*a,v=minCoord+(maxCoord-minCoord)*b;
        return [u,v,u*v];
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
          const sliceHeight=state.fixed==='v'?state.v*2+0.25:state.u*2+0.25;
          const c1=0.05+2.15*a,c2=0.05+(state.fixed==='w'?2.15:sliceHeight)*b;
          return state.fixed==='w'?[c1,c2,p[2]]:state.fixed==='v'?[c1,state.v,c2]:[state.u,c1,c2];
        };
        patch(map,7,colors[state.fixed],0.065);
        pushLine([map(0,0),map(1,0),map(1,1),map(0,1),map(0,0)],colors[state.fixed],0.42,1.1);
      }
      if(state.tangent) {
        const first=normalize(ts.v);
        const second=normalize([
          ts.u[0]-dot(ts.u,first)*first[0],
          ts.u[1]-dot(ts.u,first)*first[1],
          ts.u[2]-dot(ts.u,first)*first[2]
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
          const box={x:x-3,y:y-lineHeight+2,w:textWidth+6,h:lineHeight};
          let penalty=0;
          labels.forEach(function(other) {
            if(box.x<other.x+other.w+4 && box.x+box.w+4>other.x && box.y<other.y+other.h+4 && box.y+box.h+4>other.y) penalty+=100;
          });
          penalty+=Math.abs(x-pos.x-offset[0])+Math.abs(y-pos.y-offset[1]);
          if(penalty<bestPenalty){bestPenalty=penalty;best={x:x,y:y,box:box};}
        });
        labels.push(best.box);
        ctx.lineWidth=4;ctx.lineJoin='round';ctx.strokeStyle=colors.bg;
        ctx.strokeText(text,best.x,best.y);
        ctx.fillStyle=colors.fg;ctx.fillText(text,best.x,best.y);
      }
      axisEnds.forEach(function(e,i){labelAt(e,['u','v','w'][i]);});
      if(planeLabelPoint)labelAt(planeLabelPoint,'切平面');
      ['w','v','u'].forEach(function(key){line3(curveFor(key),colors[key],key===state.fixed?3.8:1.9,key===state.fixed?1:0.72);});
      const tangentEnds={};
      ['w','v','u'].forEach(function(key) {
        const direction=normalize(ts[key]);
        line3([add(p,mul(direction,-0.43)),p],colors[key],key===state.fixed?2.5:1.5,0.9,[4,3]);
        tangentEnds[key]=arrow3(p,ts[key],key===state.fixed?0.86:0.69,colors[key],key===state.fixed?3.5:2.4);
      });
      if(state.normal) {
        const n=normalize(normal);
        const end=arrow3(p,normal,0.98,colors.fg,2.5);
        ['w','v','u'].forEach(function(key) {
          const t=normalize(ts[key]);
          const a=add(p,mul(t,0.15)),b=add(a,mul(n,0.15)),c=add(p,mul(n,0.15));
          line3([a,b,c],colors[key],1.2,key===state.fixed?1:0.65);
        });
        labelAt(end,'∇F');
      }
      const screenP=project(p);
      ctx.fillStyle=colors.bg;ctx.beginPath();ctx.arc(screenP.x,screenP.y,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=colors.fg;ctx.beginPath();ctx.arc(screenP.x,screenP.y,4.5,0,Math.PI*2);ctx.fill();
      labelAt(p,'P',[[10,-13],[10,22],[-20,-13],[-20,22]]);
      [state.fixed].concat(['w','v','u'].filter(function(k){return k!==state.fixed;})).forEach(function(key){
        labelAt(tangentEnds[key],'t'+({w:'w',v:'v',u:'u'}[key]));
      });
      canvas.dataset.camera=JSON.stringify({az:state.az,el:state.el,zoom:state.zoom});
      canvas.dataset.geometry=JSON.stringify({p:p,normal:normal,tangents:ts,dots:[dot(normal,ts.w),dot(normal,ts.v),dot(normal,ts.u)]});
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
      if(state.fixed==='w'){xIndex=0;yIndex=1;xName='u';yName='v';}
      else if(state.fixed==='v'){xIndex=2;yIndex=0;xName='w';yName='u';}
      else{xIndex=1;yIndex=2;xName='v';yName='w';}
      if(state.swap){const i=xIndex;xIndex=yIndex;yIndex=i;const n=xName;xName=yName;yName=n;}
      const x0=p[xIndex],y0=p[yIndex],t=ts[state.fixed],slope=t[yIndex]/t[xIndex];
      const halfSpan=Math.min(0.32,x0*0.38);
      const dx=Math.min(0.2,halfSpan*0.7);
      const dy=slope*dx;
      function curveY(x) {
        if(state.fixed==='w')return p[2]/x;
        if(state.fixed==='v')return xName==='w'?x/state.v:x*state.v;
        return xName==='v'?state.u*x:x/state.u;
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
      const scale=Math.min(plotWidth/(xMax-xMin),plotHeight/(yMax-yMin))/1.35;
      const xMid=(xMin+xMax)/2,yMid=(yMin+yMax)/2;
      const domainX=[xMid-plotWidth/scale/2,xMid+plotWidth/scale/2];
      const domainY=[yMid-plotHeight/scale/2,yMid+plotHeight/scale/2];
      const X=function(x){return margin.l+(x-domainX[0])*scale;};
      const Y=function(y){return margin.t+plotHeight-(y-domainY[0])*scale;};
      const color='var(--viz-series-'+({w:1,v:2,u:3}[state.fixed])+')';
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
      projection.appendChild(svgNode('text',{x:margin.l+plotWidth/2,y:svgHeight-6,'text-anchor':'middle',class:'axis-title','data-axis':'x'},xName+'（横坐标）'));
      projection.appendChild(svgNode('text',{x:16,y:margin.t+plotHeight/2,'text-anchor':'middle',transform:'rotate(-90 16 '+(margin.t+plotHeight/2)+')',class:'axis-title','data-axis':'y'},yName+'（纵坐标）'));
      projection.appendChild(svgNode('path',{d:curve.map(function(p,i){return(i?'L':'M')+X(p[0])+','+Y(p[1]);}).join(' '),fill:'none',stroke:color,'stroke-width':2.5,opacity:0.55}));
      projection.appendChild(svgNode('line',{x1:X(tangentStart[0]),y1:Y(tangentStart[1]),x2:X(tangentEnd[0]),y2:Y(tangentEnd[1]),stroke:color,'stroke-width':2,'stroke-dasharray':'6 4','data-tangent-slope':slope}));
      const a=[X(x0),Y(y0)],b=[X(x0+dx),Y(y0)],c=[X(x0+dx),Y(y0+dy)];
      projection.appendChild(svgNode('path',{d:'M'+a.join(',')+'L'+b.join(',')+'L'+c.join(','),fill:'none',stroke:'var(--foreground)','stroke-width':1.5,'data-slope-triangle':''}));
      const sy=dy>=0?-1:1;
      projection.appendChild(svgNode('path',{d:'M'+(b[0]-7)+','+b[1]+'L'+(b[0]-7)+','+(b[1]+sy*7)+'L'+b[0]+','+(b[1]+sy*7),fill:'none',stroke:'var(--foreground)','stroke-width':1}));
      projection.appendChild(svgNode('text',{x:(a[0]+b[0])/2,y:a[1]+(dy>=0?20:-9),'text-anchor':'middle'},'δ'+xName));
      projection.appendChild(svgNode('text',{x:b[0]+8,y:(b[1]+c[1])/2+4,'text-anchor':'start'},'δ'+yName));
      projection.appendChild(svgNode('circle',{cx:a[0],cy:a[1],r:4,fill:'var(--foreground)'}));
      projection.appendChild(svgNode('text',{x:a[0]-8,y:a[1]+(dy>=0?18:-10),'text-anchor':'end'},'P'));
      projection.appendChild(svgNode('text',{x:margin.l+5,y:15,class:'text-small'},'实线：截线  ·  虚线：切线'));
      const subscript=state.fixed;
      find('uv-projection-value').textContent='δ'+yName+'/δ'+xName+' = '+signed(dy,3)+' / '+signed(dx,3)+' = '+fmt(slope,3);
      projection.dataset.axes=xName+','+yName;
      projection.dataset.slope=String(slope);
      projection.dataset.fixed=subscript;
      projection.setAttribute('aria-label','固定 '+subscript+'；纵坐标 '+yName+'，横坐标 '+xName+'；P 处切线斜率 '+fmt(slope,3));
    }
    function updateLabels() {
      const p=point(),ts=tangents(),normal=[state.v,state.u,-1];
      find('uv-u').value=state.u;find('uv-v').value=state.v;
      find('uv-u-value').textContent=fmt(state.u,2);find('uv-v-value').textContent=fmt(state.v,2);
      find('uv-fixed').value=state.fixed;
      ['slice','tangent','normal'].forEach(function(k){find('uv-'+k).checked=state[k];});
      find('uv-swap').setAttribute('aria-pressed',state.swap?'true':'false');
      find('uv-point').textContent='P = '+vectorText(p)+(state.slice?' · 截平面 '+state.fixed+' = '+fmt(p[{u:0,v:1,w:2}[state.fixed]],2):'');
      find('uv-plane-value').textContent='切平面：'+fmt(state.v,2)+'δu + '+fmt(state.u,2)+'δv − δw = 0';
      find('uv-plane-value').hidden=!state.tangent;
      find('uv-normal-value').textContent='∇F = '+vectorText(normal);
      find('uv-normal-value').hidden=!state.normal;
      const d1=-state.v/state.u,d2=1/state.v,d3=state.u;
      find('uv-dw').textContent=fmt(d1,3);find('uv-dv').textContent=fmt(d2,3);find('uv-du').textContent=fmt(d3,3);
      find('uv-product').textContent=fmt(d1*d2*d3,3);
      find('uv-vector-value').textContent='当前 t'+state.fixed+' = '+vectorText(ts[state.fixed]);
      find('uv-dot-value').hidden=!state.normal;
      const summary='P='+vectorText(p)+'。固定'+state.fixed+'。三个循环偏导分别为'+[d1,d2,d3].map(function(x){return fmt(x,3);}).join('，')+'，乘积为负一。三条切向量均与梯度正交。';
      find('uv-accessible').textContent=summary;
      canvas.setAttribute('aria-label',summary+' 可拖动旋转，用滚轮缩放，或聚焦后用方向键、加减号和 Home 控制视角。');
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
    ['u','v'].forEach(function(k) {
      on(find('uv-'+k),'input',function(event){state[k]=Number(event.target.value);requestDraw();scheduleSave();});
      on(find('uv-'+k),'change',save);
    });
    on(find('uv-fixed'),'change',function(event){state.fixed=event.target.value;requestDraw();save();});
    ['slice','tangent','normal'].forEach(function(k){on(find('uv-'+k),'change',function(event){state[k]=event.target.checked;requestDraw();save();});});
    on(find('uv-swap'),'click',function(){state.swap=!state.swap;requestDraw();save();});
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
    readState();refreshTheme();
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
