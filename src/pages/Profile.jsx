import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageShell from '@/components/PageShell';
import { LogOut, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BadgeGrid from '@/components/profile/BadgeGrid';
import PhotoWall from '@/components/profile/PhotoWall';
import { evaluateBadges, buildStats } from '@/lib/badges';
import { getFanRank, getRankScore } from '@/lib/fanRank';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postTasks, setPostTasks] = useState({});
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const refreshUser = () => synkify.auth.me().then(setUser);
  useEffect(() => {
    refreshUser();
  }, []);

  const me = queryClient.getQueryData(['me']);
  useEffect(() => {
    if (me) setUser(me);
  }, [me]);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => synkify.entities.Milestone.list('-created_date'),
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['missions'],
    queryFn: () => synkify.entities.Mission.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => synkify.entities.Task.list('-created_date'),
  });

  const totalCheckins = goals.reduce((sum, g) => sum + (g.daily_checkins?.filter(c => c.completed).length || 0), 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const stats = buildStats({ goals, milestones, missions, userEmail: user?.email });
  const badges = evaluateBadges(stats);
  const fanRank = getFanRank(totalCheckins, milestones.length);
  const fanScore = getRankScore(totalCheckins, milestones.length);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      queryClient.clear();
      setUser(null);
      await logout(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#ffffff' }}>
      <PageShell goals={goals} user={user}>
        <div className="relative z-10">
          <div className="px-5 pt-7 relative">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <div
                className="w-32 h-32 rounded-full border-4 border-black overflow-hidden"
                style={{
                  backgroundImage: user.profile_image_url ? `url(${user.profile_image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: user.profile_image_url ? undefined : 'rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="text-center mb-6">
              <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 48, color: '#000', fontWeight: 700, lineHeight: 1, marginBottom: 2 }}>
                {user.full_name || 'Station'}
              </h1>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5">
                <Trophy className="h-3.5 w-3.5" style={{ color: '#1a3aad' }} />
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0d1117' }}>
                  {fanRank.label}
                </span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.42)' }}>
                  {String(fanScore).padStart(3, '0')} pts
                </span>
              </div>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 12 }}>
                @{user.email.split('@')[0]}
              </p>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 16 }}>
                {[
                  { label: 'Followers', value: user.followers?.length || 0 },
                  { label: 'Following', value: user.following?.length || 0 },
                  { label: 'Posts', value: milestones.length },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#000', fontWeight: 600 }}>
                      {String(stat.value).padStart(3, '0')}
                    </p>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(0,0,0,0.7)', lineHeight: 1.6, marginBottom: 16 }}>
                Dedicated K-pop fan on a journey of growth
              </p>
            </div>

            {/* Achievements */}
            <div className="mb-8">
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>
                Achievements
              </p>
              <BadgeGrid badges={badges} />
            </div>

            {/* Gallery with Task Management */}
             <div className="mb-8">
               <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>
                 Posts
               </p>
               {milestones.filter(m => m.asset_url).length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>
                   No posts yet
                 </div>
               ) : (
                 <div className="grid grid-cols-3 gap-1.5">
                   {milestones.filter(m => m.asset_url).map((post) => (
                     <button
                       key={post.id}
                       onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                       className="relative aspect-square rounded-xl overflow-hidden"
                       style={{ background: selectedPost?.id === post.id ? 'rgba(26, 58, 173, 0.2)' : 'rgba(0,0,0,0.03)', border: selectedPost?.id === post.id ? '2px solid #1a3aad' : 'none' }}
                     >
                       <img src={post.asset_url} alt={post.goal_title} className="w-full h-full object-cover" />
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Post Details Panel */}
             {selectedPost && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mb-8 p-4 rounded-2xl"
                 style={{ background: 'rgba(26, 58, 173, 0.08)', border: '1px solid rgba(26, 58, 173, 0.2)' }}
               >
                 <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#1a3aad', marginBottom: 8 }}>
                   POST DETAILS
                 </p>
                 <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, fontWeight: 600, color: '#000', marginBottom: 8 }}>
                   Goal: {selectedPost.goal_title}
                 </p>
                 <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, color: 'rgba(0,0,0,0.6)', marginBottom: 12 }}>
                   {selectedPost.caption || 'No caption'}
                 </p>

                 {/* Link to Task */}
                 <div>
                   <label style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, display: 'block', marginBottom: 8, color: '#000' }}>
                     Link to Task
                   </label>
                   <select
                     onChange={(e) => {
                       if (e.target.value) setPostTasks({ ...postTasks, [selectedPost.id]: e.target.value });
                     }}
                     style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'Space Grotesk, sans-serif', fontSize: 11 }}
                   >
                     <option value="">Select a task...</option>
                     {/* Tasks will be loaded from backend */}
                   </select>
                 </div>
               </motion.div>
             )}

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.2)', color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 700, cursor: isSigningOut ? 'wait' : 'pointer', opacity: isSigningOut ? 0.6 : 1 }}
            >
              <LogOut className="w-4 h-4" /> {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
