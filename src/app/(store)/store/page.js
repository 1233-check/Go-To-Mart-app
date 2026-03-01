'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const STATUS_LABELS = {
    placed: '🟡 New Order', confirmed: '🟢 Confirmed', packing: '📦 Packing',
    packed: '✅ Packed', assigned: '🚴 Assigned', picked_up: '🏃 Picked Up',
    in_transit: '🛵 In Transit', delivered: '🎉 Delivered', cancelled: '❌ Cancelled',
};

const STORE_ACTIONS = {
    placed: { next: 'confirmed', label: 'Confirm Order', color: 'var(--success)' },
    confirmed: { next: 'packing', label: 'Start Packing', color: 'var(--warning)' },
    packing: { next: 'packed', label: 'Mark as Packed', color: 'var(--primary)' },
};

export default function StoreDashboard() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
        const channel = supabase
            .channel('store-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadOrders();
                // Play sound for new orders
                if (typeof window !== 'undefined' && 'Notification' in window) {
                    new Audio('data:audio/wav;base64,UklGRl9vT19teleVBhdmVmb3JtYXQYABAABAAQAA==').play().catch(() => { });
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function loadOrders() {
        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });
        setOrders(data || []);
        setLoading(false);
    }

    async function updateStatus(orderId, newStatus) {
        await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
    }

    const activeStatuses = ['placed', 'confirmed', 'packing'];
    const packedStatuses = ['packed', 'assigned', 'picked_up', 'in_transit'];

    const filteredOrders = activeTab === 'active'
        ? orders.filter(o => activeStatuses.includes(o.status))
        : activeTab === 'packed'
            ? orders.filter(o => packedStatuses.includes(o.status))
            : orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    const newOrderCount = orders.filter(o => o.status === 'placed').length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Header */}
            <div className="app-header">
                <h1>🏪 Store Dashboard</h1>
                <div className="flex items-center gap-2">
                    {newOrderCount > 0 && (
                        <span className="badge" style={{ background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 700 }}>
                            {newOrderCount} NEW
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)', padding: '0 var(--space-4)' }}>
                {[
                    { key: 'active', label: 'Active', count: orders.filter(o => activeStatuses.includes(o.status)).length },
                    { key: 'packed', label: 'Ready', count: orders.filter(o => packedStatuses.includes(o.status)).length },
                    { key: 'done', label: 'Completed', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: 'var(--space-3)', fontWeight: 600, fontSize: 'var(--font-sm)',
                            borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                            color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                            background: 'none', transition: 'all 0.2s',
                        }}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Orders */}
            <div style={{ padding: 'var(--space-4)' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center text-secondary" style={{ padding: 'var(--space-12)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
                        <p>No orders in this tab</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="order-card" style={{ animation: order.status === 'placed' ? 'pulse 2s infinite' : 'none' }}>
                            <div className="order-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} style={{ cursor: 'pointer' }}>
                                <div>
                                    <div className="order-id">{order.order_number}</div>
                                    <div className="text-xs text-secondary">
                                        {order.customer_name} • {order.customer_phone}
                                    </div>
                                    <div className="text-xs text-secondary">
                                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                                    <strong>{formatPrice(order.total)}</strong>
                                </div>
                            </div>

                            <div className="order-body">
                                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    {order.order_items?.length} items
                                </div>
                                {order.order_items?.map(item => (
                                    <div key={item.id} className="order-item">
                                        <span>{item.product_name} × {item.quantity}</span>
                                        <span>{formatPrice(item.total)}</span>
                                    </div>
                                ))}
                            </div>

                            {expandedOrder === order.id && (
                                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)', fontSize: 'var(--font-sm)' }}>
                                    <div><strong>📍 Address:</strong> {order.delivery_address}</div>
                                    {order.delivery_landmark && <div><strong>Landmark:</strong> {order.delivery_landmark}</div>}
                                    {order.notes && <div><strong>Notes:</strong> {order.notes}</div>}
                                </div>
                            )}

                            {STORE_ACTIONS[order.status] && (
                                <div className="order-actions">
                                    <button
                                        className="btn btn-sm w-full"
                                        style={{ background: STORE_ACTIONS[order.status].color, color: 'white' }}
                                        onClick={() => updateStatus(order.id, STORE_ACTIONS[order.status].next)}
                                    >
                                        {STORE_ACTIONS[order.status].label} →
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
