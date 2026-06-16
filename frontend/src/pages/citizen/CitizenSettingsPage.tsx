import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { api, ApiError } from '../../lib/apiClient';
import { KWARA_LGAS } from '../../lib/types';
import {
  User as UserIcon,
  Phone,
  MapPin,
  ChevronDown,
  Lock,
  Save,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export default function CitizenSettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [community, setCommunity] = useState('');
  const [lga, setLga] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Sync state with user profile context
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCommunity(profile.community || '');
      setLga(profile.lga || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast('error', 'Full Name is required.');
      return;
    }
    if (!lga) {
      toast('error', 'LGA is required.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        community: community.trim() || undefined,
        lga: lga,
      });
      toast('success', 'Profile updated successfully!');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update profile. Please try again.';
      toast('error', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('error', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast('error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.post<{ message: string }>(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        { auth: true }
      );
      toast('success', response.message || 'Password changed successfully! Redirecting to login...');
      
      // Log out and redirect after short delay
      setTimeout(async () => {
        await signOut();
        navigate('/citizen/login');
      }, 1500);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change password. Please try again.';
      toast('error', message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-800 text-2xl text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100/50">
            <UserIcon className="w-5 h-5" />
          </span>
          Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and protect your account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-teal-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Update details associated with your user account.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                    placeholder="e.g. 08012345678"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Community Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                    placeholder="e.g. Adewole"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Local Government Area (LGA) *
                </label>
                <div className="relative">
                  <select
                    value={lga}
                    onChange={(e) => setLga(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none"
                  >
                    <option value="" disabled>Select LGA</option>
                    {KWARA_LGAS.map((lgaOption) => (
                      <option key={lgaOption} value={lgaOption}>{lgaOption}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2.5 border border-slate-100 bg-slate-50/50 rounded-xl text-xs text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Role
                </label>
                <div className="h-10 flex items-center">
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200/60 px-3 py-1.5 rounded-full select-none capitalize">
                    {profile?.role || 'Citizen'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-xs font-bold text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
              >
                {savingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Secure your account credentials.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 font-medium"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-xs font-bold text-white rounded-xl disabled:opacity-50 transition-all shadow-md"
                >
                  {savingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="bg-teal-50/30 rounded-2xl border border-teal-100/50 p-4 flex gap-3 text-xs text-teal-800">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Security Notice</p>
              <p className="text-teal-900/80 leading-relaxed">
                Changing your password will automatically sign you out of this and all other active devices. You will be redirected to log back in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
