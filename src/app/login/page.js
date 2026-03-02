'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const [mode, setMode] = useState('login'); // login | signup
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'customer',
    });

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: {
                            full_name: form.fullName,
                            phone: form.phone,
                            role: form.role,
                        },
                    },
                });
                if (error) throw error;
                alert('Account created! You can now log in.');
                setMode('login');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });
                if (error) throw error;

                // Redirect based on role
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    const role = profile?.role || 'customer';
                    const routes = {
                        admin: '/admin',
                        store_staff: '/store',
                        delivery_partner: '/delivery',
                        customer: '/',
                    };
                    router.push(routes[role] || redirect);
                }
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary-gradient)',
            padding: 'var(--space-4)',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-8)',
                boxShadow: 'var(--shadow-xl)',
            }}>
                {/* Logo */}
                <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🛵</div>
                    <h1 style={{ fontWeight: 800, fontSize: 'var(--font-2xl)', color: 'var(--primary)' }}>Go To Mart</h1>
                    <p className="text-sm text-secondary">Fast • Fresh • Everyday Essentials</p>
                </div>

                {/* Toggle */}
                <div className="flex" style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                    <button
                        onClick={() => setMode('login')}
                        style={{
                            flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                            fontSize: 'var(--font-sm)', transition: 'all 0.2s',
                            background: mode === 'login' ? 'var(--bg-primary)' : 'transparent',
                            boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                            color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        style={{
                            flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                            fontSize: 'var(--font-sm)', transition: 'all 0.2s',
                            background: mode === 'signup' ? 'var(--bg-primary)' : 'transparent',
                            boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
                            color: mode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: '#ffebee', color: 'var(--error)', padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-sm)',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <>
                            <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Full Name</label>
                                <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" required />
                            </div>
                            <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Phone</label>
                                <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
                            </div>
                        </>
                    )}

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label>Email</label>
                        <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                        <label>Password</label>
                        <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" minLength={6} required />
                    </div>

                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : (mode === 'login' ? 'Log In' : 'Create Account')}
                    </button>
                </form>

                {/* Quick Access Links */}
                <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)' }}>
                    <p className="text-xs text-secondary text-center" style={{ marginBottom: 'var(--space-2)' }}>Quick Access (no login required)</p>
                    <div className="flex gap-2">
                        <Link href="/" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 'var(--font-xs)' }}>🛒 Shop</Link>
                        <Link href="/admin" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 'var(--font-xs)' }}>📊 Admin</Link>
                        <Link href="/store" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 'var(--font-xs)' }}>🏪 Store</Link>
                        <Link href="/delivery" className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 'var(--font-xs)' }}>🛵 Delivery</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
