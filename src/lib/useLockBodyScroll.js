import { useEffect } from 'react';

/**
 * useLockBodyScroll — when `locked` is true, prevents background page
 * scrolling (including overscroll/elastic bounce on iOS) while a modal
 * is open. Restores previous styles on cleanup.
 */
export default function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement: html } = document;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
      scrollY: window.scrollY,
    };
    body.style.position = 'fixed';
    body.style.top = `-${prev.scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      html.style.overflow = prev.htmlOverflow;
      window.scrollTo(0, prev.scrollY);
    };
  }, [locked]);
}