/* Original, independent predict-observe-explain activities, using the site's exact model. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MathPhysInquiries=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  return Object.freeze([
    {
      id:'energy', title:'弦变直了，能量去哪了？', tag:'位移与能量',
      a:[1,0,0,0,0,0], n:1, c:1, D:.03, t:.5, x:.5,
      question:'只有第 1 模态，初始速度为零。在 t = 0.5 时，弦的位移处处为零。此时总能量怎样变化？',
      options:['总能量降为零','总能量不变，此时全部为动能','总能量只剩一半'], answer:1,
      observe:'先看左图是否变平，再看“波动能量”里的动能、势能和总量。也可回到 t = 0，比较同一根弦的两个时刻。',
      explanation:'本例 u = sin(πx)cos(πt)。t = 0.5 时 cos(πt) = 0，但时间导数 uₜ = −πsin(πx) 并不为零。弦此刻通过平衡位置，势能为零、动能最大，总能量仍守恒。单张位移快照没有包含速度信息。',
      formula:String.raw`E=K+V,\quad K=\tfrac12\int_0^1u_t^2\,dx,\quad V=\tfrac{c^2}{2}\int_0^1u_x^2\,dx`,
      related:['wave-travel','loaded-string']
    },
    {
      id:'frequency', title:'第 3 模态会衰减快几倍？', tag:'空间频率与扩散',
      a:[1,0,1,0,0,0], n:3, c:1, D:.03, t:1, x:.25,
      question:'第 1 与第 3 模态的初始系数都为 1。第 3 模态的幅度衰减到自身初值 1/e，所需时间是第 1 模态的多少？',
      options:['1/3','1/9','相同'], answer:1,
      observe:'在 t = 1 查看右图和两个扩散系数：h₁ 约为 0.744，h₃ 约为 0.070。再选择 n = 1 与 n = 3，比较显示的衰减时间 τ。',
      explanation:'扩散衰减率是 D(nπ)²，随模态序号的平方增加，所以 τ₃ = τ₁/9。这里比较的是各自的 1/e 时间，不是说任意时刻 h₃ 都等于 h₁/9。空间起伏越密，局部温差越容易被扩散抹平。',
      formula:String.raw`h_n(t)=A_ne^{-D(n\pi)^2t},\qquad \frac{\tau_3}{\tau_1}=\frac{1}{9}`,
      related:['heat-eigenmodes','fourier-series']
    },
    {
      id:'node', title:'中点不动，整根弦都没动吗？', tag:'取样位置与节点',
      a:[0,1,0,0,0,0], n:2, c:1, D:.03, t:.15, x:.5,
      question:'只激发第 2 模态，把取样点放在 x = 0.5。这里的位移始终为零，能否据此断定整根弦不振动？',
      options:['能，中点代表整根弦','不能，中点恰好是这个模态的节点','只要再等一个周期就能断定'], answer:1,
      observe:'先确认当前取样点的读数为零；把时间拖到 t = 0，再将取样位置移到 x = 0.25。此时左图读数为 1，右图同样为 1。继续播放比较两个位置。',
      explanation:'第 2 模态的空间形状是 sin(2πx)。x = 0.5 是节点（node），空间因子为零，所以波动与扩散的这一模态在这里都始终为零。x = 0.25 处空间因子为 1，能看到时间变化。单点测量可能漏掉恰好在该点有节点的模态。',
      formula:String.raw`\phi_2(1/2)=\sin\pi=0,\qquad \phi_2(1/4)=\sin(\pi/2)=1`,
      related:['standing-wave','rectangular-membrane']
    }
  ]);
});
