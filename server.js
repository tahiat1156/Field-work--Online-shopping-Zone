import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@shoppingzone.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const MONGODB_URI = process.env.MONGODB_URI || '';

let storageMode = 'json';
let mongoError = '';

const flexibleSchemaOptions = {
  strict: false,
  versionKey: false,
  timestamps: false
};

const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  section: String,
  price: Number,
  oldPrice: Number,
  rating: Number,
  stock: Number,
  tag: String,
  image: String,
  description: String,
  colors: [String],
  sizes: [String],
  createdAt: String,
  updatedAt: String
}, flexibleSchemaOptions);

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  phone: String,
  password: String,
  address: String,
  createdAt: String,
  updatedAt: String
}, flexibleSchemaOptions);

const orderSchema = new mongoose.Schema({
  id: String,
  userId: String,
  customer: Object,
  items: Array,
  total: Number,
  paymentMethod: String,
  status: String,
  createdAt: String,
  updatedAt: String
}, flexibleSchemaOptions);

const contactSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  message: String,
  createdAt: String
}, flexibleSchemaOptions);

const newsletterSchema = new mongoose.Schema({
  id: String,
  email: String,
  createdAt: String
}, flexibleSchemaOptions);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Always send fresh data to the React frontend/admin panel during demo.
// This prevents the browser from showing old product/order data after admin update/delete.
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

function removeMongoFields(doc) {
  if (!doc) return doc;
  const { _id, __v, ...clean } = doc;
  return clean;
}

async function readJSONDB() {
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  const db = JSON.parse(raw);
  db.products ||= [];
  db.users ||= [];
  db.orders ||= [];
  db.contacts ||= [];
  db.newsletter ||= [];
  return db;
}

async function writeJSONDB(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

async function readMongoDB() {
  const [products, users, orders, contacts, newsletter] = await Promise.all([
    Product.find({}).lean(),
    User.find({}).lean(),
    Order.find({}).lean(),
    Contact.find({}).lean(),
    Newsletter.find({}).lean()
  ]);

  return {
    products: products.map(removeMongoFields),
    users: users.map(removeMongoFields),
    orders: orders.map(removeMongoFields),
    contacts: contacts.map(removeMongoFields),
    newsletter: newsletter.map(removeMongoFields)
  };
}

async function replaceMongoCollection(Model, docs) {
  await Model.deleteMany({});
  if (docs.length) await Model.insertMany(docs, { ordered: false });
}

async function writeMongoDB(db) {
  await Promise.all([
    replaceMongoCollection(Product, db.products || []),
    replaceMongoCollection(User, db.users || []),
    replaceMongoCollection(Order, db.orders || []),
    replaceMongoCollection(Contact, db.contacts || []),
    replaceMongoCollection(Newsletter, db.newsletter || [])
  ]);
}

async function readDB() {
  if (storageMode === 'mongodb') return readMongoDB();
  return readJSONDB();
}

async function writeDB(db) {
  if (storageMode === 'mongodb') return writeMongoDB(db);
  return writeJSONDB(db);
}

async function seedMongoFromJSONIfEmpty() {
  const totalDocs = await Promise.all([
    Product.estimatedDocumentCount(),
    User.estimatedDocumentCount(),
    Order.estimatedDocumentCount(),
    Contact.estimatedDocumentCount(),
    Newsletter.estimatedDocumentCount()
  ]);

  if (totalDocs.reduce((sum, count) => sum + count, 0) > 0) return;

  const seed = await readJSONDB();
  await writeMongoDB(seed);
  console.log('MongoDB seeded from backend/data/db.json');
}

async function initializeDatabase() {
  if (!MONGODB_URI) {
    storageMode = 'json';
    console.log('MONGODB_URI not found. Using local backend/data/db.json storage.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      serverSelectionTimeoutMS: 10000
    });
    storageMode = 'mongodb';
    await seedMongoFromJSONIfEmpty();
    console.log('MongoDB connected successfully. Data will be saved in MongoDB.');
  } catch (error) {
    storageMode = 'json';
    mongoError = error.message;
    console.error('MongoDB connection failed. Falling back to local JSON storage:', error.message);
  }
}

function makeToken(payload) {
  return Buffer.from(JSON.stringify({ ...payload, issuedAt: Date.now() })).toString('base64url');
}

function parseToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

function adminAuth(req, res, next) {
  const payload = parseToken(req);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function userAuth(req, res, next) {
  const payload = parseToken(req);
  if (!payload || payload.role !== 'user') {
    return res.status(401).json({ success: false, message: 'Please login first' });
  }
  req.user = payload;
  next();
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function applyProductFilters(products, query) {
  let output = [...products];
  const search = (query.search || '').toString().trim().toLowerCase();
  const category = (query.category || '').toString().trim().toLowerCase();
  const section = (query.section || '').toString().trim().toLowerCase();
  const sort = (query.sort || '').toString();

  if (search) {
    output = output.filter((item) =>
      [item.name, item.category, item.section, item.description, item.tag]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }
  if (category && category !== 'all') {
    output = output.filter((item) => item.category.toLowerCase() === category);
  }
  if (section && section !== 'all') {
    output = output.filter((item) => item.section.toLowerCase() === section);
  }

  if (sort === 'price-low') output.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') output.sort((a, b) => b.price - a.price);
  if (sort === 'rating') output.sort((a, b) => b.rating - a.rating);
  if (sort === 'newest') output.sort((a, b) => String(b.id).localeCompare(String(a.id)));

  return output;
}

function normalizeProduct(body, existing = {}) {
  return {
    ...existing,
    name: (body.name || existing.name || '').trim(),
    category: body.category || existing.category || 'Women',
    section: body.section || existing.section || 'Dress',
    price: toNumber(body.price, existing.price || 0),
    oldPrice: toNumber(body.oldPrice, existing.oldPrice || body.price || 0),
    rating: Math.min(5, Math.max(0, toNumber(body.rating, existing.rating || 4.5))),
    stock: toNumber(body.stock, existing.stock || 0),
    tag: body.tag || existing.tag || 'New',
    image: body.image || existing.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80',
    description: body.description || existing.description || 'Premium fashion item from Shopping Zone collection.',
    colors: Array.isArray(body.colors) ? body.colors : String(body.colors || existing.colors?.join(',') || 'Black,White').split(',').map((x) => x.trim()).filter(Boolean),
    sizes: Array.isArray(body.sizes) ? body.sizes : String(body.sizes || existing.sizes?.join(',') || 'S,M,L').split(',').map((x) => x.trim()).filter(Boolean),
    updatedAt: new Date().toISOString()
  };
}

function getAdminSummary(db) {
  const totalRevenue = db.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const categories = [...new Set(db.products.map((p) => p.category))];
  return {
    totalProducts: db.products.length,
    totalOrders: db.orders.length,
    totalUsers: db.users.length,
    totalMessages: db.contacts.length,
    totalSubscribers: db.newsletter.length,
    totalRevenue,
    categories: categories.length
  };
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Shopping Zone Node.js Backend API is running',
    storage: storageMode,
    frontend: 'http://localhost:5173',
    health: '/api/health'
  });
});

app.get('/api/health', async (_req, res) => {
  const db = await readDB();
  res.json({
    status: 'success',
    message: storageMode === 'mongodb' ? 'Backend connected successfully with MongoDB' : 'Backend connected successfully with local JSON storage',
    storage: storageMode,
    mongoConnected: storageMode === 'mongodb',
    mongoError: mongoError || undefined,
    totalProducts: db.products.length,
    totalUsers: db.users.length,
    totalOrders: db.orders.length
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, address = '' } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, phone and password are required' });
  }
  const db = await readDB();
  const exists = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ success: false, message: 'This email is already registered' });
  const user = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    phone,
    password,
    address,
    createdAt: new Date().toISOString()
  };
  db.users.unshift(user);
  await writeDB(db);
  const token = makeToken({ role: 'user', userId: user.id, email: user.email });
  res.status(201).json({ success: true, message: 'Registration successful', token, user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const token = makeToken({ role: 'user', userId: user.id, email: user.email });
  res.json({ success: true, message: 'Login successful', token, user: publicUser(user) });
});

app.get('/api/auth/me', userAuth, async (req, res) => {
  const db = await readDB();
  const user = db.users.find((u) => u.id === req.user.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: publicUser(user) });
});

app.get('/api/categories', async (_req, res) => {
  const db = await readDB();
  const categories = ['All', ...new Set(db.products.map((p) => p.category))];
  const sections = ['All', ...new Set(db.products.map((p) => p.section))];
  res.json({ categories, sections });
});

app.get('/api/products', async (req, res) => {
  const db = await readDB();
  const products = applyProductFilters(db.products, req.query);
  res.json({ success: true, count: products.length, products });
});

app.get('/api/products/featured', async (_req, res) => {
  const db = await readDB();
  const products = db.products.filter((p) => ['Best Seller', 'Premium', 'Trending', 'New'].includes(p.tag)).slice(0, 8);
  res.json({ success: true, products });
});

app.get('/api/products/:id', async (req, res) => {
  const db = await readDB();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

app.get('/api/recommendations', async (req, res) => {
  const db = await readDB();
  const budget = Number(req.query.budget || 999999);
  const occasion = (req.query.occasion || '').toLowerCase();
  const category = (req.query.category || '').toLowerCase();
  let products = db.products.filter((p) => p.price <= budget);
  if (category && category !== 'all') products = products.filter((p) => p.category.toLowerCase() === category);
  if (occasion.includes('party')) products = products.filter((p) => ['Dress', 'Shoes', 'Makeup', 'Bags'].includes(p.section));
  if (occasion.includes('office')) products = products.filter((p) => ['Dress', 'Shoes', 'Bags', 'Accessories'].includes(p.section));
  if (occasion.includes('kids')) products = products.filter((p) => p.category === 'Kids');
  products.sort((a, b) => b.rating - a.rating);
  res.json({ success: true, products: products.slice(0, 6) });
});

app.post('/api/orders', userAuth, async (req, res) => {
  const { customer = {}, items, total, paymentMethod = 'Cash on Delivery' } = req.body;
  if (!items?.length) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }
  const db = await readDB();
  const user = db.users.find((u) => u.id === req.user.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const order = {
    id: `ORD-${Date.now()}`,
    userId: user.id,
    customer: {
      name: customer.name || user.name,
      phone: customer.phone || user.phone,
      email: customer.email || user.email,
      address: customer.address || user.address || ''
    },
    items: items.map((item) => ({ id: item.id, name: item.name, image: item.image, price: item.price, qty: item.qty, category: item.category, section: item.section })),
    total: toNumber(total),
    paymentMethod,
    status: 'Processing',
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  await writeDB(db);
  res.status(201).json({ success: true, message: 'Order placed successfully', order });
});

app.get('/api/orders/my-orders', userAuth, async (req, res) => {
  const db = await readDB();
  const orders = db.orders.filter((order) => order.userId === req.user.userId);
  res.json({ success: true, orders });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }
  const db = await readDB();
  const contact = { id: `MSG-${Date.now()}`, name, email, message, createdAt: new Date().toISOString() };
  db.contacts.unshift(contact);
  await writeDB(db);
  res.status(201).json({ success: true, message: 'Thank you! Your message has been received.', contact });
});

app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const db = await readDB();
  db.newsletter.unshift({ id: `NEWS-${Date.now()}`, email, createdAt: new Date().toISOString() });
  await writeDB(db);
  res.status(201).json({ success: true, message: 'Subscribed successfully' });
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = makeToken({ role: 'admin', email: ADMIN_EMAIL });
    return res.json({ success: true, token, admin: { email: ADMIN_EMAIL, role: 'Admin' } });
  }
  res.status(401).json({ success: false, message: 'Invalid admin email or password' });
});

app.get('/api/admin/products', adminAuth, async (_req, res) => {
  const db = await readDB();
  res.json({ success: true, products: db.products });
});

app.post('/api/admin/products', adminAuth, async (req, res) => {
  const db = await readDB();
  const product = normalizeProduct(req.body);
  if (!product.name) return res.status(400).json({ success: false, message: 'Product name is required' });
  product.id = `p-${Date.now()}`;
  product.createdAt = new Date().toISOString();
  db.products.unshift(product);
  await writeDB(db);
  res.status(201).json({ success: true, message: 'Product added successfully', product, stats: getAdminSummary(db) });
});

app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  const db = await readDB();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });
  const updated = normalizeProduct(req.body, db.products[index]);
  db.products[index] = updated;
  await writeDB(db);
  res.json({ success: true, message: 'Product updated successfully', product: updated, stats: getAdminSummary(db) });
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  const db = await readDB();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== req.params.id);
  if (db.products.length === before) return res.status(404).json({ success: false, message: 'Product not found' });
  await writeDB(db);
  res.json({ success: true, message: 'Product deleted successfully', products: db.products, stats: getAdminSummary(db) });
});

app.get('/api/admin/orders', adminAuth, async (_req, res) => {
  const db = await readDB();
  res.json({ success: true, orders: db.orders });
});

app.patch('/api/admin/orders/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  const db = await readDB();
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.status = status || order.status;
  order.updatedAt = new Date().toISOString();
  await writeDB(db);
  res.json({ success: true, message: 'Order status updated', order, stats: getAdminSummary(db) });
});

app.get('/api/admin/stats', adminAuth, async (_req, res) => {
  const db = await readDB();
  res.json({
    success: true,
    stats: getAdminSummary(db),
    recentOrders: db.orders.slice(0, 5),
    recentMessages: db.contacts.slice(0, 5)
  });
});

app.get('/api/admin/customers', adminAuth, async (_req, res) => {
  const db = await readDB();
  const customers = db.users.map(publicUser);
  res.json({ success: true, customers });
});

app.get('/api/admin/messages', adminAuth, async (_req, res) => {
  const db = await readDB();
  res.json({ success: true, messages: db.contacts });
});

app.delete('/api/admin/messages/:id', adminAuth, async (req, res) => {
  const db = await readDB();
  const before = db.contacts.length;
  db.contacts = db.contacts.filter((message) => message.id !== req.params.id);
  if (db.contacts.length === before) return res.status(404).json({ success: false, message: 'Message not found' });
  await writeDB(db);
  res.json({ success: true, message: 'Message deleted successfully', messages: db.contacts, stats: getAdminSummary(db) });
});

app.delete('/api/admin/orders/:id', adminAuth, async (req, res) => {
  const db = await readDB();
  const before = db.orders.length;
  db.orders = db.orders.filter((order) => order.id !== req.params.id);
  if (db.orders.length === before) return res.status(404).json({ success: false, message: 'Order not found' });
  await writeDB(db);
  res.json({ success: true, message: 'Order deleted successfully', orders: db.orders, stats: getAdminSummary(db) });
});

await initializeDatabase();

app.listen(PORT, () => {
  console.log(`Shopping Zone backend running on http://localhost:${PORT}`);
});
