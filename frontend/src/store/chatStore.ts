import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  text: string;
  time: Date;
  type: 'notification' | 'email' | 'chat';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: { id: string; text: string; from: string };
}

export interface ChatConversation {
  memberId: string;
  memberName: string;
  memberAvatar: string;
  memberRole: string;
  memberStatus: 'online' | 'away' | 'offline';
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage?: ChatMessage;
  isTyping: boolean;
}

interface ChatState {
  conversations: Record<string, ChatConversation>;
  activeConversation: string | null;
  searchQuery: string;

  initConversations: (members: { id: string; name: string; avatar: string; role: string; status: 'online' | 'away' | 'offline' }[]) => void;
  setActiveConversation: (memberId: string | null) => void;
  setSearchQuery: (query: string) => void;
  sendMessage: (to: string, toName: string, text: string, type: 'notification' | 'email' | 'chat', replyTo?: { id: string; text: string; from: string }) => ChatMessage;
  markAsRead: (memberId: string) => void;
  simulateTyping: (memberId: string) => void;
  simulateReply: (memberId: string, memberName: string) => void;
  getConversation: (memberId: string) => ChatConversation | undefined;
  getSortedConversations: () => ChatConversation[];
  getTotalUnread: () => number;
}

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const mockHistory: Record<string, ChatMessage[]> = {
  'user-2': [
    { id: 'msg-j1', from: 'user-2', fromName: 'John Developer', to: 'user-1', toName: 'Demo User', text: 'Hey, have you reviewed the auth PR yet?', time: new Date(today.getTime() + 9 * 3600000 + 15 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-j2', from: 'user-1', fromName: 'Demo User', to: 'user-2', toName: 'John Developer', text: 'Just started looking at it. The JWT implementation looks solid.', time: new Date(today.getTime() + 9 * 3600000 + 18 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-j3', from: 'user-2', fromName: 'John Developer', to: 'user-1', toName: 'Demo User', text: 'Thanks! I added rate limiting to the login endpoint as you suggested.', time: new Date(today.getTime() + 9 * 3600000 + 22 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-j4', from: 'user-1', fromName: 'Demo User', to: 'user-2', toName: 'John Developer', text: 'Nice. I also noticed we should add refresh token rotation.', time: new Date(today.getTime() + 9 * 3600000 + 25 * 60000), type: 'chat', status: 'delivered' },
    { id: 'msg-j5', from: 'user-2', fromName: 'John Developer', to: 'user-1', toName: 'Demo User', text: "Good call, I'll add that in the next commit.", time: new Date(today.getTime() + 9 * 3600000 + 28 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-j6', from: 'user-2', fromName: 'John Developer', to: 'user-1', toName: 'Demo User', text: 'Also, can you check the new middleware I wrote for CORS?', time: new Date(today.getTime() + 10 * 3600000 + 5 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-j7', from: 'user-1', fromName: 'Demo User', to: 'user-2', toName: 'John Developer', text: "Sure, I'll take a look after lunch.", time: new Date(today.getTime() + 10 * 3600000 + 8 * 60000), type: 'chat', status: 'delivered' },
  ],
  'user-3': [
    { id: 'msg-s1', from: 'user-3', fromName: 'Sarah Chen', to: 'user-1', toName: 'Demo User', text: 'The code review for the dashboard is ready', time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 30 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s2', from: 'user-1', fromName: 'Demo User', to: 'user-3', toName: 'Sarah Chen', text: "Great, I'll take a look. Any critical issues?", time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 35 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s3', from: 'user-3', fromName: 'Sarah Chen', to: 'user-1', toName: 'Demo User', text: 'Found 2 security issues and 3 performance improvements', time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 38 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s4', from: 'user-1', fromName: 'Demo User', to: 'user-3', toName: 'Sarah Chen', text: "Thanks Sarah, I'll prioritize the security fixes.", time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 40 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s5', from: 'user-3', fromName: 'Sarah Chen', to: 'user-1', toName: 'Demo User', text: 'Also, the TypeScript types need updating for the API response', time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 42 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s6', from: 'user-1', fromName: 'Demo User', to: 'user-3', toName: 'Sarah Chen', text: 'Got it, adding that to the todo list.', time: new Date(today.getTime() - 86400000 + 14 * 3600000 + 45 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s7', from: 'user-3', fromName: 'Sarah Chen', to: 'user-1', toName: 'Demo User', text: 'Hey, the PR for the notification system is up now. Can you review?', time: new Date(today.getTime() + 8 * 3600000 + 10 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-s8', from: 'user-3', fromName: 'Sarah Chen', to: 'user-1', toName: 'Demo User', text: "It's PR #47 — added real-time notifications and message persistence", time: new Date(today.getTime() + 8 * 3600000 + 11 * 60000), type: 'chat', status: 'read' },
  ],
  'user-4': [
    { id: 'msg-m1', from: 'user-4', fromName: 'Mike Rodriguez', to: 'user-1', toName: 'Demo User', text: 'Can you pair program on the new feature?', time: new Date(today.getTime() - 86400000 * 2 + 11 * 3600000), type: 'chat', status: 'read' },
    { id: 'msg-m2', from: 'user-1', fromName: 'Demo User', to: 'user-4', toName: 'Mike Rodriguez', text: "Sure! Let me finish this review and I'll join you.", time: new Date(today.getTime() - 86400000 * 2 + 11 * 3600000 + 5 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-m3', from: 'user-4', fromName: 'Mike Rodriguez', to: 'user-1', toName: 'Demo User', text: "Perfect, I'll set up the session. Session ID: pair-abc-123", time: new Date(today.getTime() - 86400000 * 2 + 11 * 3600000 + 8 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-m4', from: 'user-1', fromName: 'Demo User', to: 'user-4', toName: 'Mike Rodriguez', text: 'Joining now. Let me share my screen.', time: new Date(today.getTime() - 86400000 * 2 + 11 * 3600000 + 12 * 60000), type: 'chat', status: 'read' },
    { id: 'msg-m5', from: 'user-4', fromName: 'Mike Rodriguez', to: 'user-1', toName: 'Demo User', text: 'Great session! Let me push the changes now.', time: new Date(today.getTime() - 86400000 * 2 + 12 * 3600000), type: 'chat', status: 'read' },
  ],
};

const autoReplies: Record<string, string[]> = {
  'user-2': ["I'll push the fix now.", "Looks good to me, approved!", "Can you check the test coverage?", "Let me refactor that real quick.", "Done! Ready for another review."],
  'user-3': ["Thanks for the feedback!", "I'll update the PR.", "Found another issue, hold on.", "The tests are passing now.", "Can we sync on this tomorrow?"],
  'user-4': ["On it!", "Let me pull the latest.", "I think we should refactor this.", "Great catch, fixing now.", "All done, merged!"],
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  activeConversation: null,
  searchQuery: '',

  initConversations: (members) => {
    set((state) => {
      const convos = { ...state.conversations };
      members.forEach((m) => {
        if (!convos[m.id]) {
          const history = (mockHistory[m.id] || []).map(msg => ({ ...msg, time: new Date(msg.time) }));
          const lastMsg = history.length > 0 ? history[history.length - 1] : undefined;
          const unread = history.filter(msg => msg.from !== 'user-1' && msg.status !== 'read').length;
          convos[m.id] = {
            memberId: m.id,
            memberName: m.name,
            memberAvatar: m.avatar,
            memberRole: m.role,
            memberStatus: m.status,
            messages: history,
            unreadCount: unread,
            lastMessage: lastMsg,
            isTyping: false,
          };
        }
      });
      return { conversations: convos };
    });
  },

  setActiveConversation: (memberId) => {
    set({ activeConversation: memberId });
    if (memberId) {
      get().markAsRead(memberId);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  sendMessage: (to, toName, text, type, replyTo) => {
    const user = { id: 'user-1', name: 'Demo User' };
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: user.id,
      fromName: user.name,
      to,
      toName,
      text,
      time: new Date(),
      type,
      status: 'sending',
      replyTo,
    };

    set((state) => {
      const convos = { ...state.conversations };
      const convo = convos[to];
      if (convo) {
        convo.messages = [...convo.messages, msg];
        convo.lastMessage = msg;
        convos[to] = { ...convo };
      }
      return { conversations: convos };
    });

    setTimeout(() => {
      set((state) => {
        const convos = { ...state.conversations };
        const convo = convos[to];
        if (convo) {
          convo.messages = convo.messages.map(m => m.id === msg.id ? { ...m, status: 'sent' as const } : m);
          convo.lastMessage = convo.messages[convo.messages.length - 1];
          convos[to] = { ...convo };
        }
        return { conversations: convos };
      });
    }, 300);

    setTimeout(() => {
      set((state) => {
        const convos = { ...state.conversations };
        const convo = convos[to];
        if (convo) {
          convo.messages = convo.messages.map(m => m.id === msg.id ? { ...m, status: 'delivered' as const } : m);
          convo.lastMessage = convo.messages[convo.messages.length - 1];
          convos[to] = { ...convo };
        }
        return { conversations: convos };
      });
    }, 800);

    setTimeout(() => {
      set((state) => {
        const convos = { ...state.conversations };
        const convo = convos[to];
        if (convo) {
          convo.messages = convo.messages.map(m => m.id === msg.id ? { ...m, status: 'read' as const } : m);
          convo.lastMessage = convo.messages[convo.messages.length - 1];
          convos[to] = { ...convo };
        }
        return { conversations: convos };
      });
    }, 2000);

    setTimeout(() => get().simulateTyping(to), 1500);
    setTimeout(() => get().simulateReply(to, toName), 3000 + Math.random() * 2000);

    return msg;
  },

  markAsRead: (memberId) => {
    set((state) => {
      const convos = { ...state.conversations };
      const convo = convos[memberId];
      if (convo) {
        convo.unreadCount = 0;
        convo.messages = convo.messages.map(m => m.from !== 'user-1' ? { ...m, status: 'read' as const } : m);
        convos[memberId] = { ...convo };
      }
      return { conversations: convos };
    });
  },

  simulateTyping: (memberId) => {
    set((state) => {
      const convos = { ...state.conversations };
      const convo = convos[memberId];
      if (convo) {
        convo.isTyping = true;
        convos[memberId] = { ...convo };
      }
      return { conversations: convos };
    });

    setTimeout(() => {
      set((state) => {
        const convos = { ...state.conversations };
        const convo = convos[memberId];
        if (convo) {
          convo.isTyping = false;
          convos[memberId] = { ...convo };
        }
        return { conversations: convos };
      });
    }, 2500);
  },

  simulateReply: (memberId, memberName) => {
    const replies = autoReplies[memberId] || ["Got it!", "Thanks!", "On it.", "Sounds good.", "Will do."];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: memberId,
      fromName: memberName,
      to: 'user-1',
      toName: 'Demo User',
      text: reply,
      time: new Date(),
      type: 'chat',
      status: 'delivered',
    };

    set((state) => {
      const convos = { ...state.conversations };
      const convo = convos[memberId];
      if (convo) {
        convo.isTyping = false;
        convo.messages = [...convo.messages, msg];
        convo.lastMessage = msg;
        if (state.activeConversation !== memberId) {
          convo.unreadCount = (convo.unreadCount || 0) + 1;
        }
        convos[memberId] = { ...convo };
      }
      return { conversations: convos };
    });
  },

  getConversation: (memberId) => get().conversations[memberId],

  getSortedConversations: () => {
    const { conversations, searchQuery } = get();
    const sorted = Object.values(conversations).sort((a, b) => {
      const aTime = a.lastMessage?.time?.getTime() || 0;
      const bTime = b.lastMessage?.time?.getTime() || 0;
      return bTime - aTime;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return sorted.filter(c =>
        c.memberName.toLowerCase().includes(q) ||
        c.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }
    return sorted;
  },

  getTotalUnread: () => {
    return Object.values(get().conversations).reduce((sum, c) => sum + c.unreadCount, 0);
  },
}));
