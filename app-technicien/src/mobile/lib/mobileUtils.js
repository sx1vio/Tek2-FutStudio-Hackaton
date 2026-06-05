export const severityMeta = {
  critique: {
    label: 'Critical',
    shortLabel: 'Urgent',
    hint: 'Total Failure',
    icon: 'report',
    textClass: 'text-error',
    bgClass: 'bg-error-container',
    pillClass: 'bg-error-container text-on-error-container'
  },
  urgent: {
    label: 'Urgent',
    shortLabel: 'Urgent',
    hint: 'Limited Ops',
    icon: 'warning',
    textClass: 'text-[#9e3d00]',
    bgClass: 'bg-[#ffeadb]',
    pillClass: 'bg-error-container text-on-error-container'
  },
  modere: {
    label: 'Moderate',
    shortLabel: 'Normal',
    hint: 'Efficiency Loss',
    icon: 'error_outline',
    textClass: 'text-[#6b5900]',
    bgClass: 'bg-[#fff5cc]',
    pillClass: 'bg-surface-variant text-on-surface-variant'
  },
  mineur: {
    label: 'Minor',
    shortLabel: 'Normal',
    hint: 'Noise/Vibration',
    icon: 'info',
    textClass: 'text-primary',
    bgClass: 'bg-primary-fixed',
    pillClass: 'bg-surface-variant text-on-surface-variant'
  }
};

export function formatTime(value) {
  if (!value) return 'Just now';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getDiagnosticFromDetail(detail) {
  if (!detail?.diagnostic?.resultat_json) return null;
  try {
    return JSON.parse(detail.diagnostic.resultat_json);
  } catch {
    return null;
  }
}

export function isUrgent(severity) {
  return ['critique', 'urgent'].includes(severity);
}
