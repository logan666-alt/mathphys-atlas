const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/compare.js');
const catalog=require('../dist/catalog.json');

test('Comparison links reject unknown ids, deduplicate and keep the selected order',()=>{
  const a=catalog.resources[0].id,b=catalog.resources[1].id,c=catalog.resources[2].id,d=catalog.resources[3].id;
  assert.deepEqual(C.parse(`${b},${a},${b}`,catalog.resources),{ids:[b,a],ignored:false});
  assert.deepEqual(C.parse(`bad,${a},${b},${c},${d}`,catalog.resources),{ids:[a,b,c],ignored:true});
  assert.deepEqual(C.parse('<script>',catalog.resources),{ids:[],ignored:true});
  const p=new URLSearchParams(C.url([c,a]).split('?')[1]);assert.deepEqual(C.parse(p.get('ids'),catalog.resources).ids,[c,a]);
});

test('Every comparison group points to real resources',()=>{
  const ids=new Set(catalog.resources.map(r=>r.id));
  for(const group of C.groups){assert(group.ids.length>=2&&group.ids.length<=3);group.ids.forEach(id=>assert(ids.has(id)));}
});
