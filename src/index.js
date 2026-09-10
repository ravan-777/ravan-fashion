// RAVAN production API

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

export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;

    // =====================================================
    // HEALTH CHECK
    // =====================================================

    if (path === '/api/health' && request.method === 'GET') {

      return json({
        ok: true,
        service: 'ravan-api',
        database: !!env.DB,
        time: new Date().toISOString()
      });

    }


    // =====================================================
    // PRODUCT LIST
    // =====================================================

    if (path === '/api/products' && request.method === 'GET') {

      if (!env.DB) {

        return json({
          ok: true,
          source: 'catalog-fallback',
          products: CATALOG
        });

      }

      const { results } = await env.DB.prepare(
        'SELECT id,name,category,price,old_price,tag,description FROM products WHERE active=1 ORDER BY id'
      ).all();

      return json({
        ok: true,
        source: 'd1',
        products: results
      });

    }


    // =====================================================
    // SINGLE PRODUCT
    // =====================================================

    if (path.startsWith('/api/products/') && request.method === 'GET') {

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

      const product = await env.DB.prepare(
        'SELECT id,name,category,price,old_price,tag,description FROM products WHERE id=? AND active=1'
      ).bind(id).first();

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


    // =====================================================
    // CREATE ORDER
    // =====================================================

    if (path === '/api/orders' && request.method === 'POST') {

      if (!env.DB) {

        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);

      }

      let body;

      try {

        body = await request.json();

      } catch {

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

      const { results } = await env.DB.prepare(
        `SELECT id,name,price
         FROM products
         WHERE active=1
         AND id IN (${placeholders})`
      ).bind(...ids).all();

      const byId = Object.fromEntries(
        results.map(p => [String(p.id), p])
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
            error: `Product ${item.id} is unavailable`
          }, 400);

        }

        subtotal += Number(p.price) * qty;

        normalized.push({
          productId: p.id,
          name: p.name,
          size: String(item.size || ''),
          color: String(item.color || ''),
          quantity: qty,
          unitPrice: Number(p.price)
        });

      }

      const shipping = subtotal >= 2999
        ? 0
        : 199;

      const total = subtotal + shipping;

      const id = orderId();

      const now = new Date().toISOString();


      // =================================================
      // CUSTOMER
      // =================================================

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
      `)
        .bind(
          c.name,
          c.phone,
          c.email,
          c.address,
          c.city,
          c.pin,
          c.state,
          c.landmark || '',
          now,
          now
        )
        .run();


      // =================================================
      // ORDER
      // =================================================

      await env.DB.prepare(`
        INSERT INTO orders
        (id,customer_email,subtotal,shipping,total,status,created_at)
        VALUES (?,?,?,?,?,?,?)
      `)
        .bind(
          id,
          c.email,
          subtotal,
          shipping,
          total,
          'Pending Payment',
          now
        )
        .run();


      // =================================================
      // ORDER ITEMS
      // =================================================

      for (const x of normalized) {

        await env.DB.prepare(`
          INSERT INTO order_items
          (order_id,product_id,product_name,size,color,quantity,unit_price)
          VALUES (?,?,?,?,?,?,?)
        `)
          .bind(
            id,
            x.productId,
            x.name,
            x.size,
            x.color,
            x.quantity,
            x.unitPrice
          )
          .run();

      }


      return json({

        ok: true,

        order: {
          id,
          subtotal,
          shipping,
          total,
          status: 'Pending Payment',
          createdAt: now
        }

      }, 201);

    }


    // =====================================================
    // ADMIN - SINGLE ORDER DETAILS
    // =====================================================

    if (
      path.startsWith('/api/admin/orders/') &&
      request.method === 'GET'
    ) {

      if (!env.DB) {

        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);

      }

      const id = path.split('/').pop();


      // ---------------------------------------------------
      // GET ORDER + CUSTOMER INFORMATION
      // ---------------------------------------------------

      const order = await env.DB.prepare(`
        SELECT
          o.id,
          o.customer_email,
          o.subtotal,
          o.shipping,
          o.total,
          o.status,
          o.created_at,

          c.name,
          c.phone,
          c.address,
          c.city,
          c.pin,
          c.state,
          c.landmark

        FROM orders o

        LEFT JOIN customers c
          ON c.email = o.customer_email

        WHERE o.id = ?
      `)
        .bind(id)
        .first();


      if (!order) {

        return json({
          ok: false,
          error: 'Order not found'
        }, 404);

      }


      // ---------------------------------------------------
      // GET ORDER ITEMS
      // ---------------------------------------------------

      const { results: items } =
        await env.DB.prepare(`
          SELECT
            product_id,
            product_name,
            size,
            color,
            quantity,
            unit_price

          FROM order_items

          WHERE order_id = ?
        `)
          .bind(id)
          .all();


      // ---------------------------------------------------
      // RETURN COMPLETE ORDER
      // ---------------------------------------------------

      return json({

        ok: true,

        order: {

          id: order.id,

          customer: {
            name: order.name,
            phone: order.phone,
            email: order.customer_email,
            address: order.address,
            city: order.city,
            pin: order.pin,
            state: order.state,
            landmark: order.landmark
          },

          items,

          subtotal: order.subtotal,
          shipping: order.shipping,
          total: order.total,

          status: order.status,

          created_at: order.created_at

        }

      });

    }


    // =====================================================
    // ADMIN - ORDER LIST
    // =====================================================

    if (
      path === '/api/admin/orders' &&
      request.method === 'GET'
    ) {

      if (!env.DB) {

        return json({
          ok: false,
          error: 'D1 database is not connected yet'
        }, 503);

      }

      const { results } = await env.DB.prepare(
        `SELECT
          id,
          customer_email,
          subtotal,
          shipping,
          total,
          status,
          created_at

         FROM orders

         ORDER BY created_at DESC

         LIMIT 100`
      ).all();

      return json({
        ok: true,
        orders: results
      });

    }


    // =====================================================
    // UNKNOWN API ROUTE
    // =====================================================

    if (path.startsWith('/api/')) {

      return json({
        ok: false,
        error: 'API route not found'
      }, 404);

    }


    // =====================================================
    // DEFAULT
    // =====================================================

    return new Response('Not Found', {
      status: 404
    });

  }
};
