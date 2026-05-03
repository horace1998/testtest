import { synkify } from '@/api/synkifyClient';

/**
 * Moderate a piece of user-generated content.
 * Returns { ok: true } if allowed, or { ok: false, reason } if blocked.
 *
 * kind: 'post' | 'comment' | 'mission'
 */
export async function moderate(text, kind = 'post') {
  try {
    const res = await synkify.functions.invoke('moderateContent', { text, kind });
    if (res?.data?.verdict === 'block') {
    return { ok: false, reason: res.data.reason || "Let's keep it K-pop and supportive." };
    }
    return { ok: true };
  } catch (e) {
    // Fail open
    return { ok: true };
  }
}
