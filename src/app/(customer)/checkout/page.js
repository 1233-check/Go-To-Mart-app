'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, getCartTotal, clearCart, formatPrice, generateOrderNumber } from '@/lib/cart';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        landmark: '',
        notes: '',
        paymentMethod: 'cod',
    });

    useEffect(() => {
        const cartData = getCart();
        if (cartData.length === 0) {
            router.push('/');
            return;
        }
        setCart(cartData);

        // Try to load user info
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        name: profile.full_name || '',
                        phone: profile.phone || '',
                    }));
                }
            }
        }
        loadUser();
    }, [router]);

    const subtotal = getCartTotal(cart);
    const deliveryFee = subtotal >= 199 ? 0 : 25;
    const total = subtotal + deliveryFee;

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handlePlaceOrder(e) {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.address) {
            alert('Please fill in all required fields');
            return;
        }
        if (formData.phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const orderNumber = generateOrderNumber();

            // Get current user (optional — guest checkout allowed)
            const { data: { user } } = await supabase.auth.getUser();

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    customer_id: user?.id || null,
                    delivery_address: formData.address,
                    delivery_landmark: formData.landmark,
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    subtotal: subtotal,
                    delivery_fee: deliveryFee,
                    total: total,
                    payment_method: formData.paymentMethod,
                    payment_status: formData.paymentMethod === 'cod' ? 'pending' : 'pending',
                    notes: formData.notes,
                    status: 'placed',
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                product_price: item.price,
                product_image: item.image_url || '',
                quantity: item.quantity,
                total: item.price * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Clear cart & redirect
            clearCart();
            router.push(`/orders/${order.id}?new=true`);

        } catch (err) {
            console.error('Order placement failed:', err);
            alert('Failed to place order. Please try again.');
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
            {/* Header */}
            <div className="app-header">
                <Link href="/cart" style={{ color: 'white', fontSize: '1.25rem' }}>←</Link>
                <h1>Checkout</h1>
                <div />
            </div>

            <form onSubmit={handlePlaceOrder}>
                {/* Delivery Details */}
                <div style={{ padding: 'var(--space-4)' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>📍 Delivery Details</h3>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Full Name *</label>
                        <input className="input" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Phone Number *</label>
                        <input className="input" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Delivery Address *</label>
                        <textarea className="input" name="address" value={formData.address} onChange={handleChange} placeholder="House/Flat no, Street, Area, Dimapur" rows={3} required style={{ resize: 'vertical' }} />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Landmark (Optional)</label>
                        <input className="input" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near temple, opposite school, etc." />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Delivery Notes (Optional)</label>
                        <input className="input" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special instructions" />
                    </div>
                </div>

                {/* Payment Method */}
                <div style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>💳 Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            border: `2px solid ${formData.paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border-light)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            background: formData.paymentMethod === 'cod' ? '#eef0ff' : 'white',
                        }}>
                            <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>💵 Cash on Delivery</div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Pay when your order arrives</div>
                            </div>
                        </label>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                            padding: 'var(--space-3) var(--space-4)',
                            border: `2px solid ${formData.paymentMethod === 'online' ? 'var(--primary)' : 'var(--border-light)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            background: formData.paymentMethod === 'online' ? '#eef0ff' : 'white',
                            opacity: 0.6,
                        }}>
                            <input type="radio" name="paymentMethod" value="online" checked={formData.paymentMethod === 'online'} onChange={handleChange} disabled />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>🔐 Pay Online (Coming Soon)</div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>UPI, Cards, Wallets via Razorpay</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Order Summary */}
                <div style={{ padding: 'var(--space-4)', margin: '0 var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', fontSize: 'var(--font-base)' }}>Order Summary</h3>
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between" style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--font-sm)' }}>
                            <span className="text-secondary">{item.name} × {item.quantity}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <div className="flex justify-between" style={{ fontSize: 'var(--font-sm)', marginBottom: 'var(--space-1)' }}>
                            <span className="text-secondary">Delivery fee</span>
                            <span style={{ color: deliveryFee === 0 ? 'var(--success)' : undefined }}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between" style={{ fontWeight: 800, fontSize: 'var(--font-lg)', marginTop: 'var(--space-2)' }}>
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Place Order Button */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--space-4)', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)', maxWidth: '480px', margin: '0 auto' }}>
                    <button
                        type="submit"
                        className="btn btn-success w-full"
                        disabled={loading}
                        style={{ padding: 'var(--space-4)', fontSize: 'var(--font-lg)' }}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                                Placing Order...
                            </span>
                        ) : (
                            `Place Order • ${formatPrice(total)}`
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
