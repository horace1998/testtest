import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import ThreeBackground from '@/components/ThreeBackground';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingIdol from '@/components/onboarding/OnboardingIdol';
import OnboardingGoal from '@/components/onboarding/OnboardingGoal';
import { synkify } from '@/api/synkifyClient';
import { format } from 'date-fns';

export default function Onboarding() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState(0);
  const [idolData, setIdolData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleIdolSelect = (data) => {
    setIdolData(data);
    setPhase(2);
  };

  const handleGoalComplete = async (goalData) => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError('');

    try {
      // Save profile first so app-level routing can leave onboarding immediately after success.
      await synkify.auth.updateMe({
        onboarded: true,
        favorite_idol: goalData.idol_name,
        favorite_group: goalData.idol_group,
      });

      await synkify.entities.Goal.create({
        ...goalData,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active',
        progress: 0,
        daily_checkins: [],
      });

      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      window.location.replace('/');
    } catch (error) {
      console.error('Onboarding save failed:', error);
      setSaveError(error.message || 'Could not finish onboarding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeBackground />
      <AnimatePresence mode="wait">
        {phase === 0 && <OnboardingWelcome key="welcome" onNext={() => setPhase(1)} />}
        {phase === 1 && (
          <OnboardingIdol
            key="idol"
            onNext={handleIdolSelect}
            onBack={() => setPhase(0)}
          />
        )}
        {phase === 2 && idolData && (
          <OnboardingGoal
            key="goal"
            idolData={idolData}
            onComplete={handleGoalComplete}
            onBack={() => setPhase(1)}
            isSaving={isSaving}
            error={saveError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
