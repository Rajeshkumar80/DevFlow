import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationApi } from '../../services/notificationApi';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { Bell, Send, ArrowLeft, Search, Check, CheckCheck, Reply, X } from 'lucide-react';

interface Props { onClose: () => void; }

const typeConfig: Record<string, { color: string; bg: string; icon: string }> = {
  review_assigned: { color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-500/20', icon: 'R' },
  comment_reply: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', icon: 'C' },
  status_change: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', icon: 'S' },
  learning_recommended: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-500/20', icon: 'L' },
  achievement_unlocked: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', icon: 'A' },
  team_message: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-500/20', icon: 'T' },
  mention: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20', icon: '@' },
};

const teamMembers = [
  { id: 'user-2', name: 'John Developer', avatar: 'J', status: 'online' as const, role: 'Lead' },
  { id: 'user-3', name: 'Sarah Chen', avatar: 'S', status: 'away' as const, role: 'Reviewer' },
  { id: 'user-4', name: 'Mike Rodriguez', avatar: 'M', status: 'offline' as const, role: 'Contributor' },
];

const quickReplies = [
  'Sounds good!', "I'll check it out.", 'Thanks!', 'On it.', 'Let me review.',
];

function formatMessageTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24 && d.getDate() === now.getDate()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1 || (diffDays < 2 && d.getDate() === now.getDate() - 1)) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function DateSeparator({ date }: { date: Date }) {
  const now = new Date();
  const d = new Date(date);
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
  const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-surface">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
    </div>
  );
}

function MessageBubble({ msg, isOwn, showSender, onReply }: { msg: ChatMessage; isOwn: boolean; showSender: boolean; onReply: (msg: ChatMessage) => void }) {
  return (
    <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mb-0.5 ml-1">{msg.fromName}</p>
        )}
        {msg.replyTo && (
          <div className={`text-[10px] px-2 py-1 mb-0.5 rounded-t-lg border-l-2 ${isOwn ? 'bg-primary-700/30 border-primary-300' : 'bg-gray-200 dark:bg-dark-card border-gray-400 dark:border-gray-500'}`}>
            <p className={`font-medium ${isOwn ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>{msg.replyTo.from}</p>
            <p className={`truncate ${isOwn ? 'text-white/60' : 'text-gray-500 dark:text-gray-500'}`}>{msg.replyTo.text}</p>
          </div>
        )}
        <div className={`relative px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
          isOwn
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-dark-border'
        }`}>
          <p>{msg.text}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[9px] ${isOwn ? 'text-white/50' : 'text-gray-400 dark:text-gray-500'}`}>
              {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className="text-white/50">
                {msg.status === 'sending' && <Check size={10} />}
                {msg.status === 'sent' && <Check size={10} />}
                {msg.status === 'delivered' && <CheckCheck size={10} />}
                {msg.status === 'read' && <CheckCheck size={10} className="text-blue-300" />}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onReply(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ml-1 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-dark-surface">
          <Reply size={10} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex items-center gap-0.5 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-bl-md">
        <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1">{name}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export const NotificationBell = ({ onClose }: Props) => {
  const { notifications, setNotifications, markAsRead, markAllAsRead, setUnreadCount } = useNotificationStore();
  const chatStore = useChatStore();
  const { conversations, activeConversation, searchQuery, initConversations, setActiveConversation, setSearchQuery, sendMessage, getSortedConversations, getTotalUnread } = chatStore;

  const [activeTab, setActiveTab] = useState<'all' | 'reviews' | 'team' | 'chat'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadNotifications(); initConversations(teamMembers); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversations, activeConversation]);

  const loadNotifications = async () => {
    try { const data = await notificationApi.getNotifications(); setNotifications(data.notifications); setUnreadCount(data.unreadCount); } catch {}
  };

  const handleMarkAllAsRead = async () => { try { await notificationApi.markAllAsRead(); markAllAsRead(); } catch {} };
  const handleMarkNotifRead = async (id: string) => { try { await notificationApi.markAsRead(id); markAsRead(id); } catch {} };

  const sortedConversations = getSortedConversations();
  const activeConvo = activeConversation ? conversations[activeConversation] : undefined;
  const activeMember = teamMembers.find(m => m.id === activeConversation);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'reviews') return ['review_assigned', 'status_change', 'comment_reply'].includes(n.type);
    if (activeTab === 'team') return ['team_message', 'mention', 'achievement_unlocked'].includes(n.type);
    return true;
  });

  const unreadByType = (types: string[]) => notifications.filter(n => !n.is_read && types.includes(n.type)).length;

  const handleSend = () => {
    if (!chatInput.trim() || !activeConversation || !activeMember) return;
    sendMessage(activeConversation, activeMember.name, chatInput.trim(), 'chat', replyTo ? { id: replyTo.id, text: replyTo.text, from: replyTo.fromName } : undefined);
    setChatInput('');
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const handleQuickReply = (msg: string) => {
    setChatInput(msg);
    inputRef.current?.focus();
  };

  const handleNotifReply = (n: { title: string; content?: string }) => {
    setActiveTab('chat');
    setActiveConversation(teamMembers[0].id);
    setChatInput(`Re: ${n.title}${n.content ? ' - ' + n.content.slice(0, 50) : ''}`);
  };

  const activeConvoMessages = useMemo(() => {
    if (!activeConvo) return [];
    const msgs = activeConvo.messages;
    const grouped: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    msgs.forEach(msg => {
      const msgDate = new Date(msg.time).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        grouped.push({ date: msgDate, messages: [] });
      }
      grouped[grouped.length - 1].messages.push(msg);
    });
    return grouped;
  }, [activeConvo?.messages]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15 }} className="absolute right-0 top-12 w-[380px] bg-white dark:bg-dark-surface rounded-card border border-gray-200 dark:border-dark-border shadow-dropdown z-50 overflow-hidden flex flex-col max-h-[560px]">

        {/* Header */}
        <div className="p-3 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              {activeConversation ? (
                <button onClick={() => { setActiveConversation(null); setReplyTo(null); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"><ArrowLeft size={14} className="text-gray-500" /></button>
              ) : (
                <Bell size={16} className="text-gray-900 dark:text-white" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {activeConversation ? activeMember?.name : 'Notifications'}
                </h3>
                {activeConversation && activeMember && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {activeConvo?.isTyping ? 'typing...' : activeMember.status === 'online' ? 'Online' : activeMember.status === 'away' ? 'Away' : 'Offline'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!activeConversation && (
                <>
                  {notifications.some(n => !n.is_read) && (
                    <button onClick={handleMarkAllAsRead} className="text-[10px] text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium px-2 py-1">Mark all read</button>
                  )}
                </>
              )}
              {activeConversation && (
                <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-400'}`}>
                  <Search size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs - hidden in chat */}
          {!activeConversation && (
            <div className="flex gap-0.5 p-0.5 bg-gray-100 dark:bg-dark-card rounded-lg">
              {[
                { id: 'all', label: 'All', count: notifications.filter(n => !n.is_read).length },
                { id: 'reviews', label: 'Reviews', count: unreadByType(['review_assigned', 'status_change', 'comment_reply']) },
                { id: 'team', label: 'Team', count: unreadByType(['team_message', 'mention', 'achievement_unlocked']) },
                { id: 'chat', label: 'Chat', count: getTotalUnread() },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all relative ${activeTab === tab.id ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                  {tab.label}
                  {tab.count > 0 && <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[9px] flex items-center justify-center">{tab.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Chat search bar */}
          {activeConversation && showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full text-[11px] pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300" placeholder="Search messages..." />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} className="text-gray-400" /></button>}
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeConversation && activeConvo ? (
            /* Chat View */
            <div className="flex flex-col">
              {/* Messages */}
              <div className="flex-1 px-3 py-2 space-y-0.5">
                {activeConvoMessages.map((group, gi) => (
                  <div key={gi}>
                    <DateSeparator date={new Date(group.date)} />
                    {group.messages.map((msg, mi) => {
                      const isOwn = msg.from === 'user-1';
                      const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                      const showSender = !isOwn && (!prevMsg || prevMsg.from !== msg.from);
                      return (
                        <MessageBubble key={msg.id} msg={msg} isOwn={isOwn} showSender={showSender} onReply={setReplyTo} />
                      );
                    })}
                  </div>
                ))}
                {activeConvo.isTyping && <TypingIndicator name={activeMember?.name || ''} />}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Preview */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pt-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-dark-card rounded-t-lg border border-b-0 border-gray-200 dark:border-dark-border">
                      <Reply size={12} className="text-primary-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">{replyTo.fromName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{replyTo.text}</p>
                      </div>
                      <button onClick={() => setReplyTo(null)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-dark-surface"><X size={12} className="text-gray-400" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Replies */}
              <div className="px-3 pt-2 flex gap-1 overflow-x-auto scrollbar-none">
                {quickReplies.map((msg, i) => (
                  <button key={i} onClick={() => handleQuickReply(msg)} className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors whitespace-nowrap flex-shrink-0">{msg}</button>
                ))}
              </div>

              {/* Input */}
              <div className="p-2 flex items-center gap-1.5">
                <input ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="flex-1 text-[12px] px-3 py-2 rounded-full border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300" placeholder={replyTo ? `Reply to ${replyTo.fromName}...` : 'Type a message...'} />
                <button onClick={handleSend} disabled={!chatInput.trim()} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${chatInput.trim() ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-100 dark:bg-dark-card text-gray-400'}`}>
                  <Send size={13} />
                </button>
              </div>
            </div>
          ) : activeTab === 'chat' ? (
            /* Chat List */
            <div>
              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full text-[11px] pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:outline-none" placeholder="Search conversations..." />
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-dark-border/50">
                {sortedConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-[11px]">
                    <p>No conversations found</p>
                  </div>
                ) : sortedConversations.map((convo) => (
                  <button key={convo.memberId} onClick={() => setActiveConversation(convo.memberId)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                        <span className="text-primary-700 dark:text-primary-400 text-sm font-semibold">{convo.memberAvatar}</span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-surface ${convo.memberStatus === 'online' ? 'bg-emerald-500' : convo.memberStatus === 'away' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{convo.memberName}</p>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">{formatMessageTime(convo.lastMessage.time)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {convo.isTyping ? (
                            <span className="text-primary-500 dark:text-primary-400 italic">typing...</span>
                          ) : convo.lastMessage ? (
                            <>
                              {convo.lastMessage.from === 'user-1' && <span className="text-gray-400 dark:text-gray-500">You: </span>}
                              {convo.lastMessage.text}
                            </>
                          ) : (
                            <span className="text-gray-400">Start a conversation</span>
                          )}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 ml-2">{convo.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Notifications List */
            <div>
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  <Bell size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const config = typeConfig[n.type] || typeConfig.review_assigned;
                  return (
                    <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors ${!n.is_read ? 'bg-primary-50/30 dark:bg-primary-500/[0.02]' : ''}`}>
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${config.bg} ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => handleMarkNotifRead(n.id)}>
                          <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                          {n.content && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                          <button onClick={() => handleNotifReply(n)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-card transition-colors opacity-0 group-hover:opacity-100">
                            <Reply size={12} className="text-gray-400 hover:text-primary-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
