import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Eye } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from './ToastContainer';
interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null, url: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  showViewButton?: boolean;
}


const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = "Choose file or drag & drop",
  className = "",
  disabled = false,
  accept = "image/*",
  maxSize = 5,
  showViewButton = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { toasts, error: showError } = useToast();
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileSelect = (file: File) => {
    if (disabled) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      showError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
     showError('Please select an image file');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // Call onChange with file and preview URL
    onChange(file, previewUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${preview ? 'border-solid border-gray-200' : ''}
        `}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 sm:h-40 object-cover rounded-lg"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                <div className="flex space-x-2">
                  {showViewButton && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImageModal(true);
                      }}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                      title="View image"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Change image"
                  >
                    <Upload size={16} />
                  </button>
                  <button
                    onClick={handleRemove}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ImageIcon className="text-gray-400" size={24} />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">{placeholder}</p>
            <p className="text-xs text-gray-500 mb-1">
              PNG, JPG, JPEG, SVG, WEBP up to {maxSize}MB
            </p>
            <button
              type="button"
              className="mt-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Image View Modal */}
      {showImageModal && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-[90vh] relative">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img
              src={preview}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default ImageUpload;
