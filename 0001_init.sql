PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  old_price INTEGER,
  tag TEXT DEFAULT '',
  description TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pin TEXT NOT NULL,
  state TEXT NOT NULL,
  landmark TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Payment',
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_email) REFERENCES customers(email)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size TEXT DEFAULT '',
  color TEXT DEFAULT '',
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY,
  stock INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

INSERT OR IGNORE INTO products (id,name,category,price,old_price,tag,description) VALUES
('1','Obsidian Oversized Tee','men',1499,NULL,'NEW','Heavyweight cotton with a relaxed oversized cut.'),
('2','Raven Utility Jacket','men',4999,5999,'SALE','Structured utility jacket with functional pocket detailing.'),
('3','Noir Cargo Trouser','men',3299,NULL,'NEW','Tapered cargo trousers with a clean modern finish.'),
('4','Ravan Signature Hoodie','unisex',2899,NULL,'BESTSELLER','Premium fleece hoodie with a minimal RAVAN signature.'),
('5','Shadowline Bomber','women',4299,NULL,'NEW','Cropped bomber with a sculpted silhouette.'),
('6','Midnight Slip Dress','women',3599,4299,'SALE','Fluid satin-inspired dress with an evening-ready profile.'),
('7','RAVAN 777 Cap','accessories',999,NULL,'NEW','Six-panel cap finished with a subtle 777 mark.'),
('8','Ravan Chain','accessories',1299,NULL,'','Minimal statement chain designed for everyday layering.'),
('9','Void Long Sleeve','women',2199,NULL,'','Second-skin long sleeve with soft stretch.'),
('10','Monolith Sneaker','unisex',5499,NULL,'NEW','Minimal low-top sneaker with a bold sole.'),
('11','Afterdark Mini Bag','accessories',2399,2999,'SALE','Compact crossbody bag with adjustable strap.'),
('12','Power Tailored Blazer','women',5799,NULL,'NEW','Sharp tailored blazer with an architectural silhouette.');

INSERT OR IGNORE INTO inventory (product_id,stock) VALUES
('1',50),('2',25),('3',30),('4',40),('5',20),('6',20),('7',50),('8',50),('9',30),('10',25),('11',20),('12',20);
