import { useEffect, useRef, useState } from 'react';
import {
  VideoCameraIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  createIntroVideo,
  deleteIntroVideo,
  fetchIntroVideo,
  readVideoMetadata,
  replaceIntroVideoFile,
  updateIntroVideoMetadata,
  DEFAULT_INTRO_VIDEO_LIMITS,
  type IntroVideo,
  type IntroVideoLimits
} from '../../../services/merchantProfileApi';

const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds && seconds !== 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const formatSize = (bytes: number | null | undefined) => {
  if (!bytes) return null;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const IntroVideoSection = () => {
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<IntroVideo | null>(null);
  const [limits, setLimits] = useState<IntroVideoLimits>(DEFAULT_INTRO_VIDEO_LIMITS);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Distinguishes "upload a first video" from "replace the existing one".
  const replaceModeRef = useRef(false);

  const load = async () => {
    try {
      const { introVideo, limits: serverLimits } = await fetchIntroVideo();
      setVideo(introVideo);
      setLimits(serverLimits);
      setTitle(introVideo?.title ?? '');
      setCaption(introVideo?.caption ?? '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load intro video');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = async (file: File): Promise<{ ok: boolean; duration: number | null }> => {
    const extension = file.name.includes('.')
      ? file.name.split('.').pop()!.toLowerCase()
      : '';
    if (!limits.allowed_extensions.includes(extension)) {
      toast.error(
        `Unsupported format. Use ${limits.allowed_extensions
          .map((e) => e.toUpperCase())
          .join(' or ')}.`
      );
      return { ok: false, duration: null };
    }
    if (file.size === 0) {
      toast.error('That file is empty.');
      return { ok: false, duration: null };
    }
    if (file.size > limits.max_size_bytes) {
      toast.error(
        `Video must be under ${limits.max_size_mb}MB (this one is ${formatSize(file.size)}).`
      );
      return { ok: false, duration: null };
    }

    const { duration } = await readVideoMetadata(file);
    if (duration != null && duration > limits.max_duration_seconds + 0.5) {
      toast.error(
        `Video must be ${limits.max_duration_seconds} seconds or shorter (this one is ${Math.round(
          duration
        )}s).`
      );
      return { ok: false, duration };
    }
    return { ok: true, duration };
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file still fires onChange.
    event.target.value = '';
    if (!file) return;

    const isReplace = replaceModeRef.current;
    replaceModeRef.current = false;

    const { ok, duration } = await validateFile(file);
    if (!ok) return;

    setUploading(true);
    setProgress(0);
    const toastId = toast.loading(isReplace ? 'Replacing video…' : 'Uploading video…');
    try {
      const args = {
        file,
        durationSeconds: duration,
        onProgress: setProgress
      };
      const saved = isReplace
        ? await replaceIntroVideoFile(args)
        : await createIntroVideo(args);
      setVideo(saved);
      setTitle(saved.title ?? '');
      setCaption(saved.caption ?? '');
      toast.success(isReplace ? 'Intro video replaced' : 'Intro video uploaded', { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const openFilePicker = (replace: boolean) => {
    replaceModeRef.current = replace;
    fileInputRef.current?.click();
  };

  const handleSaveMeta = async () => {
    setBusy(true);
    try {
      const saved = await updateIntroVideoMetadata({ title: title.trim(), caption: caption.trim() });
      setVideo(saved);
      setEditingMeta(false);
      toast.success('Details updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update details');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!video) return;
    setBusy(true);
    try {
      const saved = await updateIntroVideoMetadata({ is_active: !video.is_active });
      setVideo(saved);
      toast.success(saved.is_active ? 'Video is now visible' : 'Video hidden from your profile');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update visibility');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteIntroVideo();
      setVideo(null);
      setTitle('');
      setCaption('');
      setConfirmingDelete(false);
      toast.success('Intro video deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete the video');
    } finally {
      setBusy(false);
    }
  };

  const acceptAttr = limits.allowed_extensions.map((e) => `.${e}`).join(',');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 sm:p-8">
        <div className="flex items-center space-x-2 mb-2">
          <VideoCameraIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-semibold text-gray-900">Intro Video</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          A short video introducing yourself and your business, shown on your public
          profile. {limits.allowed_extensions.map((e) => e.toUpperCase()).join(' or ')}, up to{' '}
          {limits.max_size_mb}MB and {limits.max_duration_seconds} seconds.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleFileSelected}
          className="hidden"
        />

        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : uploading ? (
          <div className="border border-gray-200 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Keep this page open until the upload finishes.
            </p>
          </div>
        ) : !video ? (
          <button
            onClick={() => openFilePicker(false)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50/40 transition-colors"
          >
            <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-gray-400" />
            <span className="mt-3 block text-sm font-medium text-gray-900">
              Upload your intro video
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              {limits.allowed_extensions.map((e) => e.toUpperCase()).join(' or ')} · max{' '}
              {limits.max_size_mb}MB · max {limits.max_duration_seconds}s
            </span>
          </button>
        ) : (
          <div className="space-y-6">
            {video.status === 'failed' && (
              <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">Processing failed</p>
                  <p className="text-sm">
                    {video.failure_reason || 'Please try uploading the video again.'}
                  </p>
                </div>
              </div>
            )}
            {video.moderation_status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
                Awaiting review. Your video goes live on your public profile once approved.
              </div>
            )}
            {video.moderation_status === 'rejected' && (
              <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">Not approved</p>
                  <p className="text-sm">
                    {video.moderation_notes ||
                      'This video was not approved. Please upload a different one.'}
                  </p>
                </div>
              </div>
            )}
            {video.is_active === false && (
              <div className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-3 rounded text-sm">
                Hidden — shoppers cannot see this video right now.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {video.video_url ? (
                  <video
                    src={video.video_url}
                    poster={video.thumbnail_url ?? undefined}
                    controls
                    playsInline
                    // preload="metadata" so opening the page does not pull the
                    // whole file on a mobile connection.
                    preload="metadata"
                    className="w-full max-h-96 rounded-lg bg-black object-contain"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                    Video is still processing…
                  </div>
                )}
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  {formatDuration(video.duration_seconds) && (
                    <div>
                      <dt className="inline font-medium">Length: </dt>
                      <dd className="inline">
                        {formatDuration(video.duration_seconds)}
                        {video.duration_verified === false ? ' (approx.)' : ''}
                      </dd>
                    </div>
                  )}
                  {formatSize(video.file_size_bytes) && (
                    <div>
                      <dt className="inline font-medium">Size: </dt>
                      <dd className="inline">{formatSize(video.file_size_bytes)}</dd>
                    </div>
                  )}
                  {video.resolution && (
                    <div>
                      <dt className="inline font-medium">Resolution: </dt>
                      <dd className="inline">{video.resolution}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    maxLength={limits.max_title_chars}
                    disabled={!editingMeta || busy}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Meet the maker"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                  <textarea
                    value={caption}
                    rows={3}
                    maxLength={limits.max_caption_chars}
                    disabled={!editingMeta || busy}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="A 40-second hello from our workshop."
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {editingMeta && (
                    <p className="mt-1 text-right text-xs text-gray-500">
                      {caption.length}/{limits.max_caption_chars}
                    </p>
                  )}
                </div>
                {editingMeta ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTitle(video.title ?? '');
                        setCaption(video.caption ?? '');
                        setEditingMeta(false);
                      }}
                      disabled={busy}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMeta}
                      disabled={busy}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : 'Save details'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingMeta(true)}
                    className="px-4 py-2 border border-primary-500 text-sm font-medium rounded-md text-primary-500 hover:bg-primary-50"
                  >
                    Edit details
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => openFilePicker(true)}
                disabled={busy}
                className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Replace video
              </button>
              <button
                onClick={handleToggleVisibility}
                disabled={busy}
                className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {video.is_active ? (
                  <>
                    <EyeSlashIcon className="w-4 h-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <EyeIcon className="w-4 h-4" />
                    Show
                  </>
                )}
              </button>
              {confirmingDelete ? (
                <div className="inline-flex items-center gap-2">
                  <span className="text-sm text-gray-700">Delete this video?</span>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                    className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroVideoSection;
