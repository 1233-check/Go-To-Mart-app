/**
 * Final curated product image matcher v3
 * Efficiently searches BigBasket CSV and outputs ONLY confirmed matches
 * Products without matches keep their existing images
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'product-images-dataset', 'BigBasket.csv');
const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');

// Simple search: find first line containing ALL terms (case-insensitive), extract image URL
function findImage(terms, excludeTerms = []) {
    for (let i = 1; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();
        // Skip combos
        if (lower.includes(' + ') || lower.includes('combo')) continue;
        // Check all terms present
        if (terms.every(t => lower.includes(t.toLowerCase()))) {
            // Check no exclude terms
            if (excludeTerms.some(t => lower.includes(t.toLowerCase()))) continue;
            // Extract the image URL (bigbasket.com/media/uploads/...)
            const match = lines[i].match(/(https:\/\/www\.bigbasket\.com\/media\/uploads\/p\/l\/[^,]+)/);
            if (match && !match[1].includes('no_image')) {
                return match[1];
            }
        }
    }
    return null;
}

// Define searches: [product_name, search_terms[], exclude_terms[]]
const searches = [
    // Chips & Snacks
    ["Lay's Classic Salted", ["lays", "chips"], []],
    ["Kurkure Masala Munch", ["kurkure", "masala"], []],
    ["Uncle Chips Plain Salted", ["uncle chips"], []],
    ["Bingo Mad Angles", ["bingo", "mad angles"], []],
    ["Puffcorn Yummy Cheese", ["puffcorn"], []],
    // Biscuits
    ["Sunfeast Dark Fantasy Choco Fills", ["dark fantasy", "choco fills"], []],
    ["Bourbon Cream Biscuit", ["bourbon"], ["cream wafer"]],
    ["Parle Hide & Seek", ["hide & seek"], []],
    ["Cadbury Oreo", ["oreo"], []],
    ["Britannia Nutri Choice Digestive", ["britannia", "nutrichoice"], []],
    // Drinks
    ["Coca-Cola", ["coca-cola"], []],
    ["Pepsi", ["pepsi", "soft drink"], ["black", "zero", "diet"]],
    ["Fanta Orange", ["fanta"], []],
    ["Sprite", ["sprite"], []],
    ["Mountain Dew", ["mountain dew"], []],
    ["Maaza Mango", ["maaza"], []],
    ["Frooti Mango", ["frooti"], []],
    ["Mogu Mogu Nata De Coco", ["mogu mogu"], []],
    ["Gatorade Sports Drink", ["gatorade"], []],
    ["Red Bull Energy Drink", ["red bull"], []],
    ["Hell Energy Drink", ["hell", "energy"], []],
    ["O'Cean Fruit Water", ["o'cean"], []],
    // Dairy
    ["Amul Taaza Toned Milk", ["amul", "taaza"], []],
    ["Amul Cheese Slices", ["amul", "cheese"], ["slice"]],
    ["Amul Paneer", ["amul", "paneer"], []],
    ["Amul Butter", ["amul", "butter", "pasteurised"], []],
    ["Amul Yogurt Cup", ["amul", "dahi"], []],
    ["Amul Ghee", ["amul", "ghee"], []],
    // Sweets & Chocolates
    ["Cadbury Dairy Milk", ["cadbury", "dairy milk"], ["nutties", "5 star"]],
    ["KitKat", ["kitkat"], []],
    ["Cadbury Milky Bar", ["milky bar"], []],
    ["Cadbury Nutties", ["cadbury", "nutties"], []],
    ["Nestle Munch", ["nestle", "munch"], []],
    ["Snickers", ["snickers"], []],
    ["Kinder Joy", ["kinder joy"], []],
    ["Cadbury 5Star", ["cadbury", "5 star"], []],
    // Fruits & Vegetables
    ["Green Chilli", ["chilli", "green long"], ["chilli flakes"]],
    ["Onion", ["onion", "loose"], ["spring"]],
    ["Cabbage", ["cabbage"], ["combo"]],
    ["Tomato", ["tomato", "hybrid"], ["sauce", "ketchup"]],
    ["Lady Finger (Bhindi)", ["ladies finger"], []],
    ["Potato (Aloo)", ["potato", "loose"], ["chips", "sweet"]],
    ["Lemon (Nimbu)", ["lemon", "loose"], ["grass", "juice"]],
    ["Coriander Leaves", ["coriander", "leaves"], ["seeds"]],
    ["Banana", ["banana", "fresho"], ["cake", "pudding", "chips"]],
    ["Apple (Shimla)", ["apple", "fresho"], ["cider", "juice", "candy"]],
    ["Grapes (Green)", ["grapes", "fresho"], ["juice", "wine"]],
    ["Orange (Nagpur)", ["orange", "fresho"], ["carrot", "juice"]],
    ["Pomegranate", ["pomegranate"], ["juice"]],
    // Noodles & Pasta
    ["Samyang Buldak Ramen", ["samyang"], []],
    ["Maggi 2-Minute Noodles", ["maggi", "noodles", "masala"], ["cup"]],
    ["Yippee Noodles", ["yippee"], []],
    ["Nissin Cup Noodles", ["nissin", "cup"], []],
    ["Knorr Hot & Sour Soup", ["knorr", "soup"], []],
    ["Wai Wai Noodles", ["wai wai"], []],
    ["Pasta (Penne)", ["pasta"], ["sauce"]],
    // Atta, Rice & Dal
    ["Rice (Regular)", ["rice", "sona masoori"], ["organic", "idli", "dosa", "combo"]],
    ["Toor Dal", ["toor dal"], ["combo"]],
    ["Maida (All Purpose Flour)", ["maida"], ["combo", "sooji"]],
    ["Fortune Sunflower Oil", ["fortune", "sunflower"], []],
    ["Mustard Oil (Kachi Ghani)", ["mustard", "oil"], []],
    ["Besan (Gram Flour)", ["besan"], ["combo", "sooji"]],
    ["Sooji (Semolina)", ["sooji", "bansi"], ["combo", "idli"]],
    ["Chana Dal", ["chana dal"], ["combo"]],
    ["Rajma", ["rajma"], ["combo"]],
    // Breakfast & Sauces
    ["Nutella Hazelnut Spread", ["nutella"], []],
    ["Kissan Mixed Fruit Jam", ["kissan", "jam"], []],
    ["Quaker Oats", ["quaker", "oats"], ["combo"]],
    ["Kissan Tomato Sauce", ["kissan", "tomato"], []],
    ["Sundrop Peanut Butter Creamy", ["sundrop", "peanut butter"], []],
    ["Kellogg's Cornflakes", ["kellogg", "corn flakes"], []],
    ["Kellogg's Chocos", ["kellogg", "chocos"], []],
    ["Dr. Oetker Mayonnaise", ["oetker", "mayonnaise"], []],
    ["Nescafe Classic Coffee", ["nescafe", "sunrise"], ["combo"]],
    ["Tata Tea Gold", ["tata tea gold"], ["combo"]],
    // Masala & Spices
    ["Maggi Masala-ae-Magic", ["maggi", "masala"], ["noodle"]],
    ["Vim Dishwash Bar", ["vim", "dish"], []],
    ["Kissan Tomato Ketchup", ["kissan", "ketchup"], []],
    ["Amul Butter (Sachet)", ["amul", "butter"], []],
    // Cleaning & Household
    ["Surf Excel Detergent", ["surf excel"], []],
    ["Tide Detergent Powder", ["tide", "detergent"], []],
    ["Rin Detergent Bar", ["rin", "detergent"], []],
    ["Ariel Washing Powder", ["ariel", "detergent"], []],
    ["Harpic Toilet Cleaner", ["harpic", "toilet"], []],
    // Personal Care
    ["Colgate MaxFresh", ["colgate", "toothpaste"], ["combo"]],
    ["Dove Soap Bar", ["dove", "bathing bar"], ["combo"]],
    ["Dettol Soap", ["dettol", "bathing", "original"], ["liquid", "handwash", "combo"]],
    ["Lifebuoy Soap", ["lifebuoy", "soap"], ["handwash", "liquid"]],
    ["Lux Soft Touch Soap", ["lux", "soap"], ["handwash"]],
    ["Sunsilk Shampoo", ["sunsilk", "shampoo"], []],
    ["TRESemmé Shampoo", ["tresem", "shampoo"], []],
    ["Clinic Plus Shampoo", ["clinic plus", "shampoo"], []],
    ["Head & Shoulders Shampoo", ["head & shoulders"], []],
    // Tobacco
    ["Classic Signature Cigarettes", ["classic", "cigarette"], []],
    ["Gold Flake Cigarettes", ["gold flake", "cigarette"], []],
];

console.log('Searching BigBasket CSV (' + (lines.length - 1) + ' products)...\n');

const matched = [];
const unmatched = [];

for (const [name, terms, excl] of searches) {
    const url = findImage(terms, excl);
    if (url) {
        matched.push({ name, url });
        console.log('  ✅ ' + name + ' → ' + url.substring(url.lastIndexOf('/') + 1));
    } else {
        unmatched.push(name);
        console.log('  ❌ ' + name);
    }
}

console.log('\n✅ Matched: ' + matched.length + '/' + searches.length);
console.log('❌ Not found in BigBasket: ' + unmatched.length);

if (unmatched.length > 0) {
    console.log('\nProducts not found (will keep existing images):');
    unmatched.forEach(n => console.log('  - ' + n));
}

// Generate SQL - only for matched products
const sql = [
    '-- Go To Mart — Product Image URLs from BigBasket Dataset',
    '-- ONLY updates products where a matching BigBasket image was found',
    '-- Products without matches keep their existing images',
    '-- Run this in your Supabase SQL Editor',
    '-- Generated: ' + new Date().toISOString(),
    '',
    'BEGIN;',
    '',
];

for (const m of matched) {
    const eName = m.name.replace(/'/g, "''");
    sql.push("UPDATE products SET image_url = '" + m.url + "' WHERE name = '" + eName + "';");
}

sql.push('', 'COMMIT;');

const sqlPath = path.join(__dirname, '..', 'update-product-images-bigbasket.sql');
fs.writeFileSync(sqlPath, sql.join('\n'), 'utf-8');
console.log('\nSQL written to: update-product-images-bigbasket.sql');
console.log('Total SQL updates: ' + matched.length);
