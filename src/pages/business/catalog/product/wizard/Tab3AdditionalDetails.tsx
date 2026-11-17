import React from 'react';
import { WizardFormData } from './types';

type Props = {
  data: WizardFormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<WizardFormData>) => void;
};

const COUNTRY_OPTIONS = [
  'India',
  'China',
  'Bangladesh',
  'Vietnam',
  'Thailand',
  'Indonesia',
  'United States',
  'United Kingdom',
  'Germany',
  'Japan',
  'South Korea',
  'Other',
];

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, required, error, children, hint }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 sm:gap-4 items-start">
    <label className="text-sm text-gray-700 pt-2 sm:text-right">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  </div>
);

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500';

const Tab3AdditionalDetails: React.FC<Props> = ({ data, errors, onChange }) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Tax & Compliance */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Tax &amp; Compliance<span className="text-red-500">*</span>
        </h2>
        <div className="space-y-4">
          <Field label="HSN Code" required error={errors.hsn_code} hint="4 to 10 digit HSN classification">
            <input
              type="text"
              value={data.hsn_code}
              onChange={(e) => onChange({ hsn_code: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="e.g. 610910"
              className={inputCls}
              inputMode="numeric"
            />
          </Field>

          <Field label="Country of Origin" required error={errors.country_of_origin}>
            <select
              value={data.country_of_origin}
              onChange={(e) => onChange({ country_of_origin: e.target.value })}
              className={inputCls + ' bg-white'}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Legal Metrology (Manufacturer / Packer / Importer) */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Manufacturer / Packer / Importer
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Required for Legal Metrology compliance. Use the legal name and address printed on the
          product packaging.
        </p>
        <div className="space-y-4">
          <Field label="Manufacturer Details" required error={errors.manufacturer_details}>
            <textarea
              value={data.manufacturer_details}
              onChange={(e) => onChange({ manufacturer_details: e.target.value })}
              rows={2}
              placeholder="Full legal name and address of the manufacturer"
              className={inputCls}
            />
          </Field>
          <Field label="Packer Details" hint="Only if different from manufacturer">
            <textarea
              value={data.packer_details}
              onChange={(e) => onChange({ packer_details: e.target.value })}
              rows={2}
              placeholder="Full legal name and address of the packer"
              className={inputCls}
            />
          </Field>
          <Field label="Importer Details" hint="Required when country of origin is not India">
            <textarea
              value={data.importer_details}
              onChange={(e) => onChange({ importer_details: e.target.value })}
              rows={2}
              placeholder="Full legal name and address of the importer"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Package & Shipping dimensions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Package &amp; Shipping<span className="text-red-500">*</span>
        </h2>
        <div className="space-y-4">
          <Field label="Package Weight (g)" required error={errors.weight_g}>
            <input
              type="number"
              value={data.weight_g}
              onChange={(e) => onChange({ weight_g: e.target.value })}
              placeholder="e.g. 350"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 sm:gap-4 items-start">
            <label className="text-sm text-gray-700 pt-2 sm:text-right">Dimensions (cm)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={data.length_cm}
                onChange={(e) => onChange({ length_cm: e.target.value })}
                placeholder="Length"
                className={inputCls}
              />
              <input
                type="number"
                value={data.width_cm}
                onChange={(e) => onChange({ width_cm: e.target.value })}
                placeholder="Width"
                className={inputCls}
              />
              <input
                type="number"
                value={data.height_cm}
                onChange={(e) => onChange({ height_cm: e.target.value })}
                placeholder="Height"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEO / Catalog quality */}
      <section>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Listing SEO <span className="text-xs font-normal text-gray-500">(optional)</span>
        </h2>
        <div className="space-y-4">
          <Field label="Short Summary">
            <input
              type="text"
              value={data.short_desc}
              onChange={(e) => onChange({ short_desc: e.target.value.slice(0, 255) })}
              placeholder="1-line summary shown in search results"
              className={inputCls}
            />
          </Field>
          <Field label="Meta Title">
            <input
              type="text"
              value={data.meta_title}
              onChange={(e) => onChange({ meta_title: e.target.value.slice(0, 100) })}
              className={inputCls}
            />
          </Field>
          <Field label="Meta Description">
            <input
              type="text"
              value={data.meta_desc}
              onChange={(e) => onChange({ meta_desc: e.target.value.slice(0, 255) })}
              className={inputCls}
            />
          </Field>
          <Field label="Meta Keywords" hint="Comma separated">
            <input
              type="text"
              value={data.meta_keywords}
              onChange={(e) => onChange({ meta_keywords: e.target.value.slice(0, 255) })}
              placeholder="wallet, leather, brown"
              className={inputCls}
            />
          </Field>
        </div>
      </section>
    </div>
  );
};

export default Tab3AdditionalDetails;
