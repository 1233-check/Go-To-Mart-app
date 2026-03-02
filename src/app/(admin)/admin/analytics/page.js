'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        loadAnalytics();
    }, []);

    async function loadAnalytics() {
        setLoading(true);
        try {
            // 1. Fetch recent delivered orders for the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentOrders, error: ordersError } = await supabase
                .from('orders')
                .select('created_at, total')
                .eq('status', 'delivered')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (ordersError) throw ordersError;

            // Group by date for revenue chart
            const dailyRevenue = {};
            let total = 0;

            (recentOrders || []).forEach(order => {
                const dateSplit = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const orderTotal = Number(order.total);
                dailyRevenue[dateSplit] = (dailyRevenue[dateSplit] || 0) + orderTotal;
                total += orderTotal;
            });

            // Format for chart display
            const chartData = Object.keys(dailyRevenue).map(date => ({
                date,
                amount: dailyRevenue[date]
            }));

            setRevenueData(chartData);
            setTotalRevenue(total);

            // 2. Fetch order items for top products
            // Using a simple query since Supabase JS client doesn't support complex group-by well without RPC
            const { data: recentItems, error: itemsError } = await supabase
                .from('order_items')
                .select('product_name, quantity, total, order_id')
                .order('created_at', { ascending: false })
                .limit(200); // Look at last 200 items

            if (itemsError) throw itemsError;

            // Aggregate product sales manually
            const productSales = {};
            (recentItems || []).forEach(item => {
                if (!productSales[item.product_name]) {
                    productSales[item.product_name] = {
                        name: item.product_name,
                        unitsSold: 0,
                        revenue: 0
                    };
                }
                productSales[item.product_name].unitsSold += item.quantity;
                productSales[item.product_name].revenue += Number(item.total);
            });

            // Sort by units sold and take top 5
            const sortedProducts = Object.values(productSales)
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .slice(0, 5);

            setTopProducts(sortedProducts);

        } catch (error) {
            console.error('Error loading analytics:', error);
        }
        setLoading(false);
    }

    return (
        <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
                <h1>Analytics Dashboard</h1>
                <button className="btn btn-outline btn-sm" onClick={loadAnalytics} disabled={loading}>
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>

                    {/* Revenue Trends */}
                    <div className="card" style={{ padding: 'var(--space-4)' }}>
                        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Revenue (Last 7 Days)</h2>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--success)', marginBottom: 'var(--space-6)' }}>
                            {formatPrice(totalRevenue)}
                        </div>

                        {revenueData.length === 0 ? (
                            <div className="text-secondary text-sm">No delivered orders in the last 7 days.</div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', paddingTop: '20px' }}>
                                {revenueData.map((data, index) => {
                                    // Calculate relative height (max 100%)
                                    const maxAmount = Math.max(...revenueData.map(d => d.amount));
                                    const heightPercentage = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;

                                    return (
                                        <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div
                                                title={`${data.date}: ${formatPrice(data.amount)}`}
                                                style={{
                                                    width: '100%',
                                                    height: `${heightPercentage}%`,
                                                    background: 'var(--primary)',
                                                    borderRadius: '4px 4px 0 0',
                                                    minHeight: '4px',
                                                    opacity: 0.8,
                                                    transition: 'height 0.3s ease'
                                                }}
                                            />
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                                                {data.date}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="card" style={{ padding: 'var(--space-4)' }}>
                        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Top Selling Products</h2>

                        {topProducts.length === 0 ? (
                            <div className="text-secondary text-sm">Not enough data to determine top products.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {topProducts.map((product, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div style={{
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: index < 3 ? 'var(--primary)' : 'var(--text-secondary)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            fontWeight: 700,
                                            marginRight: 'var(--space-3)',
                                            fontSize: 'var(--font-sm)'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                                                {product.unitsSold} units sold
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {formatPrice(product.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
