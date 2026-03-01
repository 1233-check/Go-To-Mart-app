'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const STATUS_LABELS = {
    placed: '🟡 Order Placed',
    confirmed: '🟢 Confirmed',
    packing: '📦 Packing',
    packed: '✅ Packed',
    assigned: '🚴 Rider Assigned',
    picked_up: '🏃 Picked Up',
    in_transit: '🛵 On the Way',
    delivered: '🎉 Delivered',
    cancelled: '❌ Cancelled',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();

        // Real-time subscription for order updates
        const channel = supabase
            .channel('customer-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => loadOrders()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function loadOrders() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (*)
        `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error loading orders:', err);
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-4))' }}>
            {/* Header */}
            <div className="app-header">
                <Link href="/" style={{ color: 'white', fontSize: '1.25rem' }}>←</Link>
                <h1>My Orders</h1>
                <div />
            </div>

            <div style={{ padding: 'var(--space-4)' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📋</div>
                        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>No orders yet</h3>
                        <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-6)' }}>Place your first order to see it here</p>
                        <Link href="/" className="btn btn-primary">Browse Products</Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="order-card">
                                <div className="order-header">
                                    <div>
                                        <div className="order-id">{order.order_number}</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <span className={`badge status-${order.status}`}>
                                        {STATUS_LABELS[order.status] || order.status}
                                    </span>
                                </div>
                                <div className="order-body">
                                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                        {order.order_items?.length || 0} items
                                    </div>
                                    {order.order_items?.slice(0, 3).map((item) => (
                                        <div key={item.id} className="order-item">
                                            <span>{item.product_name} × {item.quantity}</span>
                                            <span>{formatPrice(item.total)}</span>
                                        </div>
                                    ))}
                                    {order.order_items?.length > 3 && (
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                                            +{order.order_items.length - 3} more items
                                        </div>
                                    )}
                                </div>
                                <div className="order-actions" style={{ justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 700 }}>{formatPrice(order.total)}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 'var(--font-sm)' }}>View Details →</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="customer-bottom-nav">
                <Link href="/"><span className="nav-icon">🏠</span>Home</Link>
                <Link href="/"><span className="nav-icon">📂</span>Categories</Link>
                <Link href="/cart"><span className="nav-icon">🛒</span>Cart</Link>
                <Link href="/orders" className="active"><span className="nav-icon">📋</span>Orders</Link>
                <Link href="/profile"><span className="nav-icon">👤</span>Profile</Link>
            </nav>
        </div>
    );
}
