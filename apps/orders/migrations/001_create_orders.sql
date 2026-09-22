CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  created_at timestamptz NOT NULL
);
