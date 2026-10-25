import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import api from '../../api';

export default function Profile({ user, fetchUser }: { user: any, fetchUser: () => void }) {
  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  const handleEmailSave = async () => {
    setEmailSaving(true);
    setEmailError('');
    setEmailSuccess('');
    try {
      const res = await api.put('/api/auth/me', { email });
      // The API returns a new token if the email changes successfully
      localStorage.setItem('token', res.data.access_token);
      setEmailSuccess('Profile updated successfully.');
      fetchUser(); // Reload the context user
    } catch (err: any) {
      setEmailError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="tenants-view">
      <header className="page-header">
        <h1>Profile Management</h1>
      </header>

      <div style={{display: 'flex', flexDirection: 'column', gap: 30, maxWidth: 600}}>
        
        {/* Profile Information Section */}
        <div className="wizard-container" style={{padding: 30}}>
          <h3>Profile Information</h3>
          <p className="text-secondary" style={{marginBottom: 20}}>Update your account information.</p>
          
          {emailError && <div className="error-alert">{emailError}</div>}
          {emailSuccess && <div className="success-alert" style={{color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, padding: '10px 15px', backgroundColor: '#10b98122', borderRadius: 4}}><CheckCircle size={16} /> {emailSuccess}</div>}

          <div className="input-group">
            <label>Role</label>
            <input value={user.role} disabled style={{backgroundColor: '#f5f5f5', color: '#666'}} />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div style={{marginTop: 20}}>
            <button className="btn-primary" onClick={handleEmailSave} disabled={emailSaving || email === user.email}>
              {emailSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="wizard-container" style={{padding: 30}}>
          <h3>Change Password</h3>
          <p className="text-secondary" style={{marginBottom: 20}}>Ensure your account is using a long, random password to stay secure.</p>
          
          {passwordError && <div className="error-alert">{passwordError}</div>}
          {passwordSuccess && <div className="success-alert" style={{color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, padding: '10px 15px', backgroundColor: '#10b98122', borderRadius: 4}}><CheckCircle size={16} /> {passwordSuccess}</div>}

          <div className="input-group">
            <label>Current Password</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                type={showCurrent ? 'text' : 'password'} 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                style={{flex: 1, paddingRight: 40}}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>New Password</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                type={showNew ? 'text' : 'password'} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                style={{flex: 1, paddingRight: 40}}
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Confirm New Password</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <input 
                type={showConfirm ? 'text' : 'password'} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                style={{flex: 1, paddingRight: 40}}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{marginTop: 20}}>
            <button className="btn-primary" onClick={handlePasswordSave} disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : <><Save size={16} /> Update Password</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
