import React from 'react';
import { Video, Upload } from 'lucide-react';

const CreatorUploadReel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
          <Video className="w-5 h-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Reel</h1>
          <p className="text-sm text-gray-500">Select a campaign, upload your video, and submit for approval.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Select a campaign to upload</p>
          <p className="text-sm text-gray-500 mt-1">Choose from your active campaigns and upload your reel.</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorUploadReel;
