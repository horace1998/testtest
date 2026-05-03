import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useLockBodyScroll from '@/lib/useLockBodyScroll';

/**
 * ModalPortal — renders children into document.body so they escape
 * any transformed ancestor (e.g. PageTransition's motion.div) and
 * `position: fixed` is anchored to the actual viewport.
 *
 * When `lockScroll` is true (default), background page scroll is locked.
 */
export default function ModalPortal({ children, lockScroll = true }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useLockBodyScroll(!!lockScroll);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
