import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10;

// Create a real or mock client
export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockClient();

function createMockClient() {
    console.warn('⚠️ Supabase not configured. Using mock client. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');

    const mockData = {
        categories: [
            { id: '1', name: 'Fruits & Vegetables', icon: '🥬', sort_order: 1, is_active: true },
            { id: '2', name: 'Dairy, Bread & Eggs', icon: '🥛', sort_order: 2, is_active: true },
            { id: '3', name: 'Chips & Snacks', icon: '🍿', sort_order: 3, is_active: true },
            { id: '4', name: 'Biscuits', icon: '🍪', sort_order: 4, is_active: true },
            { id: '5', name: 'Sweets & Chocolates', icon: '🍫', sort_order: 5, is_active: true },
            { id: '6', name: 'Drinks & Juices', icon: '🥤', sort_order: 6, is_active: true },
            { id: '7', name: 'Noodles & Pasta', icon: '🍜', sort_order: 7, is_active: true },
            { id: '8', name: 'Atta, Rice & Dal', icon: '🌾', sort_order: 8, is_active: true },
            { id: '9', name: 'Breakfast & Sauces', icon: '🥣', sort_order: 9, is_active: true },
            { id: '10', name: 'Cleaning & Household', icon: '🧹', sort_order: 10, is_active: true },
            { id: '11', name: 'Personal Care', icon: '🧴', sort_order: 11, is_active: true },
        ],
        products: [
            { id: 'p1', name: 'Kurkure Masala Munch', price: 20, mrp: 20, unit: '1 pack', category_id: '3', is_active: true, stock_quantity: 100 },
            { id: 'p2', name: 'Lay\'s Classic Salted', price: 20, mrp: 20, unit: '1 pack', category_id: '3', is_active: true, stock_quantity: 100 },
            { id: 'p3', name: 'Bingo Mad Angles', price: 20, mrp: 20, unit: '1 pack', category_id: '3', is_active: true, stock_quantity: 100 },
            { id: 'p4', name: 'Dark Fantasy Choco Fills', price: 40, mrp: 40, unit: '1 pack', category_id: '4', is_active: true, stock_quantity: 100 },
            { id: 'p5', name: 'Cadbury Oreo', price: 30, mrp: 30, unit: '1 pack', category_id: '4', is_active: true, stock_quantity: 100 },
            { id: 'p6', name: 'Coca-Cola', price: 40, mrp: 40, unit: '750 ml', category_id: '6', is_active: true, stock_quantity: 100 },
            { id: 'p7', name: 'Pepsi', price: 40, mrp: 40, unit: '750 ml', category_id: '6', is_active: true, stock_quantity: 100 },
            { id: 'p8', name: 'Red Bull Energy', price: 125, mrp: 125, unit: '250 ml', category_id: '6', is_active: true, stock_quantity: 100 },
            { id: 'p9', name: 'Maggi 2-Minute Noodles', price: 14, mrp: 14, unit: '1 pack', category_id: '7', is_active: true, stock_quantity: 100 },
            { id: 'p10', name: 'Cadbury Dairy Milk', price: 50, mrp: 50, unit: '1 bar', category_id: '5', is_active: true, stock_quantity: 100 },
            { id: 'p11', name: 'KitKat', price: 40, mrp: 40, unit: '1 bar', category_id: '5', is_active: true, stock_quantity: 100 },
            { id: 'p12', name: 'Snickers', price: 50, mrp: 50, unit: '1 bar', category_id: '5', is_active: true, stock_quantity: 100 },
            { id: 'p13', name: 'Amul Taaza Milk', price: 29, mrp: 29, unit: '500 ml', category_id: '2', is_active: true, stock_quantity: 100 },
            { id: 'p14', name: 'Amul Butter', price: 56, mrp: 56, unit: '100 g', category_id: '2', is_active: true, stock_quantity: 100 },
            { id: 'p15', name: 'Banana', price: 40, mrp: 40, unit: '1 dozen', category_id: '1', is_active: true, stock_quantity: 100 },
            { id: 'p16', name: 'Tomato', price: 40, mrp: 40, unit: '1 kg', category_id: '1', is_active: true, stock_quantity: 100 },
            { id: 'p17', name: 'Onion', price: 35, mrp: 40, unit: '1 kg', category_id: '1', is_active: true, stock_quantity: 100 },
            { id: 'p18', name: 'Potato (Aloo)', price: 30, mrp: 30, unit: '1 kg', category_id: '1', is_active: true, stock_quantity: 100 },
            { id: 'p19', name: 'Wai Wai Noodles', price: 15, mrp: 15, unit: '1 pack', category_id: '7', is_active: true, stock_quantity: 100 },
            { id: 'p20', name: 'Nescafe Classic Coffee', price: 190, mrp: 195, unit: '100 g', category_id: '9', is_active: true, stock_quantity: 100 },
        ],
        orders: [],
        order_items: [],
        profiles: [],
        addresses: [],
    };

    // Mock query builder
    function createQueryBuilder(tableName) {
        let data = [...(mockData[tableName] || [])];
        let filters = {};
        let single = false;

        const builder = {
            select: () => builder,
            insert: (newData) => {
                if (Array.isArray(newData)) {
                    newData.forEach(item => { item.id = item.id || crypto.randomUUID(); mockData[tableName]?.push(item); });
                } else {
                    newData.id = newData.id || crypto.randomUUID();
                    mockData[tableName]?.push(newData);
                }
                return { ...builder, data: Array.isArray(newData) ? newData : newData, error: null };
            },
            update: (updates) => {
                if (filters.eq) {
                    const [key, val] = filters.eq;
                    const idx = mockData[tableName]?.findIndex(item => item[key] == val);
                    if (idx >= 0) Object.assign(mockData[tableName][idx], updates);
                }
                return { ...builder, data: updates, error: null };
            },
            delete: () => {
                if (filters.eq) {
                    const [key, val] = filters.eq;
                    const idx = mockData[tableName]?.findIndex(item => item[key] == val);
                    if (idx >= 0) mockData[tableName].splice(idx, 1);
                }
                return { ...builder, data: null, error: null };
            },
            eq: (key, val) => { filters.eq = [key, val]; data = data.filter(item => item[key] == val); return builder; },
            neq: (key, val) => { data = data.filter(item => item[key] != val); return builder; },
            ilike: (key, pattern) => {
                const search = pattern.replace(/%/g, '').toLowerCase();
                data = data.filter(item => item[key]?.toLowerCase().includes(search));
                return builder;
            },
            in: (key, vals) => { data = data.filter(item => vals.includes(item[key])); return builder; },
            order: (key, opts) => {
                data.sort((a, b) => {
                    if (opts?.ascending === false) return (b[key] || 0) > (a[key] || 0) ? 1 : -1;
                    return (a[key] || 0) > (b[key] || 0) ? 1 : -1;
                });
                return builder;
            },
            limit: () => builder,
            single: () => { single = true; return { data: data[0] || null, error: data[0] ? null : { message: 'Not found' } }; },
            then: (resolve) => resolve({ data: single ? data[0] : data, error: null, count: data.length }),
        };

        // Make it thenable
        Object.defineProperty(builder, 'data', { get: () => data, configurable: true });
        Object.defineProperty(builder, 'error', { get: () => null, configurable: true });

        return builder;
    }

    return {
        from: (table) => createQueryBuilder(table),
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            signUp: async () => ({ data: { user: { id: crypto.randomUUID() } }, error: null }),
            signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured. Please set environment variables.' } }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        channel: () => ({
            on: function () { return this; },
            subscribe: function () { return this; },
        }),
        removeChannel: () => { },
    };
}

// Helper to get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Helper to get user profile with role
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
}

// Subscribe to real-time order updates
export function subscribeToOrders(callback, filters = {}) {
    let query = supabase
        .channel('orders-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', ...filters },
            (payload) => callback(payload)
        )
        .subscribe();
    return query;
}

// Check if Supabase is configured
export const isSupabaseConfigured = isConfigured;
