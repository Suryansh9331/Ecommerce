import React from 'react';
import { Briefcase, Link2 } from 'lucide-react';

const CreatorPortfolio: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500">Links, showcase reels, and social profiles.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Link2 className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Add your portfolio links</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">Instagram, sample reels, or other links so brands can discover you.</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorPortfolio;
