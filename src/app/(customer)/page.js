'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { addToCart, removeFromCart, getCart, getItemQuantity, getCartTotal, getCartItemCount, formatPrice } from '@/lib/cart';

export default function CustomerHome() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        setCart(getCart());

        const handleCartUpdate = () => setCart(getCart());
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, searchQuery]);

    async function loadData() {
        setLoading(true);
        try {
            const { data: cats } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');
            setCategories(cats || []);

            const { data: prods } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('name');
            setProducts(prods || []);
        } catch (err) {
            console.error('Error loading data:', err);
        }
        setLoading(false);
    }

    async function loadProducts() {
        try {
            let query = supabase
                .from('products')
                .select('*')
                .eq('is_active', true);

            if (selectedCategory) {
                query = query.eq('category_id', selectedCategory);
            }

            if (searchQuery.trim()) {
                query = query.ilike('name', `%${searchQuery.trim()}%`);
            }

            const { data } = await query.order('name');
            setProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
        }
    }

    function handleAddToCart(product) {
        addToCart(product);
        setCart(getCart());
    }

    function handleRemoveFromCart(productId) {
        removeFromCart(productId);
        setCart(getCart());
    }

    const cartItemCount = getCartItemCount(cart);
    const cartTotal = getCartTotal(cart);

    return (
        <div className="customer-content">
            {/* Header */}
            <header className="customer-header">
                <div className="header-top">
                    <div className="delivery-info">
                        <div>
                            <div className="delivery-badge">⚡ Delivery in 30 min</div>
                            <div className="location">📍 Dimapur, Nagaland</div>
                        </div>
                    </div>
                    <Link href="/profile" style={{ color: 'white', fontSize: '1.5rem' }}>👤</Link>
                </div>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search for groceries, snacks, drinks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            paddingLeft: '44px',
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            backdropFilter: 'blur(10px)',
                        }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
                </div>
            </header>

            {/* Hero Banner */}
            {!selectedCategory && !searchQuery && (
                <div style={{
                    background: 'var(--primary-gradient)',
                    margin: 'var(--space-4)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-6)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                            Go To Mart
                        </h2>
                        <p style={{ fontSize: 'var(--font-sm)', opacity: 0.9, marginBottom: 'var(--space-1)' }}>
                            Fast • Fresh • Everyday Essentials
                        </p>
                        <p style={{ fontSize: 'var(--font-xs)', opacity: 0.7 }}>
                            Delivering across Dimapur in 30 minutes
                        </p>
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: '-20px',
                        bottom: '-10px',
                        fontSize: '5rem',
                        opacity: 0.2,
                    }}>🛵</div>
                </div>
            )}

            {/* Categories */}
            {!searchQuery && (
                <div style={{ padding: '0 var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                        <h3 style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>
                            {selectedCategory ? 'Categories' : 'Shop by Category'}
                        </h3>
                        {selectedCategory && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setSelectedCategory(null)}
                            >
                                ← All
                            </button>
                        )}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: 'var(--space-3)',
                    }}>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="category-card"
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                style={{
                                    borderColor: selectedCategory === cat.id ? 'var(--primary)' : undefined,
                                    background: selectedCategory === cat.id ? '#eef0ff' : undefined,
                                }}
                            >
                                <div className="cat-icon">{cat.icon}</div>
                                <div className="cat-name">{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results Header */}
            {searchQuery && (
                <div style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
                    <div className="flex items-center justify-between">
                        <h3 style={{ fontWeight: 700 }}>
                            Results for &quot;{searchQuery}&quot;
                        </h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSearchQuery('')}>✕ Clear</button>
                    </div>
                    <p className="text-sm text-secondary">{products.length} products found</p>
                </div>
            )}

            {/* Products Grid */}
            <div style={{ padding: 'var(--space-4)' }}>
                {!searchQuery && !selectedCategory && (
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)' }}>
                        Popular Products
                    </h3>
                )}
                {selectedCategory && (
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--font-lg)', marginBottom: 'var(--space-3)' }}>
                        {categories.find(c => c.id === selectedCategory)?.name || 'Products'}
                    </h3>
                )}

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="product-card">
                                <div className="skeleton" style={{ width: '100%', aspectRatio: 1 }} />
                                <div className="product-info">
                                    <div className="skeleton" style={{ width: '80%', height: '14px' }} />
                                    <div className="skeleton" style={{ width: '50%', height: '12px' }} />
                                    <div className="skeleton" style={{ width: '40%', height: '18px', marginTop: '8px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</div>
                        <p style={{ fontWeight: 600 }}>No products found</p>
                        <p className="text-sm">Try a different search or category</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                        {products.map((product) => {
                            const qty = getItemQuantity(cart, product.id);
                            const hasDiscount = product.mrp && product.mrp > product.price;
                            const discountPct = hasDiscount ? Math.round((1 - product.price / product.mrp) * 100) : 0;

                            return (
                                <div key={product.id} className="product-card">
                                    {hasDiscount && discountPct > 0 && (
                                        <div className="discount-badge">{discountPct}% OFF</div>
                                    )}
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        background: 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '3rem',
                                        padding: 'var(--space-3)',
                                    }}>
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="product-image"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <span>{categories.find(c => c.id === product.category_id)?.icon || '📦'}</span>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-unit">{product.unit}</div>
                                        <div className="product-price-row">
                                            <div>
                                                <span className="product-price">{formatPrice(product.price)}</span>
                                                {hasDiscount && (
                                                    <span className="product-mrp">{formatPrice(product.mrp)}</span>
                                                )}
                                            </div>
                                            {qty === 0 ? (
                                                <button
                                                    className="add-btn"
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    ADD
                                                </button>
                                            ) : (
                                                <div className="qty-control">
                                                    <button onClick={() => handleRemoveFromCart(product.id)}>−</button>
                                                    <span>{qty}</span>
                                                    <button onClick={() => handleAddToCart(product)}>+</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Cart Bar */}
            {cartItemCount > 0 && (
                <Link href="/cart" style={{ textDecoration: 'none' }}>
                    <div className="cart-bar">
                        <div className="cart-info">
                            <span className="cart-items-count">{cartItemCount} item{cartItemCount > 1 ? 's' : ''}</span>
                            <span className="cart-total">{formatPrice(cartTotal)}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ fontWeight: 700 }}>
                            View Cart →
                        </div>
                    </div>
                </Link>
            )}

            {/* Bottom Navigation */}
            <nav className="customer-bottom-nav">
                <Link href="/" className="active">
                    <span className="nav-icon">🏠</span>
                    Home
                </Link>
                <Link href="/">
                    <span className="nav-icon">📂</span>
                    Categories
                </Link>
                <Link href="/cart" style={{ position: 'relative' }}>
                    <span className="nav-icon">🛒</span>
                    Cart
                    {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                </Link>
                <Link href="/orders">
                    <span className="nav-icon">📋</span>
                    Orders
                </Link>
                <Link href="/profile">
                    <span className="nav-icon">👤</span>
                    Profile
                </Link>
            </nav>
        </div>
    );
}
