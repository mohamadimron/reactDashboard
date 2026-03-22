import { useState, useEffect, useRef } from 'react';
import api, { API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Send, Search, User as UserIcon, MessageSquare, 
  MoreVertical, Paperclip, Smile, Shield,
  ChevronLeft, Loader2, Check, CheckCheck, Plus, X, Trash2
} from 'lucide-react';

const Messages = () => {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // otherUserId
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // New Chat States
  const [isNewChatModal, setIsNewChatModal] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  
  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConvDeleteModalOpen, setIsConvDeleteModalOpen] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState(null);
  
  const scrollRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages');
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch conversations failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    if (!otherUserId) return;
    setMsgLoading(true);
    try {
      const res = await api.get(`/messages/${otherUserId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      setActiveTab(otherUserId);
      
      // Sync Sidebar Badge: Force global update after marking as read
      window.dispatchEvent(new CustomEvent('refresh-unread'));
      
      fetchConversations();
    } catch (err) {
      console.error('Fetch messages failed', err);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (recipientInput.length >= 2 && !selectedRecipient) {
        setIsSearching(true);
        try {
          const res = await api.get(`/users/search?query=${recipientInput}`);
          setSuggestions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [recipientInput, selectedRecipient]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const contentToSend = newMessage.trim();
    if (!contentToSend) return;

    let targetEmail = '';
    if (isNewChatModal) {
      targetEmail = selectedRecipient ? selectedRecipient.email : recipientInput.trim();
    } else {
      const activeConv = conversations.find(c => c.user.id === activeTab);
      targetEmail = activeConv?.user.email || '';
    }

    if (!targetEmail) return;

    try {
      const res = await api.post('/messages', {
        recipientIdentifier: targetEmail,
        content: contentToSend
      });
      setNewMessage('');
      if (isNewChatModal) {
        setIsNewChatModal(false);
        setRecipientInput('');
        setSelectedRecipient(null);
        await fetchMessages(res.data.receiverId);
      } else {
        setMessages(prev => [...prev, res.data]);
      }
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    }
  };

  const handleDeleteMessage = async () => {
    if (!msgToDelete) return;
    try {
      await api.delete(`/messages/${msgToDelete.id}`);
      setMessages(prev => prev.filter(m => m.id !== msgToDelete.id));
      setMsgToDelete(null);
      setIsDeleteModalOpen(false);
      fetchConversations();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeTab) return;
    // For simplicity, we delete all messages in thread
    try {
      for (const msg of messages) {
        await api.delete(`/messages/${msg.id}`);
      }
      setActiveTab(null);
      setMessages([]);
      setIsConvDeleteModalOpen(false);
      fetchConversations();
    } catch (err) {
      alert('Failed to clear conversation');
    }
  };

  const activeChatUser = conversations.find(c => c.user.id === activeTab)?.user;

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className={`w-full md:w-80 lg:w-96 border-r border-gray-50 flex flex-col ${activeTab ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Messages</h2>
            <button onClick={() => setIsNewChatModal(true)} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search chats..." className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <Loader2 className="animate-spin mb-2 text-blue-600" />
              <p className="text-[10px] font-black uppercase tracking-widest">Loading</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <MessageSquare size={32} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Empty Inbox</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button 
                key={conv.id} 
                onClick={() => fetchMessages(conv.user.id)} 
                className={`w-full flex items-center p-4 rounded-[1.75rem] transition-all duration-300 group mb-1 ${
                  activeTab === conv.user.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shadow-sm transition-transform duration-500 group-hover:scale-105 ${
                    activeTab === conv.user.id ? 'border-white/30' : 'border-white'
                  }`}>
                    {conv.user.avatar ? (
                      <img src={`${API_URL}${conv.user.avatar}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-black text-lg ${
                        activeTab === conv.user.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {(conv.user.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="ml-4 flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1 overflow-hidden">
                      <h4 className={`text-[13px] font-black truncate leading-tight ${
                        activeTab === conv.user.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {conv.user.name}
                      </h4>
                      <p className={`text-[10px] font-bold truncate opacity-60 ${
                        activeTab === conv.user.id ? 'text-white' : 'text-gray-400'
                      }`}>
                        {conv.user.email}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase whitespace-nowrap ml-2 opacity-70 ${
                      activeTab === conv.user.id ? 'text-white' : 'text-gray-400'
                    }`}>
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-1">
                    {conv.lastMessage.senderId === currentUser.id && (
                      <span className={`text-[10px] font-bold ${activeTab === conv.user.id ? 'text-white/70' : 'text-blue-500'}`}>
                        You:
                      </span>
                    )}
                    <p className={`text-[11px] truncate leading-none ${
                      conv.unreadCount > 0 
                        ? (activeTab === conv.user.id ? 'text-white font-black' : 'text-gray-900 font-black') 
                        : (activeTab === conv.user.id ? 'text-white/80 font-medium' : 'text-gray-500 font-medium')
                    }`}>
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <main className={`flex-1 flex flex-col min-w-0 bg-white ${!activeTab ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!activeTab ? (
          <div className="text-center max-w-xs animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-xl shadow-blue-100">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Private Chat</h3>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Select conversation to begin</p>
          </div>
        ) : (
          <>
            <header className="h-20 px-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveTab(null)} className="md:hidden p-2 text-gray-400 hover:text-gray-900"><ChevronLeft size={24} /></button>
                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-50">
                  {activeChatUser?.avatar ? <img src={`${API_URL}${activeChatUser.avatar}`} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-black">{(activeChatUser?.name || '?').charAt(0).toUpperCase()}</div>}
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">{activeChatUser?.name}</h3>
                  <div className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Now</span></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsConvDeleteModalOpen(true)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Clear Conversation"
                >
                  <Trash2 size={20} />
                </button>
                <MoreVertical className="text-gray-400" size={20} />
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcfcfd]">
              {msgLoading ? <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div> : messages.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                    <div className="max-w-[85%] md:max-w-[70%] space-y-1 relative">
                      <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`p-4 rounded-[1.5rem] text-sm font-medium shadow-sm ${
                          isOwn 
                            ? 'bg-blue-600 text-white rounded-br-none shadow-blue-100' 
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                          {msg.content}
                        </div>
                        
                        {/* Inline Delete Trigger */}
                        <button 
                          onClick={() => { setMsgToDelete(msg); setIsDeleteModalOpen(true); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-red-100"
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className={`flex items-center space-x-2 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          {new Date(msg.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                          msg.isRead ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} className="text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="p-6 bg-white border-t border-gray-50">
              <form onSubmit={handleSend} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-[1.5rem] shadow-inner">
                <Smile className="text-gray-400 ml-2" size={20} />
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 py-2 px-1 outline-none"/>
                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"><Send size={20} /></button>
              </form>
            </footer>
          </>
        )}
      </main>

      {/* Modals */}
      {isNewChatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsNewChatModal(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Chat</h3>
                <button onClick={() => setIsNewChatModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Recipient</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input value={selectedRecipient ? selectedRecipient.name : recipientInput} onChange={(e) => { setRecipientInput(e.target.value); setSelectedRecipient(null); }} readOnly={!!selectedRecipient} className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email or Username..." autoFocus />
                    {selectedRecipient && <button onClick={() => setSelectedRecipient(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={16} /></button>}
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={16} />}
                  </div>
                  {suggestions.length > 0 && !selectedRecipient && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden divide-y divide-gray-50">
                      {suggestions.map((u) => (
                        <button key={u.id} onClick={() => { setSelectedRecipient(u); setSuggestions([]); }} className="w-full flex items-center p-3 hover:bg-blue-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {u.avatar ? <img src={`${API_URL}${u.avatar}`} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-black">{u.name.charAt(0)}</div>}
                          </div>
                          <div className="ml-3 overflow-hidden">
                            <p className="text-xs font-black text-gray-900 truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Message</label>
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full bg-gray-50 border-none rounded-[1.25rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-none outline-none" placeholder="Say hello..."/>
                </div>
                <button onClick={handleSend} disabled={(!selectedRecipient && !recipientInput.trim()) || !newMessage.trim()} className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Message Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => { setIsDeleteModalOpen(false); setMsgToDelete(null); }}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xs overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4"><Trash2 size={28} /></div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Message?</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">This action is permanent.</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-100">
              <button onClick={handleDeleteMessage} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-black text-xs hover:bg-red-700 transition-all">Delete</button>
              <button onClick={() => { setIsDeleteModalOpen(false); setMsgToDelete(null); }} className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-xl py-3 font-black text-xs hover:bg-gray-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Clear Confirmation */}
      {isConvDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsConvDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6"><Trash2 size={36} /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Clear Chat?</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed">
                All messages in this conversation will be permanently removed.
              </p>
            </div>
            <div className="bg-gray-50 px-8 py-6 flex gap-3 border-t border-gray-100">
              <button onClick={handleDeleteConversation} className="flex-1 bg-red-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">Clear All</button>
              <button onClick={() => setIsConvDeleteModalOpen(false)} className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-2xl py-4 font-black text-sm hover:bg-gray-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
