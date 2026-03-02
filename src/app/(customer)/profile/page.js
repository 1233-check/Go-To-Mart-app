'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCartItemCount, getCart } from '@/lib/cart';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [cartItemCount, setCartItemCount] = useState(0);

    // Edit states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);

    // Form states
    const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', email: '' });
    const [addressForm, setAddressForm] = useState({ label: '', full_address: '', landmark: '' });

    useEffect(() => {
        setCartItemCount(getCartItemCount(getCart()));

        const handleCartUpdate = () => setCartItemCount(getCartItemCount(getCart()));
        window.addEventListener('cart-updated', handleCartUpdate);

        loadData();

        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            setUser(user);

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setProfileForm({
                    full_name: profileData.full_name || '',
                    phone: profileData.phone || '',
                    email: profileData.email || user.email || ''
                });
            }

            // Fetch addresses
            const { data: addressesData } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (addressesData) {
                setAddresses(addressesData);
            }

        } catch (error) {
            console.error('Error loading profile:', error);
        }
        setLoading(false);
    }

    async function handleUpdateProfile(e) {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profileForm.full_name,
                    phone: profileForm.phone,
                })
                .eq('id', user.id);

            if (error) throw error;

            setProfile({ ...profile, full_name: profileForm.full_name, phone: profileForm.phone });
            setIsEditingProfile(false);
        } catch (error) {
            alert('Error updating profile');
            console.error(error);
        }
    }

    async function handleAddAddress(e) {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('addresses')
                .insert({
                    user_id: user.id,
                    label: addressForm.label || 'Home',
                    full_address: addressForm.full_address,
                    landmark: addressForm.landmark,
                })
                .select()
                .single();

            if (error) throw error;

            setAddresses([data, ...addresses]);
            setIsAddingAddress(false);
            setAddressForm({ label: '', full_address: '', landmark: '' });
        } catch (error) {
            alert('Error adding address');
            console.error(error);
        }
    }

    async function handleDeleteAddress(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) return;
        
        try {
            const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId);

            if (error) throw error;

            setAddresses(addresses.filter(a => a.id !== addressId));
        } catch (error) {
            alert('Error deleting address');
            console.error(error);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/';
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div className="app-header">
                <h1>My Profile</h1>
                <div />
            </div>

            <div style={{ padding: 'var(--space-4)' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : !user ? (
                    <div className="text-center" style={{ padding: 'var(--space-8) 0', background: 'white', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>👤</div>
                        <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Welcome to Go To Mart</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-sm)' }}>
                            Login to view your profile, manage addresses, and track orders.
                        </p>
                        <Link href="/login" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                            Login / Sign Up
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        
                        {/* Profile Section */}
                        <div className="card" style={{ padding: 'var(--space-4)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                                <h2 style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>Personal Details</h2>
                                {!isEditingProfile && (
                                    <button 
                                        onClick={() => setIsEditingProfile(true)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {isEditingProfile ? (
                                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    <div className="input-group">
                                        <label>Full Name</label>
                                        <input className="input" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Phone Number</label>
                                        <input className="input" type="tel" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} required />
                                    </div>
                                    <div className="flex gap-2" style={{ marginTop: 'var(--space-2)' }}>
                                        <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-secondary)' }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                    </div>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Full Name</div>
                                        <div style={{ fontWeight: 500 }}>{profile?.full_name || 'Not provided'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Phone Number</div>
                                        <div style={{ fontWeight: 500 }}>{profile?.phone || 'Not provided'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Email</div>
                                        <div style={{ fontWeight: 500 }}>{user.email || 'Not provided'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Addresses Section */}
                        <div className="card" style={{ padding: 'var(--space-4)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
                                <h2 style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>Saved Addresses</h2>
                                {!isAddingAddress && (
                                    <button 
                                        onClick={() => setIsAddingAddress(true)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        + Add New
                                    </button>
                                )}
                            </div>

                            {isAddingAddress && (
                                <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                                    <div className="input-group">
                                        <label>Save as (Home, Work, etc)</label>
                                        <input className="input" value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} placeholder="e.g. Home" required />
                                    </div>
                                    <div className="input-group">
                                        <label>Complete Address</label>
                                        <textarea className="input" value={addressForm.full_address} onChange={e => setAddressForm({...addressForm, full_address: e.target.value})} required rows={3} style={{ resize: 'vertical' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>Landmark (Optional)</label>
                                        <input className="input" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2" style={{ marginTop: 'var(--space-2)' }}>
                                        <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-secondary)' }} onClick={() => setIsAddingAddress(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Address</button>
                                    </div>
                                </form>
                            )}

                            {addresses.length === 0 && !isAddingAddress ? (
                                <div className="text-center" style={{ padding: 'var(--space-4) 0', color: 'var(--text-secondary)' }}>
                                    <p>No saved addresses.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                    {addresses.map((addr) => (
                                        <div key={addr.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-1)' }}>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📍</span> {addr.label}
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--error)', padding: '4px' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', paddingLeft: '28px' }}>
                                                {addr.full_address}
                                            </div>
                                            {addr.landmark && (
                                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', paddingLeft: '28px', marginTop: '4px', fontStyle: 'italic' }}>
                                                    Landmark: {addr.landmark}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Logout Section */}
                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <button 
                                onClick={handleLogout}
                                className="btn w-full" 
                                style={{ background: '#ffeeee', color: 'var(--error)', border: '1px solid #ffcccc' }}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="customer-bottom-nav">
                <Link href="/">
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
                <Link href="/profile" className="active">
                    <span className="nav-icon">👤</span>
                    Profile
                </Link>
            </nav>
        </div>
    );
}
