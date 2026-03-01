'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCart, addToCart, removeFromCart, clearCart, getCartTotal, getCartItemCount, formatPrice } from '@/lib/cart';

export default function CartPage() {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        setCart(getCart());
        const handleCartUpdate = () => setCart(getCart());
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    const subtotal = getCartTotal(cart);
    const deliveryFee = subtotal > 0 ? (subtotal >= 199 ? 0 : 25) : 0;
    const total = subtotal + deliveryFee;

    if (cart.length === 0) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🛒</div>
                <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Your cart is empty</h2>
                <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-6)' }}>Add items from the store to get started</p>
                <Link href="/" className="btn btn-primary">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '140px' }}>
            {/* Header */}
            <div className="app-header">
                <Link href="/" style={{ color: 'white', fontSize: '1.25rem' }}>←</Link>
                <h1>My Cart</h1>
                <button onClick={() => { clearCart(); setCart([]); }} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--font-sm)' }}>Clear</button>
            </div>

            {/* Delivery Banner */}
            <div style={{ background: '#eef7ee', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span>⚡</span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--success)' }}>
                    Delivery in 30 minutes
                </span>
            </div>

            {/* Cart Items */}
            <div style={{ padding: 'var(--space-4)' }}>
                {cart.map((item) => (
                    <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) 0',
                        borderBottom: '1px solid var(--border-light)',
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            flexShrink: 0,
                        }}>
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                            ) : '📦'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', marginBottom: '2px' }}>{item.name}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{item.unit}</div>
                            <div style={{ fontWeight: 700, marginTop: '2px' }}>{formatPrice(item.price * item.quantity)}</div>
                        </div>
                        <div className="qty-control">
                            <button onClick={() => { removeFromCart(item.id); setCart(getCart()); }}>−</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => { addToCart(item); setCart(getCart()); }}>+</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bill Details */}
            <div style={{ padding: 'var(--space-4)', margin: '0 var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', fontSize: 'var(--font-base)' }}>Bill Details</h3>
                <div className="flex justify-between" style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                    <span className="text-secondary">Item total</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                    <span className="text-secondary">Delivery fee</span>
                    <span className="font-medium" style={{ color: deliveryFee === 0 ? 'var(--success)' : undefined }}>
                        {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                </div>
                {subtotal < 199 && subtotal > 0 && (
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--info)', marginBottom: 'var(--space-2)' }}>
                        Add {formatPrice(199 - subtotal)} more for free delivery
                    </div>
                )}
                <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }} className="flex justify-between">
                    <span style={{ fontWeight: 700 }}>Grand Total</span>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>{formatPrice(total)}</span>
                </div>
            </div>

            {/* Checkout Button */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--space-4)', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)', maxWidth: '480px', margin: '0 auto' }}>
                <Link href="/checkout" className="btn btn-success w-full" style={{ justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                    <span>{formatPrice(total)}</span>
                    <span>Proceed to Checkout →</span>
                </Link>
            </div>
        </div>
    );
}
