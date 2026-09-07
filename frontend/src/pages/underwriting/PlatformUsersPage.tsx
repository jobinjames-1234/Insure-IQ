import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Search, Shield, ShieldAlert, Ban, CheckCircle2 } from 'lucide-react';

interface PlatformUser {
  id: string;
  email: string;
  is_active: boolean;
  tenant_id: string | null;
  role: string;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/console/users')
      .then((res: any) => {
        setUsers(res.data);
      })
      .catch((err: any) => {
        console.error('Failed to fetch platform users:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (selectedUser) {
    return (
      <div className="flex flex-col h-full bg-background font-body text-on-surface">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div>
            <button onClick={() => setSelectedUser(null)} className="text-text-secondary hover:text-on-surface mb-2 text-sm font-medium transition-colors flex items-center gap-1">
              &larr; Back to Users
            </button>
            <h1 className="font-h2 text-h2 text-on-background">User Details</h1>
            <p className="text-body text-text-secondary mt-1">{selectedUser.email}</p>
          </div>
          <div>
             {selectedUser.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-success/10 text-success border border-success/20">
                  <CheckCircle2 className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium bg-danger/10 text-danger border border-danger/20">
                  <Ban className="w-4 h-4" /> Inactive
                </span>
              )}
          </div>
        </div>
        <div className="p-6 flex-1 overflow-auto space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surface border border-outline-variant rounded-xl p-6">
              <h3 className="font-h3 text-h3 mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Email Address</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Role</p>
                  <p className="font-medium capitalize flex items-center gap-2">
                    {selectedUser.role === 'superadmin' ? <ShieldAlert className="h-4 w-4 text-danger" /> : <Shield className="h-4 w-4 text-warning" />}
                    {selectedUser.role}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Tenant ID</p>
                  <p className="font-medium font-mono-data">{selectedUser.tenant_id || 'Global (No Tenant)'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">User ID</p>
                  <p className="font-medium font-mono-data text-sm">{selectedUser.id}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-outline-variant rounded-xl p-6">
              <h3 className="font-h3 text-h3 mb-4">Recent Activity (Logs)</h3>
              <div className="space-y-3">
                {/* Mock logs since we don't have a user specific log endpoint yet */}
                <div className="p-3 border border-outline-variant rounded-lg flex justify-between items-center bg-surface-container/30">
                  <div>
                    <p className="font-medium text-sm">Logged In</p>
                    <p className="text-xs text-text-secondary">IP: 192.168.1.1</p>
                  </div>
                  <span className="text-xs text-text-secondary">2 hours ago</span>
                </div>
                <div className="p-3 border border-outline-variant rounded-lg flex justify-between items-center bg-surface-container/30">
                  <div>
                    <p className="font-medium text-sm">Updated Profile</p>
                    <p className="text-xs text-text-secondary">Changed notification settings</p>
                  </div>
                  <span className="text-xs text-text-secondary">1 day ago</span>
                </div>
                <div className="p-3 border border-outline-variant rounded-lg flex justify-between items-center bg-surface-container/30">
                  <div>
                    <p className="font-medium text-sm">Password Reset</p>
                    <p className="text-xs text-text-secondary">Requested via email</p>
                  </div>
                  <span className="text-xs text-text-secondary">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-body text-on-surface">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-h2 text-h2 text-on-background">Platform Users</h1>
          <p className="text-body text-text-secondary mt-1">Manage all users across the Insure-IQ platform.</p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search users by email or role..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body"
            />
          </div>
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'superadmin', 'admin', 'agent', 'underwriter', 'adjuster', 'customer'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                  roleFilter === role 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-surface text-text-secondary border-outline-variant hover:bg-surface-container'
                }`}
              >
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="p-4 font-caption font-semibold text-text-secondary">Email</th>
                <th className="p-4 font-caption font-semibold text-text-secondary">Role</th>
                <th className="p-4 font-caption font-semibold text-text-secondary">Tenant ID</th>
                <th className="p-4 font-caption font-semibold text-text-secondary">Status</th>
                <th className="p-4 font-caption font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary animate-pulse">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-surface-container/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {user.email.substring(0, 2)}
                        </div>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'superadmin' ? (
                          <ShieldAlert className="h-4 w-4 text-danger" />
                        ) : user.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-warning" />
                        ) : (
                          <Users className="h-4 w-4 text-text-secondary" />
                        )}
                        <span className="capitalize text-sm">{user.role}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary text-sm font-mono-data">
                      {user.tenant_id ? user.tenant_id.substring(0, 8) + '...' : 'Global'}
                    </td>
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                          <Ban className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
