import React, { useState } from 'react';
import { Settings, Save, Server, Shield, Mail, Bell } from 'lucide-react';

export default function GlobalSettingsPage() {
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maxTenants: 500,
    ssoEnforced: true,
    supportEmail: 'support@insureiq.app',
    auditRetentionDays: 90
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background font-body text-on-surface">
      <div className="p-6 border-b border-outline-variant flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-h2 text-h2 text-on-background">Global Settings</h1>
          <p className="text-body text-text-secondary mt-1">Configure platform-wide settings and defaults.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-4xl space-y-8">
          
          {/* General Platform Settings */}
          <section className="bg-surface border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Server className="h-5 w-5" />
              </div>
              <h2 className="font-h3 text-h3">Platform Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-on-surface block">Maintenance Mode</label>
                  <span className="text-sm text-text-secondary">Disable access for all non-superadmin users.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger"></div>
                </label>
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-2">Max Global Tenants</label>
                <input 
                  type="number" 
                  value={settings.maxTenants}
                  onChange={(e) => setSettings({...settings, maxTenants: parseInt(e.target.value) || 0})}
                  className="w-full max-w-md px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* Security & Auth */}
          <section className="bg-surface border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="font-h3 text-h3">Security & Auth</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-on-surface block">Enforce SSO Globally</label>
                  <span className="text-sm text-text-secondary">Require all tenants to configure SAML/SSO.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.ssoEnforced}
                    onChange={(e) => setSettings({...settings, ssoEnforced: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-2">Audit Log Retention (Days)</label>
                <input 
                  type="number" 
                  value={settings.auditRetentionDays}
                  onChange={(e) => setSettings({...settings, auditRetentionDays: parseInt(e.target.value) || 0})}
                  className="w-full max-w-md px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* Communication */}
          <section className="bg-surface border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="font-h3 text-h3">Communication Defaults</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="font-medium text-on-surface block mb-2">Global Support Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                  className="w-full max-w-md px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary"
                />
                <p className="text-sm text-text-secondary mt-1">This address receives escalated issues from all tenants.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
