const CATALOG=[
{id:'1',name:'Obsidian Oversized Tee',category:'men',price:1499,old_price:null,tag:'NEW'},
{id:'2',name:'Raven Utility Jacket',category:'men',price:4999,old_price:5999,tag:'SALE'},
{id:'3',name:'Noir Cargo Trouser',category:'men',price:3299,old_price:null,tag:'NEW'},
{id:'4',name:'Ravan Signature Hoodie',category:'unisex',price:2899,old_price:null,tag:'BESTSELLER'},
{id:'5',name:'Shadowline Bomber',category:'men',price:3999,old_price:null,tag:'NEW'},
{id:'6',name:'Midnight Slip Dress',category:'women',price:3599,old_price:4299,tag:'SALE'},
{id:'7',name:'RAVAN 777 Cap',category:'accessories',price:990,old_price:null,tag:'NEW'},
{id:'8',name:'Ravan Chain',category:'accessories',price:1290,old_price:null,tag:''},
{id:'9',name:'Void Long Sleeve',category:'women',price:2199,old_price:null,tag:''},
{id:'10',name:'Monolith Sneaker',category:'unisex',price:5490,old_price:null,tag:'NEW'},
{id:'11',name:'Afterdark Mini Bag',category:'accessories',price:2399,old_price:2999,tag:'SALE'},
{id:'12',name:'Power Tailored Blazer',category:'women',price:5799,old_price:null,tag:'NEW'}
];

const json=(data,status=200)=>new Response(JSON.stringify(data),{
 status,
 headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});

const str=v=>v==null?'':String(v).trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const pid=()=>Date.now().toString();

function oid(){
 const b=crypto.getRandomValues(new Uint8Array(4));
 return 'RAVAN-'+[...b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
}

async function body(r){
 try{return await r.json()}catch{return null}
}

const fields=`id,name,brand,category,price,old_price,tag,description,seller,image_url,product_url,affiliate_url,stock,featured,active`;

export default {async fetch(request,env){

 const {pathname:path}=new URL(request.url);
 const method=request.method;

 if(path==='/api/health'&&method==='GET'){
  return json({
   ok:true,
   service:'ravan-api',
   database:!!env.DB,
   time:new Date().toISOString()
  });
 }

 if(path==='/api/products'&&method==='GET'){
  if(!env.DB)return json({
   ok:true,source:'catalog-fallback',products:CATALOG
  });

  const {results}=await env.DB.prepare(
   `SELECT ${fields} FROM products WHERE active=1 ORDER BY featured DESC,id DESC`
  ).all();

  return json({ok:true,source:'d1',products:results});
 }

 if(path.startsWith('/api/products/')&&
    !path.startsWith('/api/admin/products/')&&
    method==='GET'){

  const id=path.split('/').pop();

  if(!env.DB){
   const p=CATALOG.find(x=>x.id===id);
   return p
    ?json({ok:true,source:'catalog-fallback',product:p})
    :json({ok:false,error:'Product not found'},404);
  }

  const p=await env.DB.prepare(
   `SELECT ${fields} FROM products WHERE id=? AND active=1`
  ).bind(id).first();

  return p
   ?json({ok:true,source:'d1',product:p})
   :json({ok:false,error:'Product not found'},404);
 }

 if(path==='/api/admin/products'&&method==='GET'){
  if(!env.DB)return json({
   ok:false,error:'D1 database is not connected yet'
  },503);

  const {results}=await env.DB.prepare(
   `SELECT ${fields} FROM products ORDER BY id DESC`
  ).all();

  return json({ok:true,products:results});
 }

 if(path==='/api/admin/products'&&method==='POST'){
  if(!env.DB)return json({
   ok:false,error:'D1 database is not connected yet'
  },503);

  const b=await body(request);

  if(!b)return json({
   ok:false,error:'Invalid JSON'
  },400);

  const name=str(b.name);

  if(!name)return json({
   ok:false,error:'Product name is required'
  },400);

  const id=pid();

  const oldPrice=
   b.old_price===''||b.old_price==null
    ?null
    :Math.max(0,num(b.old_price));

  const active=
   b.active===false||b.active===0||b.active==='0'?0:1;

  const featured=
   b.featured===true||b.featured===1||b.featured==='1'?1:0;

  await env.DB.prepare(`
   INSERT INTO products
   (${fields})
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
   id,
   name,
   str(b.brand),
   str(b.category||'unisex'),
   Math.max(0,num(b.price)),
   oldPrice,
   str(b.tag),
   str(b.description),
   str(b.seller),
   str(b.image_url),
   str(b.product_url),
   str(b.affiliate_url),
   Math.max(0,Math.floor(num(b.stock))),
   featured,
   active
  ).run();

  const product=await env.DB.prepare(
   `SELECT ${fields} FROM products WHERE id=?`
  ).bind(id).first();

  return json({
   ok:true,
   message:'Product created successfully',
   product
  },201);
 }

 if(path.startsWith('/api/admin/products/')&&
    (method==='PUT'||method==='DELETE')){

  if(!env.DB)return json({
   ok:false,error:'D1 database is not connected yet'
  },503);

  const id=path.split('/').pop();

  const old=await env.DB.prepare(
   'SELECT * FROM products WHERE id=?'
  ).bind(id).first();

  if(!old)return json({
   ok:false,error:'Product not found'
  },404);

  if(method==='DELETE'){
   await env.DB.prepare(
    'UPDATE products SET active=0 WHERE id=?'
   ).bind(id).run();

   return json({
    ok:true,
    message:'Product deactivated successfully',
    id
   });
  }

  const b=await body(request);

  if(!b)return json({
   ok:false,error:'Invalid JSON'
  },400);

  const name=b.name!==undefined?str(b.name):str(old.name);

  if(!name)return json({
   ok:false,error:'Product name is required'
  },400);

  const val=(k,d)=>b[k]!==undefined?b[k]:d;

  const oldPrice=
   b.old_price!==undefined
    ?(b.old_price===''||b.old_price==null
      ?null
      :Math.max(0,num(b.old_price)))
    :old.old_price;

  const active=val('active',old.active)?1:0;
  const featured=val('featured',old.featured)?1:0;

  await env.DB.prepare(`
   UPDATE products SET
   name=?,brand=?,category=?,price=?,old_price=?,
   tag=?,description=?,seller=?,image_url=?,
   product_url=?,affiliate_url=?,stock=?,
   featured=?,active=?
   WHERE id=?
  `).bind(
   name,
   str(val('brand',old.brand)),
   str(val('category',old.category||'unisex')),
   Math.max(0,num(val('price',old.price))),
   oldPrice,
   str(val('tag',old.tag)),
   str(val('description',old.description)),
   str(val('seller',old.seller)),
   str(val('image_url',old.image_url)),
   str(val('product_url',old.product_url)),
   str(val('affiliate_url',old.affiliate_url)),
   Math.max(0,Math.floor(num(val('stock',old.stock)))),
   featured,
   active,
   id
  ).run();

  const product=await env.DB.prepare(
   `SELECT ${fields} FROM products WHERE id=?`
  ).bind(id).first();

  return json({
   ok:true,
   message:'Product updated successfully',
   product
  });
 }

 if(path==='/api/orders'&&method==='POST'){
  if(!env.DB)return json({
   ok:false,error:'D1 database is not connected yet'
  },503);

  const b=await body(request);

  if(!b)return json({
   ok:false,error:'Invalid JSON'
  },400);

  const c=b.customer||{};
  const items=Array.isArray(b.items)?b.items:[];

  if(!c.name||!c.phone||!c.email||!c.address||
     !c.city||!c.pin||!c.state||!items.length){
   return json({
    ok:false,error:'Missing required order information'
   },400);
  }

  const ids=[...new Set(items.map(x=>String(x.id)))];
  const ph=ids.map(()=>'?').join(',');

  const {results}=await env.DB.prepare(`
   SELECT id,name,price FROM products
   WHERE active=1 AND id IN (${ph})
  `).bind(...ids).all();

  const map=Object.fromEntries(
   results.map(p=>[String(p.id),p])
  );

  let subtotal=0;
  const normalized=[];

  for(const x of items){
   const p=map[String(x.id)];
   const qty=Math.max(
    1,
    Math.min(99,num(x.qty)||1)
   );

   if(!p)return json({
    ok:false,
    error:`Product ${x.id} is unavailable`
   },400);

   subtotal+=Number(p.price)*qty;

   normalized.push([
    p.id,
    p.name,
    str(x.size),
    str(x.color),
    qty,
    Number(p.price)
   ]);
  }

  const shipping=subtotal>=2999?0:199;
  const total=subtotal+shipping;
  const id=oid();
  const now=new Date().toISOString();

  await env.DB.prepare(`
   INSERT INTO customers
   (name,phone,email,address,city,pin,state,landmark,created_at,updated_at)
   VALUES (?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(email) DO UPDATE SET
   name=excluded.name,
   phone=excluded.phone,
   address=excluded.address,
   city=excluded.city,
   pin=excluded.pin,
   state=excluded.state,
   landmark=excluded.landmark,
   updated_at=excluded.updated_at
  `).bind(
   c.name,c.phone,c.email,c.address,c.city,
   c.pin,c.state,c.landmark||'',now,now
  ).run();

  await env.DB.prepare(`
   INSERT INTO orders
   (id,customer_email,subtotal,shipping,total,status,created_at)
   VALUES (?,?,?,?,?,?,?)
  `).bind(
   id,c.email,subtotal,shipping,total,
   'Pending Payment',now
  ).run();

  for(const x of normalized){
   await env.DB.prepare(`
    INSERT INTO order_items
    (order_id,product_id,product_name,size,color,quantity,unit_price)
    VALUES (?,?,?,?,?,?,?)
   `).bind(id,...x).run();
  }

  return json({
   ok:true,
   order:{
    id,
    subtotal,
    shipping,
    total,
    status:'Pending Payment',
    createdAt:now
   }
  },201);
 }

 if(path==='/api/admin/orders'&&method==='GET'){
  if(!env.DB)return json({
   ok:false,error:'D1 database is not connected yet'
  },503);

  const {results}=await env.DB.prepare(`
   SELECT id,customer_email,subtotal,shipping,total,status,created_at
   FROM orders
   ORDER BY created_at DESC
   LIMIT 100
  `).all();

  return json({
   ok:true,
   orders:results
  });
 }

 if(path.startsWith('/api/')){
  return json({
   ok:false,
   error:'API endpoint not found'
  },404);
 }

 return new Response('Not Found',{status:404});
}};
