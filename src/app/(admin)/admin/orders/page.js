'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const STATUS_LABELS = {
    placed: '🟡 Placed', confirmed: '🟢 Confirmed', packing: '📦 Packing', packed: '✅ Packed',
    assigned: '🚴 Assigned', picked_up: '🏃 Picked Up', in_transit: '🛵 In Transit',
    delivered: '🎉 Delivered', cancelled: '❌ Cancelled',
};

const NEXT_STATUS = {
    placed: 'confirmed', confirmed: 'packing', packing: 'packed', packed: 'assigned',
    assigned: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered',
};

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/orders', icon: '📋', label: 'Orders' },
    { href: '/admin/products', icon: '📦', label: 'Products' },
    { href: '/admin/categories', icon: '📂', label: 'Categories' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [assignModal, setAssignModal] = useState(null);

    useEffect(() => {
        loadOrders();
        loadDeliveryPartners();

        const channel = supabase
            .channel('admin-all-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function loadOrders() {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false });
            setOrders(data || []);
        } catch (err) {
            console.error('Error:', err);
        }
        setLoading(false);
    }

    async function loadDeliveryPartners() {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'delivery_partner')
            .eq('is_active', true);
        setDeliveryPartners(data || []);
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    }

    async function assignDeliveryPartner(orderId, partnerId) {
        try {
            await supabase
                .from('orders')
                .update({
                    delivery_partner_id: partnerId,
                    status: 'assigned',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);
            setAssignModal(null);
        } catch (err) {
            console.error('Error assigning partner:', err);
        }
    }

    async function cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        await updateOrderStatus(orderId, 'cancelled');
    }

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-logo">🛵 Go To Mart</div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={item.href === '/admin/orders' ? 'active' : ''}>
                            <span className="nav-icon">{item.icon}</span>{item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="admin-main">
                <div className="admin-top-bar">
                    <h1>📋 Orders Management</h1>
                    <span className="badge badge-info">{orders.length} total</span>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap" style={{ marginBottom: 'var(--space-6)' }}>
                    {['all', 'placed', 'confirmed', 'packing', 'packed', 'assigned', 'in_transit', 'delivered', 'cancelled'].map(status => (
                        <button
                            key={status}
                            className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status === 'all' ? '📋 All' : STATUS_LABELS[status]}
                            <span className="badge" style={{ marginLeft: '4px', background: 'rgba(0,0,0,0.1)' }}>
                                {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Address</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Delivery Partner</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <strong>{order.order_number}</strong>
                                            <div className="text-xs text-secondary">
                                                {new Date(order.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-medium">{order.customer_name || 'Guest'}</div>
                                            <div className="text-xs text-secondary">{order.customer_phone}</div>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            <div className="text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {order.delivery_address}
                                            </div>
                                            {order.delivery_landmark && <div className="text-xs text-secondary">📍 {order.delivery_landmark}</div>}
                                        </td>
                                        <td className="text-sm">{order.order_items?.length || 0} items</td>
                                        <td><strong>{formatPrice(order.total)}</strong></td>
                                        <td><span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                                        <td>
                                            {order.delivery_partner_id ? (
                                                <span className="badge badge-success">Assigned</span>
                                            ) : order.status === 'packed' || order.status === 'confirmed' || order.status === 'packing' ? (
                                                <button className="btn btn-outline btn-sm" onClick={() => setAssignModal(order.id)}>
                                                    Assign →
                                                </button>
                                            ) : (
                                                <span className="text-xs text-secondary">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                {NEXT_STATUS[order.status] && order.status !== 'packed' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => updateOrderStatus(order.id, NEXT_STATUS[order.status])}
                                                    >
                                                        → {STATUS_LABELS[NEXT_STATUS[order.status]]?.split(' ').pop()}
                                                    </button>
                                                )}
                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <button className="btn btn-sm" style={{ color: 'var(--error)' }} onClick={() => cancelOrder(order.id)}>
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <tr><td colSpan={8} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>No orders found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Assign Delivery Partner Modal */}
            {assignModal && (
                <div className="modal-overlay" onClick={() => setAssignModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Delivery Partner</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setAssignModal(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {deliveryPartners.length === 0 ? (
                                <p className="text-center text-secondary">No delivery partners available</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {deliveryPartners.map(partner => (
                                        <button
                                            key={partner.id}
                                            className="card"
                                            style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border-light)' }}
                                            onClick={() => assignDeliveryPartner(assignModal, partner.id)}
                                        >
                                            <div className="font-medium">{partner.full_name}</div>
                                            <div className="text-xs text-secondary">{partner.phone}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
