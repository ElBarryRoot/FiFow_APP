import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV ||= 'test';
process.env.MONGO_URI ||= 'mongodb://127.0.0.1:27017/fi_fow_test';
process.env.JWT_ACCESS_SECRET ||= 'test_access_secret_minimum_64_chars_123456789012345678901234';
process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_minimum_64_chars_123456789012345678901234';

const { createApp } = await import('../app.js');
const app = createApp();

test('GET /api/health retourne success true', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
});

test('GET /api/auth/me sans token retourne 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.statusCode, 401);
});

test('GET /api/admin/dashboard sans token retourne 401', async () => {
  const res = await request(app).get('/api/admin/dashboard');
  assert.equal(res.statusCode, 401);
});

test('GET /api/notifications sans token retourne 401', async () => {
  const res = await request(app).get('/api/notifications');
  assert.equal(res.statusCode, 401);
});
