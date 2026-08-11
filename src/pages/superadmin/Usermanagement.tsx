import React, { useEffect, useState } from "react";
import { UserPlus, Download, Eye } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define user type to match backend response
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  profile: {
    is_email_verified: boolean;
    is_phone_verified: boolean;
    created_at: string;
    last_login: string | null;
  };
}

interface UserResponse {
  status: string;
  data: User[];
  message?: string;
}

interface UserProfileResponse {
  status: string;
  data: User;
  message?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { accessToken, user } = useAuth();

  const fetchUsers = async () => {
    if (!user || !['admin', 'superadmin'].includes(user.role.toLowerCase())) {
      toast.error('Access denied. Admin role required.');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (filterRole !== 'All') queryParams.append('role', filterRole);

      const response = await fetch(`${API_BASE_URL}/api/superadmin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json() as UserResponse;
      
      if (data.status === 'success') {
        setUsers(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, accessToken, search, filterRole]);

  const handleExport = () => {
    const headers = "Name,Email,Phone,Role,Status,Email Verified,Phone Verified,Created At,Last Login\n";
    const rows = users
      .map((u) => `"${u.name}","${u.email}","${u.phone}","${u.role}","${u.status}","${u.profile.is_email_verified}","${u.profile.is_phone_verified}","${u.profile.created_at}","${u.profile.last_login || 'Never'}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_management.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (userId: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success(`User status updated to ${status}`);
        fetchUsers(); // Refresh the user list
      } else {
        toast.error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const openProfile = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json() as UserProfileResponse;
      
      if (data.status === 'success') {
        setSelectedUser(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-full mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="text-primary-500 w-8 h-8" />
          <h1 className="text-3xl font-bold text-black">User Management</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="USER">Customer</option>
              <option value="MERCHANT">Merchant</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-md shadow hover:bg-primary-600 transition"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-500">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-left">
              <thead className="bg-primary-500/10 text-primary-500/90">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 text-black">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-gray-600">{user.phone}</td>
                    <td className="p-4 text-gray-500">{user.role}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() =>
                          handleStatusChange(user.id, user.status === "Active" ? "Inactive" : "Active")
                        }
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                      >
                        {user.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => openProfile(user.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">User Profile: {selectedUser.name}</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <p><strong>Email Verified:</strong> {selectedUser.profile.is_email_verified ? 'Yes' : 'No'}</p>
              <p><strong>Phone Verified:</strong> {selectedUser.profile.is_phone_verified ? 'Yes' : 'No'}</p>
              <p><strong>Created At:</strong> {new Date(selectedUser.profile.created_at).toLocaleString()}</p>
              <p><strong>Last Login:</strong> {selectedUser.profile.last_login ? new Date(selectedUser.profile.last_login).toLocaleString() : 'Never'}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
