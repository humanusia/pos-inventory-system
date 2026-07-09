-- ============================================================================
-- SEED DATA: Warung Sembako — Produk Simulasi
-- Run via Supabase SQL Editor setelah schema terinstall
-- ============================================================================

-- Hapus data produk lama (kalo ada)
TRUNCATE TABLE public.products CASCADE;

INSERT INTO public.products (sku, name, category, selling_price, cost_price, stock_quantity, min_stock_alert, is_active) VALUES

-- 🍜 Mie Instan & Makanan Instan
('MIE-0001', 'Indomie Goreng',             'Mie Instan',     3500,  2800, 120, 10, true),
('MIE-0002', 'Indomie Kuah Ayam Bawang',   'Mie Instan',     3500,  2800, 100, 10, true),
('MIE-0003', 'Indomie Kuah Soto',          'Mie Instan',     3500,  2800,  80, 10, true),
('MIE-0004', 'Mie Sedap Goreng',           'Mie Instan',     3500,  2700,  90, 10, true),
('MIE-0005', 'Mie Sedap Kuah Kari',        'Mie Instan',     3500,  2700,  75, 10, true),
('MIE-0006', 'Pop Mie Ayam',               'Mie Instan',     6000,  4800,  50,  5, true),
('MIE-0007', 'Sarimi Sapi Baso',           'Mie Instan',     3000,  2300,  60, 10, true),

-- ☕ Kopi & Teh
('KOP-0001', 'Kopi Sachet Nescafe Classic','Kopi & Teh',     3500,  2800, 150, 10, true),
('KOP-0002', 'Kopi Sachet ABC Susu',       'Kopi & Teh',     3000,  2400, 130, 10, true),
('KOP-0003', 'Kopi Good Day Cappuccino',   'Kopi & Teh',     4000,  3200,  90,  8, true),
('KOP-0004', 'Kopi Kapal Api Sachet',      'Kopi & Teh',     2500,  2000, 100, 10, true),
('KOP-0005', 'Teh Celup Sosro 25 pcs',     'Kopi & Teh',     7000,  5500,  45,  5, true),
('KOP-0006', 'Teh Sariwangi 25 pcs',       'Kopi & Teh',     6500,  5000,  40,  5, true),
('KOP-0007', 'Teh Pucuk Harum Botol 350ml','Kopi & Teh',     4500,  3500,  60,  5, true),
('KOP-0008', 'Good Day Freeze',            'Kopi & Teh',     5000,  4000,  35,  5, true),

-- 🧂 Bumbu Dapur
('BMB-0001', 'Garam Refina 250g',          'Bumbu Dapur',    4000,  3000,  80,  8, true),
('BMB-0002', 'Gula Pasir Gulaku 1kg',      'Bumbu Dapur',   18000, 15000,  50,  5, true),
('BMB-0003', 'Gula Merah 500g',            'Bumbu Dapur',   10000,  8000,  30,  5, true),
('BMB-0004', 'Royco Ayam 100g',            'Bumbu Dapur',    8000,  6200,  65,  8, true),
('BMB-0005', 'Masako Sapi 100g',           'Bumbu Dapur',    7000,  5400,  60,  8, true),
('BMB-0006', 'Kecap Bango 135ml',          'Bumbu Dapur',    5000,  3800,  70,  8, true),
('BMB-0007', 'Saos Sambal ABC 135ml',      'Bumbu Dapur',    5000,  3800,  65,  8, true),
('BMB-0008', 'Minyak Goreng Filma 1L',     'Bumbu Dapur',   20000, 17000,  40,  5, true),
('BMB-0009', 'Minyak Goreng Bimoli 2L',    'Bumbu Dapur',   38000, 33000,  25,  3, true),
('BMB-0010', 'Tepung Terigu Segitiga 1kg', 'Bumbu Dapur',   13000, 10500,  35,  5, true),
('BMB-0011', 'Santan Kara 200ml',          'Bumbu Dapur',    6000,  4500,  80,  8, true),
('BMB-0012', 'Lada Bubuk Ladaku 3g',       'Bumbu Dapur',    2000,  1400, 120, 10, true),

-- 🍚 Beras & Karbohidrat
('BRS-0001', 'Beras Pandan Wangi 5kg',     'Beras',          75000, 65000,  20,  3, true),
('BRS-0002', 'Beras Setra Ramos 5kg',      'Beras',          68000, 58000,  25,  3, true),
('BRS-0003', 'Beras Rojolele 5kg',         'Beras',          72000, 62000,  15,  3, true),
('BRS-0004', 'Beras Ketan Putih 1kg',      'Beras',          22000, 18000,  20,  3, true),
('BRS-0005', 'Tepung Beras Rose Brand 500g','Beras',         10000,  7800,  30,  5, true),

-- 🥛 Susu & Minuman
('SUS-0001', 'Susu Kental Manis Frisian Flag', 'Susu & Minuman', 12000, 9500,   55,  5, true),
('SUS-0002', 'Susu Kental Manis Indomilk',     'Susu & Minuman', 11000, 8500,   50,  5, true),
('SUS-0003', 'Susu UHT Ultra Milk 250ml',      'Susu & Minuman',  7000, 5500,   70,  8, true),
('SUS-0004', 'Susu Dancow Sachet Coklat',      'Susu & Minuman',  3500, 2600,  100, 10, true),
('SUS-0005', 'Aqua 600ml',                     'Susu & Minuman',  4000, 3000,  120, 10, true),
('SUS-0006', 'Le Minerale 600ml',              'Susu & Minuman',  3500, 2700,  110, 10, true),
('SUS-0007', 'Teh Botol Sosro 350ml',          'Susu & Minuman',  4500, 3500,   80,  8, true),
('SUS-0008', 'Sprite 390ml',                   'Susu & Minuman',  7000, 5500,   50,  5, true),
('SUS-0009', 'Coca Cola 390ml',                'Susu & Minuman',  7000, 5500,   45,  5, true),
('SUS-0010', 'Fanta 390ml',                    'Susu & Minuman',  7000, 5500,   40,  5, true),

-- 🍪 Snack & Roti
('SNC-0001', 'Taro Net 45g',               'Snack',          3000,  2200, 100, 10, true),
('SNC-0002', 'Qtela Original 60g',         'Snack',          5000,  3800,  75,  8, true),
('SNC-0003', 'Chitato Sapi Panggang 55g',  'Snack',          7000,  5500,  60,  8, true),
('SNC-0004', 'Oreo Original 133g',         'Snack',         10000,  7800,  50,  5, true),
('SNC-0005', 'Biskuit Roma Kelapa',        'Snack',          8000,  6000,  45,  5, true),
('SNC-0006', 'Beng Beng Coklat',           'Snack',          3000,  2200, 120, 10, true),
('SNC-0007', 'Kacang Garuda 150g',         'Snack',         15000, 11500,  35,  5, true),
('SNC-0008', 'Roti Sari Roti Coklat',      'Snack',          6000,  4200,  40,  5, true),

-- 🧴 Kebutuhan Rumah Tangga
('RTG-0001', 'Sabun Mandi Lifebuoy',       'Rumah Tangga',   5000,  3800,  90, 10, true),
('RTG-0002', 'Sabun Mandi Lux',            'Rumah Tangga',   6000,  4500,  75,  8, true),
('RTG-0003', 'Pasta Gigi Pepsodent 190g',  'Rumah Tangga',  15000, 11500,  50,  5, true),
('RTG-0004', 'Shampoo Sunsilk 170ml',      'Rumah Tangga',  12000,  9000,  45,  5, true),
('RTG-0005', 'Sabun Cuci Sunlight 400ml',  'Rumah Tangga',   8000,  6000,  55,  5, true),
('RTG-0006', 'Deterjen Rinso 450g',        'Rumah Tangga',   7000,  5200,  60,  8, true),
('RTG-0007', 'Pengharum Ruangan Stella',   'Rumah Tangga',  10000,  7200,  40,  5, true),

-- 🚬 Rokok
('ROK-0001', 'Sampoerna Mild 16',          'Rokok',         31000, 28000,  30,  5, true),
('ROK-0002', 'Sampoerna Kretek 12',        'Rokok',         21000, 18500,  25,  5, true),
('ROK-0003', 'Marlboro Merah 20',          'Rokok',         41000, 37500,  20,  3, true),
('ROK-0004', 'Djarum Super 12',            'Rokok',         20000, 17500,  30,  5, true),
('ROK-0005', 'Gudang Garam Filter 12',     'Rokok',         22000, 19500,  25,  5, true),
('ROK-0006', 'Dji Sam Soe 12',             'Rokok',         19000, 16500,  30,  5, true),
('ROK-0007', 'LA Bold 16',                 'Rokok',         32000, 29000,  15,  5, true);
