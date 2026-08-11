import React, { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';

interface FilterOptions {
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface MerchantSearchProps {
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
}

const MerchantSearch: React.FC<MerchantSearchProps> = ({ onSearch, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8 border border-primary-100 w-full">
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="w-full">
          <div className="relative flex items-center">
            <FaSearch className="absolute right-4 text-primary-500" />
            <input
              type="text"
              placeholder="Search by Order ID, Merchant ID, or Name"
              className="w-full pl-12 pr-4 py-3 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-primary-50/50"
              onChange={(e) => onSearch(e.target.value)}
            />
          
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={filters.status}
            className="w-full px-4 py-3 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-primary-50/50 text-gray-700"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Payment Pending</option>
            <option value="completed">Payment Completed</option>
            <option value="processing">Processing</option>
            <option value="hold">On Hold</option>
          </select>

          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateFrom}
                className="w-full px-4 py-3 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-primary-50/50 text-gray-700"
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-primary-500 font-medium px-2">to</span>
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={filters.dateTo}
                className="w-full px-4 py-3 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-primary-50/50 text-gray-700"
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.status || filters.dateFrom || filters.dateTo) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.status && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2">
                Date Range: {filters.dateFrom || 'Start'} to {filters.dateTo || 'End'}
                <button
                  onClick={() => {
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                  }}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setFilters({ status: '', dateFrom: '', dateTo: '' });
                onFilterChange({ status: '', dateFrom: '', dateTo: '' });
              }}
              className="px-3 py-1 text-primary-600 text-sm hover:text-primary-800 flex items-center gap-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantSearch; 