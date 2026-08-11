import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, X, Pencil, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SuperAdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_img: string | null;
  is_active: boolean;
  last_login: string | null;
}

const Settings: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ visible: boolean; adminId: number | null; adminName: string; } | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const { accessToken, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      toast.error('Unauthorized access');
    }
  }, [isAdmin, navigate]);

  // Fetch superadmin users
  useEffect(() => {
    if (isAdmin) {
      fetchSuperAdmins();
    }
  }, [isAdmin]);

  const fetchSuperAdmins = async () => {
    if (!accessToken) {
      toast.error('Authentication required');
      navigate('/login');
      return;
    }

    try {
      setFetching(true);
      const response = await fetch(`${API_BASE_URL}/api/superadmin/superadmins`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch superadmin users');
      }

      const data = await response.json();
      // Handle both possible response structures
      const superadmins = data.message?.superadmins || data.superadmins || [];
      setAdmins(superadmins);
    } catch (error) {
      console.error('Error fetching superadmin users:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch superadmin users');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
        setError('');
        setIsEdit(false);
        setEditId(null);
      }
    }
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!accessToken) {
      toast.error('Authentication required');
      navigate('/login');
      return;
    }

    if (!form.email || !form.first_name || !form.last_name || (!isEdit && !form.password)) {
      setError('Please fill all required fields.');
      return;
    }
    
    if (!isEdit && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
      };

      if (!isEdit && form.password) {
        payload.password = form.password;
      }

      let response;
      if (isEdit && editId) {
        // PATCH request for editing
        response = await fetch(`${API_BASE_URL}/api/superadmin/superadmins/${editId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // POST request for creating
        response = await fetch(`${API_BASE_URL}/api/superadmin/superadmins`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (isEdit ? 'Failed to update superadmin' : 'Failed to create superadmin'));
      }

      const data = await response.json();
      const successMessage = typeof data.message === 'string' ? data.message : (isEdit ? 'Superadmin updated successfully' : 'Superadmin created successfully');
      toast.success(successMessage);
      
      // Refresh the list
      await fetchSuperAdmins();
      
      setShowModal(false);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        phone: '',
      });
      setIsEdit(false);
      setEditId(null);
    } catch (error) {
      console.error(isEdit ? 'Error updating superadmin:' : 'Error creating superadmin:', error);
      setError(error instanceof Error ? error.message : (isEdit ? 'Failed to update superadmin' : 'Failed to create superadmin'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdmin = (admin: SuperAdminUser) => {
    setForm({
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      password: '',
      confirmPassword: '',
      phone: admin.phone || '',
    });
    setIsEdit(true);
    setEditId(admin.id);
    setShowModal(true);
    setError('');
  };

  const handleDeleteClick = (admin: SuperAdminUser) => {
    setShowDeleteModal({ 
      visible: true, 
      adminId: admin.id, 
      adminName: `${admin.first_name} ${admin.last_name}` 
    });
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteModal || !showDeleteModal.adminId || !accessToken) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/superadmins/${showDeleteModal.adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete superadmin');
      }

      const data = await response.json();
      const successMessage = typeof data.message === 'string' ? data.message : 'Superadmin deleted successfully';
      toast.success(successMessage);
      
      // Refresh the list
      await fetchSuperAdmins();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting superadmin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete superadmin');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (admin: SuperAdminUser) => {
    if (!accessToken) {
      toast.error('Authentication required');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/superadmins/${admin.id}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reactivate superadmin');
      }

      const data = await response.json();
      const successMessage = typeof data.message === 'string' ? data.message : 'Superadmin reactivated successfully';
      toast.success(successMessage);
      
      // Refresh the list
      await fetchSuperAdmins();
    } catch (error) {
      console.error('Error reactivating superadmin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate superadmin');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  };

  if (!isAdmin) {
    return null;
  }

  if (fetching) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80dvh] p-4 sm:p-6 lg:p-10 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-500 drop-shadow-sm">Super Admin Users Management</h1>
        <button
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-4 sm:px-5 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold w-full sm:w-auto"
          onClick={() => { 
            setShowModal(true); 
            setIsEdit(false); 
            setEditId(null);
            setForm({ 
              email: '', 
              first_name: '', 
              last_name: '', 
              password: '', 
              confirmPassword: '', 
              phone: '' 
            }); 
          }}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add New Super Admin</span>
          <span className="sm:hidden">Add Admin</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-x-auto border border-primary-100">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-100 text-primary-500 font-semibold">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-100">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-primary-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.first_name} {admin.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.phone || 'Not provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex items-center justify-center text-xs font-medium rounded-full pl-2 pr-2 py-1 ${
                    admin.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex items-center justify-center gap-2">
                  {admin.is_active ? (
                    <>
                      <button 
                        className="text-primary-400 hover:text-primary-500 transition-colors" 
                        onClick={() => handleEditAdmin(admin)} 
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-500 transition-colors" 
                        onClick={() => handleDeleteClick(admin)} 
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button 
                      className="text-green-400 hover:text-green-500 transition-colors" 
                      onClick={() => handleReactivate(admin)} 
                      title="Reactivate"
                      disabled={loading}
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-primary-100 p-4 hover:shadow-xl transition-shadow duration-200">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
                <span className={`inline-flex items-center justify-center text-xs font-medium rounded-full px-2 py-1 ${
                  admin.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {admin.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2 text-gray-900">{admin.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Login:</span>
                  <span className="ml-2 text-gray-900">
                    {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary-100">
                {admin.is_active ? (
                  <>
                    <button 
                      className="flex items-center gap-1 text-primary-400 hover:text-primary-500 transition-colors text-sm font-medium" 
                      onClick={() => handleEditAdmin(admin)} 
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      className="flex items-center gap-1 text-red-400 hover:text-red-500 transition-colors text-sm font-medium" 
                      onClick={() => handleDeleteClick(admin)} 
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                ) : (
                  <button 
                    className="flex items-center gap-1 text-green-400 hover:text-green-500 transition-colors text-sm font-medium" 
                    onClick={() => handleReactivate(admin)} 
                    disabled={loading}
                  >
                    <UserCheck className="w-4 h-4" />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && showDeleteModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="flex items-center justify-start mb-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary-500 mr-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the super admin user '<strong>{showDeleteModal.adminName}</strong>'? This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-500 text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50"
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div ref={modalRef} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-8 relative border border-primary-200 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-primary-500" 
              onClick={() => { setShowModal(false); setError(''); setIsEdit(false); setEditId(null); }}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-6 text-primary-500 pr-8">
              {isEdit ? 'Edit Super Admin User' : 'Add New Super Admin User'}
            </h2>
            <form className="space-y-4" onSubmit={handleAddUser}>
              <input 
                name="email" 
                value={form.email} 
                onChange={handleInputChange} 
                type="email" 
                placeholder="Email Address *" 
                className="w-full border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
                disabled={isEdit}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  name="first_name" 
                  value={form.first_name} 
                  onChange={handleInputChange} 
                  type="text" 
                  placeholder="First Name *" 
                  className="w-full sm:w-1/2 border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
                />
                <input 
                  name="last_name" 
                  value={form.last_name} 
                  onChange={handleInputChange} 
                  type="text" 
                  placeholder="Last Name *" 
                  className="w-full sm:w-1/2 border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
                />
              </div>
              <input 
                name="phone" 
                value={form.phone} 
                onChange={handleInputChange} 
                type="tel" 
                placeholder="Phone Number (optional)" 
                className="w-full border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
              />
              {!isEdit && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    name="password" 
                    value={form.password} 
                    onChange={handleInputChange} 
                    type="password" 
                    placeholder="Password *" 
                    className="w-full sm:w-1/2 border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
                  />
                  <input 
                    name="confirmPassword" 
                    value={form.confirmPassword} 
                    onChange={handleInputChange} 
                    type="password" 
                    placeholder="Confirm Password *" 
                    className="w-full sm:w-1/2 border border-primary-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-sm" 
                  />
                </div>
              )}
              {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="w-full sm:w-auto bg-primary-50 text-primary-500 px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors border border-primary-200" 
                  onClick={() => { setShowModal(false); setError(''); setIsEdit(false); setEditId(null); }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-primary-400 to-primary-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isEdit ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
