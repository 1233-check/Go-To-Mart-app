'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/orders', icon: '📋', label: 'Orders' },
    { href: '/admin/products', icon: '📦', label: 'Products' },
    { href: '/admin/categories', icon: '📂', label: 'Categories' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
    { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
];

const STATUS_LABELS = {
    placed: '🟡 Placed',
    confirmed: '🟢 Confirmed',
    packing: '📦 Packing',
    packed: '✅ Packed',
    assigned: '🚴 Assigned',
    picked_up: '🏃 Picked Up',
    in_transit: '🛵 In Transit',
    delivered: '🎉 Delivered',
    cancelled: '❌ Cancelled',
};

export default function AdminDashboard() {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, revenue: 0, products: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();

        const channel = supabase
            .channel('admin-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadDashboard())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function loadDashboard() {
        try {
            const [ordersRes, productsRes] = await Promise.all([
                supabase.from('orders').select('*').order('created_at', { ascending: false }),
                supabase.from('products').select('id', { count: 'exact' }),
            ]);

            const orders = ordersRes.data || [];
            const activeStatuses = ['placed', 'confirmed', 'packing', 'packed', 'assigned', 'picked_up', 'in_transit'];
            const deliveredOrders = orders.filter(o => o.status === 'delivered');

            setStats({
                totalOrders: orders.length,
                activeOrders: orders.filter(o => activeStatuses.includes(o.status)).length,
                revenue: deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0),
                products: productsRes.count || 0,
            });

            setRecentOrders(orders.slice(0, 10));
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
        setLoading(false);
    }

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">🛵 Go To Mart</div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={pathname === item.href ? 'active' : ''}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Link href="/" style={{ fontSize: 'var(--font-sm)', color: 'rgba(255,255,255,0.5)' }}>
                        ← Back to Store
                    </Link>
                </div>
            </aside>

            {/* Mobile sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn btn-icon"
                style={{
                    position: 'fixed', top: 'var(--space-4)', left: 'var(--space-4)', zIndex: 60,
                    display: 'none', background: 'var(--primary)', color: 'white', fontSize: '1.25rem',
                    width: '44px', height: '44px',
                }}
                id="sidebar-toggle"
            >
                ☰
            </button>
            <style>{`@media(max-width:768px){#sidebar-toggle{display:flex!important;}}`}</style>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-top-bar">
                    <h1>Dashboard</h1>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-success">● Live</span>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                            <div className="stat-card">
                                <div>
                                    <div className="stat-value">{stats.totalOrders}</div>
                                    <div className="stat-label">Total Orders</div>
                                </div>
                                <div className="stat-icon" style={{ background: '#eef0ff', color: 'var(--primary)' }}>📋</div>
                            </div>
                            <div className="stat-card">
                                <div>
                                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.activeOrders}</div>
                                    <div className="stat-label">Active Orders</div>
                                </div>
                                <div className="stat-icon" style={{ background: '#fff3e0', color: 'var(--warning)' }}>⚡</div>
                            </div>
                            <div className="stat-card">
                                <div>
                                    <div className="stat-value" style={{ color: 'var(--success)' }}>{formatPrice(stats.revenue)}</div>
                                    <div className="stat-label">Revenue</div>
                                </div>
                                <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>💰</div>
                            </div>
                            <div className="stat-card">
                                <div>
                                    <div className="stat-value">{stats.products}</div>
                                    <div className="stat-label">Products</div>
                                </div>
                                <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>📦</div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                                <h2 style={{ fontWeight: 700, fontSize: 'var(--font-xl)' }}>Recent Orders</h2>
                                <Link href="/admin/orders" className="btn btn-ghost btn-sm">View All →</Link>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                            <th>Time</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td><strong>{order.order_number}</strong></td>
                                                <td>
                                                    <div>{order.customer_name || 'Guest'}</div>
                                                    <div className="text-xs text-secondary">{order.customer_phone}</div>
                                                </td>
                                                <td><span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                                                <td><strong>{formatPrice(order.total)}</strong></td>
                                                <td className="text-sm text-secondary">
                                                    {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td>
                                                    <Link href={`/admin/orders/${order.id}`} className="btn btn-outline btn-sm">
                                                        Manage
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {recentOrders.length === 0 && (
                                            <tr><td colSpan={6} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>No orders yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
