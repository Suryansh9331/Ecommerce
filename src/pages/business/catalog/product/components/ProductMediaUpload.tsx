import React, { useState, useCallback, useEffect } from 'react';
import { CloudArrowUpIcon, XMarkIcon, PlayIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Media {
  media_id: number;
  url: string;
  type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  public_id: string | null;
  product_id: number;
}

interface MediaStats {
  total_count: number;
  image_count: number;
  video_count: number;
  max_allowed: number;
  remaining_slots: number;
}

interface ProductMediaUploadProps {
  productId: number;
  onMediaChange?: (media: Media[]) => void;
  maxSize?: number; // in bytes (for images only)
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

const ProductMediaUpload: React.FC<ProductMediaUploadProps> = ({
  productId,
  onMediaChange,
  maxSize = 10 * 1024 * 1024, // 10MB for images
  onUploadComplete,
  onUploadError,
}) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchMedia();
      fetchMediaStats();
    }
  }, [productId]);

  const fetchMediaStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/media/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || 'Failed to fetch media stats';
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching media stats:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch media statistics';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      toast.error(errorMsg);
    }
  };

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/media`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || 'Failed to fetch media';
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // console.log('Media data from API:', data);
      setMedia(data);
      onMediaChange?.(data);
    } catch (error) {
      console.error('Error fetching media:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load media. Please try again later.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!productId) {
        const errorMsg = 'Product ID is required for media upload';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (!stats) {
        const errorMsg = 'Unable to fetch media statistics. Please try again.';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Check if any file is a video and if we already have a video
      const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
      const hasExistingVideo = stats.video_count > 0;
      
      if (videoFiles.length > 0 && hasExistingVideo) {
        const errorMsg = 'Only 1 video file is allowed per product. Please remove the existing video first.';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (videoFiles.length > 1) {
        const errorMsg = 'Only 1 video file can be uploaded at a time.';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (stats.remaining_slots < acceptedFiles.length) {
        const errorMsg = `You can only upload up to ${stats.remaining_slots} more files.`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setIsUploading(true);
      setError(null);

      for (const file of acceptedFiles) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const formData = new FormData();
          formData.append('media_file', file);
          formData.append('type', file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
          formData.append('sort_order', media.length.toString());

          const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/${productId}/media`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.message || `Failed to upload ${file.name}`;
            throw new Error(errorMsg);
          }

          const newMedia = await response.json();
          setMedia(prev => [...prev, newMedia]);
          onMediaChange?.([...media, newMedia]);
          await fetchMediaStats(); // Refresh stats after upload
          
          // Update progress to 100% for successful upload
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          toast.success(`${file.name} uploaded successfully!`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMsg = error instanceof Error ? error.message : `Failed to upload ${file.name}. Please try again.`;
          setError(errorMsg);
          onUploadError?.(errorMsg);
          toast.error(errorMsg);
        }
      }

      setIsUploading(false);
      onUploadComplete?.();
    },
    [media, stats, productId, onMediaChange, onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB for videos
    disabled: isUploading || !productId,
    validator: (file) => {
      // Custom validation for file size based on type
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (isVideo && file.size > 50 * 1024 * 1024) {
        toast.error(`Video file ${file.name} is too large. Maximum size is 50MB.`);
        return {
          code: "file-too-large",
          message: `Video file is too large. Maximum size is 50MB.`
        };
      }
      
      if (isImage && file.size > maxSize) {
        toast.error(`Image file ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
        return {
          code: "file-too-large",
          message: `Image file is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`
        };
      }
      
      return null;
    }
  });

  const removeMedia = async (mediaId: number) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/products/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || 'Failed to delete media';
        throw new Error(errorMsg);
      }

      setMedia(prev => prev.filter(m => m.media_id !== mediaId));
      onMediaChange?.(media.filter(m => m.media_id !== mediaId));
      await fetchMediaStats(); // Refresh stats after deletion
      toast.success('Media deleted successfully!');
    } catch (error) {
      console.error('Error deleting media:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete media. Please try again.';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return; // Dropped outside the list
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return; // No change in position
    }

    // Create a new array with reordered items
    const reorderedMedia = Array.from(media);
    const [removed] = reorderedMedia.splice(sourceIndex, 1);
    reorderedMedia.splice(destinationIndex, 0, removed);

    // Update local state immediately for better UX
    setMedia(reorderedMedia);
    onMediaChange?.(reorderedMedia);

    // Update sort orders in the backend
    try {
      const updatePromises = reorderedMedia.map((item, index) => {
        // Only update if the sort order actually changed
        const newSortOrder = index;
        if (item.sort_order !== newSortOrder) {
          return fetch(`${API_BASE_URL}/api/merchant-dashboard/products/media/${item.media_id}/update-order`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sort_order: newSortOrder }),
          });
        }
        return Promise.resolve(null);
      });

      await Promise.all(updatePromises.filter(p => p !== null));
      
      // Refresh media to get updated sort orders from backend
      await fetchMedia();
      toast.success('Media order updated successfully!');
    } catch (error) {
      console.error('Error updating media order:', error);
      // Revert to original order on error
      await fetchMedia();
      toast.error('Failed to update media order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Media Stats */}
      {stats && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Media</p>
              <p className="text-lg font-semibold">{stats.total_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Images</p>
              <p className="text-lg font-semibold">{stats.image_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-lg font-semibold">{stats.video_count}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining Slots</p>
              <p className="text-lg font-semibold">{stats.remaining_slots}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dropzone */}
      {stats && stats.remaining_slots > 0 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
            isUploading ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {isUploading
                ? 'Uploading...'
                : isDragActive
                ? 'Drop the files here...'
                : 'Drag and drop files here, or click to select files'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, GIF, WebP (max {maxSize / 1024 / 1024}MB), MP4, MOV, AVI (max 50MB). Only 1 video file allowed.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Media Grid with Drag and Drop */}
      {media.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="media-grid" direction="horizontal">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                }`}
              >
                {media.map((item, index) => (
                  <Draggable
                    key={item.media_id}
                    draggableId={`media-${item.media_id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                          snapshot.isDragging
                            ? 'shadow-2xl ring-2 ring-primary-500 z-50 scale-105'
                            : 'hover:shadow-lg'
                        } transition-all duration-200`}
                      >
                        {item.type.toLowerCase() === 'image' ? (
                          <img
                            src={item.url}
                            alt="Product media"
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <PlayIcon className="h-12 w-12 text-white opacity-75" />
                            </div>
                          </div>
                        )}
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute top-2 left-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                          title="Drag to reorder"
                        >
                          <Bars3Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeMedia(item.media_id)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          title="Delete media"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-600 hover:text-red-600" />
                        </button>
                        {/* Media Type Label */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                          <p className="text-xs text-white truncate">
                            {item.type.toLowerCase() === 'image' ? 'Image' : 'Video'}
                          </p>
                        </div>
                        {/* Order Indicator */}
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          #{index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-xs text-gray-500 mt-1">{fileName}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductMediaUpload; 