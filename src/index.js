// RAVAN production API + Product Management

const CATALOG = [
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

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });

function orderId() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));

  return 'RAVAN-' + [...bytes]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function productId() {
  return Date.now().toString();
}

function cleanString(value) {
  return value == null ? '' : String(value).trim();
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --------------------------------------------------
    // HEALTH
    // --------------------------------------------------

    if (path === '/api/health' && request.method === 'GET') {
      return json({
        ok: true,
        service: 'ravan-api',
        database: !!env.DB,
        time: new Date().toISOString()
      });
    }

    // --------------------------------------------------
    // PUBLIC PRODUCTS
    // --------------------------------------------------

    if (path === '/api/products' && request.method === 'GET') {
      if (!env.DB) {
        return json({
          ok: true,
          source: 'catalog-fallback',
          products: CATALOG
        });
      }

      const { results } = await env.DB.prepare(`
        SELECT
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        FROM products
        WHERE active=1
        ORDER BY featured DESC, id DESC
      `).all();

      return json({
        ok: true,
        source: 'd1',
        products: results
      });
    }

    // --------------------------------------------------
    // PUBLIC SINGLE PRODUCT
    // --------------------------------------------------

    if (
      path.startsWith('/api/products/') &&
      !path.startsWith('/api/admin/products/') &&
      request.method === 'GET'
    ) {
      const id = path.split('/').pop();

      if (!env.DB) {
        const product = CATALOG.find(p => p.id === id);

        return product
          ? json({
              ok: true,
              source: 'catalog-fallback',
              product
            })
          : json({
              ok: false,
              error: 'Product not found'
            }, 404);
      }

      const product = await env.DB.prepare(`
        SELECT
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        FROM products
        WHERE id=? AND active=1
      `)
        .bind(id)
        .first();

      return product
        ? json({
            ok: true,
            source: 'd1',
            product
          })
        : json({
            ok: false,
            error: 'Product not found'
          }, 404);
    }

    // --------------------------------------------------
    // ADMIN PRODUCT LIST
    // --------------------------------------------------

    if (
      path === '/api/admin/products' &&
      request.method === 'GET'
    ) {
      if (!env.DB) {
        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);
      }

      const { results } = await env.DB.prepare(`
        SELECT
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        FROM products
        ORDER BY id DESC
      `).all();

      return json({
        ok: true,
        products: results
      });
    }

    // --------------------------------------------------
    // ADMIN ADD PRODUCT
    // --------------------------------------------------

    if (
      path === '/api/admin/products' &&
      request.method === 'POST'
    ) {
      if (!env.DB) {
        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);
      }

      const body = await readJson(request);

      if (!body) {
        return json({
          ok: false,
          error: 'Invalid JSON'
        }, 400);
      }

      const name = cleanString(body.name);

      if (!name) {
        return json({
          ok: false,
          error: 'Product name is required'
        }, 400);
      }

      const id = productId();

      const brand = cleanString(body.brand);
      const category = cleanString(body.category || 'unisex');
      const price = Math.max(0, numberOrZero(body.price));
      const oldPrice =
        body.old_price === '' ||
        body.old_price == null
          ? null
          : Math.max(0, numberOrZero(body.old_price));

      const tag = cleanString(body.tag);
      const description = cleanString(body.description);
      const seller = cleanString(body.seller);
      const imageUrl = cleanString(body.image_url);
      const productUrl = cleanString(body.product_url);
      const affiliateUrl = cleanString(body.affiliate_url);

      const stock = Math.max(
        0,
        Math.floor(numberOrZero(body.stock))
      );

      const featured =
        body.featured === true ||
        body.featured === 1 ||
        body.featured === '1'
          ? 1
          : 0;

      const active =
        body.active === false ||
        body.active === 0 ||
        body.active === '0'
          ? 0
          : 1;

      await env.DB.prepare(`
        INSERT INTO products (
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `)
        .bind(
          id,
          name,
          brand,
          category,
          price,
          oldPrice,
          tag,
          description,
          seller,
          imageUrl,
          productUrl,
          affiliateUrl,
          stock,
          featured,
          active
        )
        .run();

      const product = await env.DB.prepare(`
        SELECT
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        FROM products
        WHERE id=?
      `)
        .bind(id)
        .first();

      return json({
        ok: true,
        message: 'Product created successfully',
        product
      }, 201);
    }

    // --------------------------------------------------
    // ADMIN UPDATE PRODUCT
    // --------------------------------------------------

    if (
      path.startsWith('/api/admin/products/') &&
      request.method === 'PUT'
    ) {
      if (!env.DB) {
        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);
      }

      const id = path.split('/').pop();
      const body = await readJson(request);

      if (!body) {
        return json({
          ok: false,
          error: 'Invalid JSON'
        }, 400);
      }

      const existing = await env.DB.prepare(`
        SELECT *
        FROM products
        WHERE id=?
      `)
        .bind(id)
        .first();

      if (!existing) {
        return json({
          ok: false,
          error: 'Product not found'
        }, 404);
      }

      const name =
        body.name !== undefined
          ? cleanString(body.name)
          : existing.name;

      if (!name) {
        return json({
          ok: false,
          error: 'Product name is required'
        }, 400);
      }

      const brand =
        body.brand !== undefined
          ? cleanString(body.brand)
          : existing.brand || '';

      const category =
        body.category !== undefined
          ? cleanString(body.category)
          : existing.category || 'unisex';

      const price =
        body.price !== undefined
          ? Math.max(0, numberOrZero(body.price))
          : Number(existing.price || 0);

      let oldPrice = existing.old_price;

      if (body.old_price !== undefined) {
        oldPrice =
          body.old_price === '' ||
          body.old_price == null
            ? null
            : Math.max(0, numberOrZero(body.old_price));
      }

      const tag =
        body.tag !== undefined
          ? cleanString(body.tag)
          : existing.tag || '';

      const description =
        body.description !== undefined
          ? cleanString(body.description)
          : existing.description || '';

      const seller =
        body.seller !== undefined
          ? cleanString(body.seller)
          : existing.seller || '';

      const imageUrl =
        body.image_url !== undefined
          ? cleanString(body.image_url)
          : existing.image_url || '';

      const productUrl =
        body.product_url !== undefined
          ? cleanString(body.product_url)
          : existing.product_url || '';

      const affiliateUrl =
        body.affiliate_url !== undefined
          ? cleanString(body.affiliate_url)
          : existing.affiliate_url || '';

      const stock =
        body.stock !== undefined
          ? Math.max(
              0,
              Math.floor(numberOrZero(body.stock))
            )
          : Number(existing.stock || 0);

      const featured =
        body.featured !== undefined
          ? (
              body.featured === true ||
              body.featured === 1 ||
              body.featured === '1'
                ? 1
                : 0
            )
          : Number(existing.featured || 0);

      const active =
        body.active !== undefined
          ? (
              body.active === true ||
              body.active === 1 ||
              body.active === '1'
                ? 1
                : 0
            )
          : Number(existing.active || 0);

      await env.DB.prepare(`
        UPDATE products
        SET
          name=?,
          brand=?,
          category=?,
          price=?,
          old_price=?,
          tag=?,
          description=?,
          seller=?,
          image_url=?,
          product_url=?,
          affiliate_url=?,
          stock=?,
          featured=?,
          active=?
        WHERE id=?
      `)
        .bind(
          name,
          brand,
          category,
          price,
          oldPrice,
          tag,
          description,
          seller,
          imageUrl,
          productUrl,
          affiliateUrl,
          stock,
          featured,
          active,
          id
        )
        .run();

      const product = await env.DB.prepare(`
        SELECT
          id,
          name,
          brand,
          category,
          price,
          old_price,
          tag,
          description,
          seller,
          image_url,
          product_url,
          affiliate_url,
          stock,
          featured,
          active
        FROM products
        WHERE id=?
      `)
        .bind(id)
        .first();

      return json({
        ok: true,
        message: 'Product updated successfully',
        product
      });
    }

    // --------------------------------------------------
    // ADMIN DELETE / DEACTIVATE PRODUCT
    // --------------------------------------------------

    if (
      path.startsWith('/api/admin/products/') &&
      request.method === 'DELETE'
    ) {
      if (!env.DB) {
        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);
      }

      const id = path.split('/').pop();

      const existing = await env.DB.prepare(`
        SELECT id
        FROM products
        WHERE id=?
      `)
        .bind(id)
        .first();

      if (!existing) {
        return json({
          ok: false,
          error: 'Product not found'
        }, 404);
      }

      await env.DB.prepare(`
        UPDATE products
        SET active=0
        WHERE id=?
      `)
        .bind(id)
        .run();

      return json({
        ok: true,
        message: 'Product deactivated successfully',
        id
      });
    }

    // --------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------

    if (path === '/api/orders' && request.method === 'POST') {
      if (!env.DB) {
        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);
      }

      const body = await readJson(request);

      if (!body) {
        return json({
          ok: false,
          error: 'Invalid JSON'
        }, 400);
      }

      const c = body.customer || {};
      const items = Array.isArray(body.items)
        ? body.items
        : [];

      if (
        !c.name ||
        !c.phone ||
        !c.email ||
        !c.address ||
        !c.city ||
        !c.pin ||
        !c.state ||
        !items.length
      ) {
        return json({
          ok: false,
          error: 'Missing required order information'
        }, 400);
      }

      const ids = [
        ...new Set(
          items.map(x => String(x.id))
        )
      ];

      const placeholders = ids
        .map(() => '?')
        .join(',');

      const { results } = await env.DB.prepare(`
        SELECT id,name,price
        FROM products
        WHERE active=1
        AND id IN (${placeholders})
      `)
        .bind(...ids)
        .all();

      const byId = Object.fromEntries(
        results.map(p => [
          String(p.id),
          p
        ])
      );

      let subtotal = 0;
      const normalized = [];

      for (const item of items) {
        const p = byId[String(item.id)];

        const qty = Math.max(
          1,
          Math.min(
            99,
            Number(item.qty) || 1
          )
        );

        if (!p) {
          return json({
            ok: false,
            error: `Product ${
