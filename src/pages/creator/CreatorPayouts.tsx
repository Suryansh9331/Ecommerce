import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Landmark, ShieldCheck, Upload, XCircle } from 'lucide-react';
import { StatusChip } from '../../components/creator/ui/StatusChip';
import { validateFileSize, validateMaxLength, validateRequired } from '../../components/creator/utils/validation';
import { getPayoutReady, setPayoutReady } from '../../components/creator/utils/payoutReadiness';

const CreatorPayouts: React.FC = () => {
  const [ready, setReady] = useState<boolean>(() => getPayoutReady());

  const [bank, setBank] = useState({
    beneficiaryName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
  });

  const [kyc, setKyc] = useState({
    pan: '',
    aadhaarLast4: '',
    panFile: null as File | null,
    addressFile: null as File | null,
  });

  const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5MB
  const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  const bankErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const r1 = validateRequired(bank.beneficiaryName, 'Beneficiary name');
    if (!r1.ok) errors.beneficiaryName = r1.message;
    const r2 = validateRequired(bank.accountNumber, 'Account number');
    if (!r2.ok) errors.accountNumber = r2.message;
    if (bank.accountNumber && bank.accountNumber.length < 8) errors.accountNumber = 'Account number looks too short.';
    if (bank.confirmAccountNumber !== bank.accountNumber) errors.confirmAccountNumber = 'Account numbers do not match.';
    if (!bank.ifsc.trim()) errors.ifsc = 'IFSC is required.';
    else if (!IFSC_RE.test(bank.ifsc.trim().toUpperCase())) errors.ifsc = 'Enter a valid IFSC (e.g. HDFC0001234).';
    return errors;
  }, [bank]);

  const kycErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const r1 = validateRequired(kyc.pan, 'PAN');
    if (!r1.ok) errors.pan = r1.message;
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(kyc.pan.trim().toUpperCase())) errors.pan = 'Enter a valid PAN (e.g. ABCDE1234F).';

    if (kyc.aadhaarLast4.trim().length !== 4 || !/^[0-9]{4}$/.test(kyc.aadhaarLast4.trim())) {
      errors.aadhaarLast4 = 'Enter Aadhaar last 4 digits.';
    }

    if (!kyc.panFile) errors.panFile = 'PAN document is required.';
    else {
      const s = validateFileSize(kyc.panFile, MAX_DOC_BYTES);
      if (!s.ok) errors.panFile = s.message;
    }

    if (!kyc.addressFile) errors.addressFile = 'Address proof is required.';
    else {
      const s = validateFileSize(kyc.addressFile, MAX_DOC_BYTES);
      if (!s.ok) errors.addressFile = s.message;
    }
    return errors;
  }, [kyc]);

  const bankValid = Object.keys(bankErrors).length === 0;
  const kycValid = Object.keys(kycErrors).length === 0;

  const [note, setNote] = useState('');
  const noteErr = useMemo(() => {
    const r = validateMaxLength(note, 200, 'Note');
    return r.ok ? null : r.message;
  }, [note]);

  const completeSetup = () => {
    if (!bankValid || !kycValid) return;
    setPayoutReady(true);
    setReady(true);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-extrabold text-gray-900 leading-tight">Payouts</h1>
          <p className="text-[13px] text-gray-400 font-medium mt-1">
            Add bank details and complete KYC so we can release your earnings safely.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ready ? (
            <StatusChip label="Payouts ready" tone="success" dotClassName="bg-emerald-400" />
          ) : (
            <StatusChip label="Setup required" tone="warning" dotClassName="bg-primary-400" />
          )}
          <Link
            to="/creator/earnings"
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors"
          >
            View earnings
          </Link>
        </div>
      </div>

      {/* Readiness card */}
      <div className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Readiness</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-gray-900">Bank details</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{bankValid ? 'Looks good.' : 'Required to accept deals & withdraw.'}</p>
              <div className="mt-2">
                {bankValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                    <XCircle className="w-4 h-4" /> Incomplete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-gray-900">KYC</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{kycValid ? 'Documents uploaded.' : 'Upload PAN + address proof.'}</p>
              <div className="mt-2">
                {kycValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                    <XCircle className="w-4 h-4" /> Incomplete
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { setPayoutReady(false); setReady(false); }}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors"
          >
            Reset (mock)
          </button>
          <button
            type="button"
            onClick={completeSetup}
            disabled={!bankValid || !kycValid}
            className={`px-4 py-2.5 rounded-2xl text-[12px] font-extrabold transition-colors ${
              bankValid && kycValid ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Mark setup complete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bank form */}
        <div className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bank details</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Beneficiary name</label>
              <input
                value={bank.beneficiaryName}
                onChange={(e) => setBank((b) => ({ ...b, beneficiaryName: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                placeholder="As per bank account"
              />
              {bankErrors.beneficiaryName && <p className="text-[11px] text-red-600 font-semibold mt-1">{bankErrors.beneficiaryName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Account number</label>
                <input
                  value={bank.accountNumber}
                  onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value.replace(/\s/g, '') }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  inputMode="numeric"
                  placeholder="XXXXXXXXXXXX"
                />
                {bankErrors.accountNumber && <p className="text-[11px] text-red-600 font-semibold mt-1">{bankErrors.accountNumber}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Confirm account number</label>
                <input
                  value={bank.confirmAccountNumber}
                  onChange={(e) => setBank((b) => ({ ...b, confirmAccountNumber: e.target.value.replace(/\s/g, '') }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  inputMode="numeric"
                  placeholder="Re-enter"
                />
                {bankErrors.confirmAccountNumber && <p className="text-[11px] text-red-600 font-semibold mt-1">{bankErrors.confirmAccountNumber}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">IFSC</label>
              <input
                value={bank.ifsc}
                onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                placeholder="HDFC0001234"
              />
              {bankErrors.ifsc && <p className="text-[11px] text-red-600 font-semibold mt-1">{bankErrors.ifsc}</p>}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {/* mock save */}}
                disabled={!bankValid}
                className={`w-full px-4 py-3 rounded-2xl text-[13px] font-extrabold transition-colors ${
                  bankValid ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Save bank details
              </button>
            </div>
          </div>
        </div>

        {/* KYC form */}
        <div className="rounded-3xl border border-gray-100/80 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">KYC</p>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">PAN</label>
                <input
                  value={kyc.pan}
                  onChange={(e) => setKyc((k) => ({ ...k, pan: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  placeholder="ABCDE1234F"
                />
                {kycErrors.pan && <p className="text-[11px] text-red-600 font-semibold mt-1">{kycErrors.pan}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Aadhaar (last 4)</label>
                <input
                  value={kyc.aadhaarLast4}
                  onChange={(e) => setKyc((k) => ({ ...k, aadhaarLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  inputMode="numeric"
                  placeholder="1234"
                />
                {kycErrors.aadhaarLast4 && <p className="text-[11px] text-red-600 font-semibold mt-1">{kycErrors.aadhaarLast4}</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-[12px] font-extrabold text-gray-900">Upload documents</p>
              <p className="text-[11px] text-gray-500 mt-0.5">PDF/JPG/PNG up to 5MB each.</p>

              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">PAN document</p>
                    <p className="text-[11px] text-gray-500">{kyc.panFile ? kyc.panFile.name : 'No file selected'}</p>
                    {kycErrors.panFile && <p className="text-[11px] text-red-600 font-semibold mt-1">{kycErrors.panFile}</p>}
                  </div>
                  <label className="inline-flex">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setKyc((k) => ({ ...k, panFile: e.target.files?.[0] ?? null }))}
                    />
                    <span className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      Choose
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700">Address proof</p>
                    <p className="text-[11px] text-gray-500">{kyc.addressFile ? kyc.addressFile.name : 'No file selected'}</p>
                    {kycErrors.addressFile && <p className="text-[11px] text-red-600 font-semibold mt-1">{kycErrors.addressFile}</p>}
                  </div>
                  <label className="inline-flex">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setKyc((k) => ({ ...k, addressFile: e.target.files?.[0] ?? null }))}
                    />
                    <span className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-[12px] font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 inline-block mr-2" />
                      Choose
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                placeholder="Any details for verification team (optional)"
              />
              {noteErr && <p className="text-[11px] text-red-600 font-semibold mt-1">{noteErr}</p>}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {/* mock save */}}
                disabled={!kycValid || !!noteErr}
                className={`w-full px-4 py-3 rounded-2xl text-[13px] font-extrabold transition-colors ${
                  kycValid && !noteErr ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit KYC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPayouts;

