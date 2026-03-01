'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/cart';

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/orders', icon: '📋', label: 'Orders' },
    { href: '/admin/products', icon: '📦', label: 'Products' },
    { href: '/admin/categories', icon: '📂', label: 'Categories' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState({ name: '', price: '', mrp: '', unit: '1 pc', category_id: '', description: '', stock_quantity: 100 });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [{ data: prods }, { data: cats }] = await Promise.all([
            supabase.from('products').select('*, categories(name, icon)').order('name'),
            supabase.from('categories').select('*').order('sort_order'),
        ]);
        setProducts(prods || []);
        setCategories(cats || []);
        setLoading(false);
    }

    function openAddModal() {
        setEditProduct(null);
        setForm({ name: '', price: '', mrp: '', unit: '1 pc', category_id: categories[0]?.id || '', description: '', stock_quantity: 100 });
        setShowModal(true);
    }

    function openEditModal(product) {
        setEditProduct(product);
        setForm({
            name: product.name,
            price: product.price,
            mrp: product.mrp || '',
            unit: product.unit || '1 pc',
            category_id: product.category_id || '',
            description: product.description || '',
            stock_quantity: product.stock_quantity || 0,
        });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const data = {
            name: form.name,
            price: parseFloat(form.price),
            mrp: form.mrp ? parseFloat(form.mrp) : parseFloat(form.price),
            unit: form.unit,
            category_id: form.category_id || null,
            description: form.description,
            stock_quantity: parseInt(form.stock_quantity),
        };

        if (editProduct) {
            await supabase.from('products').update(data).eq('id', editProduct.id);
        } else {
            await supabase.from('products').insert(data);
        }

        setShowModal(false);
        loadData();
    }

    async function toggleProduct(id, isActive) {
        await supabase.from('products').update({ is_active: !isActive }).eq('id', id);
        loadData();
    }

    async function deleteProduct(id) {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').delete().eq('id', id);
        loadData();
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-logo">🛵 Go To Mart</div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={item.href === '/admin/products' ? 'active' : ''}>
                            <span className="nav-icon">{item.icon}</span>{item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="admin-main">
                <div className="admin-top-bar">
                    <h1>📦 Products</h1>
                    <button className="btn btn-primary" onClick={openAddModal}>+ Add Product</button>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>MRP</th>
                                    <th>Unit</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
                                        <td><strong>{p.name}</strong></td>
                                        <td><span className="badge badge-primary">{p.categories?.icon} {p.categories?.name || '—'}</span></td>
                                        <td><strong>{formatPrice(p.price)}</strong></td>
                                        <td className="text-secondary">{p.mrp ? formatPrice(p.mrp) : '—'}</td>
                                        <td className="text-sm">{p.unit}</td>
                                        <td>
                                            <span className={`badge ${p.stock_quantity > 10 ? 'badge-success' : p.stock_quantity > 0 ? 'badge-warning' : 'badge-error'}`}>
                                                {p.stock_quantity}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`badge ${p.is_active ? 'badge-success' : 'badge-error'}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleProduct(p.id, p.is_active)}
                                            >
                                                {p.is_active ? 'Active' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-outline btn-sm" onClick={() => openEditModal(p)}>Edit</button>
                                                <button className="btn btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteProduct(p.id)}>🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div className="input-group">
                                    <label>Product Name *</label>
                                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                    <div className="input-group">
                                        <label>Price (₹) *</label>
                                        <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label>MRP (₹)</label>
                                        <input className="input" type="number" step="0.01" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                    <div className="input-group">
                                        <label>Unit</label>
                                        <input className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. 1 kg, 500 ml" />
                                    </div>
                                    <div className="input-group">
                                        <label>Stock</label>
                                        <input className="input" type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Category</label>
                                    <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                        <option value="">No category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editProduct ? 'Save Changes' : 'Add Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
