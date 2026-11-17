import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
          sort_order: data.media.length + i,
          is_main_image: data.media.length + i === 0,
          is_thumbnail: data.media.length + i === 0,
        });
      }
      onChange({ media: [...data.media, ...uploaded] });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    const next = data.media.filter((_, i) => i !== idx).map((m, i) => ({
      ...m,
      sort_order: i,
      is_main_image: i === 0,
      is_thumbnail: i === 0,
    }));
    onChange({ media: next });
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

        <div className="mt-4 grid grid-cols-3 xs:grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {data.media.map((m, idx) => (
            <div
              key={m.url}
              className="relative aspect-square sm:w-28 sm:h-28 border border-gray-200 rounded-md overflow-hidden group"
            >
              <img src={m.url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  MAIN
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-0.5 shadow"
                aria-label="Remove image"
              >
                <XMarkIcon className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          ))}

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
