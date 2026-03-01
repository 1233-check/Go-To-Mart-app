'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const STATUS_FLOW = ['placed', 'confirmed', 'packing', 'packed', 'assigned', 'picked_up', 'in_transit', 'delivered'];

const STATUS_INFO = {
    placed: { icon: '🟡', label: 'Order Placed', desc: 'We\'ve received your order' },
    confirmed: { icon: '🟢', label: 'Confirmed', desc: 'Your order has been confirmed' },
    packing: { icon: '📦', label: 'Packing', desc: 'Your items are being packed' },
    packed: { icon: '✅', label: 'Packed & Ready', desc: 'Waiting for delivery partner' },
    assigned: { icon: '🚴', label: 'Rider Assigned', desc: 'Delivery partner is coming to pick up' },
    picked_up: { icon: '🏃', label: 'Picked Up', desc: 'Your order is with the rider' },
    in_transit: { icon: '🛵', label: 'On the Way!', desc: 'Your order is on its way to you' },
    delivered: { icon: '🎉', label: 'Delivered', desc: 'Enjoy your items!' },
    cancelled: { icon: '❌', label: 'Cancelled', desc: 'This order was cancelled' },
};

export default function OrderDetailPage() {
    const params = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();

        // Real-time updates
        const channel = supabase
            .channel(`order-${params.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` },
                (payload) => setOrder(prev => ({ ...prev, ...payload.new }))
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [params.id]);

    async function loadOrder() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (err) {
            console.error('Error loading order:', err);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <h2>Order not found</h2>
                <Link href="/orders" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Orders</Link>
            </div>
        );
    }

    const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
    const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.placed;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-8)' }}>
            {/* Header */}
            <div className="app-header">
                <Link href="/orders" style={{ color: 'white', fontSize: '1.25rem' }}>←</Link>
                <h1>{order.order_number}</h1>
                <div />
            </div>

            {/* Status Banner */}
            <div style={{
                background: order.status === 'delivered' ? 'var(--success-light)' : order.status === 'cancelled' ? '#ffebee' : '#eef0ff',
                padding: 'var(--space-6) var(--space-4)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>{statusInfo.icon}</div>
                <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-1)' }}>{statusInfo.label}</h2>
                <p className="text-sm text-secondary">{statusInfo.desc}</p>
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--primary)', marginTop: 'var(--space-2)', fontWeight: 600 }}>
                        ⏱️ Estimated: {order.estimated_delivery || '30-45 mins'}
                    </p>
                )}
            </div>

            {/* Order Timeline */}
            {order.status !== 'cancelled' && (
                <div className="delivery-timeline" style={{ margin: 'var(--space-4)' }}>
                    {STATUS_FLOW.map((status, index) => {
                        const info = STATUS_INFO[status];
                        const isCompleted = index < currentStatusIndex;
                        const isActive = index === currentStatusIndex;
                        const isFuture = index > currentStatusIndex;

                        return (
                            <div key={status} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                <div className="timeline-dot">
                                    {isCompleted ? '✓' : isActive ? info.icon : (index + 1)}
                                </div>
                                <div className="timeline-content">
                                    <h4 style={{ opacity: isFuture ? 0.4 : 1 }}>{info.label}</h4>
                                    <p style={{ opacity: isFuture ? 0.3 : 0.7 }}>{info.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delivery Address */}
            <div style={{ padding: 'var(--space-4)', margin: '0 var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: 'var(--font-base)' }}>📍 Delivery Address</h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{order.delivery_address}</p>
                {order.delivery_landmark && (
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                        Landmark: {order.delivery_landmark}
                    </p>
                )}
            </div>

            {/* Order Items */}
            <div style={{ padding: 'var(--space-4)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', fontSize: 'var(--font-base)' }}>🛒 Order Items</h3>
                {order.order_items?.map((item) => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                        padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)',
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0,
                        }}>📦</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{item.product_name}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Qty: {item.quantity} × {formatPrice(item.product_price)}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{formatPrice(item.total)}</div>
                    </div>
                ))}
            </div>

            {/* Bill */}
            <div style={{ padding: 'var(--space-4)', margin: '0 var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <div className="flex justify-between text-sm" style={{ marginBottom: 'var(--space-1)' }}>
                    <span className="text-secondary">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ marginBottom: 'var(--space-1)' }}>
                    <span className="text-secondary">Delivery</span>
                    <span style={{ color: order.delivery_fee == 0 ? 'var(--success)' : undefined }}>{order.delivery_fee == 0 ? 'FREE' : formatPrice(order.delivery_fee)}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }} className="flex justify-between">
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>{formatPrice(order.total)}</span>
                </div>
                <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                    Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'} • {order.payment_status}
                </div>
            </div>
        </div>
    );
}
