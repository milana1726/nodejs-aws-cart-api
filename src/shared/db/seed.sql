
-- =========================
-- USERS
-- =========================
INSERT INTO users (id, name, password)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'user1', 'password'),
  ('33333333-3333-3333-3333-333333333333', 'user2', 'password');

-- =========================
-- CARTS
-- =========================
INSERT INTO carts (id, user_id, status, created_at, updated_at)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'OPEN', NOW(), NOW()),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'OPEN', NOW(), NOW());

-- =========================
-- CART ITEMS
-- =========================

INSERT INTO cart_items (cart_id, product_id, count)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-aaaa-bbbb-cccc-111111111111', 2),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-aaaa-bbbb-cccc-222222222222', 1),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '33333333-aaaa-bbbb-cccc-333333333333', 5);

-- =========================
-- ORDERS
-- =========================
INSERT INTO orders (
  id,
  user_id,
  cart_id,
  payment,
  delivery,
  comments,
  status,
  total,
  created_at,
  updated_at
)
VALUES
  (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '{"type":"card"}',
    '{"address":"Test Address 1"}',
    '',
    'CREATED',
    300,
    NOW(),
    NOW()
  );
  