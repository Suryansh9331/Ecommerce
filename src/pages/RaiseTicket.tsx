import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Plus,
  Paperclip,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface BackendMessage {
  id: number;
  ticket_id: number;
  sender_user_id: number;
  sender_name: string;
  sender_role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'UNKNOWN';
  is_admin_reply: boolean;
  message_text: string;
  attachment_url?: string | null;
  created_at: string;
}

interface BackendTicket {
  id: number;
  ticket_uid: string;
  creator_user_id: number;
  creator_name: string;
  creator_role: 'customer' | 'merchant';
  merchant_id?: number;
  merchant_name?: string;
  title: string;
  description: string;
  image_url?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'awaiting_customer_reply' | 'awaiting_merchant_reply' | 'resolved' | 'closed';
  assigned_to_admin_id?: number | null;
  assigned_admin_name?: string | null;
  related_order_id?: string | null;
  related_product_id?: number | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  messages?: BackendMessage[];
}

interface NewTicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  related_order_id?: string;
  related_product_id?: string;
}

const UserSupportPage: React.FC = () => {
  const { accessToken, isAuthenticated, user } = useAuth();

  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<BackendTicket | null>(null);
  const [selectedTicketMessages, setSelectedTicketMessages] = useState<BackendMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [newMessageAttachment, setNewMessageAttachment] = useState<File | null>(null);

  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'in_progress' | 'resolved' | 'awaiting_customer_reply' | 'awaiting_merchant_reply'>('all');

  const [newTicketData, setNewTicketData] = useState<NewTicketData>({
    title: '',
    description: '',
    priority: 'medium',
    related_order_id: '',
    related_product_id: ''
  });
  const [newTicketImage, setNewTicketImage] = useState<File | null>(null);
  const [newTicketImagePreview, setNewTicketImagePreview] = useState<string | null>(null);

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicketMessages]);

  const fetchTickets = useCallback(async (page = 1) => {
    if (!accessToken || !isAuthenticated) {
      setIsLoading(false);
 
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        sort_by: '-updated_at'
      });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const resp = await fetch(`${API_BASE_URL}/api/user/support/tickets?${params}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to fetch tickets');
      }
      const data = await resp.json();
      setTickets(data.tickets || []);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1);
        setCurrentPage(data.pagination.current_page || 1);
      } else {
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, filterStatus, searchQuery]);

  useEffect(() => {
    fetchTickets(currentPage);
  }, [fetchTickets, currentPage]);

  const fetchTicketMessages = async (uid: string) => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/support/tickets/${uid}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!resp.ok) throw new Error('Failed to fetch ticket details');
      const ticket: BackendTicket = await resp.json();
      setSelectedTicket(ticket);
      setSelectedTicketMessages(ticket.messages || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedTicket?.ticket_uid) {
      fetchTicketMessages(selectedTicket.ticket_uid);
    } else {
      setSelectedTicketMessages([]);
    }
  }, [selectedTicket?.ticket_uid]);

  const handleNewTicketInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTicketData(prev => ({ ...prev, [name]: value }));
  };
  const handleNewTicketImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return setNewTicketImage(null);
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Image <5MB"); return; }
    setNewTicketImage(file);
    setNewTicketImagePreview(URL.createObjectURL(file));
  };
  const removeNewTicketImage = () => {
    setNewMessageAttachment(null);
    setNewTicketImage(null);
    setNewTicketImagePreview(null);
    const inp = document.getElementById('new-ticket-image-input') as HTMLInputElement;
    if (inp) inp.value = '';
  };
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.title.trim() || !newTicketData.description.trim()) {
      return toast.error("Title & description required");
    }
    if (!accessToken) return toast.error("Login required");
    setIsCreatingTicket(true);
    try {
      const form = new FormData();
      form.append('title', newTicketData.title);
      form.append('description', newTicketData.description);
      form.append('priority', newTicketData.priority);
      if (newTicketData.related_order_id) form.append('related_order_id', newTicketData.related_order_id);
      if (newTicketData.related_product_id) form.append('related_product_id', newTicketData.related_product_id);
      if (newTicketImage) form.append('image_file', newTicketImage);

      const resp = await fetch(`${API_BASE_URL}/api/user/support/tickets`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Error ${resp.status}`);
      }
      const created: BackendTicket = await resp.json();
      setTickets(prev => [created, ...prev].sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      setShowNewTicketForm(false);
      setNewTicketData({ title: '', description: '', priority: 'medium', related_order_id: '', related_product_id: '' });
      removeNewTicketImage();
      toast.success("Ticket created");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleMessageAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return setNewMessageAttachment(null);
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) return toast.error("Attachment <5MB");
    setNewMessageAttachment(file);
  };
  const removeMessageAttachment = () => {
    setNewMessageAttachment(null);
    const inp = document.getElementById('user-message-attachment-input') as HTMLInputElement;
    if (inp) inp.value = '';
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!newMessage.trim() && !newMessageAttachment)) {
      return toast.error("Enter a message or attach a file");
    }
    if (!accessToken) return toast.error("Login required");
    setIsSendingMessage(true);
    try {
      const form = new FormData();
      if (newMessage.trim()) form.append('message_text', newMessage.trim());
      if (newMessageAttachment) form.append('attachment_file', newMessageAttachment);

      const resp = await fetch(`${API_BASE_URL}/api/user/support/tickets/${selectedTicket.ticket_uid}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send');
      }
      const sent: BackendMessage = await resp.json();
      setSelectedTicketMessages(prev => [...prev, sent]);
      setNewMessage('');
      removeMessageAttachment();
      toast.success("Sent");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCloseTicketByUser = async () => {
    if (!selectedTicket || selectedTicket.status !== 'resolved') {
      return toast.error("Only resolved tickets may be closed");
    }
    if (!window.confirm("Close this ticket?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/support/tickets/${selectedTicket.ticket_uid}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to close');
      }
      const updated = await resp.json();
      setSelectedTicket(updated);
      setTickets(prev =>
        prev.map(t => (t.ticket_uid === updated.ticket_uid ? updated : t))
          .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
      toast.success("Closed");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    }
  };

  const filteredAndSortedTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.ticket_uid.toLowerCase().includes(q);
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [tickets, searchQuery, filterStatus]);

  const getStatusColor = (status: BackendTicket['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-purple-100 text-purple-700';
      case 'awaiting_customer_reply': return 'bg-primary-100 text-primary-700';
      case 'awaiting_merchant_reply': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  const getPriorityColor = (priority: BackendTicket['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <MessageSquare size={48} />
        <p className="mt-4 text-lg">Please log in to view support tickets.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 py-6 px-2 sm:px-4 md:px-8 font-worksans">
      <div className="max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl mx-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow rounded-t-xl">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Support Center</h1>
              <p className="text-xs text-gray-500">Chat with our support team</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowNewTicketForm(true);
              setSelectedTicket(null);
            }}
            className="inline-flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Ticket
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="relative w-full sm:w-64 lg:w-64">
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value as typeof filterStatus); setCurrentPage(1); }}
                className="w-full py-2 pl-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-gray-50 text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_customer_reply">Awaiting Support Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-4 lg:gap-6">
          {/* Conversations List */}
          <div className={`${selectedTicket ? 'hidden md:block' : 'block'} w-full lg:w-80 xl:w-96 bg-white border border-gray-100 rounded-xl shadow flex flex-col transition-all mb-4 lg:mb-0`}>
            {/* Filter Tabs */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'open', label: 'Active' },
                  { key: 'resolved', label: 'Resolved' },
                  { key: 'closed', label: 'Closed' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key as typeof filterStatus)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      filterStatus === tab.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredAndSortedTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 px-4">
                  <MessageSquare className="h-8 w-8 mb-2 text-gray-300" />
                  <p className="text-sm text-center">No tickets found</p>
                </div>
              ) : (
                filteredAndSortedTickets.map(ticket => (
                  <div
                    key={ticket.ticket_uid}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b border-gray-100 cursor-pointer rounded-xl transition-all ${
                      selectedTicket?.ticket_uid === ticket.ticket_uid ? 'bg-primary-100 border-l-4 border-primary-600 shadow' : 'hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm truncate pr-2" title={ticket.title}>
                        {ticket.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">#{ticket.ticket_uid}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {totalPages > 1 && (
                <div className="p-3 border-t border-gray-100 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => fetchTickets(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-gray-700">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => fetchTickets(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-white border border-gray-100 rounded-xl shadow transition-all min-w-0`}>
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      className="md:hidden p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900 text-sm truncate">{selectedTicket.title}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" style={{ background: '#F2F0FF' }}>
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-500"></div>
                    </div>
                  ) : selectedTicketMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageSquare size={48} className="mx-auto mb-3 text-gray-400" />
                      {selectedTicket.description ? (
                        <div className="inline-block text-left bg-white p-6 rounded-lg shadow-md border border-gray-100 max-w-2xl">
                          <p className="font-medium text-gray-800 mb-2">Initial Query:</p>
                          <p className="whitespace-pre-wrap text-gray-600">{selectedTicket.description}</p>
                          {selectedTicket.image_url && (
                            <a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer" 
                               className="mt-3 inline-flex items-center text-sm text-accent-600 hover:text-accent-700">
                              <Paperclip size={14} className="mr-1" /> View Attachment
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-3 text-right">
                            {selectedTicket.creator_name} at {new Date(selectedTicket.created_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600">No messages yet.</p>
                      )}
                    </div>
                  ) : (
                    selectedTicketMessages.map(msg => {
                      const isOwn = msg.sender_user_id?.toString() === user?.id?.toString();
                      
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-xl shadow border transition-all ${
                            msg.is_admin_reply
                              ? 'bg-white border-gray-200 text-gray-800'
                              : isOwn
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-primary-50 text-gray-800 border-primary-100'
                          }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message_text}</p>
                            {msg.attachment_url && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                                 className={`mt-2 inline-flex items-center text-xs ${
                                   msg.is_admin_reply ? 'text-primary-600 hover:text-primary-700' : isOwn ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                                 }`}>
                                <Paperclip size={12} className="mr-1" /> View Attachment
                              </a>
                            )}
                            <p className={`mt-2 text-[11px] text-right ${
                              msg.is_admin_reply ? 'text-gray-500' : isOwn ? 'text-white/90' : 'text-gray-500'
                            }`}>
                              {msg.sender_name} • {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress' || selectedTicket.status === 'awaiting_customer_reply') ? (
                  <div className="bg-white border-t border-gray-100 p-4">
                    {newMessageAttachment && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        <Paperclip className="h-4 w-4" />
                        <span className="flex-1 truncate">{newMessageAttachment.name}</span>
                        <button 
                          onClick={removeMessageAttachment}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          rows={1}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none overflow-hidden bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-colors"
                          disabled={isSendingMessage}
                          style={{ 
                            minHeight: '2.75rem',
                            maxHeight: '7.5rem'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                        
                        <label htmlFor="user-message-attachment-input" className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <input
                            id="user-message-attachment-input"
                            type="file"
                            className="hidden"
                            onChange={handleMessageAttachmentChange}
                            disabled={isSendingMessage}
                          />
                        </label>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={(!newMessage.trim() && !newMessageAttachment) || isSendingMessage}
                        className="w-11 h-11 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        {isSendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-white border-t-transparent border-2" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white border-t border-gray-100 p-4 text-center rounded-b-xl">
                    <div className="bg-primary-100 rounded-lg p-4">
                      {selectedTicket.status === 'resolved' ? (
                        <div>
                          <p className="text-sm text-gray-700 mb-4">This ticket has been resolved. You can close it if the issue is fixed.</p>
                          <button
                            onClick={handleCloseTicketByUser}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-800 text-white font-medium rounded-lg transition-colors"
                          >
                            Close Ticket
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-primary-600">
                          <CheckCircle className="h-8 w-8 mb-2" />
                          <p className="text-sm">This conversation is closed</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow">
                    <MessageSquare className="h-12 w-12 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Welcome to Support Center</h3>
                  <p className="text-gray-500">Select a conversation from the left to view your support tickets and chat with our team.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Ticket Modal */}
        {showNewTicketForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center p-1 sm:p-3 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-[96vw] sm:max-w-[85vw] md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto shadow-xl transform transition-all my-1 sm:my-4 flex flex-col max-h-[98vh] sm:max-h-[90vh] md:max-h-[80vh]">

              {/* Header - Compact */}
              <div className="flex justify-between items-center p-2 sm:p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 truncate pr-2">Create Support Ticket</h2>
                <button onClick={() => setShowNewTicketForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0">
                  <XCircle size={16} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 min-h-0">
                <form onSubmit={handleCreateTicket} className="space-y-2 sm:space-y-3">

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text" id="title" name="title"
                      value={newTicketData.title}
                      onChange={handleNewTicketInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description" name="description"
                      value={newTicketData.description}
                      onChange={handleNewTicketInputChange}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm resize-none"
                      required
                    />
                  </div>

                  {/* Priority and Order ID Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="relative">
                      <label htmlFor="priority" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        id="priority" name="priority"
                        value={newTicketData.priority}
                        onChange={handleNewTicketInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="related_order_id" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Order ID</label>
                      <input
                        type="text" id="related_order_id" name="related_order_id"
                        value={newTicketData.related_order_id || ''}
                        onChange={handleNewTicketInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                        placeholder="ORD12345"
                      />
                    </div>
                  </div>

                  {/* Product ID */}
                  <div>
                    <label htmlFor="related_product_id" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Product ID 
                    </label>
                    <input
                      type="text" id="related_product_id" name="related_product_id"
                      value={newTicketData.related_product_id || ''}
                      onChange={handleNewTicketInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-primary-500 focus:border-primary-500 text-xs sm:text-sm"
                      placeholder="PROD67890"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Attach Image 
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewTicketImageChange}
                      className="block w-full text-xs sm:text-sm text-gray-500 file:mr-1 sm:file:mr-2 file:py-0.5 sm:file:py-1 file:px-1 sm:file:px-2 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                    {newTicketImagePreview && (
                      <div className="mt-2 relative w-24 h-24 border border-gray-200 rounded overflow-hidden">
                        <img src={newTicketImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeNewTicketImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Footer - Compact */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreateTicket}
                  disabled={isCreatingTicket}
                  className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-500 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isCreatingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSupportPage;