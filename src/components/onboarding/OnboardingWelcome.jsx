import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import { Fingerprint } from 'lucide-react';

export default function OnboardingWelcome({ onNext }) {
  const [scanning, setScanning] = React.useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onNext();
    }, 1800);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="mb-8"
      >
        <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground">
          SYNKIFY
        </h1>
        <motion.div
          className="h-1 w-16 mx-auto mt-3 rounded-full bg-gradient-to-r from-violet-400 to-pink-300"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
      </motion.div>

      <motion.p
        className="text-muted-foreground text-base font-light max-w-xs mb-12 leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Set goals inspired by your favorite idols. 
        Grow stronger every day before you meet them.
      </motion.p>

      <motion.div
        className="relative mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          className="w-28 h-28 rounded-full glass-strong flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleScan}
          animate={scanning ? {
            boxShadow: [
              '0 0 0 0 rgba(196, 181, 253, 0)',
              '0 0 0 20px rgba(196, 181, 253, 0.2)',
              '0 0 0 40px rgba(196, 181, 253, 0)',
            ]
          } : {}}
          transition={scanning ? { duration: 1.5, repeat: Infinity } : { type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Fingerprint 
            className={`w-12 h-12 transition-colors duration-500 ${scanning ? 'text-violet-500' : 'text-muted-foreground'}`}
          />
        </motion.div>
        {scanning && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-300"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </motion.div>

      <motion.p
        className="text-xs text-muted-foreground/60 tracking-widest uppercase font-heading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Touch to enter your station
      </motion.p>
    </motion.div>
  );
}