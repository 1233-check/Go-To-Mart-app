-- ============================================
-- GO TO MART — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (extends Supabase auth.users) ──
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin', 'store_staff', 'delivery_partner')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Categories ──
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Products ──
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2),
  unit TEXT DEFAULT '1 pc',
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Customer Addresses ──
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_address TEXT NOT NULL,
  landmark TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Orders ──
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10,7),
  delivery_longitude DECIMAL(10,7),
  delivery_landmark TEXT,
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed','confirmed','packing','packed','assigned','picked_up','in_transit','delivered','cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 25,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  delivery_partner_id UUID REFERENCES profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  estimated_delivery TEXT DEFAULT '30-45 mins',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Order Items ──
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  total DECIMAL(10,2) NOT NULL
);

-- ── Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ── Row Level Security ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories & Products: readable by all, writable by admins
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Profiles: users can read/update their own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Addresses: users can manage their own
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- Orders: customers see own, staff see all
CREATE POLICY "Customers see own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Staff can see all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff', 'delivery_partner'))
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff', 'delivery_partner'))
);

-- Order items: follow order access
CREATE POLICY "Order items follow order access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (
    orders.customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff', 'delivery_partner'))
  ))
);
CREATE POLICY "Order items insertable with order" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- ── Enable Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Fruits & Vegetables', '🥬', 1),
  ('Dairy, Bread & Eggs', '🥛', 2),
  ('Chips & Snacks', '🍿', 3),
  ('Biscuits', '🍪', 4),
  ('Sweets & Chocolates', '🍫', 5),
  ('Drinks & Juices', '🥤', 6),
  ('Noodles & Pasta', '🍜', 7),
  ('Atta, Rice & Dal', '🌾', 8),
  ('Breakfast & Sauces', '🥣', 9),
  ('Masala & Spices', '🌶️', 10),
  ('Cleaning & Household', '🧹', 11),
  ('Personal Care', '🧴', 12),
  ('Tobacco', '🚬', 13),
  ('Stationery', '📝', 14)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Products
-- (Prices are estimated MRP for Dimapur market)
-- ============================================

-- Chips & Snacks
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Lay''s Classic Salted', 20, 20, '1 pack', (SELECT id FROM categories WHERE name = 'Chips & Snacks'), 'Classic salted potato chips'),
  ('Kurkure Masala Munch', 20, 20, '1 pack', (SELECT id FROM categories WHERE name = 'Chips & Snacks'), 'Crunchy puffed corn snack'),
  ('Uncle Chips Plain Salted', 20, 20, '1 pack', (SELECT id FROM categories WHERE name = 'Chips & Snacks'), 'Classic salted chips'),
  ('Bingo Mad Angles', 20, 20, '1 pack', (SELECT id FROM categories WHERE name = 'Chips & Snacks'), 'Tangy tomato triangle chips'),
  ('Puffcorn Yummy Cheese', 20, 20, '1 pack', (SELECT id FROM categories WHERE name = 'Chips & Snacks'), 'Cheesy puffed corn')
ON CONFLICT DO NOTHING;

-- Biscuits
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Sunfeast Dark Fantasy Choco Fills', 40, 40, '1 pack', (SELECT id FROM categories WHERE name = 'Biscuits'), 'Chocolate filled cookies'),
  ('Bourbon Cream Biscuit', 30, 30, '1 pack', (SELECT id FROM categories WHERE name = 'Biscuits'), 'Chocolate cream biscuit'),
  ('Parle Hide & Seek', 35, 35, '1 pack', (SELECT id FROM categories WHERE name = 'Biscuits'), 'Chocolate chip cookies'),
  ('Cadbury Oreo', 30, 30, '1 pack', (SELECT id FROM categories WHERE name = 'Biscuits'), 'Cream filled sandwich cookie'),
  ('Britannia Nutri Choice Digestive', 45, 45, '1 pack', (SELECT id FROM categories WHERE name = 'Biscuits'), 'Healthy digestive biscuit')
ON CONFLICT DO NOTHING;

-- Drinks & Juices
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Coca-Cola', 40, 40, '750 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Carbonated soft drink'),
  ('Pepsi', 40, 40, '750 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Carbonated soft drink'),
  ('Fanta Orange', 40, 40, '750 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Orange flavored drink'),
  ('Sprite', 40, 40, '750 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Lemon-lime soft drink'),
  ('Mountain Dew', 40, 40, '750 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Citrus soft drink'),
  ('Maaza Mango', 25, 25, '250 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Mango fruit drink'),
  ('Frooti Mango', 15, 15, '200 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Mango fruit drink'),
  ('Mogu Mogu Nata De Coco', 80, 80, '320 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Juice with coconut jelly'),
  ('Gatorade Sports Drink', 90, 90, '500 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Electrolyte sports drink'),
  ('Red Bull Energy Drink', 125, 125, '250 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Energy drink'),
  ('Hell Energy Drink', 99, 99, '250 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Energy drink'),
  ('O''Cean Fruit Water', 30, 30, '500 ml', (SELECT id FROM categories WHERE name = 'Drinks & Juices'), 'Flavored fruit water')
ON CONFLICT DO NOTHING;

-- Milk
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Amul Taaza Toned Milk', 29, 29, '500 ml', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), 'Toned milk'),
  ('Amul Cheese Slices', 120, 125, '200 g', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), '10 cheese slices'),
  ('Amul Paneer', 90, 90, '200 g', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), 'Fresh paneer block'),
  ('Amul Butter', 56, 56, '100 g', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), 'Pasteurized butter'),
  ('Amul Yogurt Cup', 20, 20, '100 g', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), 'Fresh dahi cup'),
  ('Amul Ghee', 290, 295, '500 ml', (SELECT id FROM categories WHERE name = 'Dairy, Bread & Eggs'), 'Pure cow ghee')
ON CONFLICT DO NOTHING;

-- Sweets & Chocolates
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Cadbury Dairy Milk', 50, 50, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Milk chocolate bar'),
  ('KitKat', 40, 40, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Crispy wafer chocolate'),
  ('Cadbury Milky Bar', 20, 20, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'White chocolate bar'),
  ('Cadbury Nutties', 60, 60, '1 pack', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Chocolate coated nuts'),
  ('Nestle Munch', 10, 10, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Crispy wafer chocolate'),
  ('Snickers', 50, 50, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Peanut caramel chocolate'),
  ('Kinder Joy', 50, 50, '1 pc', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Surprise egg with toy'),
  ('Cadbury 5Star', 20, 20, '1 bar', (SELECT id FROM categories WHERE name = 'Sweets & Chocolates'), 'Caramel chocolate bar')
ON CONFLICT DO NOTHING;

-- Veggies
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Green Chilli', 10, 10, '100 g', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh green chillies'),
  ('Onion', 35, 40, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh onions'),
  ('Cabbage', 30, 30, '1 pc', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh green cabbage'),
  ('Tomato', 40, 40, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh red tomatoes'),
  ('Lady Finger (Bhindi)', 35, 35, '500 g', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh okra'),
  ('Potato (Aloo)', 30, 30, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh potatoes'),
  ('Lemon (Nimbu)', 10, 10, '2 pcs', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh lemons'),
  ('Coriander Leaves', 10, 10, '1 bunch', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh coriander')
ON CONFLICT DO NOTHING;

-- Fruits
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Banana', 40, 40, '1 dozen', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh ripe bananas'),
  ('Apple (Shimla)', 180, 200, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh Shimla apples'),
  ('Grapes (Green)', 80, 80, '500 g', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh green grapes'),
  ('Orange (Nagpur)', 100, 100, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh Nagpur oranges'),
  ('Pomegranate', 150, 150, '1 kg', (SELECT id FROM categories WHERE name = 'Fruits & Vegetables'), 'Fresh pomegranates')
ON CONFLICT DO NOTHING;

-- Noodles & Pasta
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Samyang Buldak Ramen', 120, 120, '1 pack', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Korean hot chicken ramen'),
  ('Maggi 2-Minute Noodles', 14, 14, '1 pack', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Instant masala noodles'),
  ('Yippee Noodles', 14, 14, '1 pack', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Magic masala noodles'),
  ('Nissin Cup Noodles', 50, 50, '1 cup', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Cup noodles with veggies'),
  ('Knorr Hot & Sour Soup', 45, 45, '1 pack', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Instant soup mix'),
  ('Wai Wai Noodles', 15, 15, '1 pack', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Instant noodles'),
  ('Pasta (Penne)', 45, 45, '400 g', (SELECT id FROM categories WHERE name = 'Noodles & Pasta'), 'Durum wheat pasta')
ON CONFLICT DO NOTHING;

-- Atta, Rice & Dal
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Rice (Regular)', 60, 60, '1 kg', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'White rice'),
  ('Toor Dal', 150, 155, '1 kg', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Split pigeon peas'),
  ('Maida (All Purpose Flour)', 40, 40, '1 kg', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Refined wheat flour'),
  ('Fortune Sunflower Oil', 170, 175, '1 L', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Refined sunflower oil'),
  ('Mustard Oil (Kachi Ghani)', 180, 185, '1 L', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Cold pressed mustard oil'),
  ('Besan (Gram Flour)', 65, 65, '500 g', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Chickpea flour'),
  ('Sooji (Semolina)', 45, 45, '500 g', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Fine semolina'),
  ('Chana Dal', 90, 90, '1 kg', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Split chickpeas'),
  ('Rajma', 120, 120, '500 g', (SELECT id FROM categories WHERE name = 'Atta, Rice & Dal'), 'Kidney beans')
ON CONFLICT DO NOTHING;

-- Breakfast & Sauces
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Nutella Hazelnut Spread', 350, 355, '350 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Chocolate hazelnut spread'),
  ('Kissan Mixed Fruit Jam', 99, 99, '500 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Mixed fruit jam'),
  ('Quaker Oats', 110, 110, '400 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Rolled oats'),
  ('Kissan Tomato Sauce', 110, 110, '500 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Tomato ketchup'),
  ('Sundrop Peanut Butter Creamy', 199, 199, '462 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Creamy peanut butter'),
  ('Kellogg''s Cornflakes', 140, 145, '475 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Classic corn flakes'),
  ('Kellogg''s Chocos', 120, 120, '375 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Chocolate cereal'),
  ('Dr. Oetker Mayonnaise', 89, 89, '300 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Eggless mayonnaise'),
  ('Nescafe Classic Coffee', 190, 195, '100 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Instant coffee'),
  ('Tata Tea Gold', 250, 255, '250 g', (SELECT id FROM categories WHERE name = 'Breakfast & Sauces'), 'Premium tea')
ON CONFLICT DO NOTHING;

-- Masala & Spices
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Maggi Masala-ae-Magic', 5, 5, '1 sachet', (SELECT id FROM categories WHERE name = 'Masala & Spices'), 'All-in-one masala'),
  ('Vim Dishwash Bar', 10, 10, '1 pc', (SELECT id FROM categories WHERE name = 'Masala & Spices'), 'Dish cleaning pad'),
  ('Kissan Tomato Ketchup', 55, 55, '200 g', (SELECT id FROM categories WHERE name = 'Masala & Spices'), 'Tomato ketchup sachet'),
  ('Amul Butter (Sachet)', 15, 15, '20 g', (SELECT id FROM categories WHERE name = 'Masala & Spices'), 'Butter sachet')
ON CONFLICT DO NOTHING;

-- Cleaning & Household
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Surf Excel Detergent', 135, 139, '1 kg', (SELECT id FROM categories WHERE name = 'Cleaning & Household'), 'Washing powder'),
  ('Tide Detergent Powder', 120, 125, '1 kg', (SELECT id FROM categories WHERE name = 'Cleaning & Household'), 'Washing powder'),
  ('Rin Detergent Bar', 30, 30, '250 g', (SELECT id FROM categories WHERE name = 'Cleaning & Household'), 'Detergent soap bar'),
  ('Ariel Washing Powder', 145, 149, '1 kg', (SELECT id FROM categories WHERE name = 'Cleaning & Household'), 'Premium detergent'),
  ('Harpic Toilet Cleaner', 95, 99, '500 ml', (SELECT id FROM categories WHERE name = 'Cleaning & Household'), 'Disinfectant toilet cleaner')
ON CONFLICT DO NOTHING;

-- Personal Care
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Colgate MaxFresh', 85, 89, '150 g', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Toothpaste'),
  ('Dove Soap Bar', 52, 55, '100 g', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Moisturizing beauty bar'),
  ('Dettol Soap', 38, 38, '75 g', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Antibacterial soap'),
  ('Lifebuoy Soap', 30, 30, '100 g', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Germ protection soap'),
  ('Lux Soft Touch Soap', 38, 38, '100 g', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Beauty soap'),
  ('Sunsilk Shampoo', 185, 190, '340 ml', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Hair shampoo'),
  ('TRESemmé Shampoo', 350, 355, '580 ml', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Keratin smooth shampoo'),
  ('Clinic Plus Shampoo', 160, 165, '340 ml', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Strength & shine shampoo'),
  ('Head & Shoulders Shampoo', 210, 215, '340 ml', (SELECT id FROM categories WHERE name = 'Personal Care'), 'Anti-dandruff shampoo')
ON CONFLICT DO NOTHING;

-- Tobacco
INSERT INTO products (name, price, mrp, unit, category_id, description) VALUES
  ('Classic Signature Cigarettes', 260, 260, '1 pack', (SELECT id FROM categories WHERE name = 'Tobacco'), '20 cigarettes pack'),
  ('Gold Flake Cigarettes', 200, 200, '1 pack', (SELECT id FROM categories WHERE name = 'Tobacco'), '20 cigarettes pack')
ON CONFLICT DO NOTHING;
