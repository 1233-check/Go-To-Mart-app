/**
 * Fetch Indian product images from Open Food Facts
 * Usage: node scripts/fetch-off-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://ahitvfafdnvmkkfvghbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaXR2ZmFmZG52bWtrZnZnaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODkyMjQsImV4cCI6MjA4Nzk2NTIyNH0.PmkiaDe0DyLDjoVGxcaKjo96i6K_aQsODX18da95V3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optimized search queries for Open Food Facts (Indian brands)
const SEARCH_TERMS = {
    "Lay's Classic Salted": "lays classic salted",
    "Kurkure Masala Munch": "kurkure masala",
    "Uncle Chips Plain Salted": "uncle chips",
    "Bingo Mad Angles": "bingo mad angles",
    "Puffcorn Yummy Cheese": "puffcorn cheese",
    "Sunfeast Dark Fantasy Choco Fills": "dark fantasy choco fills",
    "Bourbon Cream Biscuit": "bourbon cream biscuit",
    "Parle Hide & Seek": "parle hide seek",
    "Cadbury Oreo": "oreo cadbury india",
    "Britannia Nutri Choice Digestive": "britannia nutri choice",
    "Coca-Cola": "coca cola india",
    "Pepsi": "pepsi india",
    "Fanta Orange": "fanta orange india",
    "Sprite": "sprite india",
    "Mountain Dew": "mountain dew india",
    "Maaza Mango": "maaza mango",
    "Frooti Mango": "frooti mango",
    "Mogu Mogu Nata De Coco": "mogu mogu",
    "Gatorade Sports Drink": "gatorade",
    "Red Bull Energy Drink": "red bull",
    "Hell Energy Drink": "hell energy drink",
    "O'Cean Fruit Water": "ocean fruit water",
    "Amul Taaza Toned Milk": "amul taaza milk",
    "Amul Cheese Slices": "amul cheese slices",
    "Amul Paneer": "amul paneer",
    "Amul Butter": "amul butter",
    "Amul Yogurt Cup": "amul yogurt",
    "Amul Ghee": "amul ghee",
    "Cadbury Dairy Milk": "cadbury dairy milk india",
    "KitKat": "kitkat india",
    "Cadbury Milky Bar": "milky bar nestle india",
    "Cadbury Nutties": "cadbury nutties",
    "Nestle Munch": "nestle munch india",
    "Snickers": "snickers india",
    "Kinder Joy": "kinder joy",
    "Cadbury 5Star": "cadbury 5 star",
    "Green Chilli": "green chilli india",
    "Onion": "onion india",
    "Cabbage": "cabbage",
    "Tomato": "tomato india",
    "Lady Finger (Bhindi)": "okra bhindi",
    "Potato (Aloo)": "potato aloo",
    "Lemon (Nimbu)": "lemon nimbu",
    "Coriander Leaves": "coriander leaves india",
    "Banana": "banana india",
    "Apple (Shimla)": "apple shimla",
    "Grapes (Green)": "green grapes india",
    "Orange (Nagpur)": "orange nagpur",
    "Pomegranate": "pomegranate india",
    "Samyang Buldak Ramen": "samyang buldak ramen",
    "Maggi 2-Minute Noodles": "maggi noodles india",
    "Yippee Noodles": "yippee noodles sunfeast",
    "Nissin Cup Noodles": "nissin cup noodles",
    "Knorr Hot & Sour Soup": "knorr soup",
    "Wai Wai Noodles": "wai wai noodles",
    "Pasta (Penne)": "penne pasta",
    "Rice (Regular)": "rice india basmati",
    "Toor Dal": "toor dal india",
    "Maida (All Purpose Flour)": "maida flour india",
    "Fortune Sunflower Oil": "fortune sunflower oil",
    "Mustard Oil (Kachi Ghani)": "mustard oil kachi ghani",
    "Besan (Gram Flour)": "besan gram flour",
    "Sooji (Semolina)": "sooji semolina india",
    "Chana Dal": "chana dal india",
    "Rajma": "rajma kidney beans india",
    "Nutella Hazelnut Spread": "nutella",
    "Kissan Mixed Fruit Jam": "kissan jam",
    "Quaker Oats": "quaker oats india",
    "Kissan Tomato Sauce": "kissan tomato ketchup",
    "Sundrop Peanut Butter Creamy": "sundrop peanut butter",
    "Kellogg's Cornflakes": "kelloggs corn flakes india",
    "Kellogg's Chocos": "kelloggs chocos india",
    "Dr. Oetker Mayonnaise": "dr oetker mayonnaise india",
    "Nescafe Classic Coffee": "nescafe classic india",
    "Tata Tea Gold": "tata tea gold",
    "Maggi Masala-ae-Magic": "maggi masala ae magic",
    "Vim Dishwash Bar": "vim dishwash bar india",
    "Kissan Tomato Ketchup": "kissan ketchup",
    "Amul Butter (Sachet)": "amul butter sachet",
    "Surf Excel Detergent": "surf excel",
    "Tide Detergent Powder": "tide detergent india",
    "Rin Detergent Bar": "rin detergent bar",
    "Ariel Washing Powder": "ariel washing powder india",
    "Harpic Toilet Cleaner": "harpic toilet cleaner",
    "Colgate MaxFresh": "colgate maxfresh india",
    "Dove Soap Bar": "dove soap india",
    "Dettol Soap": "dettol soap india",
    "Lifebuoy Soap": "lifebuoy soap india",
    "Lux Soft Touch Soap": "lux soap india",
    "Sunsilk Shampoo": "sunsilk shampoo india",
    "TRESemmé Shampoo": "tresemme shampoo",
    "Clinic Plus Shampoo": "clinic plus shampoo india",
    "Head & Shoulders Shampoo": "head shoulders shampoo india",
    "Classic Signature Cigarettes": "classic cigarettes india",
    "Gold Flake Cigarettes": "gold flake cigarettes india"
};

async function searchOpenFoodFacts(query) {
    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=3&fields=product_name,image_front_url,image_url,image_front_small_url`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'GoToMart/1.0 (grocery-app; contact@gotomart.in)'
            }
        });
        clearTimeout(timeout);

        if (!response.ok) return null;

        const data = await response.json();

        if (data.products && data.products.length > 0) {
            // Try to find the best image
            for (const product of data.products) {
                const img = product.image_front_url || product.image_url || product.image_front_small_url;
                if (img) return img;
            }
        }
        return null;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏳ Timeout');
        } else {
            console.log(`❌ ${error.message}`);
        }
        return null;
    }
}

async function main() {
    console.log('🛒 Go To Mart — Open Food Facts Image Fetcher');
    console.log('================================================\n');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`Found ${products.length} products. Searching Open Food Facts...\n`);

    let sqlStatements = [];
    sqlStatements.push('-- Auto-generated: Product Image URLs from Open Food Facts');
    sqlStatements.push('-- Run this in your Supabase SQL Editor\n');

    let found = 0;
    let notFound = 0;

    for (const product of products) {
        const searchTerm = SEARCH_TERMS[product.name] || product.name;
        process.stdout.write(`🔍 ${product.name} → "${searchTerm}" ... `);

        const imageUrl = await searchOpenFoodFacts(searchTerm);

        if (imageUrl) {
            const escapedUrl = imageUrl.replace(/'/g, "''");
            sqlStatements.push(`UPDATE products SET image_url = '${escapedUrl}' WHERE id = '${product.id}';`);
            console.log(`✅ Found!`);
            found++;
        } else {
            console.log(`⚠️ Not found`);
            notFound++;
        }

        // Be kind to the free API — 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const sqlContent = sqlStatements.join('\n');
    writeFileSync('update-product-images-off.sql', sqlContent);

    console.log(`\n================================================`);
    console.log(`✅ Found images: ${found} products`);
    console.log(`⚠️ Not found:    ${notFound} products`);
    console.log(`📄 Output: update-product-images-off.sql`);
    console.log(`\n👉 Run this SQL in your Supabase SQL Editor!`);

    if (notFound > 0) {
        console.log(`\n💡 For the ${notFound} unfound products, the app will show styled emoji icons as a graceful fallback.`);
    }
}

main();
