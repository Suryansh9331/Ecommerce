import React, { useState } from 'react';
import { Upload, X, Play, Image as ImageIcon, AlertCircle, Eye } from 'lucide-react';
import { cloudinaryService, UploadProgress } from '../../../../../services/cloudinaryService';

interface MediaFile {
  type: 'image' | 'video';
  file: File;
  url: string; // Cloudinary URL after upload
  public_id?: string; // Cloudinary public ID
  is_primary: boolean;
  isUploading?: boolean;
  previewUrl?: string; // Local preview URL before upload
}

interface MediaStepProps {
  data: MediaFile[];
  onChange: (media: MediaFile[]) => void;
}

const MediaStep: React.FC<MediaStepProps> = ({ data, onChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewModal, setPreviewModal] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  const MAX_IMAGES = 4;
  const MAX_VIDEOS = 1;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];

  const imageCount = data.filter(item => item.type === 'image').length;
  const videoCount = data.filter(item => item.type === 'video').length;

  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return 'Only image and video files are allowed';
    }

    if (isImage) {
      if (imageCount >= MAX_IMAGES) {
        return `Maximum ${MAX_IMAGES} images allowed`;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Invalid image format. Please use JPEG, PNG, SVG, or WebP';
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return 'Image size must be less than 5MB';
      }
    }

    if (isVideo) {
      if (videoCount >= MAX_VIDEOS) {
        return `Maximum ${MAX_VIDEOS} video allowed`;
      }
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return 'Invalid video format. Please use MP4, MOV, or AVI';
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return 'Video size must be less than 50MB';
      }
    }

    return null;
  };

  const handleFileUpload = async (files: FileList) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Validate all files first
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    if (validFiles.length === 0) return;

    setErrors([]);

    try {
      // Create preview media items first
      const previewMediaItems: MediaFile[] = validFiles.map((file) => {
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const is_primary = type === 'image' && imageCount === 0; // First image is primary
        
        return {
          type: type as 'image' | 'video',
          file,
          url: '', // Will be filled after upload
          previewUrl: cloudinaryService.generatePreviewUrl(file),
          is_primary,
          isUploading: true
        };
      });

      // Add preview items to state
      onChange([...data, ...previewMediaItems]);

      // Upload files to Cloudinary
      const uploadResults = await cloudinaryService.uploadMultipleFiles(
        validFiles,
        'products',
        setUploadProgress
      );

      // Update media items with Cloudinary URLs
      const updatedMediaItems: MediaFile[] = previewMediaItems.map((item, index) => {
        const result = uploadResults[index];
        
        // Clean up preview URL
        if (item.previewUrl) {
          cloudinaryService.revokePreviewUrl(item.previewUrl);
        }
        
        return {
          ...item,
          url: result.secure_url,
          public_id: result.public_id,
          isUploading: false,
          previewUrl: undefined
        };
      });

      // Replace preview items with uploaded items
      const finalData = [
        ...data,
        ...updatedMediaItems
      ];

      onChange(finalData);
      
    } catch (error: any) {
      setErrors([error.message || 'Upload failed']);
      
      // Remove failed uploads from state
      const currentData = [...data];
      onChange(currentData);
    } finally {
      setUploadProgress([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const removeMedia = async (index: number) => {
    const newData = [...data];
    const removedItem = newData[index];
    
    // Clean up preview URL if exists
    if (removedItem.previewUrl) {
      cloudinaryService.revokePreviewUrl(removedItem.previewUrl);
    }
    
    // Delete from Cloudinary if uploaded
    if (removedItem.public_id) {
      try {
        await cloudinaryService.deleteMedia(removedItem.public_id);
      } catch (error) {
        console.warn('Failed to delete media from Cloudinary:', error);
      }
    }
    
    newData.splice(index, 1);
    
    // If we removed the primary image, make the first image primary
    if (removedItem.is_primary && removedItem.type === 'image') {
      const firstImage = newData.find(item => item.type === 'image');
      if (firstImage) {
        firstImage.is_primary = true;
      }
    }
    
    onChange(newData);
  };

  const setPrimaryImage = (index: number) => {
    const newData = [...data];
    
    // Remove primary flag from all images
    newData.forEach(item => {
      if (item.type === 'image') {
        item.is_primary = false;
      }
    });
    
    // Set the selected image as primary
    if (newData[index].type === 'image') {
      newData[index].is_primary = true;
    }
    
    onChange(newData);
  };

  const openPreview = (item: MediaFile) => {
    setPreviewModal({ type: item.type, url: item.url });
  };

  const closePreview = () => {
    setPreviewModal(null);
  };

  const hasAtLeastOneImage = data.some(item => item.type === 'image');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <ImageIcon className="text-primary-500" size={32} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Product Media</h3>
        <p className="text-gray-600">Upload images and videos to showcase your product</p>
      </div>

      {/* Requirements */}
      <div className="max-w-2xl mx-auto bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Media Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Maximum {MAX_IMAGES} images (at least 1 required)</li>
          <li>• Maximum {MAX_VIDEOS} video (optional)</li>
          <li>• Images: Max 5MB each (JPEG, PNG, SVG, WebP)</li>
          <li>• Videos: Max 50MB (MP4, MOV, AVI - will be converted to MP4)</li>
        </ul>
      </div>

      {/* Validation Errors */}
      {!hasAtLeastOneImage && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={16} />
            <span className="text-red-700 text-sm">At least one product image is required</span>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 p-4 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">Upload Errors:</h4>
          <ul className="text-sm text-red-800 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Area */}
      <div className="max-w-2xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your images and videos, or browse your files
          </p>
          
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg cursor-pointer"
          >
            <Upload size={16} className="mr-2" />
            Browse Files
          </label>
          
          <p className="text-xs text-gray-500 mt-2">
            Images: {imageCount}/{MAX_IMAGES} | Videos: {videoCount}/{MAX_VIDEOS}
          </p>
        </div>
      </div>

      {/* Media Preview */}
      {data.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h4 className="font-medium text-gray-900 mb-4">Uploaded Media</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((item, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.previewUrl || item.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Play className="text-gray-500" size={32} />
                      <video
                        src={item.previewUrl || item.url}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    </div>
                  )}
                  
                  {/* Upload Progress Overlay */}
                  {item.isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-white text-sm">Uploading...</span>
                      {uploadProgress.find(p => p.fileName === item.file?.name)?.progress && (
                        <div className="w-20 h-2 bg-gray-300 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ 
                              width: `${uploadProgress.find(p => p.fileName === item.file?.name)?.progress || 0}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Primary Image Badge */}
                {item.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
                
                {/* Actions */}
                {!item.isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                      <button
                        onClick={() => openPreview(item)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {item.type === 'image' && !item.is_primary && (
                        <button
                          onClick={() => setPrimaryImage(index)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="Set as primary"
                        >
                          <ImageIcon size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeMedia(index)}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* File Info */}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="truncate">{item.file?.name || 'Uploaded media'}</p>
                  {item.file && (
                    <p>{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  )}
                  {item.isUploading && (
                    <p className="text-primary-500">Uploading...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
              >
                <X size={20} />
              </button>
              
              {previewModal.type === 'image' ? (
                <img
                  src={previewModal.url}
                  alt="Preview"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : (
                <video
                  src={previewModal.url}
                  controls
                  className="max-w-full max-h-[80vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaStep;
