const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const catalog=require('../dist/catalog.json');

function app(){
  const main={innerHTML:'',querySelector:()=>null,focus(){}};
  const location={hash:'',replace(hash){this.hash=hash;}};
  const errors=[];
  const context={
    document:{getElementById:id=>id==='main'?main:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
    window:{ResourceCompare:{configure(){},sync(){},button:()=>'',update(){}},addEventListener(){},scrollTo(){}},
    history:{replaceState(){}},location,URLSearchParams,
    console:{error(...args){errors.push(args);}},fetch:()=>new Promise(()=>{})
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),context);
  vm.runInContext('catalog='+JSON.stringify(catalog),context);
  return {context,main,errors};
}

test('Home renders every catalog card and valid constraint-surface SVG paths',()=>{
  const {context}=app();
  const html=vm.runInContext('home()',context);
  assert.equal((html.match(/<article class="resource-card"/g)||[]).length,catalog.resources.length);
  for(const resource of catalog.resources)assert(html.includes(resource.title));
  assert(!/NaN|Infinity|undefined/.test(html));
  const preview=vm.runInContext('diagram("constraint")',context);
  assert(preview.includes('>P</text>'));
  assert(preview.includes('>V</text>'));
  assert(preview.includes('>T</text>'));
});

test('A render error is reported separately from a failed catalog request',async()=>{
  const {context,main,errors}=app();
  context.fetch=async()=>({ok:true,json:async()=>catalog});
  vm.runInContext('diagram=()=>{throw new Error("broken preview");}',context);
  await vm.runInContext('loadCatalog()',context);
  assert(main.innerHTML.includes('页面暂时无法显示'));
  assert(!main.innerHTML.includes('资源目录未能加载'));
  assert.equal(errors.length,1);
  assert.equal(errors[0][0],'Page render failed');
});

test('A failed catalog request shows a reload action and records the error',async()=>{
  const {context,main,errors}=app();
  context.fetch=async()=>({ok:false,status:503});
  await vm.runInContext('loadCatalog()',context);
  assert(main.innerHTML.includes('资源目录未能加载'));
  assert(main.innerHTML.includes('重新加载'));
  assert.equal(errors[0][0],'Catalog load failed');
});
