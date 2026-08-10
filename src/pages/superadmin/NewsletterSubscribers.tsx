import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import ExportModal from '../../components/business/reports/ExportModal';

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
}


function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const show = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return { toast, show };
}

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-orange-50 border-orange-200 text-orange-800',
};

// ─── Config ─────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Component ───────────────────────────────────────────────────────────────
const NewsletterSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast, show: showToast }    = useToast();

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/superadmin/newsletter/subscribers`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch newsletter subscribers');
        }
        const data = await response.json();
        const mapped: Subscriber[] = (Array.isArray(data) ? data : []).map(
          (s: any) => ({
            id: s.id,
            email: s.email,
            subscribed_at: s.created_at,
          })
        );
        mapped.sort((a, b) => a.id - b.id);
        setSubscribers(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch newsletter subscribers');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        // ✅ CSV — no external library needed, safe to keep
        const headers = 'ID,Email,Subscribed At\n';
        const rows = subscribers
          .map(
            (s) =>
              `${s.id},"${s.email}","${new Date(s.subscribed_at).toLocaleString()}"`
          )
          .join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = 'newsletter_subscribers.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('CSV downloaded successfully', 'success');

      } else if (format === 'excel') {
        
        const headers = 'ID\tEmail\tSubscribed At\n'; 
        const rows = subscribers
          .map(
            (s) =>
              `${s.id}\t${s.email}\t${new Date(s.subscribed_at).toLocaleString()}`
          )
          .join('\n');
        const blob = new Blob([headers + rows], { type: 'application/vnd.ms-excel' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = 'newsletter_subscribers.xls';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('Excel file downloaded successfully', 'success');

      } else if (format === 'pdf') {
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showToast('Please allow popups to export PDF', 'error');
          return;
        }
        const rows = subscribers
          .map(
            (s) => `
              <tr>
                <td>${s.id}</td>
                <td>${s.email}</td>
                <td>${new Date(s.subscribed_at).toLocaleString()}</td>
              </tr>`
          )
          .join('');

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Newsletter Subscribers</title>
              <style>
                body  { font-family: sans-serif; padding: 2rem; color: #1a1a1a; }
                h1    { font-size: 1.25rem; margin-bottom: 1rem; color: #c2410c; }
                table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                th    { background: #fff7ed; color: #c2410c; text-align: left;
                        padding: 8px 12px; border-bottom: 2px solid #fed7aa; }
                td    { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
                tr:nth-child(even) td { background: #fff7ed; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <h1>Newsletter Subscribers (${subscribers.length} total)</h1>
              <table>
                <thead>
                  <tr><th>ID</th><th>Email</th><th>Subscribed At</th></tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        showToast('PDF print dialog opened', 'success');
      }

      setIsExportModalOpen(false);
    } catch (err) {
      
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-white to-orange-50">

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg border text-sm font-medium shadow-md transition-all ${TOAST_STYLES[toast.type]}`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-orange-700 drop-shadow-sm">
          Newsletter Subscribers
        </h1>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md shadow hover:bg-orange-600 transition"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-full mx-auto">
        {loading ? (
          <div className="text-orange-600 font-medium">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-orange-100">
                  <th className="px-6 py-3 text-left text-sm font-bold text-orange-700 rounded-tl-xl">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-orange-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-orange-700 rounded-tr-xl">Subscribed At</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-500">
                      No subscribers found.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub, idx) => (
                    <tr
                      key={sub.id}
                      className={`transition-colors duration-150 ${
                        idx % 2 === 0 ? 'bg-orange-50' : 'bg-white'
                      } hover:bg-orange-200/60`}
                    >
                      <td className="px-6 py-4 text-gray-800 font-medium rounded-l-lg">{sub.id}</td>
                      <td className="px-6 py-4 text-gray-700">{sub.email}</td>
                      <td className="px-6 py-4 text-gray-600 rounded-r-lg">
                        {new Date(sub.subscribed_at).toLocaleString(undefined, {
                          year:   'numeric',
                          month:  'long',
                          day:    'numeric',
                          hour:   'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
};

export default NewsletterSubscribers;