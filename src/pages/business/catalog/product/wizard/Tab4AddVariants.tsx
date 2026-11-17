import React, { useRef, useState } from 'react';
import { PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { cloudinaryService } from '../../../../../services/cloudinaryService';
import { VariantRow, WizardFormData } from './types';

type Props = {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardFormData>) => void;
};

const makeId = () => `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const blankVariant = (): VariantRow => ({
  localId: makeId(),
  color: '',
  size: '',
  sku: '',
  selling_price: '',
  mrp: '',
  stock_qty: '',
  media: [],
});

const Tab4AddVariants: React.FC<Props> = ({ data, onChange }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addRow = () => onChange({ variants: [...data.variants, blankVariant()] });
  const removeRow = (id: string) =>
    onChange({ variants: data.variants.filter((v) => v.localId !== id) });

  const updateRow = (id: string, patch: Partial<VariantRow>) =>
    onChange({
      variants: data.variants.map((v) => (v.localId === id ? { ...v, ...patch } : v)),
    });

  const handleVariantImage = async (id: string, file: File | null) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const res = await cloudinaryService.uploadImage(file, 'products/wizard/variants');
      updateRow(id, {
        media: [
          {
            url: res.secure_url,
            public_id: res.public_id,
            type: 'image',
            sort_order: 0,
            is_main_image: true,
            is_thumbnail: true,
          },
        ],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Variant image upload failed');
    } finally {
      setUploadingId(null);
      const input = fileRefs.current[id];
      if (input) input.value = '';
    }
  };

  const hasRows = data.variants.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Style code (shared across all variants) */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 sm:gap-4 items-start">
          <label className="text-sm font-semibold text-gray-800 pt-2 sm:text-right">
            Style Code
          </label>
          <div>
            <input
              type="text"
              value={data.style_code}
              onChange={(e) => onChange({ style_code: e.target.value })}
              placeholder="e.g. ST-W-0012 (shared across all variants of this design)"
              className="w-full sm:max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Groups color/size variations of the same base product. Leave blank for a
              single-variant listing.
            </p>
          </div>
        </div>
      </section>

      {/* Variants grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">Variants</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-primary-700 text-sm font-medium hover:underline"
          >
            <PlusIcon className="h-4 w-4" />
            Add variant
          </button>
        </div>

        {!hasRows && (
          <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
            <p className="text-sm text-gray-600">
              Single-variant product — click <span className="font-medium">Submit Catalog</span>{' '}
              to finish, or <button
                type="button"
                onClick={addRow}
                className="text-primary-700 font-medium hover:underline"
              >add a variant</button> (color, size, etc.).
            </p>
          </div>
        )}

        {hasRows && (
          <>
            {/* Mobile / tablet (< md): one card per variant, no horizontal scroll */}
            <div className="md:hidden space-y-3">
              {data.variants.map((v, i) => (
                <div
                  key={v.localId}
                  className="border border-gray-200 rounded-md p-3 bg-white"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => fileRefs.current[v.localId]?.click()}
                      className="w-16 h-16 shrink-0 border border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 overflow-hidden"
                      aria-label="Upload variant image"
                    >
                      {v.media[0]?.url ? (
                        <img src={v.media[0].url} alt="" className="w-full h-full object-cover" />
                      ) : uploadingId === v.localId ? (
                        <span className="text-[10px] text-gray-500">…</span>
                      ) : (
                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                    <input
                      ref={(el) => (fileRefs.current[v.localId] = el)}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleVariantImage(v.localId, e.target.files?.[0] || null)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Variant {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRow(v.localId)}
                          className="text-gray-400 hover:text-red-600 p-1 -mr-1"
                          aria-label="Remove variant"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="text-xs text-gray-600">
                          Color
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => updateRow(v.localId, { color: e.target.value })}
                            placeholder="e.g. Red"
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          Size
                          <input
                            type="text"
                            value={v.size}
                            onChange={(e) => updateRow(v.localId, { size: e.target.value })}
                            placeholder="e.g. M"
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600 col-span-2">
                          SKU
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => updateRow(v.localId, { sku: e.target.value })}
                            placeholder="Auto-generated if blank"
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          Price (₹)
                          <input
                            type="number"
                            value={v.selling_price}
                            onChange={(e) => updateRow(v.localId, { selling_price: e.target.value })}
                            placeholder={data.selling_price || '0'}
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600">
                          MRP (₹)
                          <input
                            type="number"
                            value={v.mrp}
                            onChange={(e) => updateRow(v.localId, { mrp: e.target.value })}
                            placeholder={data.mrp || '0'}
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                        <label className="text-xs text-gray-600 col-span-2">
                          Stock
                          <input
                            type="number"
                            value={v.stock_qty}
                            onChange={(e) => updateRow(v.localId, { stock_qty: e.target.value })}
                            placeholder="0"
                            className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop (md+): compact table */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Image</th>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-left">Size</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Price (₹)</th>
                    <th className="px-3 py-2 text-left">MRP (₹)</th>
                    <th className="px-3 py-2 text-left">Stock</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.variants.map((v) => (
                    <tr key={v.localId} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => fileRefs.current[v.localId]?.click()}
                          className="w-12 h-12 border border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 overflow-hidden"
                        >
                          {v.media[0]?.url ? (
                            <img src={v.media[0].url} alt="" className="w-full h-full object-cover" />
                          ) : uploadingId === v.localId ? (
                            <span className="text-[10px] text-gray-500">…</span>
                          ) : (
                            <PhotoIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => updateRow(v.localId, { color: e.target.value })}
                          placeholder="e.g. Red"
                          className="w-24 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateRow(v.localId, { size: e.target.value })}
                          placeholder="e.g. M"
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateRow(v.localId, { sku: e.target.value })}
                          placeholder="Auto"
                          className="w-28 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.selling_price}
                          onChange={(e) => updateRow(v.localId, { selling_price: e.target.value })}
                          placeholder={data.selling_price || '0'}
                          className="w-24 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.mrp}
                          onChange={(e) => updateRow(v.localId, { mrp: e.target.value })}
                          placeholder={data.mrp || '0'}
                          className="w-24 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.stock_qty}
                          onChange={(e) => updateRow(v.localId, { stock_qty: e.target.value })}
                          placeholder="0"
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(v.localId)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          aria-label="Remove variant"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Summary */}
      <section className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <span>Total variants</span>
          <span className="font-semibold">{data.variants.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total stock across variants</span>
          <span className="font-semibold">
            {data.variants.reduce((sum, v) => sum + (Number(v.stock_qty) || 0), 0)}
          </span>
        </div>
      </section>
    </div>
  );
};

export default Tab4AddVariants;
