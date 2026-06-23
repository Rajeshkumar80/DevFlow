import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, StopCircle, Users, MessageSquare, Code, Terminal, Plus, ArrowLeft, Copy, Check, LogIn, ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Send, Clock, Wifi, WifiOff, Circle } from 'lucide-react';
import { usePairStore, FileNode } from '../../store/pairStore';
import { useAuthStore } from '../../store/authStore';

function FileIcon({ node, size = 14 }: { node: FileNode; size?: number }) {
  if (node.type === 'folder') return node.isExpanded ? <FolderOpen size={size} className="text-amber-500" /> : <Folder size={size} className="text-amber-500" />;
  const ext = node.name.split('.').pop();
  const colors: Record<string, string> = { ts: 'text-blue-500', tsx: 'text-cyan-500', js: 'text-yellow-500', json: 'text-green-500', md: 'text-gray-500', css: 'text-purple-500', html: 'text-orange-500' };
  return <FileText size={size} className={colors[ext || ''] || 'text-gray-400'} />;
}

function FileTree({ files, sessionId, depth = 0 }: { files: FileNode[]; sessionId: string; depth?: number }) {
  const setActiveFile = usePairStore(s => s.setActiveFile);
  const toggleFolder = usePairStore(s => s.toggleFolder);
  const session = usePairStore(s => s.sessions.find(s => s.id === sessionId));
  if (!session) return null;

  return (
    <div>
      {files.map(node => (
        <div key={node.id}>
          <button
            onClick={() => node.type === 'folder' ? toggleFolder(sessionId, node.id) : setActiveFile(sessionId, node.id)}
            className={`w-full flex items-center gap-1.5 py-1 px-2 text-[11px] hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors ${session.activeFileId === node.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {node.type === 'folder' ? (
              node.isExpanded ? <ChevronDown size={10} className="flex-shrink-0" /> : <ChevronRight size={10} className="flex-shrink-0" />
            ) : <span className="w-[10px]" />}
            <FileIcon node={node} size={12} />
            <span className="truncate">{node.name}</span>
          </button>
          {node.type === 'folder' && node.isExpanded && node.children && (
            <FileTree files={node.children} sessionId={sessionId} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startTime?: Date): string {
  if (!startTime) return '00:00';
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const PairSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const store = usePairStore();

  const [showCreate, setShowCreate] = useState(!sessionId);
  const [newSessionName, setNewSessionName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState<'code' | 'terminal'>('code');
  const [showSidebar] = useState(true);
  const [timer, setTimer] = useState('00:00');
  const [connected] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const session = sessionId ? store.getSession(sessionId) : undefined;
  const activeFile = session ? findFileById(session.files, session.activeFileId) : undefined;

  useEffect(() => {
    if (sessionId && !session) {
      const s = store.createSession(newSessionName || 'Pair Session', user?.id || 'user-1');
      if (s.id !== sessionId) {
        store.setActiveSession(sessionId);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (session?.status === 'active' && session?.startedAt) {
      timerRef.current = setInterval(() => setTimer(formatDuration(session.startedAt)), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [session?.status, session?.startedAt]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [session?.chatMessages]);
  useEffect(() => { terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight); }, [session?.terminal]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const interval = setInterval(() => {
      store.simulateOtherUserTyping(session.id);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  const handleCreateSession = () => {
    setJoining(true);
    setError('');
    const s = store.createSession(newSessionName || `Session ${store.sessions.length + 1}`, user?.id || 'user-1');
    setTimeout(() => {
      store.addParticipant(s.id, { id: 'user-2', name: 'John Developer', avatar: 'J', color: '#3b82f6', isActive: true });
      store.addChatMessage(s.id, 'user-2', 'John Developer', 'Hey! Ready to pair program?');
      setShowCreate(false);
      navigate(`/pair/${s.id}`);
      setJoining(false);
    }, 500);
  };

  const handleJoinById = () => {
    if (!joinId.trim()) return;
    navigate(`/pair/${joinId.trim()}`);
    setShowCreate(false);
  };

  const handleCodeChange = (val: string) => {
    if (!session || !activeFile) return;
    store.updateFileContent(session.id, session.activeFileId, val);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !session) return;
    store.addChatMessage(session.id, user?.id || 'user-1', user?.username || 'You', chatInput.trim());
    setChatInput('');

    if (session.participants.length > 1) {
      setTimeout(() => {
        const other = session.participants.find(p => p.id !== (user?.id || 'user-1'));
        if (other) {
          const replies = ['Got it!', 'Makes sense.', 'Nice!', 'On it.', 'Good idea!', 'Let me check.', 'Agreed.'];
          store.addChatMessage(session.id, other.id, other.name, replies[Math.floor(Math.random() * replies.length)]);
        }
      }, 1500 + Math.random() * 2000);
    }
  };

  const handleTerminalCommand = (cmd: string) => {
    if (!session) return;
    store.executeCommand(session.id, cmd);
  };

  const handleStatusChange = (newStatus: 'active' | 'paused' | 'ended') => {
    if (!session) return;
    store.updateSessionStatus(session.id, newStatus);
    if (newStatus === 'active') {
      store.addTerminalLine(session.id, { type: 'system', text: 'Session resumed.' });
    } else if (newStatus === 'paused') {
      store.addTerminalLine(session.id, { type: 'system', text: 'Session paused.' });
    } else {
      store.addTerminalLine(session.id, { type: 'system', text: 'Session ended. Thanks for pairing!' });
      clearInterval(timerRef.current);
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addNewFile = () => {
    if (!session) return;
    const name = prompt('File name (e.g., utils.ts):');
    if (name) store.createFile(session.id, name, 'src');
  };

  // Session List / Create View
  if (showCreate && !sessionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pair Programming</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Real-time collaborative coding with your team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"><Plus size={16} /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Create Session</h3>
            </div>
            <input value={newSessionName} onChange={e => setNewSessionName(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300 mb-3" placeholder="Session name (optional)" />
            <button onClick={handleCreateSession} disabled={joining} className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-btn transition-all flex items-center justify-center gap-1.5">
              <Plus size={16} /> {joining ? 'Creating...' : 'Start New Session'}
            </button>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"><LogIn size={16} /></div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Join Session</h3>
            </div>
            <input value={joinId} onChange={e => setJoinId(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300 mb-3" placeholder="Paste session ID here" onKeyDown={e => e.key === 'Enter' && handleJoinById()} />
            <button onClick={handleJoinById} disabled={!joinId.trim()} className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-btn transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
              <LogIn size={16} /> Join Session
            </button>
            {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
          </div>
        </div>

        {store.sessions.length > 0 && (
          <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Sessions</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {store.sessions.map((s) => (
                <div key={s.id} onClick={() => { navigate(`/pair/${s.id}`); setShowCreate(false); }} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : s.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.participants.length} participants · {s.status} · {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(s.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-400 transition-all" title="Copy ID">
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Session not found</p>
          <button onClick={() => { setShowCreate(true); navigate('/pair'); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3">
      {/* Session Bar */}
      <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border px-4 py-2 flex items-center justify-between shadow-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { store.setActiveSession(null); setShowCreate(true); navigate('/pair'); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-400"><ArrowLeft size={16} /></button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-emerald-500 animate-pulse' : session.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">{session.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock size={12} /> {timer}
          </div>
          <div className="flex items-center gap-1.5">
            {connected ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-red-500" />}
            <span className="text-[10px] text-gray-400">{connected ? 'Connected' : 'Reconnecting...'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-gray-400" />
            <div className="flex -space-x-1.5">
              {session.participants.map(p => (
                <div key={p.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: p.color }}>{p.avatar}</div>
              ))}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1">{session.participants.length}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${session.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : session.status === 'paused' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-dark-surface text-gray-500'}`}>{session.status}</span>
          <button onClick={copySessionId} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {copied ? <><Check size={10} className="text-emerald-500" /> Copied</> : <><Copy size={10} /> Share</>}
          </button>
          <div className="flex gap-1">
            {session.status === 'active' && <button onClick={() => handleStatusChange('paused')} className="px-2 py-1 rounded border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover text-[10px] flex items-center gap-1"><Pause size={10} /> Pause</button>}
            {session.status === 'paused' && <button onClick={() => handleStatusChange('active')} className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] flex items-center gap-1"><Play size={10} /> Resume</button>}
            {session.status !== 'ended' && <button onClick={() => handleStatusChange('ended')} className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] flex items-center gap-1"><StopCircle size={10} /> End</button>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* File Tree Sidebar */}
        {showSidebar && (
          <div className="w-52 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border flex flex-col shadow-card flex-shrink-0">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-900 dark:text-white">Files</span>
              <button onClick={addNewFile} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-400" title="New file"><Plus size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <FileTree files={session.files} sessionId={session.id} />
            </div>
            <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-border">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{session.participants.length} participants online</p>
            </div>
          </div>
        )}

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border overflow-hidden flex flex-col shadow-card min-h-0">
            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 dark:border-dark-border">
              <button onClick={() => setActiveEditorTab('code')} className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-b-2 transition-colors ${activeEditorTab === 'code' ? 'border-primary-500 text-gray-900 dark:text-white font-medium' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}><Code size={13} /> Code</button>
              <button onClick={() => setActiveEditorTab('terminal')} className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-b-2 transition-colors ${activeEditorTab === 'terminal' ? 'border-primary-500 text-gray-900 dark:text-white font-medium' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}><Terminal size={13} /> Terminal</button>
              {activeFile && (
                <div className="ml-auto flex items-center gap-1.5 px-3 text-[10px] text-gray-400">
                  <FileIcon node={activeFile} size={11} />
                  <span>{activeFile.name}</span>
                </div>
              )}
            </div>

            {activeEditorTab === 'code' ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Cursor indicators */}
                {session.participants.filter(p => p.id !== (user?.id || 'user-1') && p.cursorPosition).map(p => (
                  <div key={p.id} className="px-3 py-1 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border flex items-center gap-2 text-[10px]">
                    <Circle size={6} fill={p.color} stroke={p.color} />
                    <span style={{ color: p.color }}>{p.name}</span>
                    <span className="text-gray-400">editing line {p.cursorPosition!.line + 1}</span>
                  </div>
                ))}
                {activeFile ? (
                  <textarea ref={codeRef} value={activeFile.content || ''} onChange={(e) => handleCodeChange(e.target.value)} className="flex-1 bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 p-4 font-mono text-xs resize-none focus:outline-none leading-relaxed" spellCheck={false} disabled={session.status === 'ended'} />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">Select a file to edit</div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div ref={terminalRef} className="flex-1 bg-gray-950 dark:bg-black p-4 font-mono text-xs overflow-y-auto">
                  {session.terminal.map(line => (
                    <div key={line.id} className={`mb-0.5 ${line.type === 'input' ? 'text-emerald-400' : line.type === 'error' ? 'text-red-400' : line.type === 'system' ? 'text-blue-400' : 'text-gray-300'}`}>
                      {line.text}
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 bg-gray-900 dark:bg-gray-950 border-t border-gray-800 flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-xs">$</span>
                  <TerminalInput onCommand={handleTerminalCommand} disabled={session.status === 'ended'} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-64 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border flex flex-col shadow-card flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-dark-border flex items-center gap-1.5">
            <MessageSquare size={13} className="text-primary-500" />
            <h3 className="font-medium text-gray-900 dark:text-white text-xs">Chat</h3>
            <span className="text-[10px] text-gray-400">({session.chatMessages.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {session.chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 text-[11px] py-8">No messages yet</div>
            ) : (
              session.chatMessages.map((msg, i) => {
                const isOwn = msg.from === (user?.id || 'user-1');
                return (
                  <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-[11px] ${isOwn ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-gray-100 rounded-bl-sm'}`}>
                      {!isOwn && <p className="text-[9px] font-semibold text-primary-600 dark:text-primary-400 mb-0.5">{msg.fromName}</p>}
                      <p>{msg.text}</p>
                      <p className={`text-[8px] mt-0.5 ${isOwn ? 'text-white/50' : 'text-gray-400'}`}>{formatTime(msg.time)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-dark-border flex gap-1.5">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type..." className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300" onKeyDown={e => e.key === 'Enter' && handleSendMessage()} disabled={session.status === 'ended'} />
            <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="px-2 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] disabled:opacity-50 transition-all"><Send size={11} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

function findFileById(files: FileNode[], id: string): FileNode | undefined {
  for (const f of files) {
    if (f.id === id) return f;
    if (f.children) { const found = findFileById(f.children, id); if (found) return found; }
  }
  return undefined;
}

function TerminalInput({ onCommand, disabled }: { onCommand: (cmd: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onCommand(value.trim());
    setHistory(prev => [...prev, value.trim()]);
    setHistoryIndex(-1);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { handleSubmit(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < history.length) { setHistoryIndex(newIndex); setValue(history[history.length - 1 - newIndex]); }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) { setHistoryIndex(newIndex); setValue(history[history.length - 1 - newIndex]); }
      else { setHistoryIndex(-1); setValue(''); }
    }
  };

  return <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 bg-transparent text-emerald-400 font-mono text-xs focus:outline-none" placeholder="Type a command... (try 'help')" disabled={disabled} autoFocus />;
}
