import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, StopCircle, Users, MessageSquare, Code, Terminal, Video } from 'lucide-react';
import { connectSocket, joinSessionRoom, emitSessionCodeChange, emitSessionChatMessage } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

export const PairSessionPage = () => {
  const { sessionId } = useParams();
  const [status, setStatus] = useState<'scheduled' | 'active' | 'paused' | 'ended'>('active');
  const [code, setCode] = useState('// Welcome to the pair programming session!\n// Start coding together...\n\nfunction greet(name: string) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));\n');
  const [messages, setMessages] = useState<{ user: string; text: string; time: Date }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(2);
  const [activeTab, setActiveTab] = useState<'code' | 'terminal'>('code');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (sessionId) {
      const socket = connectSocket();
      joinSessionRoom(sessionId);
      socket.on('session:user:join', () => setParticipants(p => p + 1));
      socket.on('session:code:change', (data: any) => { if (data.userId !== user?.id) setCode(data.content); });
      socket.on('session:chat:message', (data: any) => setMessages(m => [...m, { user: data.userId, text: data.message, time: new Date() }]));
    }
  }, [sessionId]);

  const handleCodeChange = (val: string) => { setCode(val); if (sessionId) emitSessionCodeChange(sessionId, { content: val }); };
  const handleSendMessage = () => { if (!chatInput.trim() || !sessionId) return; emitSessionChatMessage(sessionId, chatInput); setMessages([...messages, { user: user?.username || 'You', text: chatInput, time: new Date() }]); setChatInput(''); };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      <div className="flex-1 flex flex-col gap-4">
        {/* Session bar */}
        <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border px-4 py-2.5 flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><Video size={16} className="text-primary-500" /><h3 className="font-medium text-gray-900 dark:text-white text-sm">Pair Session</h3></div>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Users size={13} /> {participants}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              status === 'active' ? 'badge-green' : status === 'paused' ? 'badge-amber' : 'badge-slate'
            }`}>{status}</span>
          </div>
          <div className="flex gap-1.5">
            {status === 'active' && <button onClick={() => setStatus('paused')} className="px-2.5 py-1 rounded-btn border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover text-xs flex items-center gap-1"><Pause size={12} /> Pause</button>}
            {status === 'paused' && <button onClick={() => setStatus('active')} className="px-2.5 py-1 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-xs flex items-center gap-1"><Play size={12} /> Resume</button>}
            {status !== 'ended' && <button onClick={() => setStatus('ended')} className="px-2.5 py-1 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1"><StopCircle size={12} /> End</button>}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border overflow-hidden flex flex-col shadow-card">
          <div className="flex border-b border-gray-200 dark:border-dark-border">
            <button onClick={() => setActiveTab('code')} className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors ${activeTab === 'code' ? 'border-primary-500 text-gray-900 dark:text-white font-medium' : 'border-transparent text-gray-500 dark:text-gray-400'}`}><Code size={14} /> Code</button>
            <button onClick={() => setActiveTab('terminal')} className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors ${activeTab === 'terminal' ? 'border-primary-500 text-gray-900 dark:text-white font-medium' : 'border-transparent text-gray-500 dark:text-gray-400'}`}><Terminal size={14} /> Terminal</button>
          </div>
          {activeTab === 'code' ? (
            <div className="flex-1 flex flex-col">
              <div className="px-3 py-1.5 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex items-center gap-1.5">
                <Code size={12} className="text-primary-500" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">main.ts</span>
              </div>
              <textarea value={code} onChange={(e) => handleCodeChange(e.target.value)} className="flex-1 bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 p-4 font-mono text-xs resize-none focus:outline-none" spellCheck={false} />
            </div>
          ) : (
            <div className="flex-1 bg-gray-50 dark:bg-dark-bg p-4 font-mono text-xs">
              <div className="text-emerald-600 dark:text-emerald-400">$ DevFlow pair session ready</div>
              <div className="text-gray-500 dark:text-gray-400 mt-1">$ Both participants connected</div>
              <div className="text-gray-400 dark:text-gray-500 mt-1">$ Waiting for input...</div>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="w-72 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border flex flex-col shadow-card">
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-dark-border flex items-center gap-1.5">
          <MessageSquare size={14} className="text-primary-500" />
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">Chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 text-xs py-8">No messages yet</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.user === (user?.username || 'You') ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-btn text-xs ${msg.user === (user?.username || 'You') ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-gray-100'}`}>
                  <p className="font-medium mb-0.5 opacity-70 text-[10px]">{msg.user === (user?.username || 'You') ? 'You' : msg.user}</p>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-dark-border flex gap-1.5">
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="input flex-1 text-xs" onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
          <button onClick={handleSendMessage} className="px-2.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-btn transition-all"><MessageSquare size={14} /></button>
        </div>
      </div>
    </div>
  );
};
