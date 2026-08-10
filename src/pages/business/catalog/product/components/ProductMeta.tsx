import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { SparklesIcon } from '@heroicons/react/24/solid';
import AIProductAssistant from './AIProductAssistant';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ProductMetaProps {
  productId: number;
  productName?: string;
  productImages?: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  shortDescription: string;
  fullDescription: string;
  onMetaChange: (field: string, value: string) => void;
  errors?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    shortDescription?: string;
    fullDescription?: string;
  };
}

// Toolbar button component
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`px-2 py-1 text-sm rounded border transition-colors ${
      isActive
        ? 'bg-primary-100 border-primary-400 text-primary-700'
        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

// Reusable TipTap editor with toolbar
const RichTextEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  minHeight?: string;
  hasError?: boolean;
}> = ({ value, onChange, placeholder, minHeight = '8rem', hasError }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Return empty string instead of empty paragraph HTML so trim() checks work
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange(html);
    },
  });

  if (!editor) return null;

  return (
    <div className={`border rounded-md overflow-hidden ${hasError ? 'border-red-300' : 'border-gray-300'}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: level as 1|2|3 }).run();
          }}
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-600"
          value={
            editor.isActive('heading', { level: 1 }) ? 1 :
            editor.isActive('heading', { level: 2 }) ? 2 :
            editor.isActive('heading', { level: 3 }) ? 3 : 0
          }
        >
          <option value={0}>Normal</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline?.().run()} isActive={editor.isActive('underline')} title="Underline">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered list">
          1.
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
          •
        </ToolbarButton>

        <span className="w-px bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
          isActive={editor.isActive('link')}
          title="Link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          ✕
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none"
        style={{ minHeight }}
      />

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tiptap:focus { outline: none; }
      `}</style>
    </div>
  );
};

const ProductMeta: React.FC<ProductMetaProps> = ({
  productId,
  productName = '',
  productImages = [],
  metaTitle,
  metaDescription,
  metaKeywords,
  shortDescription,
  fullDescription,
  onMetaChange,
  errors = {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const handleUpdateMeta = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!shortDescription.trim()) {
        setError('Short description is required');
        return;
      }
      if (!fullDescription.trim()) {
        setError('Full description is required');
        return;
      }

      const metaData = {
        short_desc: shortDescription.trim(),
        full_desc: fullDescription.trim(),
        meta_title: metaTitle.trim(),
        meta_desc: metaDescription.trim(),
        meta_keywords: metaKeywords.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/meta`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update meta data');
      }

      const updatedData = await response.json();
      setSuccess('Meta data updated successfully');
      onMetaChange('shortDescription', updatedData.short_desc || '');
      onMetaChange('fullDescription', updatedData.full_desc || '');
      onMetaChange('metaTitle', updatedData.meta_title || '');
      onMetaChange('metaDescription', updatedData.meta_desc || '');
      onMetaChange('metaKeywords', updatedData.meta_keywords || '');
    } catch (err) {
      console.error('Error updating meta data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update meta data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const generateMetaKeywords = (text: string): string => {
    if (!text) return '';
    const textWithoutHtml = stripHtmlTags(text);
    const cleanText = textWithoutHtml.toLowerCase().replace(/[^\w\s]/g, '');
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    const words = cleanText.split(/\s+/).filter(word => word.length > 3 && !commonWords.includes(word));
    return [...new Set(words)].slice(0, 10).join(', ');
  };

  const handleDescriptionChange = (field: 'shortDescription' | 'fullDescription', value: string) => {
    onMetaChange(field, value);
    if (field === 'shortDescription') {
      const cleanText = stripHtmlTags(value);
      onMetaChange('metaTitle', cleanText.slice(0, 100));
    }
    if (field === 'fullDescription') {
      const cleanText = stripHtmlTags(value);
      onMetaChange('metaDescription', cleanText.slice(0, 255));
      onMetaChange('metaKeywords', generateMetaKeywords(value));
    }
  };

  const handleAIApply = (suggestions: {
    shortDescription: string;
    fullDescription: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }) => {
    onMetaChange('shortDescription', suggestions.shortDescription);
    onMetaChange('fullDescription', suggestions.fullDescription);
    onMetaChange('metaTitle', suggestions.metaTitle);
    onMetaChange('metaDescription', suggestions.metaDescription);
    onMetaChange('metaKeywords', suggestions.metaKeywords);
    setSuccess('AI suggestions applied successfully! Review and update as needed.');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AIProductAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onApplySuggestions={handleAIApply}
        productName={productName}
        productImages={productImages}
      />

      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600">
                <SparklesIcon className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Try Our AI Product Assistant</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Save time and create compelling product descriptions! Our AI can generate professional descriptions,
                SEO-optimized content, and meta tags based on your product title and images.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="flex items-center bg-white px-3 py-1 rounded-full">✨ Auto-generate descriptions</span>
                <span className="flex items-center bg-white px-3 py-1 rounded-full">🎯 SEO optimization</span>
                <span className="flex items-center bg-white px-3 py-1 rounded-full">⚡ Instant results</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex-shrink-0 ml-4 inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Generate with AI
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
        <RichTextEditor
          value={shortDescription}
          onChange={(content) => handleDescriptionChange('shortDescription', content)}
          placeholder="Enter a brief description (max 255 characters)"
          minHeight="8rem"
          hasError={!!errors.shortDescription}
        />
        {errors.shortDescription && <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>}
        <p className="mt-1 text-xs text-gray-500">You can use formatting options like bold, italic, bullet points, etc.</p>
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
        <RichTextEditor
          value={fullDescription}
          onChange={(content) => handleDescriptionChange('fullDescription', content)}
          placeholder="Enter detailed product description"
          minHeight="16rem"
          hasError={!!errors.fullDescription}
        />
        {errors.fullDescription && <p className="mt-1 text-sm text-red-600">{errors.fullDescription}</p>}
        <p className="mt-1 text-xs text-gray-500">Use the toolbar above to format your text with bullet points, headings, and other styles.</p>
      </div>

      {/* Meta Title */}
      <div>
        <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">Meta Title</label>
        <input
          type="text"
          id="metaTitle"
          value={metaTitle}
          onChange={(e) => onMetaChange('metaTitle', e.target.value)}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${
            errors.metaTitle
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="Enter meta title (max 100 characters)"
          maxLength={100}
        />
        {errors.metaTitle && <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>}
        <p className="mt-1 text-xs text-gray-500">Recommended length: 50-60 characters</p>
      </div>

      {/* Meta Description */}
      <div>
        <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">Meta Description</label>
        <textarea
          id="metaDescription"
          rows={3}
          value={metaDescription}
          onChange={(e) => onMetaChange('metaDescription', e.target.value)}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${
            errors.metaDescription
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="Enter meta description (max 255 characters)"
          maxLength={255}
        />
        {errors.metaDescription && <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>}
        <p className="mt-1 text-xs text-gray-500">Recommended length: 150-160 characters</p>
      </div>

      {/* Meta Keywords */}
      <div>
        <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700">Meta Keywords</label>
        <input
          type="text"
          id="metaKeywords"
          value={metaKeywords}
          onChange={(e) => onMetaChange('metaKeywords', e.target.value)}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${
            errors.metaKeywords
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }`}
          placeholder="Enter keywords separated by commas"
        />
        {errors.metaKeywords && <p className="mt-1 text-sm text-red-600">{errors.metaKeywords}</p>}
        <p className="mt-1 text-xs text-gray-500">Keywords are automatically generated from the full description. You can modify them manually.</p>
      </div>

      {/* SEO Preview */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Preview</h4>
        <div className="space-y-2">
          <div className="text-orange-600 text-sm truncate">{metaTitle || 'Your meta title will appear here'}</div>
          <div className="text-gray-600 text-xs line-clamp-2">{metaDescription || 'Your meta description will appear here'}</div>
        </div>
      </div>

      {/* Update Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpdateMeta}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : 'Update Meta Data'}
        </button>
      </div>
    </div>
  );
};

export default ProductMeta;