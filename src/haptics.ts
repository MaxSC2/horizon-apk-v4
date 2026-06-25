// src/haptics.ts — centralized haptics feedback
//
// Thin wrapper around expo-haptics that silently no-ops on platforms where
// haptics are unavailable. Import `Haptics` from this module instead of
// calling expo-haptics directly so we have one place to tune the feedback
// patterns.
import * as Haptics from 'expo-haptics';

export async function impactLight(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

export async function impactMedium(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
}

export async function impactHeavy(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
}

export async function notifySuccess(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}

export async function notifyWarning(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
}

export async function notifyError(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
}

export async function selection(): Promise<void> {
  try { await Haptics.selectionAsync(); } catch {}
}

// Convenience bundle for common UI patterns
export const Haptic = {
  tap: selection,
  toggle: impactLight,
  save: notifySuccess,
  delete: impactMedium,
  error: notifyError,
  success: notifySuccess,
  warn: notifyWarning,
};
