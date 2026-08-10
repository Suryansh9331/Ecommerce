import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { AI_API_URL } from '../../../../../config';

interface AIProductAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestions: (suggestions: {
    shortDescription: string;
    fullDescription: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }) => void;
  productName?: string;
  productImages?: string[]; // Cloudinary URLs from product media
}

const AIProductAssistant: React.FC<AIProductAssistantProps> = ({
  isOpen,
  onClose,
  onApplySuggestions,
  productName = '',
  productImages = [],
}) => {
  const [productTitle, setProductTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    shortDescription: string;
    fullDescription: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<'input' | 'results'>('input');

  // Update product title when prop changes
  React.useEffect(() => {
    if (productName) {
      setProductTitle(productName);
    }
  }, [productName]);


  const handleGenerate = async () => {
    if (!productTitle.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      // AI service not configured -> skip the network call and use the local
      // fallback content instead of fetching "undefined/api/...".
      if (!AI_API_URL) {
        throw new Error('AI service is not configured (VITE_AI_API_URL missing)');
      }

      // Use product images from props (Cloudinary URLs)
      let imageUrls: string[] = productImages.slice(0, 5); // Max 5 images

      // If no images provided, use a placeholder
      if (imageUrls.length === 0) {
        imageUrls = ['https://via.placeholder.com/300'];
      }

      // Call AI API
      const response = await fetch(`${AI_API_URL}/api/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: `temp-${Date.now()}`,
          product_name: productTitle,
          image_urls: imageUrls,
          tone: 'professional and informative'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      
      // Map API response to component format
      const formattedContent = {
        shortDescription: data.product_meta.short_desc || '',
        fullDescription: data.product_meta.full_desc || '',
        metaTitle: data.product_meta.meta_title || '',
        metaDescription: data.product_meta.meta_desc || '',
        metaKeywords: data.product_meta.meta_keywords || ''
      };

      setGeneratedContent(formattedContent);
      setCurrentStep('results');
    } catch (error) {
      console.error('Error generating content:', error);
      
      // Fallback to mock data if API fails
      const mockContent = {
        shortDescription: `<p>Premium <strong>${productTitle}</strong> crafted with exceptional quality and attention to detail. Perfect for everyday use with outstanding durability and style.</p>`,
        fullDescription: `<h3>About ${productTitle}</h3><p>Experience the perfect blend of quality and functionality with our ${productTitle}. Designed with the modern consumer in mind, this product offers:</p><ul><li><strong>Superior Quality:</strong> Made from high-grade materials ensuring long-lasting performance</li><li><strong>Elegant Design:</strong> Sleek and modern aesthetics that complement any style</li><li><strong>Practical Features:</strong> Thoughtfully designed for maximum convenience and usability</li><li><strong>Eco-Friendly:</strong> Sustainably sourced materials and responsible manufacturing</li></ul><h3>Key Features</h3><p>Our ${productTitle} stands out with its attention to detail and commitment to excellence. Whether you're looking for reliability, style, or functionality, this product delivers on all fronts.</p><h3>Why Choose This Product?</h3><p>Backed by our commitment to customer satisfaction, this ${productTitle} represents the best value in its category. Perfect for gift-giving or personal use, it's designed to exceed expectations.</p>`,
        metaTitle: `${productTitle} - Premium Quality | Best Price Online`,
        metaDescription: `Shop premium ${productTitle} at the best prices. High-quality, durable, and stylish. Free shipping available. Order now and experience excellence!`,
        metaKeywords: `${productTitle.toLowerCase()}, premium ${productTitle.toLowerCase()}, buy ${productTitle.toLowerCase()}, best ${productTitle.toLowerCase()}, quality ${productTitle.toLowerCase()}`
      };

      setGeneratedContent(mockContent);
      setCurrentStep('results');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApplySuggestions(generatedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setProductTitle(productName || '');
    setGeneratedContent(null);
    setCurrentStep('input');
    setIsGenerating(false);
    onClose();
  };

  const handleStartOver = () => {
    setGeneratedContent(null);
    setCurrentStep('input');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white bg-opacity-20">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-white">
                          AI Product Assistant
                        </Dialog.Title>
                        <p className="text-sm text-orange-100">
                          Generate product descriptions and SEO content instantly
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="rounded-full p-1 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {currentStep === 'input' && (
                    <div className="space-y-6">
                      {/* Progress Steps */}
                      <div className="flex items-center justify-center space-x-4 pb-6 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                            1
                          </div>
                          <span className="text-sm font-medium text-gray-900">Product Details</span>
                        </div>
                        <div className="h-px w-16 bg-gray-300" />
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500 font-semibold text-sm">
                            2
                          </div>
                          <span className="text-sm font-medium text-gray-500">AI Generation</span>
                        </div>
                        <div className="h-px w-16 bg-gray-300" />
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500 font-semibold text-sm">
                            3
                          </div>
                          <span className="text-sm font-medium text-gray-500">Review & Apply</span>
                        </div>
                      </div>

                      {/* Product Title Input */}
                      <div>
                        <label htmlFor="ai-product-title" className="block text-sm font-medium text-gray-700 mb-2">
                          Product Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="ai-product-title"
                          value={productTitle}
                          onChange={(e) => setProductTitle(e.target.value)}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          placeholder="e.g., Wireless Bluetooth Headphones"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter your product name to help AI generate relevant content
                        </p>
                      </div>

                      {/* Product Images Display */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Images
                        </label>
                        
                        {productImages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <PhotoIcon className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No product images available</p>
                            <p className="text-xs text-gray-400 mt-1">AI will use placeholder image</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-3">
                              {productImages.slice(0, 5).map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg" />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-green-600 flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Using {productImages.length} product {productImages.length === 1 ? 'image' : 'images'} from your uploaded media
                            </p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          AI will use your product images to generate more accurate descriptions
                        </p>
                      </div>

                      {/* Generate Button */}
                      <div className="pt-4">
                        <button
                          onClick={handleGenerate}
                          disabled={!productTitle.trim() || isGenerating}
                          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Generating Content...</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-5 w-5" />
                              <span>Generate with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 'results' && generatedContent && (
                    <div className="space-y-6">
                      {/* Success Message */}
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Content Generated Successfully!</p>
                          <p className="text-xs text-green-600">Review the suggestions below and apply them to your product.</p>
                        </div>
                      </div>

                      {/* Generated Content Preview */}
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {/* Short Description */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Short Description</h4>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: generatedContent.shortDescription }}
                          />
                        </div>

                        {/* Full Description */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Full Description</h4>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: generatedContent.fullDescription }}
                          />
                        </div>

                        {/* SEO Suggestions */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                            SEO Suggestions
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Meta Title</label>
                              <p className="text-sm text-gray-800 mt-1">{generatedContent.metaTitle}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Meta Description</label>
                              <p className="text-sm text-gray-800 mt-1">{generatedContent.metaDescription}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Meta Keywords</label>
                              <p className="text-sm text-gray-800 mt-1">{generatedContent.metaKeywords}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        {/* <button
                          onClick={handleStartOver}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                          Generate Again
                        </button> */}
                        <div className="flex space-x-3">
                          <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleApply}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                          >
                            Apply to Product
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AIProductAssistant;

