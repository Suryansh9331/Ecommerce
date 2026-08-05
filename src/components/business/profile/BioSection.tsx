import { useEffect, useState } from 'react';
import { IdentificationIcon, LinkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  BIO_LINK_LABEL_MAX_CHARS,
  BIO_MAX_CHARS,
  BIO_MAX_LINES,
  updateBio,
  type BioFields
} from '../../../services/merchantProfileApi';

interface BioSectionProps {
  /** Current values from GET /api/merchants/profile. */
  value: BioFields;
  /** Server-reported limits, falling back to the module defaults. */
  limits?: { bio_max_chars?: number; bio_max_lines?: number; bio_link_label_max_chars?: number };
  onSaved: (fields: BioFields) => void;
}

const BioSection = ({ value, limits, onSaved }: BioSectionProps) => {
  const maxChars = limits?.bio_max_chars ?? BIO_MAX_CHARS;
  const maxLines = limits?.bio_max_lines ?? BIO_MAX_LINES;
  const maxLabelChars = limits?.bio_link_label_max_chars ?? BIO_LINK_LABEL_MAX_CHARS;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState(value.bio ?? '');
  const [bioLink, setBioLink] = useState(value.bio_link ?? '');
  const [bioLinkLabel, setBioLinkLabel] = useState(value.bio_link_label ?? '');

  // Re-sync when the parent reloads the profile (e.g. after a save elsewhere).
  useEffect(() => {
    if (isEditing) return;
    setBio(value.bio ?? '');
    setBioLink(value.bio_link ?? '');
    setBioLinkLabel(value.bio_link_label ?? '');
  }, [value.bio, value.bio_link, value.bio_link_label, isEditing]);

  const lineCount = bio.length === 0 ? 0 : bio.split('\n').length;
  const overLength = bio.length > maxChars;
  const overLines = lineCount > maxLines;
  const canSave = !overLength && !overLines && !saving;

  const handleCancel = () => {
    setBio(value.bio ?? '');
    setBioLink(value.bio_link ?? '');
    setBioLinkLabel(value.bio_link_label ?? '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Send empty strings rather than omitting: the backend treats an absent
      // key as "unchanged" and an empty value as "clear this field".
      const saved = await updateBio({
        bio: bio.trim(),
        bio_link: bioLink.trim(),
        bio_link_label: bioLinkLabel.trim()
      });
      onSaved(saved);
      setIsEditing(false);
      toast.success('Bio updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update bio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <IdentificationIcon className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Bio</h2>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-orange-500 text-sm font-medium rounded-md text-orange-500 hover:bg-orange-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-6">
          A short introduction shown on your public profile. Your longer
          &ldquo;Business Description&rdquo; stays separate.
        </p>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={bio}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                placeholder={'Handmade brass décor from Moradabad ✨\nShips worldwide.'}
                className={`block w-full rounded-md border px-3 py-2 focus:ring-orange-500 ${
                  overLength || overLines
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange-500'
                }`}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className={overLines ? 'text-red-600' : 'text-gray-500'}>
                  {overLines
                    ? `Too many lines — keep it to ${maxLines}.`
                    : `Up to ${maxLines} lines. Emoji are welcome.`}
                </span>
                <span className={overLength ? 'text-red-600 font-medium' : 'text-gray-500'}>
                  {bio.length}/{maxChars}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                <div className="flex rounded-md border border-gray-300">
                  <div className="px-3 py-2 text-gray-500">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    value={bioLink}
                    onChange={(e) => setBioLink(e.target.value)}
                    placeholder="https://example.com"
                    className="block w-full rounded-r-md border-0 px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">One link, shown under your bio.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link label</label>
                <input
                  type="text"
                  value={bioLinkLabel}
                  maxLength={maxLabelChars}
                  onChange={(e) => setBioLinkLabel(e.target.value)}
                  placeholder="Our catalogue"
                  disabled={!bioLink.trim()}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {bioLink.trim() ? 'Optional. Defaults to the URL.' : 'Add a link first.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {value.bio ? (
              // whitespace-pre-line preserves the merchant's line breaks. The
              // value is rendered as text, never as HTML.
              <p className="text-gray-900 whitespace-pre-line">{value.bio}</p>
            ) : (
              <p className="text-gray-500 italic">No bio yet. Add one so shoppers know who you are.</p>
            )}
            {value.bio_link && (
              <a
                href={value.bio_link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 break-all"
              >
                <LinkIcon className="w-4 h-4 shrink-0" />
                {value.bio_link_label || value.bio_link}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BioSection;
