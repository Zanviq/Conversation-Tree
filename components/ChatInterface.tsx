import React, { useEffect, useRef, useState } from 'react';
import { Message, Attachment } from '../types';
import { Send, GitFork, User, Sparkles, Pencil, Copy, X, Check, Paperclip, Menu, GitMerge, Info, Maximize2, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getThreadFromHead } from '../utils/graphUtils';

interface ChatInterfaceProps {
  messages: Message[];
  messageMap?: Record<string, Message>; 
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onFork: (nodeId: string) => void;
  onEdit: (nodeId: string, newText: string) => void;
  onEditAndFork: (nodeId: string, newText: string) => void;
  isProcessing: boolean;
  onToggleLeftSidebar: () => void;
  leftSidebarOpen: boolean;
  
  // Track Selection Props
  isTrackSelectionMode: boolean;
  onToggleTrackSelection: () => void;
  selectedTrackCount: number;

  // View Track
  onViewTrack: (track: { id: string, label: string, color: string }) => void;

  // Model Selection
  chatModel: string;
  labelModel: string;
  setChatModel: (model: string) => void;
  setLabelModel: (model: string) => void;
}

// Helper structure for rendering
interface ChatPair {
  userMsg: Message;
  aiMsg?: Message;
}

// Track Colors matching Map
const TRACK_COLORS = [
    'border-nebula-500 text-nebula-400 bg-nebula-950', 
    'border-cyan-500 text-cyan-400 bg-cyan-950', 
    'border-amber-500 text-amber-400 bg-amber-950', 
    'border-pink-500 text-pink-400 bg-pink-950', 
    'border-emerald-500 text-emerald-400 bg-emerald-950', 
    'border-red-500 text-red-400 bg-red-950', 
];

const TRACK_COLORS_HEX = [
    '#a78bfa', 
    '#22d3ee', 
    '#fbbf24', 
    '#f472b6', 
    '#34d399', 
    '#f87171', 
];

const MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  messageMap,
  onSendMessage, 
  onFork,
  onEdit,
  onEditAndFork,
  isProcessing,
  onToggleLeftSidebar,
  leftSidebarOpen,
  isTrackSelectionMode,
  onToggleTrackSelection,
  selectedTrackCount,
  onViewTrack,
  chatModel,
  labelModel,
  setChatModel,
  setLabelModel
}) => {
  const [input, setInput] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMode, setEditMode] = useState<'replace' | 'fork' | null>(null);

  // Model Menu State
  const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Image Upload State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, attachments]); 

  // Close model menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Group messages
  const pairs: ChatPair[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      const nextMsg = messages[i + 1];
      if (nextMsg && nextMsg.role === 'model') {
        pairs.push({ userMsg: msg, aiMsg: nextMsg });
        i++; // Skip next
      } else {
        pairs.push({ userMsg: msg });
      }
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isProcessing) return;
    
    onSendMessage(input, attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const processFile = (file: File) => {
    // Simple check for image
    if (!file.type.startsWith('image/')) {
        alert('Only image files are currently supported.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        // format: data:image/jpeg;base64,...
        const base64Data = base64String.split(',')[1];
        const mimeType = base64String.split(';')[0].split(':')[1];
        
        setAttachments(prev => [...prev, { mimeType, data: base64Data }]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                processFile(file);
                e.preventDefault(); 
            }
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startEdit = (nodeId: string, initialText: string, mode: 'replace' | 'fork') => {
    setEditingNodeId(nodeId);
    setEditText(initialText);
    setEditMode(mode);
  };

  const cancelEdit = () => {
    setEditingNodeId(null);
    setEditText("");
    setEditMode(null);
  };

  const confirmEdit = (nodeId: string) => {
    if (!editText.trim()) return;
    if (editMode === 'replace') {
        onEdit(nodeId, editText);
    } else if (editMode === 'fork') {
        onEditAndFork(nodeId, editText);
    }
    cancelEdit();
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-space-900 relative">
      {/* Header */}
      <div className="p-4 border-b border-space-800 bg-space-900/50 backdrop-blur-md z-10 flex items-center gap-4">
        {/* Desktop Sidebar Toggle - Visible only on desktop (md+) */}
        <button 
            onClick={onToggleLeftSidebar}
            className={`hidden md:flex p-2 rounded-lg hover:bg-space-800 text-gray-400 transition-colors ${!leftSidebarOpen ? 'bg-space-800 text-nebula-400' : ''}`}
            title="Toggle Sidebar"
        >
            <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
           <span className="text-nebula-400"><Sparkles size={18} /></span>
           <h2 className="text-gray-100 font-medium">Cosmic Chat</h2>
        </div>

        {/* Model Selection Button */}
        <div className="relative group" ref={modelMenuRef}>
            <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="p-1.5 rounded-lg bg-space-800/50 border border-space-700 hover:border-nebula-500/50 hover:bg-space-800 text-gray-400 hover:text-white transition-all flex items-center justify-center"
                title="Select Model"
            >
                <Cpu size={14} />
            </button>
            {/* Tooltip (Hover) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Select Model
            </div>
            {/* Dropdown Menu */}
            {showModelMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-space-900 border border-space-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-gray-500 block">Conversation Model</label>
                            <div className="relative">
                                <select 
                                    value={chatModel}
                                    onChange={(e) => setChatModel(e.target.value)}
                                    className="w-full bg-space-950 border border-space-800 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-nebula-500 appearance-none"
                                >
                                    {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="w-full h-px bg-space-800"></div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-gray-500 block">Labeling Model</label>
                             <div className="relative">
                                <select 
                                    value={labelModel}
                                    onChange={(e) => setLabelModel(e.target.value)}
                                    className="w-full bg-space-950 border border-space-800 rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-nebula-500 appearance-none"
                                >
                                     {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="h-4 w-px bg-space-700 hidden sm:block"></div>
        <div className="text-xs text-gray-500 hidden sm:block">
           {pairs.length} Events in Current Timeline
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 space-y-8">
        {pairs.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
               <div className="w-24 h-24 rounded-full bg-space-800 flex items-center justify-center animate-pulse-slow">
                    <Sparkles size={40} className="text-nebula-500"/>
               </div>
               <p>Begin transmission...</p>
           </div>
        )}
        
        {pairs.map((pair, index) => {
            const isEditing = editingNodeId === (pair.aiMsg?.id || pair.userMsg.id);
            const nodeId = pair.aiMsg?.id || pair.userMsg.id; 
            const isRoot = index === 0;

            return (
                <div key={pair.userMsg.id} className="relative group hover:z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border border-space-800 rounded-xl bg-space-900/40 overflow-hidden shadow-lg">
                        
                        {/* User Part */}
                        <div className="p-4 border-b border-space-800/50 bg-space-800/30 flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-space-800 flex-shrink-0 flex items-center justify-center border border-space-700 mt-1">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="text-xs text-gray-500 font-mono uppercase tracking-wide">User Signal</div>
                                    
                                    {/* Track Badges for Context */}
                                    {pair.userMsg.attachedTrackIds && pair.userMsg.attachedTrackIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {pair.userMsg.attachedTrackIds.map((id, idx) => (
                                                <button
                                                    key={id}
                                                    onClick={() => onViewTrack({ id, label: String.fromCharCode(65 + idx), color: TRACK_COLORS_HEX[idx % TRACK_COLORS_HEX.length] })}
                                                    className={`
                                                        px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                        border bg-space-950 hover:brightness-125 transition-all
                                                        flex items-center gap-1
                                                    `}
                                                    style={{ 
                                                        borderColor: TRACK_COLORS_HEX[idx % TRACK_COLORS_HEX.length],
                                                        color: TRACK_COLORS_HEX[idx % TRACK_COLORS_HEX.length]
                                                    }}
                                                >
                                                    <Info size={8} />
                                                    Track {String.fromCharCode(65 + idx)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea 
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full bg-space-950 border border-space-700 rounded p-2 text-gray-200 focus:outline-none focus:border-nebula-500 resize-none h-24"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={cancelEdit} className="text-xs px-3 py-1 rounded bg-space-800 hover:bg-space-700 text-gray-400">Cancel</button>
                                            <button 
                                                onClick={() => confirmEdit(nodeId)} 
                                                className="text-xs px-3 py-1 rounded bg-nebula-600 hover:bg-nebula-500 text-white flex items-center gap-1"
                                            >
                                                <Check size={12}/> 
                                                {editMode === 'replace' ? 'Update & Overwrite' : 'Fork & Create New'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {/* Render Attached Images */}
                                        {pair.userMsg.attachments && pair.userMsg.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-1">
                                                {pair.userMsg.attachments.map((att, i) => (
                                                    <div key={i} className="relative rounded-lg overflow-hidden border border-space-700">
                                                        <img 
                                                            src={`data:${att.mimeType};base64,${att.data}`} 
                                                            alt="Attachment" 
                                                            className="max-h-64 object-contain bg-black/50"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {pair.userMsg.content && (
                                            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">{pair.userMsg.content}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Part */}
                        <div className="p-4 bg-transparent flex gap-4 min-h-[60px]">
                            <div className="w-8 h-8 rounded-full bg-nebula-600 flex-shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)] mt-1">
                                <Sparkles size={16} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-nebula-400/70 mb-1 font-mono uppercase tracking-wide">Cosmic Response</div>
                                {pair.aiMsg ? (
                                    <div className="markdown-content text-sm md:text-base text-gray-300">
                                        <ReactMarkdown>
                                            {pair.aiMsg.content || (isProcessing && index === pairs.length - 1 ? "..." : "")}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-1 h-6">
                                        <div className="w-1.5 h-1.5 bg-nebula-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-nebula-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-nebula-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    {!isEditing && pair.aiMsg && (
                        <div className="absolute top-full right-0 pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <button
                                onClick={() => onFork(nodeId)}
                                className="flex items-center gap-1 px-2 py-1 bg-space-950 border border-space-700 rounded text-xs text-gray-400 hover:text-nebula-400 hover:border-nebula-500 transition-colors"
                            >
                                <GitFork size={12} className="rotate-90"/>
                                <span>Focus</span>
                            </button>
                            <button
                                onClick={() => startEdit(nodeId, pair.userMsg.content, 'replace')}
                                className="flex items-center gap-1 px-2 py-1 bg-space-950 border border-space-700 rounded text-xs text-gray-400 hover:text-yellow-400 hover:border-yellow-500 transition-colors"
                            >
                                <Pencil size={12} />
                                <span>Edit</span>
                            </button>
                             <button
                                onClick={() => !isRoot && startEdit(nodeId, pair.userMsg.content, 'fork')}
                                disabled={isRoot}
                                className={`flex items-center gap-1 px-2 py-1 bg-space-950 border border-space-700 rounded text-xs transition-colors ${
                                    isRoot 
                                    ? 'opacity-40 cursor-not-allowed text-gray-600' 
                                    : 'text-gray-400 hover:text-green-400 hover:border-green-500'
                                }`}
                                title={isRoot ? "Cannot fork the root message" : "Edit & Fork"}
                            >
                                <Copy size={12} />
                                <span>Edit & Fork</span>
                            </button>
                        </div>
                    )}
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-space-900 border-t border-space-800 relative z-20">
        <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto py-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group shrink-0">
                            <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="preview" 
                                className="h-16 w-16 object-cover rounded-lg border border-space-700 bg-space-950"
                            />
                            <button 
                                onClick={() => removeAttachment(idx)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Track Selection Chips */}
            {isTrackSelectionMode && (
                <div className="flex flex-wrap gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in">
                    {Array.from({ length: Math.max(1, selectedTrackCount) }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${TRACK_COLORS[i % TRACK_COLORS.length]}`}>
                            <GitMerge size={12} />
                            <span className="font-bold">{String.fromCharCode(65 + i)}</span>
                            {i === 0 && <span className="opacity-70 ml-1">(Current)</span>}
                        </div>
                    ))}
                    <span className="text-xs text-gray-500 self-center ml-2">Select stars in the map...</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />
                
                {/* File Upload */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2 p-2 text-gray-400 hover:text-nebula-400 hover:bg-space-800 rounded-lg transition-colors"
                    title="Attach Image"
                >
                    <Paperclip size={20} />
                </button>

                {/* Track Comparison Button */}
                <button
                    type="button"
                    onClick={onToggleTrackSelection}
                    className={`mb-2 p-2 rounded-lg transition-colors ${isTrackSelectionMode ? 'bg-space-800 text-cyan-400 ring-1 ring-cyan-500/50' : 'text-gray-400 hover:text-cyan-400 hover:bg-space-800'}`}
                    title="Compare Timelines"
                >
                    <GitMerge size={20} />
                </button>

                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputResize}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        rows={1}
                        placeholder={isTrackSelectionMode ? "Ask AI to compare these timelines..." : "Send a message to the cosmos..."}
                        className="w-full bg-space-950 border border-space-700 text-gray-200 rounded-xl px-4 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-nebula-500/50 focus:border-nebula-500 transition-all placeholder-gray-600 resize-none min-h-[56px] max-h-[200px]"
                    />
                    <button 
                        type="submit"
                        disabled={(!input.trim() && attachments.length === 0) || isProcessing}
                        className="absolute right-2 bottom-2 aspect-square w-10 h-10 flex items-center justify-center bg-nebula-600 hover:bg-nebula-500 disabled:bg-space-800 disabled:text-gray-600 text-white rounded-lg transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
      </div>

    </div>
  );
};

export default ChatInterface;