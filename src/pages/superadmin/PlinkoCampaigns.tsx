import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { fetchCampaigns, saveCampaign } from '../../services/superadmin/plinkoService';
import { PlinkoCampaignConfig, PlinkoPrizeConfig } from '../../types/plinko';

const BLANK: PlinkoCampaignConfig = {
  name: '',
  is_active: false,
  headline: 'Tap to drop',
  subheadline: '',
  terms_text: '',
  image_urls: ['', '', '', ''],
  coupon_prefix: 'PLK',
  validity_days: 1,
  min_order_value: null,
  max_discount_amount: null,
  popup_delay_seconds: 5,
  redisplay_after_days: 7,
  daily_mint_ceiling: 500,
  start_date: null,
  end_date: null,
  prizes: [
    { label: '15% back', slot_kind: 'coupon', discount_type: 'percentage', discount_value: 15, weight: 10, display_order: 0, is_active: true },
    { label: 'Try again', slot_kind: 'decoy', discount_type: null, discount_value: null, weight: 0, display_order: 1, is_active: true },
    { label: 'Free gift', slot_kind: 'decoy', discount_type: null, discount_value: null, weight: 0, display_order: 2, is_active: true },
    { label: '10% back', slot_kind: 'coupon', discount_type: 'percentage', discount_value: 10, weight: 30, display_order: 3, is_active: true },
    { label: '5% back', slot_kind: 'coupon', discount_type: 'percentage', discount_value: 5, weight: 60, display_order: 4, is_active: true },
  ],
};

const PlinkoCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<PlinkoCampaignConfig[]>([]);
  const [draft, setDraft] = useState<PlinkoCampaignConfig>(BLANK);
  const [saving, setSaving] = useState(false);

  const reload = () =>
    fetchCampaigns()
      .then((list) => {
        setCampaigns(list);
        if (list.length) setDraft(list[0]);
      })
      .catch(() => toast.error('Could not load campaigns'));

  useEffect(() => {
    reload();
  }, []);

  // Weights are relative, so the only number an admin can reason about is the
  // resulting probability. Show it rather than making them do the arithmetic.
  const totalWeight = useMemo(
    () =>
      draft.prizes
        .filter((p) => p.slot_kind === 'coupon' && p.is_active)
        .reduce((sum, p) => sum + (Number(p.weight) || 0), 0),
    [draft.prizes]
  );

  const setField = <K extends keyof PlinkoCampaignConfig>(
    key: K,
    value: PlinkoCampaignConfig[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const setPrize = (index: number, patch: Partial<PlinkoPrizeConfig>) =>
    setDraft((d) => ({
      ...d,
      prizes: d.prizes.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  const addPrize = () =>
    setDraft((d) => ({
      ...d,
      prizes: [
        ...d.prizes,
        {
          label: 'New slot',
          slot_kind: 'coupon',
          discount_type: 'percentage',
          discount_value: 5,
          weight: 10,
          display_order: d.prizes.length,
          is_active: true,
        },
      ],
    }));

  const removePrize = (index: number) =>
    setDraft((d) => ({ ...d, prizes: d.prizes.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Give the campaign a name');
      return;
    }
    if (totalWeight <= 0) {
      toast.error('At least one coupon slot needs a weight above zero');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveCampaign({
        ...draft,
        image_urls: (draft.image_urls ?? []).filter(Boolean),
      });
      setDraft(saved);
      await reload();
      toast.success('Campaign saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save campaign');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600';
  const labelCls = 'mb-1 block text-xs font-medium text-gray-700';

  return (
    <div className="min-h-full bg-gradient-to-br from-white to-primary-50 p-1">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plinko Campaigns</h1>
          <p className="text-sm text-gray-500">
            Board copy, prize odds, and the guardrails on what a code is worth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={draft.campaign_id ?? ''}
            onChange={(e) => {
              const found = campaigns.find((c) => c.campaign_id === Number(e.target.value));
              setDraft(found ?? BLANK);
            }}
            className={field}
          >
            <option value="">+ New campaign</option>
            {campaigns.map((c) => (
              <option key={c.campaign_id} value={c.campaign_id}>
                {c.name} {c.is_active ? '(live)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 whitespace-nowrap rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Campaign</h2>

          <div>
            <label className={labelCls}>Name</label>
            <input value={draft.name} onChange={(e) => setField('name', e.target.value)} className={field} />
          </div>
          <div>
            <label className={labelCls}>Headline</label>
            <input value={draft.headline} onChange={(e) => setField('headline', e.target.value)} className={field} />
          </div>
          <div>
            <label className={labelCls}>Subheadline</label>
            <input
              value={draft.subheadline ?? ''}
              onChange={(e) => setField('subheadline', e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Terms &amp; conditions (shown with the code)</label>
            <textarea
              rows={3}
              value={draft.terms_text ?? ''}
              onChange={(e) => setField('terms_text', e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label className={labelCls}>Popup images (4)</label>
            <p className="mb-2 text-xs text-gray-400">
              Shown beside the game. Paste full URLs or paths under <code>/public</code>.
              Leave blank to show a plain branded panel instead.
            </p>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  value={draft.image_urls?.[i] ?? ''}
                  onChange={(e) => {
                    const next = [...(draft.image_urls ?? ['', '', '', ''])];
                    next[i] = e.target.value;
                    setField('image_urls', next);
                  }}
                  placeholder={`Image ${i + 1} URL`}
                  className={field}
                />
              ))}
            </div>
            {(draft.image_urls ?? []).some(Boolean) && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(draft.image_urls ?? []).map((src, i) =>
                  src ? (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-16 w-full rounded-md object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                      }}
                    />
                  ) : (
                    <div key={i} className="h-16 rounded-md border border-dashed border-gray-200" />
                  )
                )}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            Live on the storefront
            <span className="text-xs text-gray-400">(activating this deactivates the others)</span>
          </label>
        </div>

        <div className="space-y-4 rounded-lg bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Coupon rules</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Code prefix</label>
              <input
                value={draft.coupon_prefix}
                onChange={(e) => setField('coupon_prefix', e.target.value.toUpperCase())}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Valid for (days)</label>
              <input
                type="number"
                min={1}
                value={draft.validity_days}
                onChange={(e) => setField('validity_days', Number(e.target.value))}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Minimum order (₹)</label>
              <input
                type="number"
                value={draft.min_order_value ?? ''}
                onChange={(e) =>
                  setField('min_order_value', e.target.value === '' ? null : Number(e.target.value))
                }
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Max discount (₹)</label>
              <input
                type="number"
                value={draft.max_discount_amount ?? ''}
                onChange={(e) =>
                  setField('max_discount_amount', e.target.value === '' ? null : Number(e.target.value))
                }
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Popup delay (seconds)</label>
              <input
                type="number"
                min={0}
                value={draft.popup_delay_seconds}
                onChange={(e) => setField('popup_delay_seconds', Number(e.target.value))}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Re-show after (days)</label>
              <input
                type="number"
                min={0}
                value={draft.redisplay_after_days}
                onChange={(e) => setField('redisplay_after_days', Number(e.target.value))}
                className={field}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Daily code limit</label>
            <input
              type="number"
              min={0}
              value={draft.daily_mint_ceiling}
              onChange={(e) => setField('daily_mint_ceiling', Number(e.target.value))}
              className={field}
            />
            <p className="mt-1 text-xs text-gray-400">
              Caps worst-case daily exposure at this many codes × the max discount.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Board slots</h2>
            <p className="text-xs text-gray-500">
              Decoy slots are drawn on the board but can never be won — that is what makes
              &quot;everyone wins&quot; true.
            </p>
          </div>
          <button
            type="button"
            onClick={addPrize}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <Plus size={14} /> Add slot
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-50 text-xs uppercase text-primary-600">
              <tr>
                {['Label', 'Kind', 'Type', 'Value', 'Weight', 'Odds', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {draft.prizes.map((prize, index) => {
                const winnable = prize.slot_kind === 'coupon' && prize.is_active;
                const odds = winnable && totalWeight > 0
                  ? ((Number(prize.weight) || 0) / totalWeight) * 100
                  : 0;
                return (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <input
                        value={prize.label}
                        onChange={(e) => setPrize(index, { label: e.target.value })}
                        className={field}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={prize.slot_kind}
                        onChange={(e) =>
                          setPrize(index, { slot_kind: e.target.value as 'coupon' | 'decoy' })
                        }
                        className={field}
                      >
                        <option value="coupon">Coupon</option>
                        <option value="decoy">Decoy</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={prize.discount_type ?? ''}
                        disabled={!winnable}
                        onChange={(e) =>
                          setPrize(index, {
                            discount_type: (e.target.value || null) as 'percentage' | 'fixed' | null,
                          })
                        }
                        className={`${field} disabled:bg-gray-50`}
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">₹</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        disabled={!winnable}
                        value={prize.discount_value ?? ''}
                        onChange={(e) =>
                          setPrize(index, {
                            discount_value: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className={`${field} disabled:bg-gray-50`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        disabled={!winnable}
                        value={prize.weight}
                        onChange={(e) => setPrize(index, { weight: Number(e.target.value) })}
                        className={`${field} disabled:bg-gray-50`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                      {winnable ? `${odds.toFixed(1)}%` : 'never'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removePrize(index)}
                        aria-label="Remove slot"
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlinkoCampaigns;
