/**
 * Auto-populate product images from Pexels API
 * Usage: node scripts/populate-images.mjs
 */

import { createClient } from '@supabase/supabase-js';

const PEXELS_API_KEY = 'ebUoUerCGwsC7ESdEpsD5zT7UVxVPr6N5d5eoJOYtKJ1jy4ghwYC4idr';
const SUPABASE_URL = 'https://ahitvfafdnvmkkfvghbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaXR2ZmFmZG52bWtrZnZnaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODkyMjQsImV4cCI6MjA4Nzk2NTIyNH0.PmkiaDe0DyLDjoVGxcaKjo96i6K_aQsODX18da95V3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simplified search terms for better Pexels results
const SEARCH_OVERRIDES = {
    "Lay's Classic Salted": "potato chips packet",
    "Kurkure Masala Munch": "snacks packet",
    "Uncle Chips Plain Salted": "potato chips",
    "Bingo Mad Angles": "triangle chips snack",
    "Puffcorn Yummy Cheese": "cheese puff snack",
    "Sunfeast Dark Fantasy Choco Fills": "chocolate cookies",
    "Bourbon Cream Biscuit": "chocolate cream biscuit",
    "Parle Hide & Seek": "chocolate chip cookies",
    "Cadbury Oreo": "oreo cookies",
    "Britannia Nutri Choice Digestive": "digestive biscuits",
    "Coca-Cola": "coca cola bottle",
    "Pepsi": "pepsi bottle",
    "Fanta Orange": "orange soda",
    "Sprite": "sprite drink",
    "Mountain Dew": "green soda bottle",
    "Maaza Mango": "mango juice",
    "Frooti Mango": "mango juice box",
    "Mogu Mogu Nata De Coco": "coconut jelly drink",
    "Gatorade Sports Drink": "gatorade",
    "Red Bull Energy Drink": "red bull",
    "Hell Energy Drink": "energy drink can",
    "O'Cean Fruit Water": "flavored water bottle",
    "Amul Taaza Toned Milk": "milk packet",
    "Amul Cheese Slices": "cheese slices",
    "Amul Paneer": "paneer cheese",
    "Amul Butter": "butter block",
    "Amul Yogurt Cup": "yogurt cup",
    "Amul Ghee": "ghee jar",
    "Cadbury Dairy Milk": "chocolate bar",
    "KitKat": "kitkat chocolate",
    "Cadbury Milky Bar": "white chocolate",
    "Cadbury Nutties": "chocolate nuts",
    "Nestle Munch": "wafer chocolate bar",
    "Snickers": "snickers chocolate",
    "Kinder Joy": "kinder egg surprise",
    "Cadbury 5Star": "caramel chocolate",
    "Green Chilli": "green chili peppers",
    "Onion": "fresh onions",
    "Cabbage": "green cabbage",
    "Tomato": "fresh tomatoes",
    "Lady Finger (Bhindi)": "okra vegetable",
    "Potato (Aloo)": "fresh potatoes",
    "Lemon (Nimbu)": "fresh lemons",
    "Coriander Leaves": "fresh coriander leaves",
    "Banana": "bananas bunch",
    "Apple (Shimla)": "red apples",
    "Grapes (Green)": "green grapes",
    "Orange (Nagpur)": "fresh oranges",
    "Pomegranate": "pomegranate fruit",
    "Samyang Buldak Ramen": "korean ramen noodles",
    "Maggi 2-Minute Noodles": "instant noodles packet",
    "Yippee Noodles": "instant noodles",
    "Nissin Cup Noodles": "cup noodles",
    "Knorr Hot & Sour Soup": "soup packet",
    "Wai Wai Noodles": "instant noodles",
    "Pasta (Penne)": "penne pasta",
    "Rice (Regular)": "white rice bag",
    "Toor Dal": "yellow lentils dal",
    "Maida (All Purpose Flour)": "all purpose flour",
    "Fortune Sunflower Oil": "sunflower oil bottle",
    "Mustard Oil (Kachi Ghani)": "mustard oil bottle",
    "Besan (Gram Flour)": "gram flour chickpea",
    "Sooji (Semolina)": "semolina flour",
    "Chana Dal": "chickpea lentils",
    "Rajma": "red kidney beans",
    "Nutella Hazelnut Spread": "nutella jar",
    "Kissan Mixed Fruit Jam": "fruit jam jar",
    "Quaker Oats": "oats bowl",
    "Kissan Tomato Sauce": "tomato ketchup bottle",
    "Sundrop Peanut Butter Creamy": "peanut butter jar",
    "Kellogg's Cornflakes": "cornflakes cereal",
    "Kellogg's Chocos": "chocolate cereal",
    "Dr. Oetker Mayonnaise": "mayonnaise jar",
    "Nescafe Classic Coffee": "instant coffee jar",
    "Tata Tea Gold": "tea leaves",
    "Maggi Masala-ae-Magic": "masala spice packet",
    "Vim Dishwash Bar": "dishwashing soap",
    "Kissan Tomato Ketchup": "ketchup bottle",
    "Amul Butter (Sachet)": "butter sachet",
    "Surf Excel Detergent": "washing powder",
    "Tide Detergent Powder": "detergent powder",
    "Rin Detergent Bar": "laundry soap bar",
    "Ariel Washing Powder": "laundry detergent",
    "Harpic Toilet Cleaner": "toilet cleaner bottle",
    "Colgate MaxFresh": "toothpaste tube",
    "Dove Soap Bar": "dove soap",
    "Dettol Soap": "antibacterial soap",
    "Lifebuoy Soap": "hand soap bar",
    "Lux Soft Touch Soap": "beauty soap bar",
    "Sunsilk Shampoo": "shampoo bottle",
    "TRESemmé Shampoo": "shampoo bottle",
    "Clinic Plus Shampoo": "shampoo bottle hair",
    "Head & Shoulders Shampoo": "shampoo anti dandruff",
    "Classic Signature Cigarettes": "cigarette pack",
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
            // Use the "medium" sized photo (350px) — good for product cards
            return data.photos[0].src.medium;
        }
        return null;
    } catch (error) {
        console.error(`  Fetch error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🛒 Go To Mart — Product Image Populator');
    console.log('========================================\n');

    // 1. Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description')
        .order('name');

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`Found ${products.length} products. Fetching images...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
        const searchTerm = SEARCH_OVERRIDES[product.name] || product.description || product.name;
        process.stdout.write(`🔍 ${product.name} → "${searchTerm}" ... `);

        const imageUrl = await searchPexels(searchTerm);

        if (imageUrl) {
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: imageUrl })
                .eq('id', product.id);

            if (updateError) {
                console.log(`❌ DB error: ${updateError.message}`);
                failCount++;
            } else {
                console.log(`✅ Done`);
                successCount++;
            }
        } else {
            console.log(`⚠️ No image found`);
            failCount++;
        }

        // Rate limit: ~200ms between requests to stay well under limits
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n========================================`);
    console.log(`✅ Updated: ${successCount} products`);
    console.log(`⚠️ Failed:  ${failCount} products`);
    console.log(`\nDone! Refresh your app to see the images.`);
}

main();
