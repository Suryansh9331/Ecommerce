import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutline, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { INITIAL_FORM_DATA, WIZARD_STEPS, WizardFormData, WizardStepKey } from './types';
import { validateWizardStep } from './wizard-helpers';
import Tab1AddProduct from './Tab1AddProduct';
import Tab2BasicDetails from './Tab2BasicDetails';
import Tab3AdditionalDetails from './Tab3AdditionalDetails';
import Tab4AddVariants from './Tab4AddVariants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MeeshoProductWizard: React.FC = () => {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentStep: WizardStepKey = WIZARD_STEPS[stepIndex].key;

  const update = (patch: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const validateStep = (idx: number): Record<string, string> =>
    validateWizardStep(idx, formData);

  const next = () => {
    const stepErrors = validateStep(stepIndex);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  };

  const back = () => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const goTo = (idx: number) => {
    // Allow jumping to an earlier tab freely; forward jumps require passing
    // validation on every tab in between.
    if (idx <= stepIndex) {
      setErrors({});
      setStepIndex(idx);
      return;
    }
    for (let i = stepIndex; i < idx; i++) {
      const e = validateStep(i);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        setStepIndex(i);
        return;
      }
    }
    setErrors({});
    setStepIndex(idx);
  };

  const buildPayload = () => ({
    product_name: formData.product_name.trim(),
    product_description: formData.product_description.trim(),
    category_id: formData.category_id,
    brand_id: formData.brand_id,
    sku: formData.sku.trim(),
    cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
    selling_price: Number(formData.selling_price),
    mrp: Number(formData.mrp),
    wdrp: formData.wdrp ? Number(formData.wdrp) : null,
    hsn_code: formData.hsn_code.trim(),
    gst_rate: formData.gst_rate ? Number(formData.gst_rate) : null,
    country_of_origin: formData.country_of_origin.trim(),
    manufacturer_details: formData.manufacturer_details.trim(),
    packer_details: formData.packer_details.trim() || null,
    importer_details: formData.importer_details.trim() || null,
    style_code: formData.style_code.trim() || null,
    weight_g: formData.weight_g ? Number(formData.weight_g) : null,
    size_chart_url: formData.size_chart_url || null,
    stock_qty: formData.stock_qty ? Number(formData.stock_qty) : 0,
    low_stock_threshold: Number(formData.low_stock_threshold) || 5,
    media: formData.media,
    attributes: formData.attributes,
    meta: {
      short_desc: formData.short_desc || null,
      full_desc: formData.product_description,
      meta_title: formData.meta_title || null,
      meta_desc: formData.meta_desc || null,
      meta_keywords: formData.meta_keywords || null,
    },
    shipping: {
      length_cm: formData.length_cm ? Number(formData.length_cm) : null,
      width_cm: formData.width_cm ? Number(formData.width_cm) : null,
      height_cm: formData.height_cm ? Number(formData.height_cm) : null,
      weight_kg: formData.weight_g ? Number(formData.weight_g) / 1000 : null,
    },
    variants: formData.variants.map((v) => ({
      sku: v.sku.trim(),
      product_name: formData.product_name.trim(),
      selling_price: Number(v.selling_price || formData.selling_price),
      mrp: Number(v.mrp || formData.mrp),
      cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
      stock_qty: Number(v.stock_qty || 0),
      media: v.media,
      attributes: [
        ...(v.color ? [{ attribute_id: 0, value_text: v.color }] : []),
        ...(v.size ? [{ attribute_id: 0, value_text: v.size }] : []),
      ],
    })),
  });

  const submit = async () => {
    // Final validation across all tabs
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
      const e = validateStep(i);
      if (Object.keys(e).length > 0) {
        setStepIndex(i);
        setErrors(e);
        toast.error('Please fix the highlighted fields before submitting');
        return;
      }
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/meesho-wizard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Failed with status ${res.status}`);
      }
      toast.success('Product submitted for approval');
      navigate('/business/catalog/products');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = useMemo(
    () => ((stepIndex + 1) / WIZARD_STEPS.length) * 100,
    [stepIndex]
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header — scrolls away with content (Meesho hides its app bar too) */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-6 pb-2 sm:pb-3 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate('/business/catalog/products')}
          className="p-1.5 sm:p-2 rounded hover:bg-gray-100 shrink-0"
          aria-label="Back to products"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
          Catalog Upload
        </h1>
      </div>

      {/* Sticky tab strip — stays visible on scroll, like Meesho's supplier app */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-4 pb-2 sm:pb-3 pt-1 sm:pt-2 shadow-sm">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = idx === stepIndex;
              const isDone = idx < stepIndex;
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`relative flex flex-col items-center justify-center py-2.5 sm:py-4 px-1 sm:px-2 text-center transition ${
                    isActive ? 'bg-primary-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? (
                    <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 mb-0.5 sm:mb-1" />
                  ) : (
                    <CheckCircleOutline
                      className={`h-5 w-5 sm:h-6 sm:w-6 mb-0.5 sm:mb-1 ${
                        isActive ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    />
                  )}
                  <span
                    className={`text-[10px] leading-tight sm:text-sm ${
                      isActive
                        ? 'text-primary-700 font-semibold'
                        : isDone
                        ? 'text-gray-700 font-medium'
                        : 'text-gray-500 font-medium'
                    }`}
                  >
                    <span className="sm:hidden">{step.short}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                  {/* Active-tab indicator — a thick bar at the bottom edge */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-600 rounded-t" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="h-1 bg-gray-100">
            <div
              className="h-1 bg-primary-600 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab body */}
      <div className="px-3 sm:px-4 py-3 sm:py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-6">
        {currentStep === 'add-product' && (
          <Tab1AddProduct data={formData} errors={errors} onChange={update} />
        )}
        {currentStep === 'basic-details' && (
          <Tab2BasicDetails data={formData} errors={errors} onChange={update} />
        )}
        {currentStep === 'additional-details' && (
          <Tab3AdditionalDetails data={formData} errors={errors} onChange={update} />
        )}
        {currentStep === 'add-variants' && (
          <Tab4AddVariants data={formData} errors={errors} onChange={update} />
        )}

        {/* Nav buttons */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0 || submitting}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          {stepIndex < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={submitting}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Catalog'}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default MeeshoProductWizard;
