import { describe, expect, it } from 'vitest';

import { INITIAL_FORM_DATA, MediaItem, WizardFormData } from './types';
import {
  computePriceBreakdown,
  normalizeMedia,
  reorderMedia,
  validateWizardStep,
} from './wizard-helpers';

const img = (url: string, overrides: Partial<MediaItem> = {}): MediaItem => ({
  url,
  public_id: url + '-pid',
  type: 'image',
  sort_order: 0,
  is_main_image: false,
  is_thumbnail: false,
  ...overrides,
});

describe('normalizeMedia', () => {
  it('assigns sequential sort_order starting at 0', () => {
    const result = normalizeMedia([img('a'), img('b'), img('c')]);
    expect(result.map((m) => m.sort_order)).toEqual([0, 1, 2]);
  });

  it('marks the first item as MAIN and thumbnail, all others as not', () => {
    const result = normalizeMedia([img('a'), img('b'), img('c')]);
    expect(result[0].is_main_image).toBe(true);
    expect(result[0].is_thumbnail).toBe(true);
    expect(result.slice(1).every((m) => !m.is_main_image)).toBe(true);
    expect(result.slice(1).every((m) => !m.is_thumbnail)).toBe(true);
  });

  it('handles empty input without throwing', () => {
    expect(normalizeMedia([])).toEqual([]);
  });

  it('preserves other MediaItem fields (url, public_id, type)', () => {
    const input = [img('a', { public_id: 'keep-me' })];
    const result = normalizeMedia(input);
    expect(result[0].url).toBe('a');
    expect(result[0].public_id).toBe('keep-me');
    expect(result[0].type).toBe('image');
  });
});

describe('reorderMedia', () => {
  const base = [img('a'), img('b'), img('c'), img('d')];

  it('moves an item forward and re-normalizes', () => {
    const result = reorderMedia(base, 0, 2);
    expect(result.map((m) => m.url)).toEqual(['b', 'c', 'a', 'd']);
    expect(result.map((m) => m.sort_order)).toEqual([0, 1, 2, 3]);
    expect(result[0].is_main_image).toBe(true);
    expect(result[2].is_main_image).toBe(false); // the moved one is no longer main
  });

  it('moves an item backward and re-normalizes', () => {
    const result = reorderMedia(base, 3, 0);
    expect(result.map((m) => m.url)).toEqual(['d', 'a', 'b', 'c']);
    expect(result[0].is_main_image).toBe(true);
  });

  it('is a no-op if from === to', () => {
    expect(reorderMedia(base, 1, 1)).toBe(base);
  });

  it('is a no-op when indexes are out of bounds', () => {
    expect(reorderMedia(base, -1, 2)).toBe(base);
    expect(reorderMedia(base, 0, 9)).toBe(base);
    expect(reorderMedia(base, 9, 0)).toBe(base);
  });

  it('does not mutate the input array', () => {
    const copy = [...base];
    reorderMedia(base, 0, 3);
    expect(base).toEqual(copy);
  });
});

describe('validateWizardStep — Tab 1 (Add Product)', () => {
  const empty: WizardFormData = { ...INITIAL_FORM_DATA };

  it('flags all required Tab 1 fields when empty', () => {
    const errs = validateWizardStep(0, empty);
    expect(errs.category_id).toBeDefined();
    expect(errs.brand_id).toBeDefined();
    expect(errs.product_name).toBeDefined();
    expect(errs.product_description).toBeDefined();
    expect(errs.media).toBeDefined();
  });

  it('accepts 3-character product name but rejects 2', () => {
    const base = {
      ...empty,
      category_id: 1,
      brand_id: 1,
      product_description: 'ok',
      media: [img('a')],
    };
    expect(validateWizardStep(0, { ...base, product_name: 'ab' }).product_name).toBeDefined();
    expect(validateWizardStep(0, { ...base, product_name: 'abc' }).product_name).toBeUndefined();
  });

  it('treats whitespace-only product name as empty', () => {
    const d: WizardFormData = {
      ...empty,
      category_id: 1,
      brand_id: 1,
      product_name: '   ',
      product_description: 'x',
      media: [img('a')],
    };
    expect(validateWizardStep(0, d).product_name).toBeDefined();
  });

  it('passes when all Tab 1 requirements are met', () => {
    const d: WizardFormData = {
      ...empty,
      category_id: 1,
      brand_id: 1,
      product_name: 'Good Name',
      product_description: 'A fine description',
      media: [img('a')],
    };
    expect(validateWizardStep(0, d)).toEqual({});
  });
});

describe('validateWizardStep — Tab 2 (Basic Details) MRP rule', () => {
  const base: WizardFormData = { ...INITIAL_FORM_DATA };

  it('rejects MRP < selling_price', () => {
    const errs = validateWizardStep(1, {
      ...base,
      selling_price: '500',
      mrp: '400',
    });
    expect(errs.mrp).toBe('MRP must be greater than or equal to selling price');
  });

  it('accepts MRP == selling_price (boundary)', () => {
    const errs = validateWizardStep(1, {
      ...base,
      selling_price: '500',
      mrp: '500',
    });
    expect(errs.mrp).toBeUndefined();
  });

  it('uses numeric, not lexical, comparison', () => {
    // '9' > '100' lexically. If the code compared strings, this would pass.
    const errs = validateWizardStep(1, {
      ...base,
      selling_price: '100',
      mrp: '9',
    });
    expect(errs.mrp).toBe('MRP must be greater than or equal to selling price');
  });

  it('rejects WDRP > selling_price', () => {
    const errs = validateWizardStep(1, {
      ...base,
      selling_price: '500',
      mrp: '600',
      wdrp: '700',
    });
    expect(errs.wdrp).toBe('WDRP must be less than or equal to selling price');
  });
});

describe('validateWizardStep — Tab 3 (Additional Details) HSN rule', () => {
  const base: WizardFormData = { ...INITIAL_FORM_DATA, manufacturer_details: 'Mfg', weight_g: '350' };

  it('accepts 6-digit HSN', () => {
    expect(validateWizardStep(2, { ...base, hsn_code: '610910' }).hsn_code).toBeUndefined();
  });

  it('accepts 4-digit HSN (lower bound)', () => {
    expect(validateWizardStep(2, { ...base, hsn_code: '6109' }).hsn_code).toBeUndefined();
  });

  it('rejects 3-digit HSN', () => {
    expect(validateWizardStep(2, { ...base, hsn_code: '610' }).hsn_code).toBeDefined();
  });

  it('rejects non-numeric HSN', () => {
    expect(validateWizardStep(2, { ...base, hsn_code: '61A910' }).hsn_code).toBeDefined();
  });
});

describe('computePriceBreakdown', () => {
  it('derives customer price from listed + shipping', () => {
    const r = computePriceBreakdown({ selling_price: '350' });
    expect(r.customerPrice).toBe(350);
  });

  it('subtracts commission and GST on commission from bank settlement', () => {
    // listed 1000, commission 10% → 100 commission, GST on commission 18% → 18
    // settlement = 1000 - 100 - 18 = 882
    const r = computePriceBreakdown({ selling_price: '1000', commission_pct: '10' });
    expect(r.commissionAmt).toBeCloseTo(100);
    expect(r.gstOnCommission).toBeCloseTo(18);
    expect(r.bankSettlement).toBeCloseTo(882);
  });

  it('clamps bank settlement at zero', () => {
    const r = computePriceBreakdown({ selling_price: '10', commission_pct: '500' });
    expect(r.bankSettlement).toBe(0);
  });

  it('treats empty / non-numeric inputs as 0', () => {
    const r = computePriceBreakdown({ selling_price: '', commission_pct: 'abc' as unknown as string });
    expect(r.listed).toBe(0);
    expect(r.commissionAmt).toBe(0);
    expect(r.bankSettlement).toBe(0);
  });
});
