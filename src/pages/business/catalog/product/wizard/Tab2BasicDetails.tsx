import React, { useEffect, useMemo, useState } from 'react';
import { CategoryAttributeValue, WizardFormData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type AttributeValueOpt = { value_code: string; value_label: string };

type Attribute = {
  attribute_id: number;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  required?: boolean;
  help_text?: string | null;
  values?: AttributeValueOpt[];
};

type Props = {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardFormData>) => void;
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

const Tab2BasicDetails: React.FC<Props> = ({ data, errors, onChange }) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  // Fetch category-specific attributes whenever category changes
  useEffect(() => {
    if (!data.category_id) {
      setAttributes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingAttrs(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/merchant-dashboard/categories/${data.category_id}/attributes`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error('Failed to load attributes');
        const list: Attribute[] = await res.json();

        const enriched = await Promise.all(
          list.map(async (attr) => {
            if (['select', 'multiselect', 'boolean'].includes(attr.type)) {
              try {
                const vres = await fetch(
                  `${API_BASE_URL}/api/merchant-dashboard/attributes/${attr.attribute_id}/values`,
                  { headers: authHeaders() }
                );
                if (vres.ok) {
                  const values = await vres.json();
                  return { ...attr, values };
                }
              } catch {
                /* ignore per-attribute failure */
              }
            }
            return attr;
          })
        );
        if (!cancelled) setAttributes(enriched);
      } catch {
        if (!cancelled) setAttributes([]);
      } finally {
        if (!cancelled) setLoadingAttrs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data.category_id]);

  const attrValueMap = useMemo(() => {
    const map: Record<number, CategoryAttributeValue> = {};
    for (const a of data.attributes) map[a.attribute_id] = a;
    return map;
  }, [data.attributes]);

  const setAttr = (attr: Attribute, patch: Partial<CategoryAttributeValue>) => {
    const next = { ...attrValueMap };
    next[attr.attribute_id] = { ...(next[attr.attribute_id] || {}), ...patch, attribute_id: attr.attribute_id };
    onChange({ attributes: Object.values(next) });
  };

  // Live derived prices
  const listed = Number(data.selling_price) || 0;
  const wdrp = Number(data.wdrp) || 0;
  const mrp = Number(data.mrp) || 0;
  const gst = Number(data.gst_rate) || 0;
  const commissionPct = Number(data.commission_pct) || 0;
  const shippingToCustomer = 0; // Shipping is charged separately in Meesho; display 0 for now
  const customerPrice = listed + shippingToCustomer;
  const commissionAmt = (listed * commissionPct) / 100;
  const gstOnCommission = (commissionAmt * 18) / 100;
  const bankSettlement = Math.max(listed - commissionAmt - gstOnCommission, 0);

  const renderAttributeInput = (attr: Attribute) => {
    const val = attrValueMap[attr.attribute_id];

    if (attr.type === 'select' || attr.type === 'boolean') {
      return (
        <select
          value={val?.value_code ?? ''}
          onChange={(e) => setAttr(attr, { value_code: e.target.value, value_text: undefined })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select</option>
          {(attr.values || []).map((v) => (
            <option key={v.value_code} value={v.value_code}>
              {v.value_label}
            </option>
          ))}
        </select>
      );
    }

    if (attr.type === 'multiselect') {
      const current = (val?.value_text || '').split(',').filter(Boolean);
      const toggle = (code: string) => {
        const next = current.includes(code)
          ? current.filter((c) => c !== code)
          : [...current, code];
        setAttr(attr, { value_text: next.join(',') });
      };
      return (
        <div className="flex flex-wrap gap-2">
          {(attr.values || []).map((v) => {
            const on = current.includes(v.value_code);
            return (
              <button
                key={v.value_code}
                type="button"
                onClick={() => toggle(v.value_code)}
                className={`px-3 py-1 text-xs border rounded-full ${
                  on
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {v.value_label}
              </button>
            );
          })}
        </div>
      );
    }

    if (attr.type === 'number') {
      return (
        <input
          type="number"
          value={val?.value_number ?? ''}
          onChange={(e) =>
            setAttr(attr, {
              value_number: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
          placeholder="e.g. 350"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      );
    }

    return (
      <input
        type="text"
        value={val?.value_text ?? ''}
        onChange={(e) => setAttr(attr, { value_text: e.target.value })}
        placeholder="Select"
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
      />
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Product details */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800">
            Product details<span className="text-red-500">*</span>
          </h2>
          <span className="text-xs text-gray-500">All fields are required</span>
        </div>

        {!data.category_id && (
          <p className="text-sm text-gray-500">Select a category in step 1 to see its specs.</p>
        )}
        {loadingAttrs && (
          <p className="text-sm text-gray-500">Loading category specs…</p>
        )}

        <div className="space-y-4">
          {attributes.map((attr) => (
            <div
              key={attr.attribute_id}
              className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start"
            >
              <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right capitalize">
                {attr.name}
                {attr.required && <span className="text-red-500">*</span>}
              </label>
              <div>
                {renderAttributeInput(attr)}
                {attr.help_text && (
                  <p className="mt-1 text-xs text-gray-400">{attr.help_text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="text-primary-700 text-sm font-medium hover:underline"
            onClick={() => {
              const url = window.prompt('Paste a public size chart image URL');
              if (url) onChange({ size_chart_url: url });
            }}
          >
            {data.size_chart_url ? 'Update Size Chart ›' : 'Add Size Chart ›'}
          </button>
          {data.size_chart_url && (
            <span className="ml-3 text-xs text-gray-500 break-all">{data.size_chart_url}</span>
          )}
        </div>
      </section>

      {/* Price & Tax */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800">
            Price &amp; Tax details<span className="text-red-500">*</span>
          </h2>
          <span className="text-xs text-gray-500">All fields are required</span>
        </div>

        <div className="space-y-4">
          {/* Supplier Listed Price */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">
              Selling Price<span className="text-red-500">*</span>
            </label>
            <div>
              <input
                type="number"
                value={data.selling_price}
                onChange={(e) => onChange({ selling_price: e.target.value })}
                placeholder="e.g. 350.00"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">All return reasons allowed at this price.</p>
              {errors.selling_price && (
                <p className="mt-1 text-xs text-red-600">{errors.selling_price}</p>
              )}
            </div>
          </div>

          {/* WDRP */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">
              Wrong/Defective Returns Price
            </label>
            <div>
              <input
                type="number"
                value={data.wdrp}
                onChange={(e) => onChange({ wdrp: e.target.value })}
                placeholder="e.g. 325 (OPTIONAL)"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only wrong / defective return reasons allowed at this price.
              </p>
              {errors.wdrp && <p className="mt-1 text-xs text-red-600">{errors.wdrp}</p>}
            </div>
          </div>

          {/* MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">
              MRP<span className="text-red-500">*</span>
            </label>
            <div>
              <input
                type="number"
                value={data.mrp}
                onChange={(e) => onChange({ mrp: e.target.value })}
                placeholder="e.g. 700.00"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
              {errors.mrp && <p className="mt-1 text-xs text-red-600">{errors.mrp}</p>}
            </div>
          </div>

          {/* GST rate */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">GST Rate (%)</label>
            <div>
              <select
                value={data.gst_rate}
                onChange={(e) => onChange({ gst_rate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select</option>
                {[0, 3, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">Stock Quantity</label>
            <div>
              <input
                type="number"
                value={data.stock_qty}
                onChange={(e) => onChange({ stock_qty: e.target.value })}
                placeholder="e.g. 100"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-1 sm:gap-4 items-start">
            <label className="text-xs sm:text-sm text-gray-700 sm:pt-2 sm:text-right">SKU</label>
            <div>
              <input
                type="text"
                value={data.sku}
                onChange={(e) => onChange({ sku: e.target.value })}
                placeholder="Auto-generated if left blank"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 sm:py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Live price summary */}
        <div className="mt-4 sm:mt-6 bg-gray-50 border border-gray-200 rounded-md p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-white border border-gray-300 text-xs font-semibold">₹</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Customer Price</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              ₹{customerPrice.toFixed(2)}
            </span>
          </div>
          <div className="pl-6 sm:pl-8 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Selling Price</span>
              <span>₹{listed.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping (paid by customer)</span>
              <span>₹{shippingToCustomer.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 inline-flex items-center justify-center rounded bg-white border border-gray-300 text-xs font-semibold">🏦</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Bank settlement amount</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              ₹{bankSettlement.toFixed(2)}
            </span>
          </div>
          <div className="pl-6 sm:pl-8 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Commission @ {commissionPct}%</span>
              <span>− ₹{commissionAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST on commission @ 18%</span>
              <span>− ₹{gstOnCommission.toFixed(2)}</span>
            </div>
            {wdrp > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>WDRP (returns at defect)</span>
                <span>₹{wdrp.toFixed(2)}</span>
              </div>
            )}
            {mrp > 0 && gst > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>MRP includes {gst}% GST</span>
                <span>₹{mrp.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tab2BasicDetails;
