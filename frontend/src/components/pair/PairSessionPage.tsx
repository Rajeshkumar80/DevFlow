import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, StopCircle, Users, MessageSquare, Code, Terminal, Video, Plus, ArrowLeft, Copy, Check } from 'lucide-react';
import { connectSocket, joinSessionRoom, emitSessionCodeChange, emitSessionChatMessage } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { sessionApi } from '../../services/sessionApi';

export const PairSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(!sessionId);
  const [sessions, setSessions] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'active' | 'paused' | 'ended'>('active');
  const [code, setCode] = useState('// Welcome to pair programming!\n// Start coding together...\n\nfunction greet(name: string) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));\n');
  const [messages, setMessages] = useState<{ user: string; text: string; time: Date }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'terminal'>('code');
  const [newSessionName, setNewSessionName] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSessions();
    if (sessionId) joinSession(sessionId);
  }, [sessionId]);

  const loadSessions = async () => {
    try {
      const data = await sessionApi.listSessions();
      setSessions(data);
    } catch {}
  };

  const joinSession = async (sid: string) => {
    setJoining(true);
    try {
      let s = await sessionApi.getSession(sid).catch(() => null);
      if (!s) {
        s = await sessionApi.createSession({ name: 'Pair Session', creatorId: user?.id || 'user-1' });
      }
      if (user?.id) {
        await sessionApi.joinSession(sid, user.id).catch(() => {});
      }
      setSession(s);
      setCode(s.code || code);
      setStatus(s.status === 'ended' ? 'ended' : 'active');
      setShowCreate(false);

      const socket = connectSocket();
      joinSessionRoom(sid);
      socket.off('session:user:join');
      socket.off('session:code:change');
      socket.off('session:chat:message');

      socket.on('session:user:join', () => {
        setParticipants(p => p + 1);
      });
      socket.on('session:code:change', (data: any) => {
        if (data.userId !== user?.id) setCode(data.content);
      });
      socket.on('session:chat:message', (data: any) => {
        setMessages(m => [...m, { user: data.userId || 'Unknown', text: data.message, time: new Date() }]);
      });

      setParticipants(s.participants?.length || 1);
    } catch {} finally { setJoining(false); }
  };

  const handleCreateSession = async () => {
    setJoining(true);
    try {
      const s = await sessionApi.createSession({
        name: newSessionName || 'Pair Session',
        creatorId: user?.id || 'user-1'
      });
      if (user?.id) await sessionApi.joinSession(s.id, user.id).catch(() => {});
      navigate(`/pair/${s.id}`);
      await joinSession(s.id);
      setShowCreate(false);
    } catch {} finally { setJoining(false); }
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    if (sessionId) emitSessionCodeChange(sessionId, { content: val });
    if (session) sessionApi.updateSession(session.id, { code: val }).catch(() => {});
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !sessionId) return;
    emitSessionChatMessage(sessionId, chatInput);
    setMessages([...messages, { user: user?.username || 'You', text: chatInput, time: new Date() }]);
    setChatInput('');
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'ended') => {
    setStatus(newStatus);
    if (session) await sessionApi.updateSession(session.id, { status: newStatus }).catch(() => {});
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId || session?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Session List View
  if (showCreate && !sessionId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pair Programming</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time collaborative coding</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Create New Session</h3>
          <div className="flex gap-3">
            <input value={newSessionName} onChange={e => setNewSessionName(e.target.value)} className="input flex-1" placeholder="Session name (optional)" />
            <button onClick={handleCreateSession} disabled={joining} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all flex items-center gap-1.5">
              <Plus size={16} /> {joining ? 'Creating...' : 'Start Session'}
            </button>
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {sessions.map((s) => (
                <div key={s.id} onClick={() => navigate(`/pair/${s.id}`)} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : s.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name || 'Pair Session'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.participants?.length || 0} participants · {s.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      <div className="flex-1 flex flex-col gap-4">
        {/* Session bar */}
        <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border px-4 py-2.5 flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <button onClick={() => { navigate('/pair'); setShowCreate(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-400"><ArrowLeft size={16} /></button>
            <div className="flex items-center gap-1.5"><Video size={16} className="text-primary-500" /><h3 className="font-medium text-gray-900 dark:text-white text-sm">{session?.name || 'Pair Session'}</h3></div>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Users size={13} /> {participants}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              status === 'active' ? 'badge-green' : status === 'paused' ? 'badge-amber' : 'badge-slate'
            }`}>{status}</span>
            {sessionId && (
              <button onClick={copySessionId} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Share ID</>}
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {status === 'active' && <button onClick={() => handleStatusChange('paused')} className="px-2.5 py-1 rounded-btn border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover text-xs flex items-center gap-1"><Pause size={12} /> Pause</button>}
            {status === 'paused' && <button onClick={() => handleStatusChange('active')} className="px-2.5 py-1 rounded-btn bg-primary-600 hover:bg-primary-700 text-white text-xs flex items-center gap-1"><Play size={12} /> Resume</button>}
            {status !== 'ended' && <button onClick={() => handleStatusChange('ended')} className="px-2.5 py-1 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1"><StopCircle size={12} /> End</button>}
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
