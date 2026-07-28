import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * Explore Screen (Catalog module — Superadmin)
 * -------------------------------------------------------------
 * Manages the (max 3) banners rendered on the "Explore" screen of
 * the mobile app. Each banner has: image, title, CTA button text,
 * and CTA path. Backed by /api/superadmin/explore-banners.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// The explore screen has three fixed, named banner slots.
type SlotKey = 'hero' | 'spotlight' | 'category';

interface SlotConfig {
  key: SlotKey;
  label: string;
  description: string;
}

const SLOTS: SlotConfig[] = [
  {
    key: 'hero',
    label: 'Hero Banner',
    description: 'Primary banner at the top of the Explore screen.',
  },
  {
    key: 'spotlight',
    label: 'Spotlight Banner',
    description: 'Featured highlight shown below the hero.',
  },
  {
    key: 'category',
    label: 'Category Banner',
    description: 'Category-focused promotional banner.',
  },
];

const DEFAULT_MAX_BANNERS = SLOTS.length;

// --- Banner image spec (must match backend validation) ---
const BANNER_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/webp'];
const BANNER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BANNER_TARGET_W = 1200;
const BANNER_TARGET_H = 600;
const BANNER_ASPECT = 2; // 2:1
const BANNER_ASPECT_TOLERANCE = 0.02;

// Read an image File's natural dimensions.
const readImageSize = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image file.'));
    };
    img.src = url;
  });

// --- TYPES ---
interface Banner {
  id: number;
  slot: SlotKey;
  imageUrl: string;
  title: string;
  ctaText: string;
  ctaPath: string;
  displayOrder: number;
  isActive: boolean;
}

interface BannerForm {
  slot: SlotKey;
  file: File | null; // new image to upload (null when keeping existing)
  imagePreview: string; // preview URL (object URL or existing remote URL)
  title: string;
  ctaText: string;
  ctaPath: string;
}

const emptyForm: BannerForm = {
  slot: 'hero',
  file: null,
  imagePreview: '',
  title: '',
  ctaText: '',
  ctaPath: '',
};

// Map an API banner (snake_case) to the local shape (camelCase).
const mapBanner = (b: any): Banner => ({
  id: b.id,
  slot: b.slot,
  imageUrl: b.image_url,
  title: b.title,
  ctaText: b.cta_text,
  ctaPath: b.cta_path,
  displayOrder: b.display_order ?? 0,
  isActive: b.is_active ?? true,
});

const slotLabel = (key: SlotKey): string =>
  SLOTS.find((s) => s.key === key)?.label ?? key;

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ExploreScreen: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [maxBanners, setMaxBanners] = useState<number>(DEFAULT_MAX_BANNERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;
  const slotsFull = banners.length >= maxBanners;

  // Lookup of the banner occupying each named slot (undefined when empty).
  const bannerBySlot = useMemo(() => {
    const map: Partial<Record<SlotKey, Banner>> = {};
    banners.forEach((b) => {
      map[b.slot] = b;
    });
    return map;
  }, [banners]);

  // --- FETCH ---
  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/explore-banners`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load banners');
      }
      const data = await res.json();
      setBanners((data.banners || []).map(mapBanner));
      if (data.max_banners) setMaxBanners(data.max_banners);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load banners.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- MODAL HELPERS ---
  const openCreate = (slot?: SlotKey) => {
    const targetSlot =
      slot ?? SLOTS.find((s) => !bannerBySlot[s.key])?.key;
    if (!targetSlot) {
      toast.error(`You can only have ${maxBanners} explore banners.`);
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, slot: targetSlot });
    setIsModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      slot: banner.slot,
      file: null,
      imagePreview: banner.imageUrl,
      title: banner.title,
      ctaText: banner.ctaText,
      ctaPath: banner.ctaPath,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!BANNER_ALLOWED_TYPES.includes(file.type)) {
      toast.error('Banner image must be a JPG or WebP file.');
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      toast.error('Banner image must be 5 MB or smaller.');
      return;
    }

    try {
      const { width, height } = await readImageSize(file);
      if (width < BANNER_TARGET_W || height < BANNER_TARGET_H) {
        toast.error(`Banner image must be at least ${BANNER_TARGET_W}×${BANNER_TARGET_H} px.`);
        return;
      }
      if (Math.abs(width / height - BANNER_ASPECT) > BANNER_ASPECT_TOLERANCE) {
        toast.error('Banner image must have a 2:1 aspect ratio (e.g. 1200×600 px).');
        return;
      }
    } catch {
      toast.error('Could not read the image file. Please upload a valid JPG or WebP.');
      return;
    }

    setForm((f) => ({
      ...f,
      file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !form.file) return toast.error('Banner image is required.');
    if (isEditing && !form.file && !form.imagePreview)
      return toast.error('Banner image is required.');
    if (!form.title.trim()) return toast.error('Banner title is required.');
    if (!form.ctaText.trim()) return toast.error('CTA button text is required.');
    if (!form.ctaPath.trim()) return toast.error('CTA path is required.');

    const fd = new FormData();
    if (!isEditing) fd.append('slot', form.slot);
    fd.append('title', form.title.trim());
    fd.append('cta_text', form.ctaText.trim());
    fd.append('cta_path', form.ctaPath.trim());
    if (form.file) fd.append('image', form.file);

    setIsSaving(true);
    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/superadmin/explore-banners/${editingId}`
        : `${API_BASE_URL}/api/superadmin/explore-banners`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders(), // no Content-Type — browser sets the multipart boundary
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save banner');
      }
      const saved = mapBanner(await res.json());
      setBanners((prev) =>
        isEditing
          ? prev.map((b) => (b.id === saved.id ? saved : b))
          : [...prev, saved]
      );
      toast.success(isEditing ? 'Banner updated.' : 'Banner added.');
      closeModal();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/superadmin/explore-banners/${deleteTarget.id}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete banner');
      }
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Banner removed.');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete banner.');
    } finally {
      setDeleting(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="h-7 w-7 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Explore Screen</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage the banners shown on the Explore screen of the mobile app.
            You can add up to {maxBanners} banners.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={slotsFull || isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${
            slotsFull || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          <PlusIcon className="h-5 w-5" />
          Add Banner
        </button>
      </div>

      {/* Slot counter */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm font-medium text-gray-600">Banner slots:</span>
        <div className="flex gap-1.5">
          {SLOTS.map((s) => (
            <span
              key={s.key}
              className={`h-2.5 w-8 rounded-full ${
                bannerBySlot[s.key] ? 'bg-orange-500' : 'bg-orange-100'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-400">
          {banners.length}/{maxBanners} used
        </span>
      </div>

      {/* Body — three fixed, named slots */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SLOTS.map((slotCfg, idx) => {
            const banner = bannerBySlot[slotCfg.key];

            // Empty slot → prompt to add this specific named banner.
            if (!banner) {
              return (
                <button
                  key={slotCfg.key}
                  onClick={() => openCreate(slotCfg.key)}
                  className="border-2 border-dashed border-orange-200 rounded-xl flex flex-col items-center justify-center text-center px-4 py-10 bg-[#fffaf3] hover:bg-[#fff3e6] transition-colors min-h-[260px]"
                >
                  <span className="mb-2 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide">
                    {idx + 1}. {slotCfg.label}
                  </span>
                  <PlusIcon className="h-9 w-9 text-orange-400 mb-2" />
                  <span className="text-sm font-medium text-orange-600">
                    Add {slotCfg.label}
                  </span>
                  <span className="text-xs text-gray-400 mt-1 max-w-[220px]">
                    {slotCfg.description}
                  </span>
                </button>
              );
            }

            // Filled slot → banner card labelled with its named role.
            return (
              <div
                key={slotCfg.key}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[2/1] bg-gray-100">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-semibold uppercase tracking-wide">
                    {idx + 1}. {slotCfg.label}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {banner.title}
                  </h3>

                  {/* CTA preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-medium">
                      <CursorArrowRaysIcon className="h-3.5 w-3.5" />
                      {banner.ctaText}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      → {banner.ctaPath}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(banner)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(banner)}
                      title="Delete banner"
                      className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- CREATE / EDIT MODAL ---------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit' : 'Add'} {slotLabel(form.slot)}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {SLOTS.find((s) => s.key === form.slot)?.description}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Banner Image <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {form.imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[2/1] bg-gray-100">
                    <img
                      src={form.imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Safe zone — keep key content inside the center 85% */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="w-[85%] h-[85%] border-2 border-dashed border-white/80 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]">
                        <span className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/55 text-white text-[10px] font-medium tracking-wide">
                          Safe zone · 85%
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/70"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-orange-200 rounded-xl py-10 flex flex-col items-center justify-center bg-[#fffaf3] hover:bg-[#fff3e6] transition-colors"
                  >
                    <PhotoIcon className="h-10 w-10 text-orange-300 mb-2" />
                    <span className="text-sm font-medium text-orange-600">
                      Click to upload
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      1200 × 600 px (2:1) · JPG or WebP · max 5 MB
                    </span>
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Export at <span className="font-medium text-gray-500">1200 × 600 px</span> (2:1),
                  sRGB JPG/WebP, ≤ 5 MB. Keep logos &amp; text inside the center 85% safe zone.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Collection"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>

              {/* CTA button text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CTA Button Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ctaText: e.target.value }))
                  }
                  placeholder="e.g. Shop Now"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>

              {/* CTA path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CTA Path <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ctaPath}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ctaPath: e.target.value }))
                  }
                  placeholder="e.g. /collections/summer"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Where the CTA button navigates when tapped in the app.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {isSaving && (
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  )}
                  {isEditing ? 'Save Changes' : 'Add Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- DELETE CONFIRMATION ---------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete banner?
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              "{deleteTarget.title}" will be removed from the Explore screen.
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {deleting && (
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreScreen;
