'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

export default function StoreInventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    async function loadInventory() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .order('name', { ascending: true });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error loading inventory:', error);
            alert('Failed to load inventory');
        }
        setLoading(false);
    }

    async function handleToggleStatus(productId, currentStatus) {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.map(p =>
                p.id === productId ? { ...p, is_active: !currentStatus } : p
            ));
        } catch (error) {
            console.error('Error toggling product status:', error);
            alert('Failed to update product status');
        }
    }

    async function handleUpdateStock(productId, newStock) {
        const parsedStock = parseInt(newStock, 10);
        if (isNaN(parsedStock) || parsedStock < 0) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: parsedStock, updated_at: new Date().toISOString() })
                .eq('id', productId);

            if (error) throw error;

            setProducts(products.map(p =>
                p.id === productId ? { ...p, stock_quantity: parsedStock } : p
            ));
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock quantity');
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Header */}
            <div className="app-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 0 }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h1>📦 Inventory Management</h1>
                    <button className="btn btn-outline btn-sm" onClick={loadInventory} disabled={loading} style={{ background: 'white' }}>
                        ↻ Refresh
                    </button>
                </div>

                {/* Internal Nav */}
                <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid var(--border-light)' }}>
                    <Link href="/store" style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textDecoration: 'none'
                    }}>
                        Orders
                    </Link>
                    <Link href="/store/inventory" style={{
                        padding: 'var(--space-3) var(--space-4)',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        borderBottom: '3px solid var(--primary)',
                        textDecoration: 'none'
                    }}>
                        Inventory
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
                        <table className="table" style={{ width: '100%', minWidth: '800px', margin: 0 }}>
                            <thead style={{ background: 'var(--bg-secondary)' }}>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock Qty</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} style={{ opacity: product.is_active ? 1 : 0.6 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', background: 'var(--border-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.unit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-secondary">{product.categories?.name || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>{formatPrice(product.price)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ padding: '4px 8px', fontSize: '16px', background: 'var(--bg-secondary)' }}
                                                    onClick={() => handleUpdateStock(product.id, Math.max(0, product.stock_quantity - 1))}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={product.stock_quantity || 0}
                                                    onChange={(e) => handleUpdateStock(product.id, e.target.value)}
                                                    style={{
                                                        width: '60px',
                                                        padding: '4px 8px',
                                                        textAlign: 'center',
                                                        border: '1px solid var(--border-light)',
                                                        borderRadius: '4px',
                                                        MozAppearance: 'textfield'
                                                    }}
                                                />
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ padding: '4px 8px', fontSize: '16px', background: 'var(--bg-secondary)' }}
                                                    onClick={() => handleUpdateStock(product.id, product.stock_quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${product.is_active ? 'badge-success' : 'badge-error'}`}>
                                                {product.is_active ? 'In Stock' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleStatus(product.id, product.is_active)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: product.is_active ? 'var(--warning)' : 'var(--success)' }}
                                            >
                                                {product.is_active ? 'Hide' : 'Show'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>
                                            No products found in the database.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
