-- Go To Mart — Product Image URLs from BigBasket Dataset
-- ONLY updates products where a matching BigBasket image was found
-- Products without matches keep their existing images
-- Run this in your Supabase SQL Editor
-- Generated: 2026-03-02T08:20:35.653Z

BEGIN;

UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/294274_16-bingo-mad-angles-achari-masti.jpg' WHERE name = 'Bingo Mad Angles';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40077104_4-sunfeast-dark-fantasy-biscuits-cookies-choco-fills.jpg' WHERE name = 'Sunfeast Dark Fantasy Choco Fills';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40222518_1-cremica-bourbon-more-crunchy-more-chocolaty-sandwich-biscuits.jpg' WHERE name = 'Bourbon Cream Biscuit';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40242232_1-cadbury-oreo-red-velvet-sandwich-biscuit-limited-edition-yuly-treat.jpg' WHERE name = 'Cadbury Oreo';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40230665_3-britannia-nutri-choice-seeds-biscuits-100-atta-high-in-fibre-healthy-snacks.jpg' WHERE name = 'Britannia Nutri Choice Digestive';
-- Fanta Orange: not in BigBasket dataset, keeps existing image
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/292398_9-mountain-dew-soft-drink.jpg' WHERE name = 'Mountain Dew';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40236199_1-hell-energy-coffee-provides-strength-latte-flavour.jpg' WHERE name = 'Hell Energy Drink';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/104864_8-amul-butter-pasteurised.jpg' WHERE name = 'Amul Butter';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/1212499_1-cadbury-dairy-milk-chocolate-home-treats-pack.jpg' WHERE name = 'Cadbury Dairy Milk';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40258165_2-snickers-peanut-miniature-chocolate-nutritious-with-cocoa-butter.jpg' WHERE name = 'Snickers';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40019376_11-cadbury-5-star-chocolate-home-pack.jpg' WHERE name = 'Cadbury 5Star';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000081_19-fresho-chilli-green-long-medium.jpg' WHERE name = 'Green Chilli';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40075537_5-fresho-onion.jpg' WHERE name = 'Onion';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40023473_5-fresho-cabbage-organically-grown.jpg' WHERE name = 'Cabbage';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000200_17-fresho-tomato-hybrid.jpg' WHERE name = 'Tomato';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000144_13-fresho-ladies-finger.jpg' WHERE name = 'Lady Finger (Bhindi)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40048457_9-fresho-potato-new-crop.jpg' WHERE name = 'Potato (Aloo)';
-- Lemon (Nimbu): not in BigBasket dataset, keeps existing image
-- Apple (Shimla): not in BigBasket dataset, keeps existing image
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40097808_2-fresho-pomegranate-peeled.jpg' WHERE name = 'Pomegranate';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/266112_17-maggi-2-minute-instant-noodles-masala.jpg' WHERE name = 'Maggi 2-Minute Noodles';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/303129_2-borges-durum-wheat-pasta-fusilli.jpg' WHERE name = 'Pasta (Penne)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000457_13-bb-royal-rice-raw-sona-masoori.jpg' WHERE name = 'Rice (Regular)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40261310_1-natureland-organics-arhartoor-dal-or-yellow-pigeon-peas.jpg' WHERE name = 'Toor Dal';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000416_12-bb-royal-maida.jpg' WHERE name = 'Maida (All Purpose Flour)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/274145_14-fortune-sun-lite-sunflower-refined-oil.jpg' WHERE name = 'Fortune Sunflower Oil';
-- Mustard Oil (Kachi Ghani): matched mustard seeds not oil, keeps existing image
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40125915_6-bb-royal-organic-besan-flour.jpg' WHERE name = 'Besan (Gram Flour)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000464_9-bb-royal-sooji-bansi.jpg' WHERE name = 'Sooji (Semolina)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000803_14-bb-royal-channa-dal.jpg' WHERE name = 'Chana Dal';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/10000563_14-bb-royal-rajma-kashmiri.jpg' WHERE name = 'Rajma';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/208345_20-quaker-oats-breakfast-cereal-rich-in-protein-dietary-fibre-nutritious-easy-to-cook.jpg' WHERE name = 'Quaker Oats';
-- Sundrop Peanut Butter: matched granola not peanut butter, keeps existing image
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/30005233_21-kelloggs-chocos-moons-stars.jpg' WHERE name = 'Kellogg''s Chocos';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40269224_1-droetker-funfoods-veg-mayonnaise-delite-rich-creamy.jpg' WHERE name = 'Dr. Oetker Mayonnaise';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/20005895_6-nescafe-sunrise-instant-coffee-chicory-mixture.jpg' WHERE name = 'Nescafe Classic Coffee';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/240065_14-tata-tea-gold-tea.jpg' WHERE name = 'Tata Tea Gold';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/104864_8-amul-butter-pasteurised.jpg' WHERE name = 'Amul Butter (Sachet)';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/212128_26-surf-excel-matic-top-load-detergent-powder.jpg' WHERE name = 'Surf Excel Detergent';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40097081_10-ariel-matic-detergent-washing-powder-front-load.jpg' WHERE name = 'Ariel Washing Powder';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/263754_13-harpic-power-plus-disinfectant-toilet-cleaner-liquid-original.jpg' WHERE name = 'Harpic Toilet Cleaner';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/20005547_11-colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti-formula-provides-fresher-breath.jpg' WHERE name = 'Colgate MaxFresh';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/1203041_2-dove-cream-beauty-bathing-bar.jpg' WHERE name = 'Dove Soap Bar';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/1206304_6-dettol-bathing-bar-soap-germ-protection-original.jpg' WHERE name = 'Dettol Soap';
-- Lux Soft Touch Soap: matched Park Avenue not Lux, keeps existing image
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/189323_11-sunsilk-stunning-black-shine-shampoo-with-amlaoil-pearl-protein-vitamin-e-for-long-lasting-shine.jpg' WHERE name = 'Sunsilk Shampoo';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/40002096_14-tresele-keratin-smooth-shampoo.jpg' WHERE name = 'TRESemmé Shampoo';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/100090784_8-clinic-plus-strong-long-health-shampoo.jpg' WHERE name = 'Clinic Plus Shampoo';
UPDATE products SET image_url = 'https://www.bigbasket.com/media/uploads/p/l/267873_8-head-shoulders-anti-dandruff-shampoo-anti-hairfall.jpg' WHERE name = 'Head & Shoulders Shampoo';

COMMIT;