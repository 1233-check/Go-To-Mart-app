/**
 * Fetch product images from Pexels and generate a SQL update script
 * Usage: node scripts/fetch-images-sql.mjs
 * Then run the output SQL in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const PEXELS_API_KEY = 'ebUoUerCGwsC7ESdEpsD5zT7UVxVPr6N5d5eoJOYtKJ1jy4ghwYC4idr';
const SUPABASE_URL = 'https://ahitvfafdnvmkkfvghbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaXR2ZmFmZG52bWtrZnZnaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODkyMjQsImV4cCI6MjA4Nzk2NTIyNH0.PmkiaDe0DyLDjoVGxcaKjo96i6K_aQsODX18da95V3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simplified search terms for better Pexels results
const SEARCH_OVERRIDES = {
    "Lay's Classic Salted": "potato chips",
    "Kurkure Masala Munch": "corn snacks",
    "Uncle Chips Plain Salted": "potato chips",
    "Bingo Mad Angles": "triangle chips snack",
    "Puffcorn Yummy Cheese": "cheese puffs",
    "Sunfeast Dark Fantasy Choco Fills": "chocolate cookies",
    "Bourbon Cream Biscuit": "chocolate cream biscuit",
    "Parle Hide & Seek": "chocolate chip cookies",
    "Cadbury Oreo": "oreo cookies",
    "Britannia Nutri Choice Digestive": "digestive biscuits",
    "Coca-Cola": "coca cola bottle",
    "Pepsi": "pepsi bottle",
    "Fanta Orange": "orange soda",
    "Sprite": "sprite lemon drink",
    "Mountain Dew": "green soda bottle",
    "Maaza Mango": "mango juice",
    "Frooti Mango": "mango juice box",
    "Mogu Mogu Nata De Coco": "coconut jelly drink",
    "Gatorade Sports Drink": "sports drink",
    "Red Bull Energy Drink": "energy drink can",
    "Hell Energy Drink": "energy drink can",
    "O'Cean Fruit Water": "flavored water",
    "Amul Taaza Toned Milk": "milk packet",
    "Amul Cheese Slices": "cheese slices",
    "Amul Paneer": "paneer cheese",
    "Amul Butter": "butter block",
    "Amul Yogurt Cup": "yogurt cup",
    "Amul Ghee": "ghee jar",
    "Cadbury Dairy Milk": "milk chocolate bar",
    "KitKat": "kitkat chocolate wafer",
    "Cadbury Milky Bar": "white chocolate",
    "Cadbury Nutties": "chocolate nuts",
    "Nestle Munch": "wafer chocolate",
    "Snickers": "snickers chocolate",
    "Kinder Joy": "kinder egg",
    "Cadbury 5Star": "caramel chocolate",
    "Green Chilli": "green chili peppers",
    "Onion": "fresh onions",
    "Cabbage": "green cabbage",
    "Tomato": "red tomatoes",
    "Lady Finger (Bhindi)": "okra",
    "Potato (Aloo)": "potatoes",
    "Lemon (Nimbu)": "lemons",
    "Coriander Leaves": "coriander cilantro",
    "Banana": "bananas",
    "Apple (Shimla)": "red apples",
    "Grapes (Green)": "green grapes",
    "Orange (Nagpur)": "oranges",
    "Pomegranate": "pomegranate",
    "Samyang Buldak Ramen": "korean ramen noodles",
    "Maggi 2-Minute Noodles": "instant noodles",
    "Yippee Noodles": "instant noodles packet",
    "Nissin Cup Noodles": "cup noodles",
    "Knorr Hot & Sour Soup": "hot soup bowl",
    "Wai Wai Noodles": "noodles packet",
    "Pasta (Penne)": "penne pasta",
    "Rice (Regular)": "white rice grains",
    "Toor Dal": "yellow lentils",
    "Maida (All Purpose Flour)": "flour bag",
    "Fortune Sunflower Oil": "sunflower oil",
    "Mustard Oil (Kachi Ghani)": "mustard oil bottle",
    "Besan (Gram Flour)": "chickpea flour",
    "Sooji (Semolina)": "semolina",
    "Chana Dal": "chickpea lentils",
    "Rajma": "kidney beans",
    "Nutella Hazelnut Spread": "nutella jar",
    "Kissan Mixed Fruit Jam": "fruit jam",
    "Quaker Oats": "oats bowl breakfast",
    "Kissan Tomato Sauce": "ketchup bottle",
    "Sundrop Peanut Butter Creamy": "peanut butter",
    "Kellogg's Cornflakes": "cornflakes cereal",
    "Kellogg's Chocos": "chocolate cereal",
    "Dr. Oetker Mayonnaise": "mayonnaise",
    "Nescafe Classic Coffee": "instant coffee",
    "Tata Tea Gold": "tea leaves cup",
    "Maggi Masala-ae-Magic": "spice masala",
    "Vim Dishwash Bar": "dish soap",
    "Kissan Tomato Ketchup": "tomato ketchup",
    "Amul Butter (Sachet)": "butter",
    "Surf Excel Detergent": "washing powder",
    "Tide Detergent Powder": "detergent",
    "Rin Detergent Bar": "laundry soap",
    "Ariel Washing Powder": "laundry detergent",
    "Harpic Toilet Cleaner": "toilet cleaner",
    "Colgate MaxFresh": "toothpaste",
    "Dove Soap Bar": "dove soap",
    "Dettol Soap": "antibacterial soap",
    "Lifebuoy Soap": "hand soap",
    "Lux Soft Touch Soap": "beauty soap",
    "Sunsilk Shampoo": "shampoo bottle",
    "TRESemmé Shampoo": "shampoo",
    "Clinic Plus Shampoo": "hair shampoo",
    "Head & Shoulders Shampoo": "anti dandruff shampoo",
    "Classic Signature Cigarettes": "cigarettes",
    "Gold Flake Cigarettes": "cigarette pack"
};

async function searchPexels(query) {
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });

        if (!response.ok) {
            console.error(`  Pexels API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.medium;
        }
        return null;
    } catch (error) {
        console.error(`  Fetch error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🛒 Go To Mart — Product Image SQL Generator');
    console.log('=============================================\n');

    // 1. Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description')
        .order('name');

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`Found ${products.length} products. Fetching images from Pexels...\n`);

    let sqlStatements = [];
    sqlStatements.push('-- Auto-generated: Product Image URLs from Pexels');
    sqlStatements.push('-- Run this in your Supabase SQL Editor\n');

    let successCount = 0;

    for (const product of products) {
        const searchTerm = SEARCH_OVERRIDES[product.name] || product.description || product.name;
        process.stdout.write(`🔍 ${product.name} → "${searchTerm}" ... `);

        const imageUrl = await searchPexels(searchTerm);

        if (imageUrl) {
            const escapedUrl = imageUrl.replace(/'/g, "''");
            const escapedId = product.id;
            sqlStatements.push(`UPDATE products SET image_url = '${escapedUrl}' WHERE id = '${escapedId}';`);
            console.log(`✅`);
            successCount++;
        } else {
            console.log(`⚠️ No image`);
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Write to file
    const sqlContent = sqlStatements.join('\n');
    writeFileSync('update-product-images.sql', sqlContent);

    console.log(`\n=============================================`);
    console.log(`✅ Generated SQL for ${successCount} products`);
    console.log(`📄 Output: update-product-images.sql`);
    console.log(`\n👉 Copy-paste the contents of update-product-images.sql into your Supabase SQL Editor and run it!`);
}

main();
