import React, { useState, useEffect } from 'react';
import { FileText, Search, Tag } from 'lucide-react';

interface MetaData {
  short_desc: string;
  full_desc: string;
  meta_title: string;
  meta_desc: string;
  meta_keywords: string;
}

interface MetaStepProps {
  data: MetaData;
  onChange: (meta: MetaData) => void;
}

const MetaStep: React.FC<MetaStepProps> = ({ data, onChange }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof MetaData, value: string) => {
    const newData = { ...data, [field]: value };
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    onChange(newData);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.short_desc.trim()) newErrors.short_desc = 'Short description is required';
    if (!data.full_desc.trim()) newErrors.full_desc = 'Full description is required';
    if (data.meta_title.length > 60) newErrors.meta_title = 'Meta title should be under 60 characters';
    if (data.meta_desc.length > 160) newErrors.meta_desc = 'Meta description should be under 160 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format text for preview (simple markdown-like formatting)
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/(\n\n)/g, '</p><p>')
      .replace(/^(.+)$/m, '<p>$1</p>');
  };

  // Auto-generate meta fields from content
  const autoGenerateMeta = () => {
    if (!data.meta_title && data.short_desc) {
      handleInputChange('meta_title', data.short_desc.substring(0, 55));
    }
    if (!data.meta_desc && data.short_desc) {
      handleInputChange('meta_desc', data.short_desc.substring(0, 155));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <FileText className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Product Descriptions & SEO</h3>
        <p className="text-gray-600">Create compelling descriptions and optimize for search engines</p>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description *
          </label>
          <textarea
            value={data.short_desc}
            onChange={(e) => handleInputChange('short_desc', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
              errors.short_desc ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief product description for product cards and search results"
          />
          {errors.short_desc && <p className="text-red-500 text-xs mt-1">{errors.short_desc}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Used in product cards, search results, and can auto-populate meta description
          </p>
        </div>

        {/* Full Description with Formatting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description *
          </label>
          
          {/* Formatting Toolbar */}
          <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center space-x-4">
            <div className="text-xs text-gray-600">Formatting:</div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="bg-white px-2 py-1 rounded border">**Bold**</span>
              <span className="bg-white px-2 py-1 rounded border">*Italic*</span>
              <span className="bg-white px-2 py-1 rounded border">- List</span>
              <span className="bg-white px-2 py-1 rounded border">1. Numbered</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="ml-auto text-primary-600 hover:text-primary-700 text-xs"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          
          {showPreview ? (
            <div 
              className="w-full min-h-[200px] px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg bg-white prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(data.full_desc) }}
            />
          ) : (
            <textarea
              value={data.full_desc}
              onChange={(e) => handleInputChange('full_desc', e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.full_desc ? 'border-red-500' : ''
              }`}
              placeholder="Detailed product description with features, benefits, and specifications.

Use formatting:
**Bold text** for emphasis
*Italic text* for style
- Bullet points for features
1. Numbered lists for steps

This will be displayed on the product page with proper formatting."
            />
          )}
          {errors.full_desc && <p className="text-red-500 text-xs mt-1">{errors.full_desc}</p>}
        </div>

        {/* SEO Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Search className="mr-2 text-gray-500" size={20} />
              SEO Optimization
            </h4>
            <button
              type="button"
              onClick={autoGenerateMeta}
              className="text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1 rounded"
            >
              Auto-Generate
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
                <span className="text-gray-500 font-normal">({data.meta_title.length}/60)</span>
              </label>
              <input
                type="text"
                value={data.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.meta_title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="SEO-friendly title for search engines"
                maxLength={60}
              />
              {errors.meta_title && <p className="text-red-500 text-xs mt-1">{errors.meta_title}</p>}
              <p className="text-gray-500 text-xs mt-1">Appears in search engine results</p>
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Keywords
                <Tag className="inline ml-1" size={14} />
              </label>
              <input
                type="text"
                value={data.meta_keywords}
                onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-gray-500 text-xs mt-1">Comma-separated keywords for SEO</p>
            </div>
          </div>

          {/* Meta Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
              <span className="text-gray-500 font-normal">({data.meta_desc.length}/160)</span>
            </label>
            <textarea
              value={data.meta_desc}
              onChange={(e) => handleInputChange('meta_desc', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.meta_desc ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description that appears in search engine results"
              maxLength={160}
            />
            {errors.meta_desc && <p className="text-red-500 text-xs mt-1">{errors.meta_desc}</p>}
            <p className="text-gray-500 text-xs mt-1">Shown in search engine results below the title</p>
          </div>
        </div>

          {/* SEO Preview
          {(data.meta_title || data.meta_desc) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Search Engine Preview</h4>
              <div className="bg-white p-3 rounded border">
                <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {data.meta_title || 'Product Title'}
                </div>
                <div className="text-green-600 text-sm">
                  {window.location.origin}/product/{data.meta_title?.toLowerCase().replace(/\s+/g, '-') || 'product-name'}
                </div>
                <div className="text-gray-600 text-sm mt-1">
                  {data.meta_desc || data.short_desc || 'Product description will appear here...'}
                </div>
              </div>
            </div>
          )} */}

        {/* Content Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Content Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use descriptive, benefit-focused language in descriptions</li>
            <li>• Include key product features and specifications</li>
            <li>• Use bullet points and numbered lists for better readability</li>
            <li>• Meta title should be under 60 characters for best SEO results</li>
            <li>• Meta description should be 150-160 characters for optimal display</li>
            <li>• Include relevant keywords naturally in your content</li>
            <li>• Use formatting to make content scannable and engaging</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MetaStep;
