import React, { useState } from 'react';
import { Eye, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  orderId: string;
  Name: string;
  type: 'Refund' | 'Return';
  reason: string;
  item: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

const mockRequests: Request[] = [
  {
    id: '1',
    orderId: 'ORD-1001',
    Name: 'John Doe',
    type: 'Refund',
    reason: 'Product damaged',
    item: 'Wireless Mouse',
    status: 'Pending',
    date: '2024-06-09',
  },
  {
    id: '2',
    orderId: 'ORD-1002',
    Name: 'Jane Smith',
    type: 'Return',
    reason: 'Wrong size',
    item: 'T-Shirt (Size M)',
    status: 'Approved',
    date: '2024-06-08',
  },
  {
    id: '3',
    orderId: 'ORD-1003',
    Name: 'Alice Brown',
    type: 'Refund',
    reason: 'Late delivery',
    item: 'Bluetooth Speaker',
    status: 'Rejected',
    date: '2024-06-07',
  },
];

const RefundAndReturnManagement: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<{ visible: boolean; requestId: string | null; requestName: string; } | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredRequests = mockRequests.filter(r => {
    const matchesFilter = filter === 'All' ? true : r.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.item.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusCount = (status: string) => mockRequests.filter(r => r.status === status).length;

  const handleDeleteClick = (id: string, name: string) => {
    setShowDeleteModal({ visible: true, requestId: id, requestName: name });
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteModal || !showDeleteModal.requestId) return;

    const requestIdToDelete = showDeleteModal.requestId;
    const requestNameToDelete = showDeleteModal.requestName;
    setShowDeleteModal(null); // Close the dialog immediately

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      // In a real application, you would make an API call here with requestIdToDelete
      // For now, we'll just show a success message
      // console.log(`Deleting request with ID: ${requestIdToDelete}`);
      toast.success(`Request for ${requestNameToDelete} deleted successfully`);
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete request');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  };

  return (
    <div className="min-h-[80vh] p-6 bg-white border border-gray-200 shadow-xl rounded-xl">
      <h1 className="text-2xl font-bold text-primary-500 mb-4">Refund & Return Management</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <input
          type="text"
          className="md:w-1/3 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Search by Order ID, Name, Reason, or Item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-sm">
        <div className="bg-primary-100 p-3 rounded-md text-center text-primary-700 font-semibold">
          Total: {mockRequests.length}
        </div>
        <div className="bg-yellow-100 p-3 rounded-md text-center text-yellow-700 font-semibold">
          Pending: {getStatusCount('Pending')}
        </div>
        <div className="bg-green-100 p-3 rounded-md text-center text-green-700 font-semibold">
          Approved: {getStatusCount('Approved')}
        </div>
        <div className="bg-red-100 p-3 rounded-md text-center text-red-700 font-semibold">
          Rejected: {getStatusCount('Rejected')}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-primary-100 overflow-x-auto">
        <table className="min-w-full text-sm text-left table-fixed">
          <thead className="bg-primary-50 text-primary-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2 w-[90px]">Order ID</th>
              <th className="px-3 py-2 w-[100px]">Name</th>
              <th className="px-3 py-2 w-[110px]">Item</th>
              <th className="px-3 py-2 w-[70px]">Type</th>
              <th className="px-3 py-2 w-[120px]">Reason</th>
              <th className="px-3 py-2 w-[80px]">Status</th>
              <th className="px-3 py-2 w-[80px]">Date</th>
              <th className="px-3 py-2 w-[80px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-primary-50">
                <td className="px-3 py-2">{req.orderId}</td>
                <td className="px-3 py-2">{req.Name}</td>
                <td className="px-3 py-2 truncate">{req.item}</td>
                <td className="px-3 py-2">{req.type}</td>
                <td className="px-3 py-2 truncate">{req.reason}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : req.status === 'Approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-3 py-2">{req.date}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-1">
                    <button title="Approve" className="text-green-600 hover:text-green-700">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button 
                      title="Delete" 
                      className="text-primary-600 hover:text-primary-700"
                      onClick={() => handleDeleteClick(req.id, req.Name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button title="View" className="text-primary-600 hover:text-primary-700">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && showDeleteModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="flex items-center justify-start mb-4">
              <AlertCircle className="h-8 w-8 text-primary-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the request for '<strong>{showDeleteModal.requestName}</strong>'? This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundAndReturnManagement;
