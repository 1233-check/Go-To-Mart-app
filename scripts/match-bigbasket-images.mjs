/**
 * Match BigBasket CSV product images to our Supabase products
 * Usage: node scripts/match-bigbasket-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const SUPABASE_URL = 'https://ahitvfafdnvmkkfvghbe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaXR2ZmFmZG52bWtrZnZnaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODkyMjQsImV4cCI6MjA4Nzk2NTIyNH0.PmkiaDe0DyLDjoVGxcaKjo96i6K_aQsODX18da95V3Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Parse CSV manually (no external deps)
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h.trim()] = (values[idx] || '').trim();
        });
        rows.push(obj);
    }
    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// Simple fuzzy matching: normalize strings and compare
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[''`´]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getMatchScore(productName, csvProductName, csvBrand) {
    const normProduct = normalize(productName);
    const normCSV = normalize(csvProductName);
    const normBrand = normalize(csvBrand || '');

    // Exact match
    if (normProduct === normCSV) return 100;

    // Product name contains CSV name or vice versa
    if (normCSV.includes(normProduct) || normProduct.includes(normCSV)) return 80;

    // Check if all meaningful words from our product name appear in CSV
    const productWords = normProduct.split(' ').filter(w => w.length > 2);
    const csvFull = normCSV + ' ' + normBrand;
    const matchingWords = productWords.filter(w => csvFull.includes(w));
    const wordScore = (matchingWords.length / productWords.length) * 70;

    return wordScore;
}

// Manual overrides for tricky names
const MANUAL_SEARCH = {
    "Cadbury 5Star": "5 star",
    "Cadbury Dairy Milk": "dairy milk",
    "Cadbury Milky Bar": "milky bar",
    "Cadbury Nutties": "nutties",
    "Cadbury Oreo": "oreo",
    "Lady Finger (Bhindi)": "bhindi",
    "Potato (Aloo)": "potato",
    "Lemon (Nimbu)": "lemon",
    "Apple (Shimla)": "apple",
    "Orange (Nagpur)": "orange",
    "Grapes (Green)": "green grapes",
    "Pasta (Penne)": "penne pasta",
    "Rice (Regular)": "rice",
    "Fortune Sunflower Oil": "fortune sunflower",
    "Mustard Oil (Kachi Ghani)": "mustard oil",
    "Besan (Gram Flour)": "besan",
    "Sooji (Semolina)": "sooji",
    "Maida (All Purpose Flour)": "maida",
    "O'Cean Fruit Water": "ocean fruit water",
    "Amul Butter (Sachet)": "amul butter",
    "Kellogg's Cornflakes": "cornflakes",
    "Kellogg's Chocos": "chocos",
    "Lay's Classic Salted": "lays classic",
    "Parle Hide & Seek": "hide seek",
    "Knorr Hot & Sour Soup": "knorr soup",
    "Head & Shoulders Shampoo": "head shoulders",
    "Kissan Tomato Ketchup": "kissan ketchup",
    "Kissan Tomato Sauce": "kissan ketchup",
    "Dr. Oetker Mayonnaise": "mayonnaise",
    "TRESemmé Shampoo": "tresemme",
    "Maggi Masala-ae-Magic": "maggi masala",
};

async function main() {
    console.log('🛒 Go To Mart — BigBasket Image Matcher');
    console.log('=========================================\n');

    // 1. Load CSV
    const csvText = readFileSync('product-images-dataset/BigBasket.csv', 'utf-8');
    const csvProducts = parseCSV(csvText);
    console.log(`📊 Loaded ${csvProducts.length} BigBasket products from CSV\n`);

    // 2. Fetch our products
    const { data: ourProducts, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`🏪 Found ${ourProducts.length} products in our database\n`);

    let sqlStatements = [];
    sqlStatements.push('-- Auto-generated: BigBasket Product Image URLs');
    sqlStatements.push('-- Run this in your Supabase SQL Editor\n');

    let matched = 0;
    let unmatched = 0;

    for (const product of ourProducts) {
        const searchName = MANUAL_SEARCH[product.name] || product.name;

        // Find best match in CSV
        let bestMatch = null;
        let bestScore = 0;

        for (const csvProduct of csvProducts) {
            if (!csvProduct.Image_Url) continue;

            const score = getMatchScore(searchName, csvProduct.ProductName, csvProduct.Brand);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = csvProduct;
            }
        }

        if (bestMatch && bestScore >= 40) {
            const imageUrl = bestMatch.Image_Url.replace(/'/g, "''");
            sqlStatements.push(`UPDATE products SET image_url = '${imageUrl}' WHERE id = '${product.id}'; -- ${product.name} → ${bestMatch.ProductName} (${bestScore}%)`);
            console.log(`✅ ${product.name} → "${bestMatch.ProductName}" (${bestScore}% match)`);
            matched++;
        } else {
            console.log(`⚠️ ${product.name} → No good match (best: ${bestScore}%)`);
            unmatched++;
        }
    }

    const sqlContent = sqlStatements.join('\n');
    writeFileSync('update-bigbasket-images.sql', sqlContent);

    console.log(`\n=========================================`);
    console.log(`✅ Matched:   ${matched} products`);
    console.log(`⚠️ Unmatched: ${unmatched} products`);
    console.log(`📄 Output: update-bigbasket-images.sql`);
    console.log(`\n👉 Run this SQL in your Supabase SQL Editor!`);
}

main();
