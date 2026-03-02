'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users');
        }
        setLoading(false);
    }

    async function handleRoleChange(userId, newRole) {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update user role');
        }
    }

    async function handleToggleStatus(userId, currentStatus) {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_active: !currentStatus } : u
            ));
        } catch (error) {
            console.error('Error toggling exact:', error);
            alert('Failed to toggle user status');
        }
    }

    const ROLE_BADGES = {
        admin: 'badge-error',
        customer: 'badge-success',
        store_staff: 'badge-warning',
        delivery_partner: 'badge-info',
    };

    return (
        <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
                <h1>User Management</h1>
                <button className="btn btn-outline btn-sm" onClick={loadUsers} disabled={loading}>
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center" style={{ padding: 'var(--space-12)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.6 }}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{user.full_name || '—'}</div>
                                    </td>
                                    <td className="text-secondary">{user.email || '—'}</td>
                                    <td>{user.phone || '—'}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-light)',
                                                fontSize: '14px',
                                                background: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="store_staff">Store Staff</option>
                                            <option value="delivery_partner">Delivery Partner</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-secondary text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: user.is_active ? 'var(--error)' : 'var(--success)' }}
                                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-secondary" style={{ padding: 'var(--space-6)' }}>
                                        No users found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
