(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ThreePhaseView=factory();})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  // A rigid 3D camera rotation: screen horizontal, screen vertical, nearward depth.
  function rotate(x,y,z,yaw,pitch){
    const a=yaw*Math.PI/180,b=pitch*Math.PI/180,u=x*Math.cos(a)-y*Math.sin(a),v=x*Math.sin(a)+y*Math.cos(a);
    return [u,v*Math.sin(b)-z*Math.cos(b),v*Math.cos(b)+z*Math.sin(b)];
  }
  const contexts=new WeakMap();
  function draw(canvas,faces,w,h,distance,radius){
    let ctx=contexts.get(canvas);
    if(!ctx){
      const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return false;
      const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
      const vs=shader(gl.VERTEX_SHADER,'attribute vec4 position;attribute vec3 color;varying vec3 shade;void main(){gl_Position=position;shade=color;}'),fs=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 shade;void main(){gl_FragColor=vec4(shade,1.0);}');
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);
      ctx={gl,program,buffer:gl.createBuffer(),position:gl.getAttribLocation(program,'position'),color:gl.getAttribLocation(program,'color')};contexts.set(canvas,ctx);
    }
    const {gl,program,buffer,position,color}=ctx,dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const near=distance-radius*2,far=distance+radius*2,palette=[[.212,.424,.694],[.086,.506,.431],[.698,.392,.149]],tri=[],edges=[];
    function vertex(target,p,c){const cw=distance-p[2],cz=(far+near)/(far-near)*cw-2*far*near/(far-near);target.push((p[0]/w*2-1)*cw,(1-p[1]/h*2)*cw,cz,cw,...c);}
    for(const f of faces){const base=palette[f.k],shade=base.map(v=>v*.78+.22);for(const p of f.points)vertex(tri,p,shade);for(const [a,b] of [[0,1],[1,2],[2,0]]){vertex(edges,f.points[a],base.map(v=>v*.9+.1));vertex(edges,f.points[b],base.map(v=>v*.9+.1));}}
    function upload(data,mode){gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,4,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,3,gl.FLOAT,false,28,16);gl.drawArrays(mode,0,data.length/7);}
    gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);upload(tri,gl.TRIANGLES);gl.disable(gl.POLYGON_OFFSET_FILL);upload(edges,gl.LINES);return true;
  }
  function destroy(canvas){const ctx=contexts.get(canvas);if(ctx){ctx.gl.deleteBuffer(ctx.buffer);ctx.gl.deleteProgram(ctx.program);ctx.gl.getExtension('WEBGL_lose_context')?.loseContext();contexts.delete(canvas);}}
  return {rotate,draw,destroy};
});
