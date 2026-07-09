-- ============================================================================
-- SEED DATA: Warung Sembako Super Lengkap — 100+ Produk Simulasi
-- Run via Supabase SQL Editor
-- ============================================================================
TRUNCATE TABLE public.products CASCADE;

INSERT INTO public.products (sku, name, category, selling_price, cost_price, stock_quantity, min_stock_alert, is_active) VALUES

-- ============================================================
-- 🍜 MIE INSTAN
-- ============================================================
('MIE-001', 'Indomie Goreng',              'Mie Instan',     3500,  2800, 200, 15, true),
('MIE-002', 'Indomie Kuah Ayam Bawang',    'Mie Instan',     3500,  2800, 180, 15, true),
('MIE-003', 'Indomie Kuah Soto',           'Mie Instan',     3500,  2800, 150, 15, true),
('MIE-004', 'Indomie Kuah Kari',           'Mie Instan',     3500,  2800, 140, 15, true),
('MIE-005', 'Indomie Rendang',             'Mie Instan',     4000,  3200, 120, 10, true),
('MIE-006', 'Mie Sedap Goreng',            'Mie Instan',     3500,  2700, 160, 15, true),
('MIE-007', 'Mie Sedap Kuah Kari Spesial', 'Mie Instan',     3500,  2700, 150, 15, true),
('MIE-008', 'Mie Sedap Soto',              'Mie Instan',     3500,  2700, 130, 15, true),
('MIE-009', 'Pop Mie Ayam',                'Mie Instan',     6000,  4800,  80,  8, true),
('MIE-010', 'Pop Mie Baso',                'Mie Instan',     6000,  4800,  75,  8, true),
('MIE-011', 'Sarimi Sapi Baso',            'Mie Instan',     3000,  2300, 110, 10, true),
('MIE-012', 'Sarimi Ayam Kremes',          'Mie Instan',     3000,  2300, 100, 10, true),
('MIE-013', 'Supermi Ayam Bawang',         'Mie Instan',     3000,  2200,  90, 10, true),
('MIE-014', 'Lemonilo Mie Goreng',         'Mie Instan',     7000,  5500,  60,  5, true),

-- ============================================================
-- ☕ KOPI & TEH
-- ============================================================
('KOP-001', 'Nescafe Classic Sachet',      'Kopi & Teh',     3500,  2800, 200, 15, true),
('KOP-002', 'Kopi ABC Susu',               'Kopi & Teh',     3000,  2400, 180, 15, true),
('KOP-003', 'Good Day Cappuccino',         'Kopi & Teh',     4000,  3200, 120, 10, true),
('KOP-004', 'Good Day Freeze',             'Kopi & Teh',     5000,  4000,  70,  8, true),
('KOP-005', 'Kapal Api Sachet',            'Kopi & Teh',     2500,  2000, 160, 15, true),
('KOP-006', 'Torabika Duo Sachet',         'Kopi & Teh',     3500,  2800, 130, 10, true),
('KOP-007', 'Torabika Cappuccino',         'Kopi & Teh',     4000,  3100, 110, 10, true),
('KOP-008', 'Luwak White Koffie',          'Kopi & Teh',     4000,  3200, 100, 10, true),
('KOP-009', 'Kopi Kenangan Sachet',        'Kopi & Teh',     5000,  4000,  60,  5, true),
('KOP-010', 'Teh Celup Sosro 25pcs',       'Kopi & Teh',     7000,  5500,  80,  8, true),
('KOP-011', 'Teh Sariwangi 25pcs',         'Kopi & Teh',     6500,  5000,  70,  8, true),
('KOP-012', 'Teh Pucuk Harum 350ml',       'Kopi & Teh',     4500,  3500, 120, 10, true),
('KOP-013', 'Teh Botol Sosro 350ml',       'Kopi & Teh',     4500,  3500, 100, 10, true),
('KOP-014', 'Teh Kotak Ultra 250ml',       'Kopi & Teh',     4000,  3000,  90,  8, true),
('KOP-015', 'Teh Gelas 24pcs',             'Kopi & Teh',    10000,  7800,  40,  5, true),
('KOP-016', 'Nutrisari Jeruk Sachet',      'Kopi & Teh',     3000,  2200, 150, 10, true),

-- ============================================================
-- 🧂 BUMBU DAPUR
-- ============================================================
('BMB-001', 'Garam Refina 250g',           'Bumbu Dapur',    4000,  3000, 150, 10, true),
('BMB-002', 'Garam Dolphin 500g',          'Bumbu Dapur',    6000,  4500, 100,  8, true),
('BMB-003', 'Gula Pasir Gulaku 1kg',       'Bumbu Dapur',   18000, 15000,  80,  5, true),
('BMB-004', 'Gula Pasir Lokal 1kg',        'Bumbu Dapur',   15000, 12500,  70,  5, true),
('BMB-005', 'Gula Merah 500g',             'Bumbu Dapur',   10000,  8000,  50,  5, true),
('BMB-006', 'Royco Ayam 100g',             'Bumbu Dapur',    8000,  6200, 100,  8, true),
('BMB-007', 'Royco Sapi 100g',             'Bumbu Dapur',    8000,  6200,  90,  8, true),
('BMB-008', 'Masako Ayam 100g',            'Bumbu Dapur',    7000,  5400, 100,  8, true),
('BMB-009', 'Masako Sapi 100g',            'Bumbu Dapur',    7000,  5400,  90,  8, true),
('BMB-010', 'Kecap Bango 135ml',           'Bumbu Dapur',    5000,  3800, 120, 10, true),
('BMB-011', 'Kecap ABC 135ml',             'Bumbu Dapur',    4500,  3400, 110, 10, true),
('BMB-012', 'Saos Sambal ABC 135ml',       'Bumbu Dapur',    5000,  3800, 100, 10, true),
('BMB-013', 'Saos Tiram Saori 135ml',      'Bumbu Dapur',    7000,  5200,  70,  8, true),
('BMB-014', 'Minyak Goreng Filma 1L',      'Bumbu Dapur',   20000, 17000,  90,  5, true),
('BMB-015', 'Minyak Goreng Bimoli 2L',     'Bumbu Dapur',   38000, 33000,  50,  3, true),
('BMB-016', 'Minyak Goreng Sania 1L',      'Bumbu Dapur',   19000, 16000,  80,  5, true),
('BMB-017', 'Tepung Terigu Segitiga 1kg',  'Bumbu Dapur',   13000, 10500,  60,  5, true),
('BMB-018', 'Santan Kara 200ml',           'Bumbu Dapur',    6000,  4500, 150, 10, true),
('BMB-019', 'Lada Bubuk Ladaku 3g',        'Bumbu Dapur',    2000,  1400, 200, 15, true),
('BMB-020', 'Ketumbar Bubuk 10g',          'Bumbu Dapur',    2000,  1400, 150, 10, true),
('BMB-021', 'Bawang Putih 250g',           'Bumbu Dapur',    8000,  5500, 100,  8, true),
('BMB-022', 'Bawang Merah 250g',           'Bumbu Dapur',   10000,  7000,  90,  8, true),

-- ============================================================
-- 🍚 BERAS & KARBOHIDRAT
-- ============================================================
('BRS-001', 'Beras Pandan Wangi 5kg',      'Beras',          75000, 65000,  30,  3, true),
('BRS-002', 'Beras Setra Ramos 5kg',       'Beras',          68000, 58000,  35,  3, true),
('BRS-003', 'Beras Rojolele 5kg',          'Beras',          72000, 62000,  25,  3, true),
('BRS-004', 'Beras IR64 5kg',              'Beras',          62000, 53000,  40,  5, true),
('BRS-005', 'Beras Ketan Putih 1kg',       'Beras',          22000, 18000,  30,  3, true),
('BRS-006', 'Tepung Beras Rosebrand 500g', 'Beras',          10000,  7800,  50,  5, true),

-- ============================================================
-- 🥛 SUSU & MINUMAN
-- ============================================================
('SUS-001', 'SKM Frisian Flag Gold',       'Susu & Minuman', 12000,  9500,  80,  8, true),
('SUS-002', 'SKM Indomilk',                'Susu & Minuman', 11000,  8500,  75,  8, true),
('SUS-003', 'SKM Carnation',               'Susu & Minuman', 13000, 10500,  50,  5, true),
('SUS-004', 'Ultra Milk 250ml',            'Susu & Minuman',  7000,  5500, 120, 10, true),
('SUS-005', 'Ultra Milk Coklat 250ml',     'Susu & Minuman',  7000,  5500, 110, 10, true),
('SUS-006', 'Dancow Sachet Coklat',        'Susu & Minuman',  3500,  2600, 180, 15, true),
('SUS-007', 'Dancow Sachet Vanilla',       'Susu & Minuman',  3500,  2600, 160, 15, true),
('SUS-008', 'Aqua 600ml',                  'Susu & Minuman',  4000,  3000, 250, 20, true),
('SUS-009', 'Le Minerale 600ml',           'Susu & Minuman',  3500,  2700, 220, 20, true),
('SUS-010', 'Aqua Galon 19L',              'Susu & Minuman', 22000, 18000,  30,  3, true),
('SUS-011', 'Sprite 390ml',                'Susu & Minuman',  7000,  5500, 100,  8, true),
('SUS-012', 'Coca Cola 390ml',             'Susu & Minuman',  7000,  5500,  90,  8, true),
('SUS-013', 'Fanta 390ml',                 'Susu & Minuman',  7000,  5500,  85,  8, true),
('SUS-014', 'Pocari Sweat 500ml',          'Susu & Minuman',  8500,  6500,  70,  8, true),
('SUS-015', 'Mizone 500ml',                'Susu & Minuman',  7500,  5800,  60,  5, true),
('SUS-016', 'Yakult',                      'Susu & Minuman',  3000,  2200, 200, 15, true),

-- ============================================================
-- 🍪 SNACK & ROTI
-- ============================================================
('SNC-001', 'Taro Net 45g',                'Snack',          3000,  2200, 200, 15, true),
('SNC-002', 'Qtela Original 60g',          'Snack',          5000,  3800, 120, 10, true),
('SNC-003', 'Chitato Sapi Panggang 55g',   'Snack',          7000,  5500, 100,  8, true),
('SNC-004', 'Chitato Ayam Bawang 55g',     'Snack',          7000,  5500,  90,  8, true),
('SNC-005', 'Oreo Original 133g',          'Snack',         10000,  7800,  80,  5, true),
('SNC-006', 'Oreo Vanilla 133g',           'Snack',         10000,  7800,  75,  5, true),
('SNC-007', 'Biskuit Roma Kelapa',         'Snack',          8000,  6000,  70,  5, true),
('SNC-008', 'Beng Beng Coklat',            'Snack',          3000,  2200, 250, 20, true),
('SNC-009', 'Kacang Garuda 150g',          'Snack',         15000, 11500,  50,  5, true),
('SNC-010', 'Roti Sari Roti Coklat',       'Snack',          6000,  4200,  60,  5, true),
('SNC-011', 'Roti Sari Roti Keju',         'Snack',          6000,  4200,  55,  5, true),
('SNC-012', 'Tic Tac Mint',                'Snack',          5000,  3800, 130, 10, true),
('SNC-013', 'Kiss Coklat',                 'Snack',          2000,  1400, 300, 20, true),
('SNC-014', 'Good Time Coklat',            'Snack',          8000,  6000,  80,  8, true),
('SNC-015', 'Nabati Wafer',                'Snack',          3000,  2200, 200, 15, true),

-- ============================================================
-- 🧴 KEBUTUHAN RUMAH TANGGA
-- ============================================================
('RTG-001', 'Sabun Mandi Lifebuoy',        'Rumah Tangga',   5000,  3800, 150, 15, true),
('RTG-002', 'Sabun Mandi Lux',             'Rumah Tangga',   6000,  4500, 120, 10, true),
('RTG-003', 'Sabun Mandi Dettol',          'Rumah Tangga',   7000,  5200, 100,  8, true),
('RTG-004', 'Pasta Gigi Pepsodent 190g',   'Rumah Tangga',  15000, 11500,  80,  5, true),
('RTG-005', 'Pasta Gigi Formula 190g',     'Rumah Tangga',  12000,  9000,  70,  5, true),
('RTG-006', 'Sikat Gigi Pepsodent',        'Rumah Tangga',   8000,  5800,  90,  8, true),
('RTG-007', 'Shampoo Sunsilk 170ml',       'Rumah Tangga',  12000,  9000,  70,  5, true),
('RTG-008', 'Shampoo Clear 170ml',         'Rumah Tangga',  13000, 10000,  65,  5, true),
('RTG-009', 'Sabun Cuci Sunlight 400ml',   'Rumah Tangga',   8000,  6000,  90,  8, true),
('RTG-010', 'Deterjen Rinso 450g',         'Rumah Tangga',   7000,  5200, 100, 10, true),
('RTG-011', 'Deterjen Daia 450g',          'Rumah Tangga',   5000,  3600, 110, 10, true),
('RTG-012', 'Pengharum Ruangan Stella',    'Rumah Tangga',  10000,  7200,  60,  5, true),
('RTG-013', 'Tisu Basah Mitu 50s',         'Rumah Tangga',  10000,  7500,  70,  5, true),
('RTG-014', 'Kapur Barus',                 'Rumah Tangga',   3000,  2000, 200, 15, true),

-- ============================================================
-- 🚬 ROKOK
-- ============================================================
('ROK-001', 'Sampoerna Mild 16',           'Rokok',         31000, 28000,  50,  5, true),
('ROK-002', 'Sampoerna Kretek 12',         'Rokok',         21000, 18500,  40,  5, true),
('ROK-003', 'Marlboro Merah 20',           'Rokok',         41000, 37500,  30,  3, true),
('ROK-004', 'Marlboro Light 20',           'Rokok',         41000, 37500,  25,  3, true),
('ROK-005', 'Djarum Super 12',             'Rokok',         20000, 17500,  45,  5, true),
('ROK-006', 'Gudang Garam Filter 12',      'Rokok',         22000, 19500,  40,  5, true),
('ROK-007', 'Dji Sam Soe 12',              'Rokok',         19000, 16500,  50,  5, true),
('ROK-008', 'LA Bold 16',                  'Rokok',         32000, 29000,  20,  5, true),
('ROK-009', 'Surya 12',                    'Rokok',         18000, 15500,  35,  5, true),

-- ============================================================
-- 🐔 SEMBAKO (Telur, Tempe, Tahu, dll)
-- ============================================================
('SMB-001', 'Telur Ayam 1kg',              'Sembako',       25000, 21000,  60,  5, true),
('SMB-002', 'Telur Bebek 1 butir',         'Sembako',        3500,  2500,  80, 10, true),
('SMB-003', 'Tempe 250g',                  'Sembako',        5000,  3500,  50,  5, true),
('SMB-004', 'Tahu Putih 5pcs',             'Sembako',        6000,  4000,  45,  5, true),
('SMB-005', 'Mie Telur Kering 500g',       'Sembako',       10000,  7500,  70,  8, true),
('SMB-006', 'Bihun Jagung 500g',           'Sembako',        8000,  5800,  60,  8, true),

-- ============================================================
-- 👶 KEBUTUHAN BAYI
-- ============================================================
('BYI-001', 'Popok Bayi Sweety M 20pcs',   'Kebutuhan Bayi', 25000, 20000,  40,  5, true),
('BYI-002', 'Popok Bayi Pampers M 20pcs',  'Kebutuhan Bayi', 45000, 38000,  30,  3, true),
('BYI-003', 'Tisu Basah Bayi Mitu 50s',    'Kebutuhan Bayi', 12000,  9000,  50,  5, true),
('BYI-004', 'Bedak Bayi Zwitsal',          'Kebutuhan Bayi', 15000, 11500,  45,  5, true),
('BYI-005', 'Minyak Telon 100ml',          'Kebutuhan Bayi', 20000, 15500,  35,  5, true),

-- ============================================================
-- 💊 OBAT-OBATAN RINGAN
-- ============================================================
('OBT-001', 'Tolak Angin Sachet',          'Obat Ringan',    4000,  3000, 120, 10, true),
('OBT-002', 'Bodrex',                      'Obat Ringan',    3500,  2500,  80,  8, true),
('OBT-003', 'Paracetamol 500mg',           'Obat Ringan',    3000,  2000, 100, 10, true),
('OBT-004', 'Antangin Jrg',                'Obat Ringan',    4000,  3000,  90,  8, true),
('OBT-005', 'Promaag',                     'Obat Ringan',    5000,  3800,  70,  5, true),
('OBT-006', 'Balsem Geliga',               'Obat Ringan',   12000,  9000,  50,  5, true),
('OBT-007', 'Minyak Kayu Putih 50ml',      'Obat Ringan',   15000, 11000,  55,  5, true),
('OBT-008', 'Plaster Hansaplast',          'Obat Ringan',    4000,  2800, 150, 10, true),
('OBT-009', 'Masker 3ply 10pcs',           'Obat Ringan',    8000,  5500, 100, 10, true),

-- ============================================================
-- 🔋 LAIN-LAIN
-- ============================================================
('LIN-001', 'Baterai AA 2pcs',             'Lain-Lain',      8000,  5500,  90, 10, true),
('LIN-002', 'Baterai AAA 2pcs',            'Lain-Lain',      8000,  5500,  85, 10, true),
('LIN-003', 'Gas LPG 3kg',                 'Lain-Lain',     22000, 19000,  25,  3, true),
('LIN-004', 'Es Batu 1kg',                 'Lain-Lain',      4000,  2000,  80,  8, true),
('LIN-005', 'Korek Api Gas',               'Lain-Lain',      3000,  2000, 200, 15, true),
('LIN-006', 'Tali Rafia Roll',             'Lain-Lain',      5000,  3000,  60,  5, true),
('LIN-007', 'Kantong Plastik 1 pack',      'Lain-Lain',      8000,  5500,  80,  8, true),
('LIN-008', 'Sabun Colek',                 'Lain-Lain',      2000,  1200, 250, 20, true),
('LIN-009', 'Spons Cuci Piring',           'Lain-Lain',      4000,  2500, 100, 10, true),
('LIN-010', 'Pulpen',                      'Lain-Lain',      3000,  1800, 150, 15, true);
