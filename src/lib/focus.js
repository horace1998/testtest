/**
 * Helpers for the user's focus (group + optional bias).
 * - subject: who/what the pledge is addressed to. Bias if set, else the group.
 * - hasFocus: did the user pick a group yet?
 */
export function getFocusSubject(user) {
  if (!user) return '';
  return user.favorite_idol?.trim() || user.favorite_group?.trim() || '';
}

export function hasFocus(user) {
  return !!(user?.favorite_group);
}