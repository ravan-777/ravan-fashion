let products=[];

const fallbackProducts=[
{id:'1',name:'Obsidian Oversized Tee',cat:'men',price:1499,old:0,tag:'NEW',sizes:['S','M','L','XL'],colors:['Black','Charcoal'],desc:'Heavyweight cotton with a relaxed oversized cut.',new:1,sale:0},
{id:'2',name:'Raven Utility Jacket',cat:'men',price:4999,old:5999,tag:'SALE',sizes:['S','M','L','XL'],colors:['Black'],desc:'Structured utility jacket with functional pocket detailing.',new:0,sale:1},
{id:'3',name:'Noir Cargo Trouser',cat:'men',price:3299,old:0,tag:'NEW',sizes:['28','30','32','34','36'],colors:['Black','Stone'],desc:'Tapered cargo trousers with a clean modern finish.',new:1,sale:0},
{id:'4',name:'Ravan Signature Hoodie',cat:'unisex',price:2899,old:0,tag:'BESTSELLER',sizes:['S','M','L','XL'],colors:['Black','Bone'],desc:'Premium fleece hoodie with a minimal RAVAN signature.',new:0,sale:0},
{id:'5',name:'Shadowline Bomber',cat:'women',price:4299,old:0,tag:'NEW',sizes:['XS','S','M','L'],colors:['Black'],desc:'Cropped bomber with a sculpted silhouette.',new:1,sale:0},
{id:'6',name:'Midnight Slip Dress',cat:'women',price:3599,old:4299,tag:'SALE',sizes:['XS','S','M','L'],colors:['Black'],desc:'Fluid satin-inspired dress with an evening-ready profile.',new:0,sale:1},
{id:'7',name:'RAVAN 777 Cap',cat:'accessories',price:999,old:0,tag:'NEW',sizes:['OS'],colors:['Black','Grey'],desc:'Six-panel cap finished with a subtle 777 mark.',new:1,sale:0},
{id:'8',name:'Ravan Chain',cat:'accessories',price:1299,old:0,tag:'',sizes:['OS'],colors:['Silver'],desc:'Minimal statement chain designed for everyday layering.',new:0,sale:0},
{id:'9',name:'Void Long Sleeve',cat:'women',price:2199,old:0,tag:'',sizes:['XS','S','M','L'],colors:['Black'],desc:'Second-skin long sleeve with soft stretch.',new:0,sale:0},
{id:'10',name:'Monolith Sneaker',cat:'unisex',price:5499,old:0,tag:'NEW',sizes:['6','7','8','9','10'],colors:['Black','White'],desc:'Minimal low-top sneaker with a bold sole.',new:1,sale:0},
{id:'11',name:'Afterdark Mini Bag',cat:'accessories',price:2399,old:2999,tag:'SALE',sizes:['OS'],colors:['Black'],desc:'Compact crossbody bag with adjustable strap.',new:0,sale:1},
{id:'12',name:'Power Tailored Blazer',cat:'women',price:5799,old:0,tag:'NEW',sizes:['XS','S','M','L'],colors:['Black'],desc:'Sharp tailored blazer with an architectural silhouette.',new:1,sale:0}
];

let filter='all';
let cart=JSON.parse(localStorage.ravanCart||'[]');
let wish=JSON.parse(localStorage.ravanWish||'[]');
let cur=null,selSize=null,selColor=null;

const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');

const variantFallback={
'1':[['S','M','L','XL'],['Black','Charcoal']],
'2':[['S','M','L','XL'],['Black']],
'3':[['28','30','32','34','36'],['Black','Stone']],
'4':[['S','M','L','XL'],['Black','Bone']],
'5':[['XS','S','M','L'],['Black']],
'6':[['XS','S','M','L'],['Black']],
'7':[['OS'],['Black','Grey']],
'8':[['OS'],['Silver']],
'9':[['XS','S','M','L'],['Black']],
'10':[['6','7','8','9','10'],['Black','White']],
'11':[['OS'],['Black']],
'12':[['XS','S','M','L'],['Black']]
};

function list(v,fb){
try{
const a=Array.isArray(v)?v:JSON.parse(v||'[]');
return Array.isArray(a)&&a.length?a:fb;
}catch{
return fb;
}
}

function mapProduct(p){
const id=String(p.id);
const fb=variantFallback[id]||[['OS'],['Black']];
return {
...p,
id,
cat:String(p.category||p.cat||'unisex').toLowerCase(),
price:Number(p.price||0),
old:Number(p.old_price||p.old||0),
tag:p.tag||'',
sizes:list(p.sizes,fb[0]),
colors:list(p.colors,fb[1]),
desc:p.description||p.desc||'',
new:Number(p.featured||p.new||0),
sale:String(p.tag||'').toUpperCase()==='SALE',
image_url:p.image_url||'',
product_url:p.product_url||'',
affiliate_url:p.affiliate_url||'',
seller:p.seller||'',
brand:p.brand||'RAVAN',
stock:Number(p.stock||0)
};
}

function img(p){
return p.image_url||`assets/${fallbackProducts.some(x=>x.id===String(p.id))?p.id:'1'}.svg`;
}

async function loadProducts(){
try{
const r=await fetch('/api/products',{cache:'no-store'});
const d=await r.json();
if(!r.ok||!d.ok||!Array.isArray(d.products))throw Error('API error');
products=d.products.map(mapProduct);
}catch(e){
console.warn('D1 unavailable; using fallback catalogue.',e);
products=fallbackProducts.map(mapProduct);
}
render();
}

function save(){
localStorage.ravanCart=JSON.stringify(cart);
localStorage.ravanWish=JSON.stringify(wish);

const cc=document.getElementById('cc');
const wc=document.getElementById('wc');

if(cc)cc.textContent=cart.reduce((a,x)=>a+x.qty,0);
if(wc)wc.textContent=wish.length;
}

function setFilter(f){
filter=f;
document.querySelectorAll('.chips button').forEach(b=>{
b.classList.toggle('active',b.dataset.f===f);
});
render();
document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});
closeM();
}

function card(p){
return `
<article class="card" onclick="openProduct('${p.id}')">
<div class="pic">
<img src="${img(p)}" alt="${p.name}">
${p.tag?`<span class="badge">${p.tag}</span>`:''}
<button class="heart ${wish.includes(p.id)?'saved':''}" onclick="event.stopPropagation();toggleWish('${p.id}')">
${wish.includes(p.id)?'♥':'♡'}
</button>
</div>
<div class="info">
<div>
<h3>${p.name}</h3>
<p>${p.cat.toUpperCase()}</p>
</div>
<div class="price">
${p.old?`<span class="old">${money(p.old)}</span>`:''}
${money(p.price)}
</div>
</div>
</article>`;
}

function render(){
const q=(document.getElementById('q')?.value||'').toLowerCase();

let a=products.filter(p=>{
const matchFilter=
filter==='all'||
p.cat===filter||
(filter==='new'&&p.new)||
(filter==='sale'&&p.sale)||
(filter==='men'&&p.cat==='unisex')||
(filter==='women'&&p.cat==='unisex');

return matchFilter&&(p.name+' '+p.desc+' '+p.brand+' '+p.seller).toLowerCase().includes(q);
});

const s=document.getElementById('sort')?.value;

if(s==='low')a.sort((x,y)=>x.price-y.price);
if(s==='high')a.sort((x,y)=>y.price-x.price);
if(s==='newest')a.sort((x,y)=>y.new-x.new);

const grid=document.getElementById('grid');
if(grid)grid.innerHTML=a.map(card).join('')||'<p>No products found.</p>';

const search=document.getElementById('search');
const results=document.getElementById('results');

if(search?.classList.contains('open')&&results){
results.innerHTML='<div class="grid">'+a.map(card).join('')+'</div>';
}
}

function openProduct(id){
cur=products.find(p=>p.id===String(id));
if(!cur)return;

selSize=cur.sizes[0];
selColor=cur.colors[0];

const externalUrl=cur.affiliate_url||cur.product_url;

const action=externalUrl
?`<a class="btn full" href="${externalUrl}" target="_blank" rel="noopener noreferrer">VIEW DEAL ↗</a>`
:`<button class="btn full" onclick="add()">ADD TO BAG — ${money(cur.price)}</button>`;

document.getElementById('detail').innerHTML=`
<div class="detail">
<div class="detailimg">
<img src="${img(cur)}" alt="${cur.name}">
</div>

<div class="copy">
<small>${cur.cat.toUpperCase()} / ${cur.brand||'RAVAN'}</small>
<h2>${cur.name}</h2>

<div>
${cur.old?`<span class="old">${money(cur.old)}</span>`:''}
${money(cur.price)}
</div>

<p>${cur.desc}</p>

${cur.seller?`<small>SELLER / PARTNER: ${cur.seller}</small>`:''}

<small>SIZE</small>
<div class="opts" id="sizes">
${cur.sizes.map(x=>`
<button class="${x===selSize?'sel':''}" onclick="pickSize('${x}')">${x}</button>
`).join('')}
</div>

<small>COLOUR</small>
<div class="opts" id="colors">
${cur.colors.map(x=>`
<button class="${x===selColor?'sel':''}" onclick="pickColor('${x}')">${x}</button>
`).join('')}
</div>

${cur.stock>0?`<small>IN STOCK: ${cur.stock}</small>`:''}

${action}
</div>
</div>`;

document.getElementById('modal').classList.add('open');
}

function pickSize(x){
selSize=x;
document.querySelectorAll('#sizes button').forEach(b=>{
b.classList.toggle('sel',b.textContent===x);
});
}

function pickColor(x){
selColor=x;
document.querySelectorAll('#colors button').forEach(b=>{
b.classList.toggle('sel',b.textContent===x);
});
}

function add(){
if(!cur)return;

if(cur.affiliate_url||cur.product_url){
window.open(cur.affiliate_url||cur.product_url,'_blank','noopener,noreferrer');
return;
}

if(cur.stock<=0){
alert('This product is currently out of stock.');
return;
}

const x=cart.find(x=>
x.id===cur.id&&
x.size===selSize&&
x.color===selColor
);

if(x){
if(x.qty>=cur.stock){
alert('Maximum available stock reached.');
return;
}
x.qty++;
}else{
cart.push({
id:cur.id,
size:selSize,
color:selColor,
qty:1
});
}

save();
closeM();
openCart();
}

function toggleWish(id){
id=String(id);
const i=wish.indexOf(id);

if(i<0)wish.push(id);
else wish.splice(i,1);

save();
render();
}

function openCart(){
let h='',t=0;

cart.forEach((x,i)=>{
const p=products.find(p=>p.id===String(x.id));
if(!p)return;

t+=p.price*x.qty;

h+=`
<div class="row">
<img src="${img(p)}">
<div>
<h4>${p.name}</h4>
.size} / ${x.color}</p>
<div class="qty">
<button onclick="qty(${i},-1)">−</button>
${x.qty}
<button onclick="qty(${i},1)">+</button>
</div>
</div>
<div>
${money(p.price*x.qty)}
<br>
<button class="remove" onclick="del(${i})">REMOVE</button>
</div>
</div>`;
});

document.getElementById('cartItems').innerHTML=h||'<p>No items in your bag.</p>';
document.getElementById('total').textContent=money(t);
document.getElementById('cart').classList.add('open');let products=[];

const fallbackProducts=[
{id:'1',name:'Obsidian Oversized Tee',cat:'men',price:1499,old:0,tag:'NEW',sizes:['S','M','L','XL'],colors:['Black','Charcoal'],desc:'Heavyweight cotton with a relaxed oversized cut.',new:1,sale:0},
{id:'2',name:'Raven Utility Jacket',cat:'men',price:4999,old:5999,tag:'SALE',sizes:['S','M','L','XL'],colors:['Black'],desc:'Structured utility jacket with functional pocket detailing.',new:0,sale:1},
{id:'3',name:'Noir Cargo Trouser',cat:'men',price:3299,old:0,tag:'NEW',sizes:['28','30','32','34','36'],colors:['Black','Stone'],desc:'Tapered cargo trousers with a clean modern finish.',new:1,sale:0},
{id:'4',name:'Ravan Signature Hoodie',cat:'unisex',price:2899,old:0,tag:'BESTSELLER',sizes:['S','M','L','XL'],colors:['Black','Bone'],desc:'Premium fleece hoodie with a minimal RAVAN signature.',new:0,sale:0},
{id:'5',name:'Shadowline Bomber',cat:'women',price:4299,old:0,tag:'NEW',sizes:['XS','S','M','L'],colors:['Black'],desc:'Cropped bomber with a sculpted silhouette.',new:1,sale:0},
{id:'6',name:'Midnight Slip Dress',cat:'women',price:3599,old:4299,tag:'SALE',sizes:['XS','S','M','L'],colors:['Black'],desc:'Fluid satin-inspired dress with an evening-ready profile.',new:0,sale:1},
{id:'7',name:'RAVAN 777 Cap',cat:'accessories',price:999,old:0,tag:'NEW',sizes:['OS'],colors:['Black','Grey'],desc:'Six-panel cap finished with a subtle 777 mark.',new:1,sale:0},
{id:'8',name:'Ravan Chain',cat:'accessories',price:1299,old:0,tag:'',sizes:['OS'],colors:['Silver'],desc:'Minimal statement chain designed for everyday layering.',new:0,sale:0},
{id:'9',name:'Void Long Sleeve',cat:'women',price:2199,old:0,tag:'',sizes:['XS','S','M','L'],colors:['Black'],desc:'Second-skin long sleeve with soft stretch.',new:0,sale:0},
{id:'10',name:'Monolith Sneaker',cat:'unisex',price:5499,old:0,tag:'NEW',sizes:['6','7','8','9','10'],colors:['Black','White'],desc:'Minimal low-top sneaker with a bold sole.',new:1,sale:0},
{id:'11',name:'Afterdark Mini Bag',cat:'accessories',price:2399,old:2999,tag:'SALE',sizes:['OS'],colors:['Black'],desc:'Compact crossbody bag with adjustable strap.',new:0,sale:1},
{id:'12',name:'Power Tailored Blazer',cat:'women',price:5799,old:0,tag:'NEW',sizes:['XS','S','M','L'],colors:['Black'],desc:'Sharp tailored blazer with an architectural silhouette.',new:1,sale:0}
];

let filter='all';
let cart=JSON.parse(localStorage.ravanCart||'[]');
let wish=JSON.parse(localStorage.ravanWish||'[]');
let cur=null,selSize=null,selColor=null;

const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');

const variantFallback={
'1':[['S','M','L','XL'],['Black','Charcoal']],
'2':[['S','M','L','XL'],['Black']],
'3':[['28','30','32','34','36'],['Black','Stone']],
'4':[['S','M','L','XL'],['Black','Bone']],
'5':[['XS','S','M','L'],['Black']],
'6':[['XS','S','M','L'],['Black']],
'7':[['OS'],['Black','Grey']],
'8':[['OS'],['Silver']],
'9':[['XS','S','M','L'],['Black']],
'10':[['6','7','8','9','10'],['Black','White']],
'11':[['OS'],['Black']],
'12':[['XS','S','M','L'],['Black']]
};

function list(v,fb){
try{
const a=Array.isArray(v)?v:JSON.parse(v||'[]');
return Array.isArray(a)&&a.length?a:fb;
}catch{
return fb;
}
}

function mapProduct(p){
const id=String(p.id);
const fb=variantFallback[id]||[['OS'],['Black']];
return {
...p,
id,
cat:String(p.category||p.cat||'unisex').toLowerCase(),
price:Number(p.price||0),
old:Number(p.old_price||p.old||0),
tag:p.tag||'',
sizes:list(p.sizes,fb[0]),
colors:list(p.colors,fb[1]),
desc:p.description||p.desc||'',
new:Number(p.featured||p.new||0),
sale:String(p.tag||'').toUpperCase()==='SALE',
image_url:p.image_url||'',
product_url:p.product_url||'',
affiliate_url:p.affiliate_url||'',
seller:p.seller||'',
brand:p.brand||'RAVAN',
stock:Number(p.stock||0)
};
}

function img(p){
return p.image_url||`assets/${fallbackProducts.some(x=>x.id===String(p.id))?p.id:'1'}.svg`;
}

async function loadProducts(){
try{
const r=await fetch('/api/products',{cache:'no-store'});
const d=await r.json();
if(!r.ok||!d.ok||!Array.isArray(d.products))throw Error('API error');
products=d.products.map(mapProduct);
}catch(e){
console.warn('D1 unavailable; using fallback catalogue.',e);
products=fallbackProducts.map(mapProduct);
}
render();
}

function save(){
localStorage.ravanCart=JSON.stringify(cart);
localStorage.ravanWish=JSON.stringify(wish);

const cc=document.getElementById('cc');
const wc=document.getElementById('wc');

if(cc)cc.textContent=cart.reduce((a,x)=>a+x.qty,0);
if(wc)wc.textContent=wish.length;
}

function setFilter(f){
filter=f;
document.querySelectorAll('.chips button').forEach(b=>{
b.classList.toggle('active',b.dataset.f===f);
});
render();
document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});
closeM();
}

function card(p){
return `
<article class="card" onclick="openProduct('${p.id}')">
<div class="pic">
<img src="${img(p)}" alt="${p.name}">
${p.tag?`<span class="badge">${p.tag}</span>`:''}
<button class="heart ${wish.includes(p.id)?'saved':''}" onclick="event.stopPropagation();toggleWish('${p.id}')">
${wish.includes(p.id)?'♥':'♡'}
</button>
</div>
<div class="info">
<div>
<h3>${p.name}</h3>
<p>${p.cat.toUpperCase()}</p>
</div>
<div class="price">
${p.old?`<span class="old">${money(p.old)}</span>`:''}
${money(p.price)}
</div>
</div>
</article>`;
}

function render(){
const q=(document.getElementById('q')?.value||'').toLowerCase();

let a=products.filter(p=>{
const matchFilter=
filter==='all'||
p.cat===filter||
(filter==='new'&&p.new)||
(filter==='sale'&&p.sale)||
(filter==='men'&&p.cat==='unisex')||
(filter==='women'&&p.cat==='unisex');

return matchFilter&&(p.name+' '+p.desc+' '+p.brand+' '+p.seller).toLowerCase().includes(q);
});

const s=document.getElementById('sort')?.value;

if(s==='low')a.sort((x,y)=>x.price-y.price);
if(s==='high')a.sort((x,y)=>y.price-x.price);
if(s==='newest')a.sort((x,y)=>y.new-x.new);

const grid=document.getElementById('grid');
if(grid)grid.innerHTML=a.map(card).join('')||'<p>No products found.</p>';

const search=document.getElementById('search');
const results=document.getElementById('results');

if(search?.classList.contains('open')&&results){
results.innerHTML='<div class="grid">'+a.map(card).join('')+'</div>';
}
}

function openProduct(id){
cur=products.find(p=>p.id===String(id));
if(!cur)return;

selSize=cur.sizes[0];
selColor=cur.colors[0];

const externalUrl=cur.affiliate_url||cur.product_url;

const action=externalUrl
?`<a class="btn full" href="${externalUrl}" target="_blank" rel="noopener noreferrer">VIEW DEAL ↗</a>`
:`<button class="btn full" onclick="add()">ADD TO BAG — ${money(cur.price)}</button>`;

document.getElementById('detail').innerHTML=`
<div class="detail">
<div class="detailimg">
<img src="${img(cur)}" alt="${cur.name}">
</div>

<div class="copy">
<small>${cur.cat.toUpperCase()} / ${cur.brand||'RAVAN'}</small>
<h2>${cur.name}</h2>

<div>
${cur.old?`<span class="old">${money(cur.old)}</span>`:''}
${money(cur.price)}
</div>

<p>${cur.desc}</p>

${cur.seller?`<small>SELLER / PARTNER: ${cur.seller}</small>`:''}

<small>SIZE</small>
<div class="opts" id="sizes">
${cur.sizes.map(x=>`
<button class="${x===selSize?'sel':''}" onclick="pickSize('${x}')">${x}</button>
`).join('')}
</div>

<small>COLOUR</small>
<div class="opts" id="colors">
${cur.colors.map(x=>`
<button class="${x===selColor?'sel':''}" onclick="pickColor('${x}')">${x}</button>
`).join('')}
</div>

${cur.stock>0?`<small>IN STOCK: ${cur.stock}</small>`:''}

${action}
</div>
</div>`;

document.getElementById('modal').classList.add('open');
}

function pickSize(x){
selSize=x;
document.querySelectorAll('#sizes button').forEach(b=>{
b.classList.toggle('sel',b.textContent===x);
});
}

function pickColor(x){
selColor=x;
document.querySelectorAll('#colors button').forEach(b=>{
b.classList.toggle('sel',b.textContent===x);
});
}

function add(){
if(!cur)return;

if(cur.affiliate_url||cur.product_url){
window.open(cur.affiliate_url||cur.product_url,'_blank','noopener,noreferrer');
return;
}

if(cur.stock<=0){
alert('This product is currently out of stock.');
return;
}

const x=cart.find(x=>
x.id===cur.id&&
x.size===selSize&&
x.color===selColor
);

if(x){
if(x.qty>=cur.stock){
alert('Maximum available stock reached.');
return;
}
x.qty++;
}else{
cart.push({
id:cur.id,
size:selSize,
color:selColor,
qty:1
});
}

save();
closeM();
openCart();
}

function toggleWish(id){
id=String(id);
const i=wish.indexOf(id);

if(i<0)wish.push(id);
else wish.splice(i,1);

save();
render();
}

function openCart(){
let h='',t=0;

cart.forEach((x,i)=>{
const p=products.find(p=>p.id===String(x.id));
if(!p)return;

t+=p.price*x.qty;

h+=`
<div class="row">
<img src="${img(p)}">
<div>
<h4>${p.name}</h4>
<p>${x.size} / ${x.color}</p>
<div class="qty">
<button onclick="qty(${i},-1)">−</button>
${x.qty}
<button onclick="qty(${i},1)">+</button>
</div>
</div>
<div>
${money(p.price*x.qty)}
<br>
<button class="remove" onclick="del(${i})">REMOVE</button>
</div>
</div>`;
});

document.getElementById('cartItems').innerHTML=h||'<p>No items in your bag.</p>';
document.getElementById('total').textContent=money(t);
document.getElementById('cart').classList.add('open');
}

function qty(i,d){
const item=cart[i];
const p=products.find(p=>p.id===String(item.id));

if(d>0&&p&&p.stock>0&&item.qty>=p.stock){
alert('Maximum available stock reached.');
return;
}

item.qty=Math.max(1,item.qty+d);
save();
openCart();
}

function del(i){
cart.splice(i,1);
save();
openCart();
}

function openWish(){
document.getElementById('wishItems').innerHTML=
wish.map(id=>{
const p=products.find(p=>p.id===String(id));
if(!p)return '';

return `
<div class="row">
<img src="${img(p)}">
<div>
<h4>${p.name}</h4>
<p>${money(p.price)}</p>
</div>
<button class="remove" onclick="toggleWish('${id}');openWish()">REMOVE</button>
</div>`;
}).join('')||'<p>No saved products.</p>';

document.getElementById('wish').classList.add('open');
}

function openSearch(){
document.getElementById('search').classList.add('open');
document.getElementById('q').focus();
render();
}

function openFilters(){
document.getElementById('filters').classList.add('open');
}

function closeM(){
document.querySelectorAll('.overlay').forEach(x=>{
x.classList.remove('open');
});
}

document.getElementById('chips').innerHTML=
['all','men','women','accessories','new','sale']
.map(x=>`
<button data-f="${x}" onclick="setFilter('${x}')">
${x==='all'?'All':x.replace(/^./,c=>c.toUpperCase())}
</button>
`).join('');

document.querySelector('#chips button')?.classList.add('active');

save();

function cartTotal(){
return cart.reduce((t,x)=>{
const p=products.find(p=>p.id===String(x.id));
return t+(p?p.price*x.qty:0);
},0);
}

function openCheckout(){
if(!cart.length){
alert('Your bag is empty.');
return;
}

const subtotal=cartTotal();
const shipping=subtotal>=2999?0:199;

document.getElementById('checkoutItems').innerHTML=
cart.map(x=>{
const p=products.find(p=>p.id===String(x.id));

return p?`
<div class="checkout-item">
<span>
${p.name}
<small>${x.size} / ${x.color} × ${x.qty}</small>
</span>
<b>${money(p.price*x.qty)}</b>
</div>`:'';
}).join('');

document.getElementById('checkoutSubtotal').textContent=money(subtotal);
document.getElementById('checkoutShipping').textContent=shipping?money(shipping):'FREE';
document.getElementById('checkoutTotal').textContent=money(subtotal+shipping);

document.getElementById('checkout').classList.add('open');
}

async function placeOrder(e){
e.preventDefault();

if(!cart.length)return;

const subtotal=cartTotal();
const shipping=subtotal>=2999?0:199;
const total=subtotal+shipping;

const customer={
name:document.getElementById('cName').value.trim(),
phone:document.getElementById('cPhone').value.trim(),
email:document.getElementById('cEmail').value.trim(),
address:document.getElementById('cAddress').value.trim(),
city:document.getElementById('cCity').value.trim(),
pin:document.getElementById('cPin').value.trim(),
state:document.getElementById('cState').value,
landmark:document.getElementById('cLandmark').value.trim()
};

const payload={
customer,
items:cart.map(x=>({...x})),
subtotal,
shipping,
total
};

try{
const res=await fetch('/api/orders',{
method:'POST',
headers:{'content-type':'application/json'},
body:JSON.stringify(payload)
});

const data=await res.json().catch(()=>({}));

if(res.ok&&data.ok){
localStorage.ravanLastOrder=JSON.stringify(data.order);
cart=[];
save();
closeM();

alert(
`Order ${data.order.orderId} created successfully. Your order is saved in RAVAN database.`
);

return;
}

if(res.status!==503){
throw Error(data.error||'Order could not be created.');
}

}catch(err){
console.warn('Backend order API unavailable; using local demo fallback.',err);
}

const orderId='RAVAN-'+Date.now().toString().slice(-8);

const order={
orderId,
createdAt:new Date().toISOString(),
customer,
items:cart.map(x=>({...x})),
subtotal,
shipping,
total,
status:'Pending Payment',
mode:'local-demo'
};

localStorage.ravanLastOrder=JSON.stringify(order);

localStorage.ravanOrders=
JSON.stringify([
order,
...JSON.parse(localStorage.ravanOrders||'[]')
]);

cart=[];
save();
closeM();

alert(`Order ${orderId} created successfully. Demo/local order saved.`);
}

loadProducts();￼Enter
}

function qty(i,d){
const item=cart[i];
const p=products.find(p=>p.id===String(item.id));

if(d>0&&p&&p.stock>0&&item.qty>=p.stock){
alert('Maximum available stock reached.');
return;
}

item.qty=Math.max(1,item.qty+d);
save();
openCart();
}

function del(i){
cart.splice(i,1);
save();
openCart();
}

function openWish(){
document.getElementById('wishItems').innerHTML=
wish.map(id=>{
const p=products.find(p=>p.id===String(id));
if(!p)return '';

return `
<div class="row">
<img src="${img(p)}">
<div>
<h4>${p.name}</h4>
<p>${money(p.price)}</p>
</div>
<button class="remove" onclick="toggleWish('${id}');openWish()">REMOVE</button>
</div>`;
}).join('')||'<p>No saved products.</p>';

document.getElementById('wish').classList.add('open');
}

function openSearch(){
document.getElementById('search').classList.add('open');
document.getElementById('q').focus();
render();
}

function openFilters(){
document.getElementById('filters').classList.add('open');
}

function closeM(){
document.querySelectorAll('.overlay').forEach(x=>{
x.classList.remove('open');
});
}

document.getElementById('chips').innerHTML=
['all','men','women','accessories','new','sale']
.map(x=>`
<button data-f="${x}" onclick="setFilter('${x}')">
${x==='all'?'All':x.replace(/^./,c=>c.toUpperCase())}
</button>
`).join('');

document.querySelector('#chips button')?.classList.add('active');

save();

function cartTotal(){
return cart.reduce((t,x)=>{
const p=products.find(p=>p.id===String(x.id));
return t+(p?p.price*x.qty:0);
},0);
}

function openCheckout(){
if(!cart.length){
alert('Your bag is empty.');
return;
}

const subtotal=cartTotal();
const shipping=subtotal>=2999?0:199;

document.getElementById('checkoutItems').innerHTML=
cart.map(x=>{
