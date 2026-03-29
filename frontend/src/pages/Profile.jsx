import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import api, { API_URL } from '../services/api';
import { User, Mail, Lock, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Required'),
  newPassword: z.string().min(6, 'Must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Profile = () => {
  const { user, updateUserContext } = useAuth();
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [avatarMsg, setAvatarMsg] = useState({ type: '', text: '' });
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: errorsP, isSubmitting: isSubP } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email }
  });

  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: errorsV, isSubmitting: isSubV } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onProfileSubmit = async (data) => {
    try {
      setProfileMsg({ type: '', text: '' });
      const res = await api.put('/users/profile', data);
      updateUserContext(res.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setAvatarLoading(true);
      const res = await api.put('/users/profile/avatar', formData);
      updateUserContext(res.data);
      setAvatarMsg({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Avatar upload failed' });
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const onPassSubmit = async (data) => {
    try {
      setPassMsg({ type: '', text: '' });
      await api.put('/users/profile/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setPassMsg({ type: 'success', text: 'Password changed successfully!' });
      resetPass();
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Change failed' });
    }
  };

  const avatarUrl = user?.avatar ? `${API_URL}${user.avatar}` : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 flex items-end space-x-5 mb-8">
            <div className="relative">
              <input
                id="profile-avatar-upload"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={onAvatarChange}
              />
              <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-xl overflow-hidden">
                <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-4xl overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
              <label
                htmlFor="profile-avatar-upload"
                className={`absolute bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all border-4 border-white cursor-pointer ${
                  avatarLoading ? 'pointer-events-none opacity-70' : ''
                }`}
              >
                <Camera size={18} />
              </label>
            </div>
            <div className="pb-2">
              <h2 className="text-3xl font-black text-gray-900 leading-tight">{user?.name}</h2>
              <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">{user?.role} ACCOUNT</p>
              {avatarMsg.text && (
                <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
                  avatarMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {avatarMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{avatarMsg.text}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Info Form */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-50">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <User size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>
              
              {profileMsg.text && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-sm font-bold">{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...regProfile('name')}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                  </div>
                  {errorsP.name && <p className="mt-1 text-xs text-red-600 font-bold ml-1">{errorsP.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...regProfile('email')}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                  </div>
                  {errorsP.email && <p className="mt-1 text-xs text-red-600 font-bold ml-1">{errorsP.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubP}
                  className="w-full bg-blue-600 text-white rounded-2xl py-3.5 font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isSubP ? 'Saving Changes...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-50">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Security & Password</h3>
              </div>

              {passMsg.text && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${passMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {passMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-sm font-bold">{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePass(onPassSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...regPass('currentPassword')}
                      type="password"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {errorsV.currentPassword && <p className="mt-1 text-xs text-red-600 font-bold ml-1">{errorsV.currentPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...regPass('newPassword')}
                      type="password"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  {errorsV.newPassword && <p className="mt-1 text-xs text-red-600 font-bold ml-1">{errorsV.newPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...regPass('confirmPassword')}
                      type="password"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {errorsV.confirmPassword && <p className="mt-1 text-xs text-red-600 font-bold ml-1">{errorsV.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubV}
                  className="w-full bg-indigo-600 text-white rounded-2xl py-3.5 font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isSubV ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
