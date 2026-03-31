export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateRequired(value: string, fieldLabel: string): ValidationResult {
  if (value.trim().length === 0) return { ok: false, message: `${fieldLabel} is required.` };
  return { ok: true };
}

export function validateMaxLength(value: string, max: number, fieldLabel: string): ValidationResult {
  if (value.length > max) return { ok: false, message: `${fieldLabel} must be ${max} characters or less.` };
  return { ok: true };
}

export function validateFileSize(file: File, maxBytes: number): ValidationResult {
  if (file.size > maxBytes) {
    const mb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return { ok: false, message: `File is too large. Max size is ${mb} MB.` };
  }
  return { ok: true };
}

export function validateFileExtension(file: File, allowed: string[]): ValidationResult {
  const name = file.name || '';
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx >= 0 ? name.slice(dotIdx).toLowerCase() : '';
  if (!allowed.map((x) => x.toLowerCase()).includes(ext)) {
    return { ok: false, message: `Unsupported file type. Allowed: ${allowed.join(', ')}` };
  }
  return { ok: true };
}

