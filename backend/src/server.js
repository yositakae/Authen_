require('dotenv').config();

const cors = require('cors');
const express = require('express');
const crypto = require('node:crypto');
const http = require('node:http');
const prisma = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString('hex'),
});
const publicUser = ({ userId, name, email, role }) => ({ userId, name, email, role });

app.post('/api/auth/register', async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
  if (password !== confirmPassword) return res.status(400).json({ error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' });
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมลที่ถูกต้อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร' });
  }
  try {
    const { salt, hash } = hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash: `${salt}:${hash}` } });
    res.status(201).json(publicUser(user));
  } catch (error) { next(error); }
});

app.post('/api/auth/login', async (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const [salt, expected] = user.passwordHash.split(':');
    const actual = Buffer.from(hashPassword(password, salt).hash, 'hex');
    if (actual.length !== Buffer.from(expected, 'hex').length || !crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'))) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    res.json(publicUser(user));
  } catch (error) { next(error); }
});

app.get('/api/users', async (_req, res, next) => {
  try { res.json((await prisma.user.findMany({ orderBy: { userId: 'asc' } })).map(publicUser)); }
  catch (error) { next(error); }
});

app.put('/api/users/:userId/role', async (req, res, next) => {
  const userId = Number(req.params.userId);
  const role = req.body.role;
  if (!Number.isInteger(userId) || !['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid userId or role' });
  try { res.json(publicUser(await prisma.user.update({ where: { userId }, data: { role } }))); }
  catch (error) { next(error); }
});

app.get('/api/menus/:menuId/ratings', async (req, res, next) => {
  const menuId = Number(req.params.menuId);
  if (!Number.isInteger(menuId) || menuId < 1) return res.status(400).json({ error: 'Invalid menuId' });
  try {
    const ratings = await prisma.rating.findMany({ where: { menuId }, select: { score: true } });
    res.json({ average: ratings.length ? ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length : 0, count: ratings.length });
  } catch (error) { next(error); }
});

app.put('/api/menus/:menuId/ratings', async (req, res, next) => {
  const menuId = Number(req.params.menuId);
  const userId = Number(req.body.userId);
  const score = Number(req.body.score);
  if (!Number.isInteger(menuId) || menuId < 1 || !Number.isInteger(userId) || userId < 1 || !Number.isInteger(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Valid menuId, userId, and score from 1 to 5 are required' });
  }
  try {
    await prisma.rating.upsert({ where: { userId_menuId: { userId, menuId } }, create: { userId, menuId, score }, update: { score } });
    const ratings = await prisma.rating.findMany({ where: { menuId }, select: { score: true } });
    res.json({ average: ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length, count: ratings.length });
  } catch (error) { next(error); }
});

app.get('/api/types', async (_req, res, next) => {
  try {
    const types = await prisma.type.findMany({ orderBy: { typeId: 'asc' } });
    res.json(types);
  } catch (error) {
    next(error);
  }
});

app.post('/api/types', async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const type = await prisma.type.create({ data: { name } });
    res.status(201).json(type);
  } catch (error) {
    next(error);
  }
});

app.put('/api/types/:typeId', async (req, res, next) => {
  const typeId = Number(req.params.typeId);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!Number.isInteger(typeId) || typeId < 1 || !name) {
    return res.status(400).json({ error: 'A valid typeId and name are required' });
  }
  try {
    const type = await prisma.type.update({ where: { typeId }, data: { name } });
    res.json(type);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/types/:typeId', async (req, res, next) => {
  const typeId = Number(req.params.typeId);
  if (!Number.isInteger(typeId) || typeId < 1) return res.status(400).json({ error: 'Invalid typeId' });
  try {
    await prisma.type.delete({ where: { typeId } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/menus', async (_req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({
      include: { type: { select: { typeId: true, name: true } }, ratings: { select: { score: true } } },
      orderBy: { menuId: 'asc' },
    });
    res.json(menus.map(({ ratings, ...menu }) => ({ ...menu, price: Number(menu.price), rating: { average: ratings.length ? ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length : 0, count: ratings.length } })));
  } catch (error) {
    next(error);
  }
});

app.post('/api/menus', async (req, res, next) => {
  const { name, price, isBestSeller = false, typeId } = req.body;
  const numericPrice = Number(price);
  const numericTypeId = Number(typeId);
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isInteger(numericTypeId) || numericTypeId < 1 || typeof isBestSeller !== 'boolean') {
    return res.status(400).json({ error: 'name, non-negative price, boolean isBestSeller, and typeId are required' });
  }
  try {
    const menu = await prisma.menu.create({
      data: { name: name.trim(), price: numericPrice, isBestSeller, typeId: numericTypeId },
      include: { type: { select: { typeId: true, name: true } } },
    });
    res.status(201).json({ ...menu, price: Number(menu.price) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/menus/:menuId', async (req, res, next) => {
  const menuId = Number(req.params.menuId);
  const { name, price, isBestSeller, typeId } = req.body;
  const numericPrice = Number(price);
  const numericTypeId = Number(typeId);
  if (!Number.isInteger(menuId) || menuId < 1 || typeof name !== 'string' || !name.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isInteger(numericTypeId) || numericTypeId < 1 || typeof isBestSeller !== 'boolean') {
    return res.status(400).json({ error: 'Valid menu fields are required' });
  }
  try {
    const menu = await prisma.menu.update({
      where: { menuId },
      data: { name: name.trim(), price: numericPrice, isBestSeller, typeId: numericTypeId },
      include: { type: { select: { typeId: true, name: true } } },
    });
    res.json({ ...menu, price: Number(menu.price) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/menus/:menuId', async (req, res, next) => {
  const menuId = Number(req.params.menuId);
  if (!Number.isInteger(menuId) || menuId < 1) return res.status(400).json({ error: 'Invalid menuId' });
  try {
    await prisma.menu.delete({ where: { menuId } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'P2003') {
    return res.status(409).json({ error: 'The type is in use or the selected typeId does not exist' });
  }
  if (error.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  if (error.code === 'P2002') return res.status(409).json({ error: 'A record with this value already exists' });
  if (error.code === 'P2011' || error.code === 'P2000') return res.status(400).json({ error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง' });
  if (error.code === 'P1001' || error.code === 'P1003') {
    return res.status(503).json({ error: 'Database unavailable; check the MySQL service and environment settings' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);
server.on('error', (error) => {
  console.error(`API server failed to listen on port ${port}:`, error);
  process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () => console.log(`API server listening on port ${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
