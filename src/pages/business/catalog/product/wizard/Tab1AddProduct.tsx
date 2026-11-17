import React, { useRef, useState } from 'react';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import CategorySelection from '../components/CategorySelection';
import { cloudinaryService } from '../../../../../services/cloudinaryService';
import { MediaItem, WizardFormData } from './types';

type Props = {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardFormData>) => void;
};

const MAX_DESCRIPTION = 1400;
const MIN_IMAGES = 1;
const RECOMMENDED_IMAGES = 4;

const Tab1AddProduct: React.FC<Props> = ({ data, errors, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await cloudinaryService.uploadImage(file, 'products/wizard');
        uploaded.push({
          url: res.secure_url,
          public_id: res.public_id,
          type: 'image',
          sort_order: 0,          // normalize() will overwrite
          is_main_image: false,
          is_thumbnail: false,
        });
      }
      onChange({ media: normalize([...data.media, ...uploaded]) });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Re-apply sort_order + MAIN/thumbnail flags after any mutation so index 0
  // is always the hero image. The backend stores whichever item has
  // is_main_image=true as the primary product image.
  const normalize = (list: MediaItem[]): MediaItem[] =>
    list.map((m, i) => ({
      ...m,
      sort_order: i,
      is_main_image: i === 0,
      is_thumbnail: i === 0,
    }));

  const removeImage = (idx: number) => {
    onChange({ media: normalize(data.media.filter((_, i) => i !== idx)) });
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= data.media.length || from === to) return;
    const next = Array.from(data.media);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ media: normalize(next) });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveImage(result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Category + Brand */}
      <section>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Select Category<span className="text-red-500">*</span>
        </label>
        <CategorySelection
          selectedCategoryId={data.category_id}
          onCategorySelect={(catId) => onChange({ category_id: catId, brand_id: null })}
          selectedBrandId={data.brand_id ?? undefined}
          onBrandSelect={(brandId) => onChange({ brand_id: brandId })}
          errors={errors}
        />
        {errors.category_id && (
          <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
        )}
        {errors.brand_id && (
          <p className="mt-1 text-xs text-red-600">{errors.brand_id}</p>
        )}
      </section>

      {/* Product Images */}
      <section>
        <label className="block text-sm font-semibold text-gray-800">
          Product Image<span className="text-red-500">*</span>
        </label>
        <div className="mt-1 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md px-3 py-2">
          <span className="font-semibold">!</span>
          <span>
            Upload the same product from different angles. Minimum {MIN_IMAGES},
            recommended {RECOMMENDED_IMAGES}+.
          </span>
        </div>

        {data.media.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Drag the <Bars3Icon className="inline h-3 w-3 -mt-0.5" /> handle or use the arrows
            to reorder. The first image is used as the main thumbnail.
          </p>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="wizard-media" direction="horizontal">
            {(dropProvided) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className="mt-3 grid grid-cols-3 xs:grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3"
              >
                {data.media.map((m, idx) => (
                  <Draggable key={m.url} draggableId={m.url} index={idx}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`relative aspect-square sm:w-28 sm:h-28 border rounded-md overflow-hidden group bg-white ${
                          dragSnapshot.isDragging
                            ? 'border-primary-500 shadow-lg scale-105'
                            : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={m.url}
                          alt={`Product image ${idx + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                            MAIN
                          </span>
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>

                        {/* Drag handle (desktop + long-press touch) */}
                        <button
                          type="button"
                          {...dragProvided.dragHandleProps}
                          className="absolute bottom-1 right-1 bg-white/90 hover:bg-white rounded p-0.5 shadow cursor-grab active:cursor-grabbing"
                          aria-label="Drag to reorder"
                        >
                          <Bars3Icon className="h-3.5 w-3.5 text-gray-700" />
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-0.5 shadow"
                          aria-label="Remove image"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-700" />
                        </button>

                        {/* Tap-friendly move buttons (always visible, main
                            interaction on mobile where drag-and-drop can be
                            fiddly). */}
                        <div className="absolute top-1/2 left-1 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => moveImage(idx, idx - 1)}
                            disabled={idx === 0}
                            className="bg-white/90 hover:bg-white rounded p-0.5 shadow disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move image left"
                          >
                            <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(idx, idx + 1)}
                            disabled={idx === data.media.length - 1}
                            className="bg-white/90 hover:bg-white rounded p-0.5 shadow disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move image right"
                          >
                            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}

                {/* Upload button stays outside the draggable area */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square sm:w-28 sm:h-28 border-2 border-dashed border-primary-400 bg-primary-50 rounded-md flex flex-col items-center justify-center text-primary-700 hover:bg-primary-100 disabled:opacity-60"
                >
                  <ArrowUpTrayIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
                  <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Upload'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {errors.media && <p className="mt-2 text-xs text-red-600">{errors.media}</p>}
      </section>

      {/* Product Name */}
      <section className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 sm:gap-4 items-start">
        <label className="text-sm font-semibold text-gray-800 pt-2">
          Product Name<span className="text-red-500">*</span>
        </label>
        <div>
          <input
            type="text"
            value={data.product_name}
            onChange={(e) => onChange({ product_name: e.target.value })}
            placeholder="e.g. Brown leather wallet"
            maxLength={120}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
          {errors.product_name && (
            <p className="mt-1 text-xs text-red-600">{errors.product_name}</p>
          )}
        </div>
      </section>

      {/* Product Description */}
      <section className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 sm:gap-4 items-start">
        <label className="text-sm font-semibold text-gray-800 pt-2">
          Product Description
        </label>
        <div>
          <textarea
            value={data.product_description}
            onChange={(e) =>
              onChange({ product_description: e.target.value.slice(0, MAX_DESCRIPTION) })
            }
            placeholder="e.g. Solid two-fold wallet with clean details. Crafted in high-quality leather."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <div className="flex justify-between mt-1 text-xs">
            {errors.product_description ? (
              <span className="text-red-600">{errors.product_description}</span>
            ) : (
              <span />
            )}
            <span className="text-gray-400">
              {data.product_description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tab1AddProduct;
