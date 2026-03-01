'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const STATUS_LABELS = {
    assigned: '📦 Pickup Pending',
    picked_up: '🏃 Picked Up',
    in_transit: '🛵 On the Way',
    delivered: '🎉 Delivered',
};

const DELIVERY_ACTIONS = {
    assigned: { next: 'picked_up', label: 'Mark as Picked Up', color: 'var(--warning)' },
    picked_up: { next: 'in_transit', label: 'Start Delivery', color: 'var(--primary)' },
    in_transit: { next: 'delivered', label: 'Mark as Delivered ✓', color: 'var(--success)' },
};

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
        const channel = supabase
            .channel('delivery-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function loadOrders() {
        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .in('status', ['assigned', 'picked_up', 'in_transit', 'delivered'])
            .order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
    }

    async function updateStatus(orderId, newStatus) {
        await supabase.from('orders').update({
            status: newStatus,
            updated_at: new Date().toISOString()
        }).eq('id', orderId);
    }

    function openMaps(address) {
        const encoded = encodeURIComponent(address + ', Dimapur, Nagaland');
        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
    }

    const pendingOrders = orders.filter(o => ['assigned', 'picked_up', 'in_transit'].includes(o.status));
    const completedOrders = orders.filter(o => o.status === 'delivered');

    const filteredOrders = activeTab === 'pending' ? pendingOrders : completedOrders;

    const todayEarnings = completedOrders
        .filter(o => new Date(o.updated_at).toDateString() === new Date().toDateString())
        .length * 30; // ₹30 per delivery estimate

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Header */}
            <div className="app-header">
                <h1>🛵 Delivery</h1>
                <div className="flex items-center gap-2">
                    <span className="badge" style={{ background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 700 }}>
                        {pendingOrders.length} Active
                    </span>
                </div>
            </div>

            {/* Earnings Card */}
            <div style={{
                margin: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--primary-gradient)',
                borderRadius: 'var(--radius-xl)',
                color: 'white',
            }}>
                <div style={{ fontSize: 'var(--font-sm)', opacity: 0.8 }}>Today&apos;s Earnings</div>
                <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800 }}>{formatPrice(todayEarnings)}</div>
                <div style={{ fontSize: 'var(--font-xs)', opacity: 0.7, marginTop: 'var(--space-1)' }}>
                    {completedOrders.filter(o => new Date(o.updated_at).toDateString() === new Date().toDateString()).length} deliveries completed today
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)', padding: '0 var(--space-4)' }}>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        flex: 1, padding: 'var(--space-3)', fontWeight: 600, fontSize: 'var(--font-sm)',
                        borderBottom: activeTab === 'pending' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-secondary)',
                        background: 'none',
                    }}
                >
                    Active ({pendingOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    style={{
                        flex: 1, padding: 'var(--space-3)', fontWeight: 600, fontSize: 'var(--font-sm)',
                        borderBottom: activeTab === 'completed' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'completed' ? 'var(--primary)' : 'var(--text-secondary)',
                        background: 'none',
                    }}
                >
                    Completed ({completedOrders.length})
                </button>
            </div>

            {/* Orders */}
            <div style={{ padding: 'var(--space-4)' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center text-secondary" style={{ padding: 'var(--space-12)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>
                            {activeTab === 'pending' ? '☕' : '📋'}
                        </div>
                        <p>{activeTab === 'pending' ? 'No active deliveries' : 'No completed deliveries'}</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div>
                                    <div className="order-id">{order.order_number}</div>
                                    <div className="text-xs text-secondary">
                                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                            </div>

                            <div className="order-body">
                                {/* Customer Info */}
                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>👤 {order.customer_name}</div>
                                    <a href={`tel:${order.customer_phone}`} style={{ fontSize: 'var(--font-sm)', color: 'var(--primary)', fontWeight: 500 }}>
                                        📞 {order.customer_phone}
                                    </a>
                                </div>

                                {/* Address with Maps Link */}
                                <div style={{
                                    background: 'var(--bg-secondary)', padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)',
                                }}>
                                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>📍 Delivery Address</div>
                                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{order.delivery_address}</div>
                                    {order.delivery_landmark && (
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                            Landmark: {order.delivery_landmark}
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ marginTop: 'var(--space-2)', width: '100%' }}
                                        onClick={() => openMaps(order.delivery_address)}
                                    >
                                        🗺️ Open in Google Maps
                                    </button>
                                </div>

                                {/* Items */}
                                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                    {order.order_items?.length} items • {formatPrice(order.total)}
                                    {order.payment_method === 'cod' && (
                                        <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)' }}>
                                            COD — Collect {formatPrice(order.total)}
                                        </span>
                                    )}
                                </div>
                                {order.order_items?.map(item => (
                                    <div key={item.id} className="order-item" style={{ fontSize: 'var(--font-xs)' }}>
                                        <span>{item.product_name} × {item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {DELIVERY_ACTIONS[order.status] && (
                                <div className="order-actions">
                                    <button
                                        className="btn w-full"
                                        style={{ background: DELIVERY_ACTIONS[order.status].color, color: 'white', padding: 'var(--space-3)' }}
                                        onClick={() => updateStatus(order.id, DELIVERY_ACTIONS[order.status].next)}
                                    >
                                        {DELIVERY_ACTIONS[order.status].label}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
