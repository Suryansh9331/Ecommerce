import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Plus,
 
  Paperclip,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Interfaces Aligned with Backend ---
interface BackendMessage {
  id: number;
  ticket_id: number;
  sender_user_id: number;
  sender_name: string;
  sender_role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'UNKNOWN'; // Match backend roles
  is_admin_reply: boolean;
  message_text: string;
  attachment_url?: string | null;
  created_at: string;
}

interface BackendTicket {
  id: number; // DB ID
  ticket_uid: string; // User-facing ID
  creator_user_id: number;
  creator_name: string;
  creator_role: 'customer' | 'merchant';
  merchant_id?: number;
  merchant_name?: string;
  title: string;
  description: string; // Initial description
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
  messages?: BackendMessage[]; // Messages will be loaded separately or on demand
}

interface NewTicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  related_order_id?: string;
  related_product_id?: string; // Send as string, convert to int on backend if needed
}

const Support: React.FC = () => {
  const { accessToken, user } = useAuth();

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
    priority: 'medium'
  });
  const [newTicketImage, setNewTicketImage] = useState<File | null>(null);
  const [newTicketImagePreview, setNewTicketImagePreview] = useState<string | null>(null);

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      // Add other params like sort_by, page, per_page if your backend supports them for merchants

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/support/tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json(); // Expecting { tickets: [], pagination: {} }
      setTickets(data.tickets || []); // Adjust if structure is different
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchTicketMessages = async (ticketUid: string) => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/support/tickets/${ticketUid}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch ticket details and messages');
      const ticketData: BackendTicket = await response.json();
      setSelectedTicket(ticketData); // Update the whole selected ticket
      setSelectedTicketMessages(ticketData.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages for the selected ticket.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedTicket?.ticket_uid) {
      fetchTicketMessages(selectedTicket.ticket_uid);
    } else {
      setSelectedTicketMessages([]); // Clear messages if no ticket is selected
    }
  }, [selectedTicket?.ticket_uid, accessToken]);


  const handleNewTicketInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewTicketImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB.");
        return;
      }
      setNewTicketImage(file);
      setNewTicketImagePreview(URL.createObjectURL(file));
    } else {
      setNewTicketImage(null);
      setNewTicketImagePreview(null);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.title.trim() || !newTicketData.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    setIsCreatingTicket(true);
    try {
      const formData = new FormData();
      formData.append('title', newTicketData.title);
      formData.append('description', newTicketData.description);
      formData.append('priority', newTicketData.priority);
      if (newTicketData.related_order_id) formData.append('related_order_id', newTicketData.related_order_id);
      if (newTicketData.related_product_id) formData.append('related_product_id', newTicketData.related_product_id);

      if (newTicketImage) {
        formData.append('image_file', newTicketImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/support/tickets`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }, // Content-Type is set by FormData
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create ticket' }));
        throw new Error(errorData.message || 'Failed to create ticket');
      }

      const createdTicket: BackendTicket = await response.json();
      setTickets(prev => [createdTicket, ...prev].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      setShowNewTicketForm(false);
      setNewTicketData({ title: '', description: '', priority: 'medium' });
      setNewTicketImage(null);
      setNewTicketImagePreview(null);
      toast.success('Support ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create support ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleMessageAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Attachment size should be less than 5MB.");
        return;
      }
      setNewMessageAttachment(file);
    } else {
      setNewMessageAttachment(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!newMessage.trim() && !newMessageAttachment)) {
      toast.error("Message or attachment is required.");
      return;
    }
    setIsSendingMessage(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('message_text', newMessage.trim());
      if (newMessageAttachment) {
        formData.append('attachment_file', newMessageAttachment);
      }

      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/support/tickets/${selectedTicket.ticket_uid}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
        throw new Error(errorData.message || 'Failed to send message');
      }

      const sentMessage: BackendMessage = await response.json();
      // Optimistically update, or refetch messages for the ticket
      setSelectedTicketMessages(prev => [...prev, sentMessage]);
      // Also update the main ticket's updated_at and potentially status
      setTickets(prevTickets => prevTickets.map(t =>
        t.ticket_uid === selectedTicket.ticket_uid
          ? { ...t, updated_at: sentMessage.created_at, status: 'in_progress' } // Or status from backend
          : t
      ));
      setSelectedTicket(prev => prev ? { ...prev, updated_at: sentMessage.created_at, status: 'in_progress' } : null);

      setNewMessage('');
      setNewMessageAttachment(null);
      if (document.getElementById('message-attachment-input')) { // Reset file input
        (document.getElementById('message-attachment-input') as HTMLInputElement).value = "";
      }
      toast.success("Message sent!");

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || selectedTicket.status !== 'resolved') {
      toast.error("Only resolved tickets can be closed.");
      return;
    }
    if (!window.confirm("Are you sure you want to close this ticket? This action cannot be undone by you.")) return;

    setIsSendingMessage(true); // Reuse submitting state or create a new one for closing
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-dashboard/support/tickets/${selectedTicket.ticket_uid}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to close ticket' }));
        throw new Error(errorData.message || 'Failed to close ticket');
      }
      const updatedTicket = await response.json();
      setTickets(prev => prev.map(t => t.ticket_uid === updatedTicket.ticket_uid ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      toast.success("Ticket closed successfully.");
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to close ticket');
    } finally {
      setIsSendingMessage(false);
    }
  };


  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); // Sort by most recently updated

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


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
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
        <div className="relative">
          
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex min-h-0">
        {/* Conversations List */}
        <div className={`${selectedTicket ? 'hidden md:block' : 'block'} w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col`}>
          {/* Filter Tabs */}
          <div className="p-3 border-b border-gray-100">
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
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 px-4">
                <MessageSquare className="h-8 w-8 mb-2 text-gray-300" />
                <p className="text-sm text-center">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.ticket_uid}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTicket?.ticket_uid === ticket.ticket_uid ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate pr-2" title={ticket.title}>
                      {ticket.title}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'awaiting_merchant_reply' ? 'Your turn' : 
                       ticket.status === 'awaiting_customer_reply' ? 'Waiting' :
                       ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(ticket.priority).includes('red') ? 'bg-red-400' : getPriorityColor(ticket.priority).includes('yellow') ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                      <span className="text-xs text-gray-400">#{ticket.ticket_uid}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-gray-50`}>
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="md:hidden p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="font-medium text-gray-900 text-sm" title={selectedTicket.title}>
                        {selectedTicket.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status === 'awaiting_merchant_reply' ? 'Your turn' : 
                           selectedTicket.status === 'awaiting_customer_reply' ? 'Waiting for support' :
                           selectedTicket.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500 capitalize">{selectedTicket.priority} priority</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)' }}>
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : selectedTicketMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-8 w-8 text-primary-500" />
                    </div>
                    <p className="text-gray-600 font-medium">Start the conversation</p>
                    <p className="text-sm text-gray-500 mt-1">Send a message to begin getting help with your issue.</p>
                  </div>
                ) : (
                  selectedTicketMessages.map((message, index) => {
                    const isOwn = message.sender_user_id === Number(user?.id);
                    const showAvatar = index === 0 || selectedTicketMessages[index - 1]?.sender_user_id !== message.sender_user_id;
                    
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {!isOwn && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${showAvatar ? 'visible' : 'invisible'}`}>
                            <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-white">
                              {message.sender_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : ''}`}>
                          {showAvatar && !isOwn && (
                            <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender_name}</p>
                          )}
                          
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isOwn 
                              ? 'bg-primary-500 text-white rounded-br-md' 
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.message_text}
                            </p>
                            
                            {message.attachment_url && (
                              <a 
                                href={message.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`mt-2 inline-flex items-center gap-1 text-xs underline ${
                                  isOwn ? 'text-primary-100 hover:text-white' : 'text-primary-600 hover:text-primary-700'
                                }`}
                              >
                                <Paperclip className="h-3 w-3" />
                                View attachment
                              </a>
                            )}
                          </div>
                          
                          <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'} ml-1`}>
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                        
                        {isOwn && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${showAvatar ? 'visible' : 'invisible'}`}>
                            <div className="w-full h-full bg-primary-500 rounded-full flex items-center justify-center text-white">
                              {message.sender_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
                <div className="bg-white border-t border-gray-200 p-4">
                  {newMessageAttachment && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <Paperclip className="h-4 w-4" />
                      <span className="flex-1 truncate">{newMessageAttachment.name}</span>
                      <button 
                        onClick={() => setNewMessageAttachment(null)}
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
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                        }}
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
                            if (newMessage.trim() || newMessageAttachment) {
                              handleSendMessage(e as any);
                            }
                          }
                        }}
                      />
                      
                      <label 
                        htmlFor="message-attachment-input" 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                        <input 
                          id="message-attachment-input" 
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
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white border-t border-gray-200 p-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedTicket.status === 'resolved' ? (
                      <>
                        <p className="text-sm text-gray-600 mb-3">This ticket has been resolved by our support team.</p>
                        <button
                          onClick={handleCloseTicket}
                          disabled={isSendingMessage}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                        >
                          Mark as Closed
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 font-medium">This conversation is closed.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Support Center</h3>
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
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-accent-500 focus:border-accent-500 text-xs sm:text-sm"
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
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-accent-500 focus:border-accent-500 text-xs sm:text-sm resize-none"
                    required
                  />
                </div>

                {/* Priority and Order ID Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="relative">
                    <label htmlFor="priority" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <div className="relative">
                      <select
                        id="priority" name="priority"
                        value={newTicketData.priority}
                        onChange={handleNewTicketInputChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 pl-2 sm:pl-3 pr-6 sm:pr-8 focus:ring-accent-500 focus:border-accent-500 text-xs sm:text-sm appearance-none bg-white"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.3rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1rem 1rem'
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="related_order_id" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Order ID <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text" id="related_order_id" name="related_order_id"
                      value={newTicketData.related_order_id || ''}
                      onChange={handleNewTicketInputChange}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-accent-500 focus:border-accent-500 text-xs sm:text-sm"
                      placeholder="ORD12345"
                    />
                  </div>
                </div>

                {/* Product ID */}
                <div>
                  <label htmlFor="related_product_id" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Product ID <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text" id="related_product_id" name="related_product_id"
                    value={newTicketData.related_product_id || ''}
                    onChange={handleNewTicketInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-1 sm:py-1.5 px-2 sm:px-3 focus:ring-accent-500 focus:border-accent-500 text-xs sm:text-sm"
                    placeholder="PROD67890"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Attach Image <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewTicketImageChange}
                    className="block w-full text-xs sm:text-sm text-gray-500 file:mr-1 sm:file:mr-2 file:py-0.5 sm:file:py-1 file:px-1 sm:file:px-2 file:rounded file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  {newTicketImagePreview && (
                    <div className="mt-2 relative w-10 h-10 sm:w-12 sm:h-12 border rounded">
                      <img src={newTicketImagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                      <button type="button" onClick={() => { setNewTicketImage(null); setNewTicketImagePreview(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600">
                        <XCircle size={8} className="sm:w-2.5 sm:h-2.5" />
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
                className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreateTicket}
                disabled={isCreatingTicket}
                className="w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-500 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
              >
                {isCreatingTicket ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;