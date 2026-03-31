import React, { useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, FolderOpen, Globe, Languages, MapPin, ShieldAlert, SlidersHorizontal, Sparkles, Timer, XCircle } from 'lucide-react';
import { StatusChip } from '../../components/creator/ui/StatusChip';
import { validateMaxLength } from '../../components/creator/utils/validation';
import { CreatorTargeting, loadCreatorTargeting, saveCreatorTargeting } from '../../components/creator/utils/creatorTargeting';

const CreatorCategories: React.FC = () => {
  const [saved, setSaved] = useState<CreatorTargeting>(() => loadCreatorTargeting());
  const [draft, setDraft] = useState<CreatorTargeting>(() => loadCreatorTargeting());
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const NICHE_OPTIONS = useMemo(
    () => [
      'Fashion', 'Beauty', 'Skincare', 'Electronics', 'Food', 'Fitness', 'Home', 'Kids', 'Travel', 'Gaming', 'Books', 'Pets',
    ],
    [],
  );
  const LANG_OPTIONS = useMemo(() => ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali'], []);
  const FORMAT_OPTIONS = useMemo(
    () => ['Talking head', 'Voiceover', 'Aesthetic b-roll', 'Unboxing', 'Tutorial', 'Try-on', 'Before/After', 'Top 5 list'],
    [],
  );
  const BUDGET_OPTIONS = useMemo(() => ['Any', '₹0–₹1k', '₹1k–₹3k', '₹3k–₹10k', '₹10k+'], []);
  const TURNAROUND_OPTIONS = useMemo(() => ['24h', '48h', '72h', '7d'], []);
  const COLLAB_OPTIONS = useMemo(() => ['Affiliate', 'Fixed', 'Fixed + Affiliate'], []);
  const EXCLUSION_OPTIONS = useMemo(() => ['Alcohol', 'Tobacco', 'Gambling', 'Adult', 'Political'], []);

  const limits = { primaryMin: 1, primaryMax: 5, secondaryMax: 10 };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (draft.primaryNiches.length < limits.primaryMin) e.primaryNiches = `Select at least ${limits.primaryMin} primary niche.`;
    if (draft.primaryNiches.length > limits.primaryMax) e.primaryNiches = `Select up to ${limits.primaryMax} primary niches.`;
    if (draft.secondaryNiches.length > limits.secondaryMax) e.secondaryNiches = `Select up to ${limits.secondaryMax} secondary niches.`;
    if (draft.languages.length < 1) e.languages = 'Select at least 1 language.';
    if (draft.audience.city && !draft.audience.state) e.location = 'Select state if you choose a city.';
    if (draft.dealPrefs.budgets.length < 1) e.budgets = 'Select at least one budget band.';
    if (!draft.dealPrefs.turnaround) e.turnaround = 'Select turnaround time.';
    if (draft.dealPrefs.collabTypes.length < 1) e.collab = 'Select at least one collab type.';
    return e;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;

  const completeness = useMemo(() => {
    const parts = [
      draft.primaryNiches.length >= limits.primaryMin && draft.primaryNiches.length <= limits.primaryMax,
      draft.languages.length >= 1,
      draft.dealPrefs.budgets.length >= 1 && draft.dealPrefs.turnaround.length > 0 && draft.dealPrefs.collabTypes.length >= 1,
    ];
    const done = parts.filter(Boolean).length;
    return Math.round((done / parts.length) * 100);
  }, [draft, limits.primaryMin, limits.primaryMax]);

  const toggle = (arr: string[], value: string, max?: number) => {
    const has = arr.includes(value);
    if (has) return arr.filter((x) => x !== value);
    if (max != null && arr.length >= max) return arr; // ignore
    return [...arr, value];
  };

  const onSave = () => {
    if (!isValid) return;
    setSaved(draft);
    saveCreatorTargeting(draft);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F0] flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[#FF4D00]" />
          </div>
          <div>
            <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Targeting</h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">
              Tell us what you create so we can send you better deals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusChip label={`${completeness}% complete`} tone={completeness >= 100 ? 'success' : completeness >= 67 ? 'info' : 'warning'} dotClassName={completeness >= 100 ? 'bg-emerald-400' : completeness >= 67 ? 'bg-blue-400' : 'bg-orange-400'} />
          {dirty ? <StatusChip label="Unsaved changes" tone="warning" dotClassName="bg-orange-400" /> : <StatusChip label="Saved" tone="success" dotClassName="bg-emerald-400" />}
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || !isValid}
            className={`px-4 py-2.5 rounded-2xl text-[12px] font-extrabold transition-colors ${
              dirty && isValid ? 'bg-[#FF4D00] text-white hover:bg-[#e64500]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Primary + Secondary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Primary niches
              </p>
              <p className="text-[12px] text-gray-500 mt-1">Select {limits.primaryMin}–{limits.primaryMax}. These drive deal matching.</p>
            </div>
            <p className="text-[11px] font-bold text-gray-400">{draft.primaryNiches.length}/{limits.primaryMax}</p>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {NICHE_OPTIONS.map((n) => {
              const on = draft.primaryNiches.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, primaryNiches: toggle(d.primaryNiches, n, limits.primaryMax) }))}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                    on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {errors.primaryNiches && <p className="text-[11px] text-red-600 font-semibold mt-3">{errors.primaryNiches}</p>}
        </section>

        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Secondary niches
              </p>
              <p className="text-[12px] text-gray-500 mt-1">Optional. Helps improve variety.</p>
            </div>
            <p className="text-[11px] font-bold text-gray-400">{draft.secondaryNiches.length}/{limits.secondaryMax}</p>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {NICHE_OPTIONS.map((n) => {
              const on = draft.secondaryNiches.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, secondaryNiches: toggle(d.secondaryNiches, n, limits.secondaryMax) }))}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                    on ? 'bg-[#FF4D00] text-white border-[#FF4D00]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {errors.secondaryNiches && <p className="text-[11px] text-red-600 font-semibold mt-3">{errors.secondaryNiches}</p>}
        </section>
      </div>

      {/* Languages + location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Languages className="w-4 h-4" /> Languages
          </p>
          <p className="text-[12px] text-gray-500 mt-1">Choose the languages you create content in.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {LANG_OPTIONS.map((l) => {
              const on = draft.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, languages: toggle(d.languages, l) }))}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                    on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          {errors.languages && <p className="text-[11px] text-red-600 font-semibold mt-3">{errors.languages}</p>}
        </section>

        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-4 h-4" /> Audience location
          </p>
          <p className="text-[12px] text-gray-500 mt-1">Optional. Helps local brands match you.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Country</label>
              <input
                value={draft.audience.country}
                onChange={(e) => setDraft((d) => ({ ...d, audience: { ...d.audience, country: e.target.value } }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="India"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">State</label>
              <input
                value={draft.audience.state ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, audience: { ...d.audience, state: e.target.value } }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="Maharashtra"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">City</label>
              <input
                value={draft.audience.city ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, audience: { ...d.audience, city: e.target.value } }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                placeholder="Mumbai"
              />
            </div>
          </div>
          {errors.location && <p className="text-[11px] text-red-600 font-semibold mt-3">{errors.location}</p>}
        </section>
      </div>

      {/* Formats + Deal prefs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Content formats
          </p>
          <p className="text-[12px] text-gray-500 mt-1">Optional. Helps brands choose the right creator fit.</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {FORMAT_OPTIONS.map((f) => {
              const on = draft.contentFormats.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, contentFormats: toggle(d.contentFormats, f, 6) }))}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                    on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Timer className="w-4 h-4" /> Deal preferences
          </p>
          <p className="text-[12px] text-gray-500 mt-1">Set expectations for budgets and timelines.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[12px] font-bold text-gray-700 mb-2">Budget bands</p>
              <div className="flex gap-2 flex-wrap">
                {BUDGET_OPTIONS.map((b) => {
                  const on = draft.dealPrefs.budgets.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setDraft((d) => {
                        // "Any" behaves like a single selection
                        if (b === 'Any') return { ...d, dealPrefs: { ...d.dealPrefs, budgets: on ? [] : ['Any'] } };
                        const next = toggle(d.dealPrefs.budgets.filter((x) => x !== 'Any'), b);
                        return { ...d, dealPrefs: { ...d.dealPrefs, budgets: next } };
                      })}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                        on ? 'bg-[#FF4D00] text-white border-[#FF4D00]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              {errors.budgets && <p className="text-[11px] text-red-600 font-semibold mt-2">{errors.budgets}</p>}
            </div>

            <div>
              <p className="text-[12px] font-bold text-gray-700 mb-2">Turnaround time</p>
              <div className="flex gap-2 flex-wrap">
                {TURNAROUND_OPTIONS.map((t) => {
                  const on = draft.dealPrefs.turnaround === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, dealPrefs: { ...d.dealPrefs, turnaround: t } }))}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                        on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {errors.turnaround && <p className="text-[11px] text-red-600 font-semibold mt-2">{errors.turnaround}</p>}
            </div>

            <div>
              <p className="text-[12px] font-bold text-gray-700 mb-2">Collab types</p>
              <div className="flex gap-2 flex-wrap">
                {COLLAB_OPTIONS.map((c) => {
                  const on = draft.dealPrefs.collabTypes.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, dealPrefs: { ...d.dealPrefs, collabTypes: toggle(d.dealPrefs.collabTypes, c) } }))}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                        on ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {errors.collab && <p className="text-[11px] text-red-600 font-semibold mt-2">{errors.collab}</p>}
            </div>
          </div>
        </section>
      </div>

      {/* Exclusions */}
      <section className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Restricted categories (optional)
        </p>
        <p className="text-[12px] text-gray-500 mt-1">Hide deals you don’t want to receive.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {EXCLUSION_OPTIONS.map((x) => {
            const on = draft.exclusions.includes(x);
            return (
              <button
                key={x}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, exclusions: toggle(d.exclusions, x) }))}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                  on ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {x}
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer banner */}
      <div className={`rounded-3xl border p-4 flex items-start gap-3 ${isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
        {isValid ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`text-[13px] font-extrabold ${isValid ? 'text-emerald-800' : 'text-red-800'}`}>
            {isValid ? 'Targeting looks good.' : 'Fix a few items to save.'}
          </p>
          {!isValid && (
            <ul className="mt-1 text-[12px] text-red-700 font-semibold list-disc pl-5 space-y-0.5">
              {Object.values(errors).slice(0, 3).map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
          {dirty && isValid && (
            <p className="text-[12px] text-emerald-700 font-semibold mt-1">You have unsaved changes.</p>
          )}
        </div>
      </div>

      {/* Dev note */}
      <div className="text-[11px] text-gray-400 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Saved locally for now. When APIs are ready, we’ll replace localStorage with backend persistence.
      </div>
    </div>
  );
};

export default CreatorCategories;
