// src/haptics.ts — centralized haptics feedback
//
// v4.4 — добавлены тематические сигналы выполнения для каждого режима
// интерфейса. Каждый режим имеет свой "голос" тактильной обратной связи:
//
//   focus     → Selection (мягкий тик)
//   aurora    → Success notification (плавный всплеск)
//   neon      → Impact Heavy (резкий бздынь)
//   paper     → Selection (мягкий тик, как карандаш по бумаге)
//   quest     → Impact Medium + Success (двойной удар как "achievement unlocked")
//   cosmic    → Success (звёздный всплеск)
//   mono      → Impact Light (строгий короткий тик)
//   synthwave → Impact Rigid (электрический бздынь 80-х)
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

export async function impactRigid(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); } catch {}
}

export async function impactSoft(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft); } catch {}
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

// ── v4.4 — Mode-specific "achievement" haptics ─────────────────────────────
// Вызывается при завершении задачи, тренировки, достижении цели и т.д.
// Каждый режим имеет свой паттерн обратной связи, соответствующий его характеру.
export async function modeAchievement(uiMode: string): Promise<void> {
  try {
    switch (uiMode) {
      case 'focus':
        // Спокойный Selection — как отметка галочки в блокноте
        await selection();
        break;
      case 'aurora':
        // Плавный Success — как мягкий всплеск света
        await notifySuccess();
        break;
      case 'neon':
        // Резкий Impact Heavy — как бздынь неона
        await impactHeavy();
        break;
      case 'paper':
        // Мягкий Selection — как роспись пером
        await selection();
        break;
      case 'quest':
        // Двойной удар: Impact Medium + Success — как "achievement unlocked"
        await impactMedium();
        setTimeout(() => notifySuccess().catch(() => {}), 150);
        break;
      case 'cosmic':
        // Успех — как вспышка сверхновой
        await notifySuccess();
        break;
      case 'mono':
        // Строгий короткий Impact Light — как удар по клавише печатной машинки
        await impactLight();
        break;
      case 'synthwave':
        // Impact Rigid — как электрический синтезатор 80-х
        await impactRigid();
        break;
      default:
        await selection();
    }
  } catch {}
}

// ── Mode-specific "tap" haptics ─────────────────────────────────────────────
// Лёгкая обратная связь при тапах в каждом режиме.
export async function modeTap(uiMode: string): Promise<void> {
  try {
    switch (uiMode) {
      case 'neon':
      case 'synthwave':
        // Резкие режимы → резкий отклик
        await impactLight();
        break;
      case 'quest':
      case 'cosmic':
        // Игровые/космические → мягкий impact
        await impactSoft();
        break;
      case 'focus':
      case 'aurora':
      case 'paper':
      case 'mono':
      default:
        // Спокойные → selection
        await selection();
        break;
    }
  } catch {}
}
