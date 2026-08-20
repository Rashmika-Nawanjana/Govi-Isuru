const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middleware/authMiddleware');

const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'auth-test-secret';

test.after(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('auth middleware accepts a valid access token', () => {
  const token = jwt.sign(
    { id: 'user-123', role: 'farmer' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  const req = {
    header: (name) => (
      name === 'Authorization' ? `Bearer ${token}` : undefined
    )
  };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'user-123');
  assert.equal(req.user.role, 'farmer');
  assert.equal(res.statusCode, 200);
});

test('auth middleware rejects a request without a token', () => {
  const req = { header: () => undefined };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { msg: 'No token, authorization denied' });
});

test('auth middleware rejects an invalid token', () => {
  const req = {
    header: () => 'Bearer this-is-not-a-valid-jwt'
  };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { msg: 'Token is not valid' });
});

test('auth middleware rejects an expired token', () => {
  const token = jwt.sign(
    { id: 'user-123', role: 'farmer' },
    process.env.JWT_SECRET,
    { expiresIn: -1 }
  );
  const req = {
    header: () => `Bearer ${token}`
  };
  const res = createResponse();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { msg: 'Token is not valid' });
});
