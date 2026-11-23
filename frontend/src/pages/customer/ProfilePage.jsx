import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { User, Mail, Phone, ShieldCheck, Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching user profile..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      
      <div>
        <h1 className="text-3xl font-black text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage account information & role credentials</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-2xl overflow-hidden border border-sky-200 shadow-sm">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile?.name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-0.5 rounded-full uppercase">
                {profile?.role} Account
              </span>
              {profile?.auth_provider && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-0.5 rounded-full uppercase">
                  {profile.auth_provider} AUTH
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center space-x-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-xs text-gray-400 block font-semibold">Email Address</span>
              <span className="font-bold text-gray-900">{profile?.email}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-xs text-gray-400 block font-semibold">Phone Number</span>
              <span className="font-bold text-gray-900">{profile?.phone || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-xs text-gray-400 block font-semibold">Account Member Since</span>
              <span className="font-bold text-gray-900">{profile?.created_at ? format(new Date(profile.created_at), 'PPP') : 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
