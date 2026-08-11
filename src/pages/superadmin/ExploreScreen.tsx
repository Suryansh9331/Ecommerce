import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BookmarkSquareIcon,
  SparklesIcon,
  StarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Banner image spec (must match backend validation) ---
const BANNER_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const BANNER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BANNER_TARGET_W = 1200;
const BANNER_TARGET_H = 600;
const BANNER_ASPECT = 2; // 2:1

// --- Helper Functions ---

const readImageSize = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image file."));
    };
    img.src = url;
  });

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject(new Error("Canvas context is not available."));
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty."));
          return;
        }
        const file = new File([blob], fileName, { type: blob.type });
        resolve(file);
      },
      "image/jpeg",
      0.9
    );
  });
}

// --- TYPES ---
interface BannerItem {
  id: number;
  groupKey: string;
  imageUrl: string;
  title: string;
  ctaText: string;
  ctaPath: string;
  displayOrder: number;
  isActive: boolean;
}

type BannerGroups = Record<string, BannerItem[]>;

interface BannerForm {
  groupKey: string;
  file: File | null;
  imagePreview: string;
  title: string;
  ctaText: string;
  ctaPath: string;
}

const emptyForm: Omit<BannerForm, "groupKey"> = {
  file: null,
  imagePreview: "",
  title: "",
  ctaText: "",
  ctaPath: "",
};

const mapBannerItem = (b: any): BannerItem => ({
  id: b.id,
  groupKey: b.group_key,
  imageUrl: b.image_url,
  title: b.title || "",
  ctaText: b.cta_text || "",
  ctaPath: b.cta_path || "",
  displayOrder: b.display_order ?? 0,
  isActive: b.is_active ?? true,
});

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const GROUP_META: Record<string, { name: string; icon: React.FC<any> }> = {
  hero: { name: "Hero Banner", icon: StarIcon },
  category: { name: "Category Banner", icon: BookmarkSquareIcon },
  spotlight: { name: "Spotlight Banner", icon: SparklesIcon },
};

// --- MAIN COMPONENT ---
const ExploreScreen: React.FC = () => {
  const [bannerGroups, setBannerGroups] = useState<BannerGroups>({});
  const [groupKeys, setGroupKeys] = useState<string[]>([]);
  const [maxItemsPerGroup, setMaxItemsPerGroup] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [isCropping, setIsCropping] = useState(false);
  const [sourceImageForCrop, setSourceImageForCrop] = useState<string | null>(
    null
  );
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const isEditing = editingId !== null;

  const fetchBannerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/superadmin/explore-banners`,
        {
          headers: authHeaders(),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load banner data");
      }
      const data = await res.json();
      const mappedGroups: BannerGroups = {};
      for (const key in data.banner_groups) {
        mappedGroups[key] = data.banner_groups[key].map(mapBannerItem);
      }
      setBannerGroups(mappedGroups);
      setGroupKeys(data.group_keys || []);
      setMaxItemsPerGroup(data.max_items_per_group || 3);
    } catch (e: any) {
      toast.error(e.message || "Failed to load banner data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBannerData();
  }, [fetchBannerData]);

  const openCreate = (groupKey: string) => {
    const items = bannerGroups[groupKey] || [];
    if (items.length >= maxItemsPerGroup) {
      toast.error(`You can only have ${maxItemsPerGroup} items in this group.`);
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, groupKey });
    setIsModalOpen(true);
  };

  const openEdit = (item: BannerItem) => {
    setEditingId(item.id);
    setForm({
      groupKey: item.groupKey,
      file: null,
      imagePreview: item.imageUrl,
      title: item.title,
      ctaText: item.ctaText,
      ctaPath: item.ctaPath,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(null);
    setSourceImageForCrop(null);
    setOriginalFile(null);
    setIsCropping(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (!BANNER_ALLOWED_TYPES.includes(file.type)) {
      toast.error("Image must be a JPG, PNG or WebP file.");
      return;
    }
    if (file.size > BANNER_MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    try {
      const { width, height } = await readImageSize(file);

      // Simple rule: the raw image must already be at least 1200x600.
      // (If it is, the largest possible 2:1 crop from it is mathematically
      // guaranteed to reach 1200x600 too — no extra math needed.)
      if (width < BANNER_TARGET_W || height < BANNER_TARGET_H) {
        toast.error(
          `This image is ${width}×${height}px, but must be at least ${BANNER_TARGET_W}×${BANNER_TARGET_H}px. Please upload a larger image.`
        );
        return;
      }

      const aspectMatches = Math.abs(width / height - BANNER_ASPECT) < 0.01;
      if (aspectMatches) {
        // Already the right ratio — use as-is, no crop needed.
        setForm(
          (f) => f && { ...f, file, imagePreview: URL.createObjectURL(file) }
        );
        return;
      }

      // Big enough but wrong ratio — let the user crop it.
      setOriginalFile(file);
      setSourceImageForCrop(URL.createObjectURL(file));
      setIsCropping(true);
    } catch {
      toast.error("Could not read the image file.");
      return;
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Auto-select the largest possible 2:1 area, centered. Since the source
    // image is already guaranteed >= 1200x600, this default is always valid.
    const crop = centerCrop(
      makeAspectCrop({ unit: "%", width: 100 }, BANNER_ASPECT, width, height),
      width,
      height
    );
    setCrop(crop);
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current || !originalFile) {
      toast.error("Could not process crop. Please try again.");
      return;
    }
    try {
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        originalFile.name
      );
      const { width, height } = await readImageSize(croppedFile);
      if (width < BANNER_TARGET_W || height < BANNER_TARGET_H) {
        toast.error(
          `Selected area is only ${width}×${height}px. Please select a larger crop area (at least ${BANNER_TARGET_W}×${BANNER_TARGET_H}px), or upload a higher-resolution image.`
        );
        return;
      }
      setForm(
        (f) =>
          f && {
            ...f,
            file: croppedFile,
            imagePreview: URL.createObjectURL(croppedFile),
          }
      );
      setIsCropping(false);
      setSourceImageForCrop(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to crop image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!isEditing && !form.file) return toast.error("Image is required.");
    // FIX: Removed validations for title, ctaText, ctaPath - they are now optional

    const fd = new FormData();
    fd.append("group_key", form.groupKey);
    fd.append("title", form.title.trim() || "");
    fd.append("cta_text", form.ctaText.trim() || "");
    fd.append("cta_path", form.ctaPath.trim() || "");
    if (form.file) fd.append("image", form.file);

    setIsSaving(true);
    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/superadmin/explore-banners/${editingId}`
        : `${API_BASE_URL}/api/superadmin/explore-banners`;
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save banner item");
      }
      const saved = mapBannerItem(await res.json());
      setBannerGroups((prev) => {
        const group = prev[saved.groupKey] || [];
        const newGroup = isEditing
          ? group.map((item) => (item.id === saved.id ? saved : item))
          : [...group, saved];
        return { ...prev, [saved.groupKey]: newGroup };
      });
      toast.success(isEditing ? "Banner item updated." : "Banner item added.");
      closeModal();
    } catch (e: any) {
      toast.error(e.message || "Failed to save banner item.");
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
        { method: "DELETE", headers: authHeaders() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete item");
      }
      setBannerGroups((prev) => {
        const group = prev[deleteTarget.groupKey] || [];
        const newGroup = group.filter((item) => item.id !== deleteTarget.id);
        return { ...prev, [deleteTarget.groupKey]: newGroup };
      });
      toast.success("Banner item removed.");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Explore Screen Banners
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the banner carousels for the mobile app's Explore screen.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {(groupKeys.length > 0 ? groupKeys : Object.keys(GROUP_META)).map(
            (key) => (
              <BannerGroupSection
                key={key}
                groupKey={key}
                items={bannerGroups[key] || []}
                maxItems={maxItemsPerGroup}
                onAdd={() => openCreate(key)}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                setBannerGroups={setBannerGroups}
                fetchBannerData={fetchBannerData}
              />
            )
          )}
        </div>
      )}

      {isModalOpen && form && !isCropping && (
        <BannerItemModal
          form={form}
          setForm={setForm}
          isEditing={isEditing}
          isSaving={isSaving}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          handleImageSelect={handleImageSelect}
          fileInputRef={fileInputRef}
        />
      )}

      {isCropping && sourceImageForCrop && (
        <ImageCropModal
          src={sourceImageForCrop}
          crop={crop}
          setCrop={setCrop}
          completedCrop={completedCrop}
          setCompletedCrop={setCompletedCrop}
          imgRef={imgRef}
          onImageLoad={onImageLoad}
          onConfirm={handleConfirmCrop}
          onCancel={closeModal}
          minSize={{ width: BANNER_TARGET_W, height: BANNER_TARGET_H }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          item={deleteTarget}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const BannerGroupSection: React.FC<{
  groupKey: string;
  items: BannerItem[];
  maxItems: number;
  onAdd: () => void;
  onEdit: (item: BannerItem) => void;
  onDelete: (item: BannerItem) => void;
  setBannerGroups: React.Dispatch<React.SetStateAction<BannerGroups>>;
  fetchBannerData: () => Promise<void>;
}> = ({
  groupKey,
  items,
  maxItems,
  onAdd,
  onEdit,
  onDelete,
  setBannerGroups,
  fetchBannerData,
}) => {
  const [isReordering, setIsReordering] = useState(false);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.displayOrder - b.displayOrder),
    [items]
  );
  const slotsFull = items.length >= maxItems;
  const Meta = GROUP_META[groupKey] || { name: groupKey, icon: StarIcon };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sortedItems.length) return;

    const next = [...sortedItems];
    [next[index], next[target]] = [next[target], next[index]];

    const withOrder = next.map((item, i) => ({ ...item, displayOrder: i }));
    setBannerGroups((g) => ({ ...g, [groupKey]: withOrder }));

    setIsReordering(true);
    try {
      await fetch(
        `${API_BASE_URL}/api/superadmin/explore-banners/groups/${groupKey}/order`,
        {
          method: "PUT",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ order: next.map((item) => item.id) }),
        }
      );
    } catch (e: any) {
      toast.error("Failed to reorder. Reverting.");
      fetchBannerData();
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <header className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Meta.icon className="h-6 w-6 text-primary-500" />
            <h2 className="text-lg font-bold text-gray-800">{Meta.name}</h2>
          </div>
          <p className="text-sm text-gray-500 ml-9">
            Add up to {maxItems} images to this carousel.
          </p>
        </div>
        <button
          onClick={onAdd}
          disabled={slotsFull}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm self-start sm:self-center disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-primary-500 text-white hover:bg-primary-600"
        >
          <PlusIcon className="h-5 w-5" /> Add Image
        </button>
      </header>
      <div className="p-4 space-y-4">
        {sortedItems.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl">
            <PhotoIcon className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium text-sm">
              No images in this group yet
            </p>
          </div>
        ) : (
          sortedItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="flex sm:flex-col items-center justify-center gap-2 px-3 py-2 sm:py-4 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-100">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || isReordering}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-gray-700 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                  {idx + 1}
                </span>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === sortedItems.length - 1 || isReordering}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="relative w-full sm:w-48 flex-shrink-0 aspect-[2/1] bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.title || "Banner"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {item.title || "Untitled"}
                </h3>
                <div className="mt-2 flex items-center gap-2 min-w-0">
                  {item.ctaText && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-500 text-white text-xs font-medium flex-shrink-0">
                      <CursorArrowRaysIcon className="h-3.5 w-3.5" />
                      {item.ctaText}
                    </span>
                  )}
                  {item.ctaPath && (
                    <span className="text-xs text-gray-400 truncate">
                      → {item.ctaPath}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col items-center justify-end gap-2 p-3 border-t sm:border-t-0 sm:border-l border-gray-100">
                <button
                  onClick={() => onEdit(item)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const BannerItemModal: React.FC<{
  form: BannerForm;
  setForm: (value: React.SetStateAction<BannerForm | null>) => void;
  isEditing: boolean;
  isSaving: boolean;
  closeModal: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({
  form,
  setForm,
  isEditing,
  isSaving,
  closeModal,
  handleSubmit,
  handleImageSelect,
  fileInputRef,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing
            ? "Edit Banner Item"
            : `Add to ${GROUP_META[form.groupKey]?.name || "Group"}`}
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={BANNER_ALLOWED_TYPES.join(",")}
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
              className="w-full border-2 border-dashed border-primary-200 rounded-xl py-10 flex flex-col items-center justify-center bg-primary-50 hover:bg-primary-50"
            >
              <PhotoIcon className="h-10 w-10 text-primary-300 mb-2" />
              <span className="text-sm font-medium text-primary-600">
                Click to upload
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                1200 × 600 px (2:1) · JPG, PNG, WebP · max 5 MB
              </span>
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, title: e.target.value })
            }
            placeholder="e.g. Summer Collection"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            CTA Button Text{" "}
            <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.ctaText}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, ctaText: e.target.value })
            }
            placeholder="e.g. Shop Now"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            CTA Path{" "}
            <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.ctaPath}
            onChange={(e) =>
              setForm((prev) => prev && { ...prev, ctaPath: e.target.value })
            }
            placeholder="e.g. /collections/summer"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
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
            className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {isSaving && (
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
            )}
            {isEditing ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ImageCropModal: React.FC<{
  src: string;
  crop: Crop | undefined;
  setCrop: (c: Crop) => void;
  completedCrop: PixelCrop | undefined;
  setCompletedCrop: (c: PixelCrop) => void;
  imgRef: React.RefObject<HTMLImageElement>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  minSize: { width: number; height: number };
}> = ({
  src,
  crop,
  setCrop,
  setCompletedCrop,
  imgRef,
  onImageLoad,
  onConfirm,
  onCancel,
  minSize,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Crop Image</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <p className="text-sm text-gray-500 mb-3">
          We've auto-selected the largest 2:1 area for you — drag to reposition,
          or resize (it won't let you go below the required size).
        </p>
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={BANNER_ASPECT}
          minWidth={minSize.width}
          minHeight={minSize.height}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={src}
            onLoad={onImageLoad}
            className="max-h-[60vh]"
          />
        </ReactCrop>
      </div>
      <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 inline-flex items-center gap-2"
        >
          <CheckIcon className="h-5 w-5" />
          Confirm Crop
        </button>
      </div>
    </div>
  </div>
);

const DeleteConfirmationModal: React.FC<{
  item: BannerItem;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ item, deleting, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
          <TrashIcon className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Delete item?</h2>
      </div>
      <p className="text-sm text-gray-500">
        "{item.title || "Untitled"}" will be removed from the carousel. This
        cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
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
);

export default ExploreScreen;