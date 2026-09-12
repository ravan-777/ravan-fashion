let products = [];

const fallbackProducts = [
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

const variantFallback = {
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

let filter = 'all';
let cart = JSON.parse(localStorage.ravanCart || '[]');
let wish = JSON.parse(localStorage.ravanWish || '[]');
let cur = null;
let selSize = null;
let selColor = null;

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function list(v, fallback) {
  try {
    const a = Array.isArray(v) ? v : JSON.parse(v || '[]');
    return Array.isArray(a) && a.length ? a : fallback;
  } catch {
    return fallback;
  }
}

function mapProduct(p) {
  const id = String(p.id);
  const fb = variantFallback[id] || [['OS'],['Black']];

  return {
    ...p,
    id,
    cat: String(p.category || p.cat || 'unisex').toLowerCase(),
    price: Number(p.price || 0),
    old: Number(p.old_price || p.old || 0),
    tag: p.tag || '',
    sizes: list(p.sizes, fb[0]),
    colors: list(p.colors, fb[1]),
    desc: p.description || p.desc || '',
    new: Number(p.featured || p.new || 0),
    sale: String(p.tag || '').toUpperCase() === 'SALE',
    image_url: p.image_url || '',
    product_url: p.product_url || '',
    affiliate_url: p.affiliate_url || '',
    seller: p.seller || '',
    brand: p.brand || 'RAVAN',
    stock: Number(p.stock || 0)
  };
}

function img(p) {
  if (p.image_url) return p.image_url;

  const original = fallbackProducts.some(x => x.id === String(p.id));
  return original ? `assets/${p.id}.svg` : 'assets/1.svg';
}

async function loadProducts() {
  try {
    const r = await fetch('/api/products', {
      cache: 'no-store'
    });

    const d = await r.json();

    if (!r.ok || !d.ok || !Array.isArray(d.products)) {
      throw new Error('Product API failed');
    }

    products = d.products.map(mapProduct);
  } catch (e) {
    console.warn('Using fallback products:', e);
    products = fallbackProducts.map(mapProduct);
  }

  render();
  save();
}

function save() {
  localStorage.ravanCart = JSON.stringify(cart);
  localStorage.ravanWish = JSON.stringify(wish);

  const cc = document.getElementById('cc');
  const wc = document.getElementById('wc');

  if (cc) cc.textContent = cart.reduce((a,x) => a + x.qty, 0);
  if (wc) wc.textContent = wish.length;
}

function setFilter(f) {
  filter = f;

  document.querySelectorAll('.chips button').forEach(b => {
    b.classList.toggle('active', b.dataset.f === f);
  });

  const cat = document.getElementById('cat');
  if (cat) cat.value = f;

  render();
  closeM();

  document.getElementById('shop')?.scrollIntoView({
    behavior: 'smooth'
  });
}

function card(p) {
  return `
  <article class="card" onclick="openProduct('${p.id}')">
    <div class="pic">
      <img src="${img(p)}" alt="${p.name}">
      ${p.tag ? `<span class="badge">${p.tag}</span>` : ''}
      <button class="heart ${wish.includes(p.id) ? 'saved' : ''}"
        onclick="event.stopPropagation();toggleWish('${p.id}')">
        ${wish.includes(p.id) ? '♥' : '♡'}
      </button>
    </div>

    <div class="info">
      <div>
        <h3>${p.name}</h3>
        <p>${p.cat.toUpperCase()}</p>
      </div>

      <div class="price">
        ${p.old ? `<span class="old">${money(p.old)}</span>` : ''}
        ${money(p.price)}
      </div>
    </div>
  </article>`;
}

function render() {
  const q = (document.getElementById('q')?.value || '').toLowerCase();

  let a = products.filter(p => {
    const filterOK =
      filter === 'all' ||
      p.cat === filter ||
      (filter === 'new' && p.new) ||
      (filter === 'sale' && p.sale) ||
      (filter === 'men' && p.cat === 'unisex') ||
      (filter === 'women' && p.cat === 'unisex');

    const text =
      `${p.name} ${p.desc} ${p.brand} ${p.seller}`.toLowerCase();

    return filterOK && text.includes(q);
  });

  const sort = document.getElementById('sort')?.value;

  if (sort === 'low') a.sort((x,y) => x.price - y.price);
  if (sort === 'high') a.sort((x,y) => y.price - x.price);
  if (sort === 'newest') a.sort((x,y) => y.new - x.new);

  const grid = document.getElementById('grid');

  if (grid) {
    grid.innerHTML =
      a.map(card).join('') ||
      '<p>No products found.</p>';
  }

  const results = document.getElementById('results');

  if (results) {
    results.innerHTML = a.length
      ? '<div class="grid">' + a.map(card).join('') + '</div>'
      : '<p>No products found.</p>';
  }
}

function openProduct(id) {
  cur = products.find(p => p.id === String(id));
  if (!cur) return;

  selSize = cur.sizes[0];
  selColor = cur.colors[0];

  const external = cur.affiliate_url || cur.product_url;

  let action = '';

  if (external) {
    action = `
      <a class="btn full"
         href="${external}"
         target="_blank"
         rel="noopener noreferrer">
         VIEW DEAL ↗
      </a>`;
  } else if (cur.stock > 0) {
    action = `
      <button class="btn full" onclick="add()">
        ADD TO BAG — ${money(cur.price)}
      </button>`;
  } else {
    action = `
      <button class="btn full" disabled>
        OUT OF STOCK
      </button>`;
  }

  document.getElementById('detail').innerHTML = `
    <div class="detail">

      <div class="detailimg">
        <img src="${img(cur)}" alt="${cur.name}">
      </div>

      <div class="copy">

        <small>${cur.cat.toUpperCase()} / ${cur.brand}</small>

        <h2>${cur.name}</h2>

        <div>
          ${cur.old ? `<span class="old">${money(cur.old)}</span>` : ''}
          ${money(cur.price)}
        </div>

        <p>${cur.desc}</p>

        ${cur.seller
          ? `<small>SELLER / PARTNER: ${cur.seller}</small>`
          : ''}

        <small>SIZE</small>

        <div class="opts" id="sizes">
          ${cur.sizes.map(x => `
            <button
              class="${x === selSize ? 'sel' : ''}"
              onclick="pickSize('${x}')">
              ${x}
            </button>
          `).join('')}
        </div>

        <small>COLOUR</small>

        <div class="opts" id="colors">
          ${cur.colors.map(x => `
            <button
              class="${x === selColor ? 'sel' : ''}"
              onclick="pickColor('${x}')">
              ${x}
            </button>
          `).join('')}
        </div>

        ${cur.stock > 0
          ? `<small>IN STOCK: ${cur.stock}</small>`
          : ''}

        ${action}

      </div>
    </div>
  `;

  document.getElementById('modal').classList.add('open');
}

function pickSize(x) {
  selSize = x;

  document.querySelectorAll('#sizes button').forEach(b => {
    b.classList.toggle('sel', b.textContent.trim() === x);
  });
}

function pickColor(x) {
  selColor = x;

  document.querySelectorAll('#colors button').forEach(b => {
    b.classList.toggle('sel', b.textContent.trim() === x);
  });
}

function add() {
  if (!cur) return;

  if (cur.affiliate_url || cur.product_url) {
    window.open(
      cur.affiliate_url || cur.product_url,
      '_blank',
      'noopener,noreferrer'
    );
    return;
  }

  if (cur.stock <= 0) {
    alert('This product is currently out of stock.');
    return;
  }

  let item = cart.find(x =>
    x.id === cur.id &&
    x.size === selSize &&
    x.color === selColor
  );

  if (item) {
    if (item.qty >= cur.stock) {
      alert('Maximum available stock reached.');
      return;
    }

    item.qty++;
  } else {
    cart.push({
      id: cur.id,
      size: selSize,
      color: selColor,
      qty: 1
    });
  }

  save();
  closeM();
  openCart();
}

function toggleWish(id) {
  id = String(id);

  const i = wish.indexOf(id);

  if (i === -1) {
    wish.push(id);
  } else {
    wish.splice(i, 1);
  }

  save();
  render();
}

function openCart() {
  let html = '';
  let total = 0;

  cart.forEach((x,i) => {
    const p = products.find(p => p.id === String(x.id));
    if (!p) return;

    const line = p.price * x.qty;
    total += line;

    html += `
      <div class="row">

        <img src="${img(p)}" alt="${p.name}">

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
          ${money(line)}
          <br>
          <button class="remove" onclick="del(${i})">
            REMOVE
          </button>
        </div>

      </div>
    `;
  });

  const box = document.getElementById('cartItems');
  const totalEl = document.getElementById('total');

  if (box) {
    box.innerHTML = html || '<p>No items in your bag.</p>';
  }

  if (totalEl) {
    totalEl.textContent = money(total);
  }

  document.getElementById('cart')?.classList.add('open');
}

function qty(i, change) {
  if (!cart[i]) return;

  const p = products.find(p => p.id === String(cart[i].id));

  if (change > 0 && p && p.stock > 0 && cart[i].qty >= p.stock) {
    alert('Maximum available stock reached.');
    return;
  }

  cart[i].qty += change;

  if (cart[i].qty <= 0) {
    cart.splice(i,1);
  }

  save();
  openCart();
}

function del(i) {
  cart.splice(i,1);
  save();
  openCart();
}

function openWish() {
  const box = document.getElementById('wishItems');

  if (!box) return;

  const items = wish
    .map(id => products.find(p => p.id === String(id)))
    .filter(Boolean);

  box.innerHTML = items.length
    ? items.map(p => card(p)).join('')
    : '<p>Your wishlist is empty.</p>';

  document.getElementById('wish')?.classList.add('open');
}

function openSearch() {
  document.getElementById('search')?.classList.add('open');

  setTimeout(() => {
    document.getElementById('q')?.focus();
  },100);

  render();
}

function openFilters() {
  document.getElementById('filters')?.classList.add('open');
}

function closeM() {
  document.querySelectorAll('.overlay').forEach(x => {
    x.classList.remove('open');
  });
}

function openCheckout() {
  if (!cart.length) {
    alert('Your bag is empty.');
    return;
  }

  let subtotal = 0;
  let html = '';

  cart.forEach(x => {
    const p = products.find(p => p.id === String(x.id));
    if (!p) return;

    const line = p.price * x.qty;
    subtotal += line;

    html += `
      <div class="summary-item">
        <span>${p.name} × ${x.qty}</span>
        <b>${money(line)}</b>
      </div>
    `;
  });

  const shipping = subtotal >= 2999 ? 0 : 199;
  const total = subtotal + shipping;

  document.getElementById('checkoutItems').innerHTML = html;
  document.getElementById('checkoutSubtotal').textContent = money(subtotal);
  document.getElementById('checkoutShipping').textContent = money(shipping);
  document.getElementById('checkoutTotal').textContent = money(total);

  closeM();
  document.getElementById('checkout')?.classList.add('open');
}

async function placeOrder(event) {
  event.preventDefault();

  if (!cart.length) {
    alert('Your bag is empty.');
    return;
  }

  const items = [];

  cart.forEach(x => {
    const p = products.find(p => p.id === String(x.id));

    if (p) {
      items.push({
        id: p.id,
        name: p.name,
        size: x.size,
        color: x.color,
        qty: x.qty,
        price: p.price
      });
    }
  });

  const subtotal = items.reduce(
    (sum,x) => sum + Number(x.price) * Number(x.qty),
    0
  );

  const shipping = subtotal >= 2999 ? 0 : 199;
  const total = subtotal + shipping;

  const payload = {
    customer: {
      name: document.getElementById('cName').value.trim(),
      phone: document.getElementById('cPhone').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      address: document.getElementById('cAddress').value.trim(),
      city: document.getElementById('cCity').value.trim(),
      pin: document.getElementById('cPin').value.trim(),
      state: document.getElementById('cState').value,
      landmark: document.getElementById('cLandmark').value.trim()
    },
    items,
    subtotal,
    shipping,
    total
  };

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const d = await r.json();

    if (!r.ok || !d.ok) {
      throw new Error(d.error || 'Order failed');
    }

    alert(
      `Order placed successfully!\nOrder ID: ${d.order?.id || 'RAVAN'}`
    );

    cart = [];
    save();
    document.getElementById('checkoutForm')?.reset();
    closeM();
    openCart();

  } catch (e) {
    console.error(e);

    alert(
      'Order could not be submitted right now. Please try again.'
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  save();
  loadProducts();
});
