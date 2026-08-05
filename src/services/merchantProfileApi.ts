/**
 * Merchant bio + intro video API.
 *
 * The codebase calls fetch inline, but these six endpoints share multipart
 * handling, upload progress and error shaping — duplicating that across
 * components would be worse than one small module.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface IntroVideo {
  id: number;
  title: string | null;
  caption: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  // Owner-only fields
  file_size_bytes?: number | null;
  video_format?: string | null;
  mime_type?: string | null;
  duration_verified?: boolean;
  status?: 'processing' | 'ready' | 'failed';
  failure_reason?: string | null;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  moderation_notes?: string | null;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IntroVideoLimits {
  max_size_bytes: number;
  max_size_mb: number;
  max_duration_seconds: number;
  allowed_extensions: string[];
  max_title_chars: number;
  max_caption_chars: number;
}

export interface BioFields {
  bio: string | null;
  bio_link: string | null;
  bio_link_label: string | null;
}

/** Server defaults, replaced by the values the profile endpoint reports. */
export const DEFAULT_INTRO_VIDEO_LIMITS: IntroVideoLimits = {
  max_size_bytes: 50 * 1024 * 1024,
  max_size_mb: 50,
  max_duration_seconds: 60,
  allowed_extensions: ['mov', 'mp4'],
  max_title_chars: 120,
  max_caption_chars: 500
};

export const BIO_MAX_CHARS = 250;
export const BIO_MAX_LINES = 5;
export const BIO_LINK_LABEL_MAX_CHARS = 60;

const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`
});

/** Turn the backend's {error, details} shape into one readable sentence. */
const readError = async (res: Response, fallback: string): Promise<string> => {
  const body = await res.json().catch(() => null);
  if (!body) return fallback;
  const base: string = body.error || body.message || fallback;
  if (!body.details) return base;
  if (typeof body.details === 'string') return `${base}: ${body.details}`;
  const parts = Object.values(body.details as Record<string, string[] | string>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]));
  return parts.length ? parts.join(' ') : base;
};

export async function updateBio(fields: Partial<BioFields>): Promise<BioFields> {
  const res = await fetch(`${API_BASE_URL}/api/merchants/profile`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  if (!res.ok) throw new Error(await readError(res, 'Failed to update bio'));
  const data = await res.json();
  return data.profile as BioFields;
}

export async function fetchIntroVideo(): Promise<{
  introVideo: IntroVideo | null;
  limits: IntroVideoLimits;
}> {
  const res = await fetch(`${API_BASE_URL}/api/merchants/profile/intro-video`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(await readError(res, 'Failed to load intro video'));
  const data = await res.json();
  return {
    introVideo: data.intro_video ?? null,
    limits: data.limits ?? DEFAULT_INTRO_VIDEO_LIMITS
  };
}

interface UploadArgs {
  file: File;
  title?: string;
  caption?: string;
  durationSeconds?: number | null;
  onProgress?: (percent: number) => void;
}

/**
 * XHR rather than fetch: fetch cannot report upload progress, and a 50MB
 * upload with no progress bar reads as a hung page.
 */
function uploadVideo(url: string, method: 'POST' | 'PUT', args: UploadArgs): Promise<IntroVideo> {
  const { file, title, caption, durationSeconds, onProgress } = args;

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('video', file);
    if (title !== undefined) form.append('title', title);
    if (caption !== undefined) form.append('caption', caption);
    if (durationSeconds != null && Number.isFinite(durationSeconds)) {
      form.append('duration_seconds', String(Math.round(durationSeconds)));
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: Record<string, unknown> | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((body?.intro_video ?? null) as IntroVideo);
        return;
      }
      const details = body?.details;
      let message = (body?.error as string) || (body?.message as string) || 'Upload failed';
      if (details && typeof details === 'object') {
        const parts = Object.values(details as Record<string, string[] | string>)
          .flatMap((value) => (Array.isArray(value) ? value : [value]));
        if (parts.length) message = parts.join(' ');
      } else if (typeof details === 'string') {
        message = `${message}: ${details}`;
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error('Network error while uploading the video.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.send(form);
  });
}

export function createIntroVideo(args: UploadArgs): Promise<IntroVideo> {
  return uploadVideo(`${API_BASE_URL}/api/merchants/profile/intro-video`, 'POST', args);
}

export function replaceIntroVideoFile(args: UploadArgs): Promise<IntroVideo> {
  return uploadVideo(`${API_BASE_URL}/api/merchants/profile/intro-video/file`, 'PUT', args);
}

export async function updateIntroVideoMetadata(fields: {
  title?: string;
  caption?: string;
  is_active?: boolean;
}): Promise<IntroVideo> {
  const res = await fetch(`${API_BASE_URL}/api/merchants/profile/intro-video`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  if (!res.ok) throw new Error(await readError(res, 'Failed to update intro video'));
  const data = await res.json();
  return data.intro_video as IntroVideo;
}

export async function deleteIntroVideo(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/merchants/profile/intro-video`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(await readError(res, 'Failed to delete intro video'));
}

/**
 * Read duration and dimensions from the file before uploading, so the merchant
 * gets an instant "too long" instead of waiting out a 50MB upload. The server
 * re-checks with ffprobe when it can — this is a courtesy, not the guard.
 */
export function readVideoMetadata(
  file: File
): Promise<{ duration: number | null; width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const done = (result: { duration: number | null; width: number | null; height: number | null }) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };

    video.onloadedmetadata = () => {
      done({
        duration: Number.isFinite(video.duration) ? video.duration : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null
      });
    };
    // A codec the browser cannot decode still uploads fine (the server only
    // checks the container), so resolve with nulls rather than rejecting.
    video.onerror = () => done({ duration: null, width: null, height: null });

    video.src = url;
  });
}
