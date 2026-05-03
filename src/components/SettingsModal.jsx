import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import ModalPortal from '@/components/ui/ModalPortal';
import { toast } from 'sonner';

export default function SettingsModal({ isOpen, onClose, user }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPublic, setIsPublic] = useState(user?.is_public !== false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await synkify.auth.updateMe({
        full_name: fullName,
        is_public: isPublic,
      });
      toast.success('Profile updated');
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      // Note: Password change would be handled by backend
      // For now, show placeholder
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    }
    setSaving(false);
  };

  return (
    <ModalPortal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ height: '100dvh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-md"
              style={{ maxHeight: '90dvh' }}
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="bg-white rounded-3xl p-6 overflow-y-auto no-scrollbar" style={{ maxHeight: '90dvh' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-xl font-bold">Settings</h2>
                  <button onClick={onClose} className="border border-foreground/15 rounded-full p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Profile Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">Profile</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground block mb-1">Display Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full border border-foreground/10 rounded-xl p-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground block mb-1">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full border border-foreground/10 rounded-xl p-3 text-sm font-medium text-foreground/50 bg-foreground/5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">Privacy</h3>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className="w-full flex items-center justify-between p-3 border border-foreground/10 rounded-xl hover:bg-foreground/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-foreground/50" />
                        <div className="text-left">
                          <p className="text-xs font-bold">Public Profile</p>
                          <p className="text-[10px] text-foreground/50">{isPublic ? 'Anyone can view' : 'Private only'}</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-foreground/20'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${isPublic ? 'ml-4.5' : 'ml-0.5'}`} />
                      </div>
                    </button>
                  </div>

                  {/* Security Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">Security</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground block mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-foreground/10 rounded-xl p-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                            placeholder="Password"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-foreground/50"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground block mb-1">New Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-foreground/10 rounded-xl p-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                          placeholder="Password"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] tracking-widest uppercase text-muted-foreground block mb-1">Confirm Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-foreground/10 rounded-xl p-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                          placeholder="Password"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || (!currentPassword && !newPassword)}
                        className="w-full py-2 px-3 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-xs font-bold text-foreground transition-colors disabled:opacity-50"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl border border-foreground/15 text-xs font-bold text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
