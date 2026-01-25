import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, MessageSquare, Menu, X, GitGraph, LogOut, Home } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ChatInterface from './components/ChatInterface';
import UniverseMap from './components/UniverseMap';
import { LandingPage } from './components/LandingPage';
import { Message, Session, Attachment } from './types';
import { streamGeminiResponse, generateNodeLabel } from './services/geminiService';
import { getThreadFromHead, buildHierarchy, findLCA } from './utils/graphUtils';
import { getStorageAdapter } from './services/storageService';

const STORAGE_KEY_SESSIONS = 'cosmic_fork_sessions';
const STORAGE_KEY_ACTIVE_ID = 'cosmic_fork_active_id';

const App: React.FC = () => {
  // --- Landing State ---
  const [hasStarted, setHasStarted] = useState(false);
  
  // --- Storage State (Always use local storage)
  const storageAdapter = useRef(getStorageAdapter('local'));
  
  // --- Toast State ---
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  const showToast = (message: string, type: 'error' | 'success' = 'error', duration: number = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // --- Model State ---
  const [chatModel, setChatModel] = useState("gemini-3-flash-preview");
  const [labelModel, setLabelModel] = useState("gemini-3-flash-preview");
  
  // Load models from local storage after app starts
  useEffect(() => {
    const loadModels = async () => {
      try {
        const chatModelValue = await storageAdapter.current.loadModel('cosmic_chat_model');
        const labelModelValue = await storageAdapter.current.loadModel('cosmic_label_model');
        if (chatModelValue) setChatModel(chatModelValue);
        if (labelModelValue) setLabelModel(labelModelValue);
      } catch (e) {
        console.error("Failed to load models from storage", e);
        showToast('모델 로드 실패', 'error');
      }
    };
    if (hasStarted) {
      loadModels();
    }
  }, [hasStarted]);

  useEffect(() => {
      const saveModel = async () => {
        try {
          await storageAdapter.current.saveModel('cosmic_chat_model', chatModel);
        } catch (e) {
          console.error("Failed to save chat model", e);
          showToast('채팅 모델 저장 실패', 'error');
        }
      };
      if (hasStarted) {
        saveModel();
      }
  }, [chatModel, hasStarted]);

  useEffect(() => {
      const saveModel = async () => {
        try {
          await storageAdapter.current.saveModel('cosmic_label_model', labelModel);
        } catch (e) {
          console.error("Failed to save label model", e);
          showToast('라벨 모델 저장 실패', 'error');
        }
      };
      if (hasStarted) {
        saveModel();
      }
  }, [labelModel, hasStarted]);

  // --- State ---
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Load data from local storage after app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading sessions from server...');
        const loadedSessions = await storageAdapter.current.loadSessions();
        setSessions(loadedSessions);
        
        const loadedActiveId = await storageAdapter.current.loadActiveId();
        setActiveSessionId(loadedActiveId);
        
        console.log('✅ Sessions loaded');
      } catch (e) {
        console.error("❌ Failed to load data from storage", e);
        showToast('저장소 로드 실패', 'error');
      }
    };
    
    if (hasStarted) {
      loadData();
    }
  }, [hasStarted]);

  const [isProcessing, setIsProcessing] = useState(false);
  
  // Track Selection State
  const [isTrackSelectionMode, setIsTrackSelectionMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  
  // Track Viewing State (Modal)
  const [viewingTrack, setViewingTrack] = useState<{ id: string, label: string, color: string } | null>(null);

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(window.innerWidth >= 768);
  
  // Resizable Sidebar widths
  const [leftWidth, setLeftWidth] = useState(256); // Default 256px
  const [rightWidth, setRightWidth] = useState(400); // Default wider for map
  
  // Resizing Refs
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  // Handle window resize to auto-adjust sidebars if moving between mobile/desktop
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 768) {
            // Ensure width is valid on desktop switch
            setSidebarOpen(true);
        } else {
            // Auto-close on mobile to save space
            setSidebarOpen(false);
            setRightSidebarOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Resize Handlers ---
  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRight.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingLeft.current) {
        const newWidth = e.clientX;
        const maxWidth = window.innerWidth * 0.4; // Max 40% of screen
        if (newWidth > 200 && newWidth < maxWidth) {
            setLeftWidth(newWidth);
        }
    } else if (isResizingRight.current) {
        const newWidth = window.innerWidth - e.clientX;
        const maxWidth = window.innerWidth * 0.6; // Max 60% for map
        if (newWidth > 300 && newWidth < maxWidth) {
            setRightWidth(newWidth);
        }
    }
  };

  const handleMouseUp = () => {
    isResizingLeft.current = false;
    isResizingRight.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  // --- Persistence Effects ---
  useEffect(() => {
    const saveSessions = async () => {
      try {
        console.log('💾 Saving sessions...', sessions.length);
        await storageAdapter.current.saveSessions(sessions);
        console.log('✅ Sessions saved');
      } catch (e) {
        console.error("❌ Failed to save sessions", e);
        showToast('대화 저장 실패', 'error');
      }
    };
    saveSessions();
  }, [sessions]);

  useEffect(() => {
    const saveActiveId = async () => {
      try {
        console.log('💾 Saving active session ID...', activeSessionId);
        await storageAdapter.current.saveActiveId(activeSessionId);
        console.log('✅ Active session ID saved');
      } catch (e) {
         console.error("❌ Failed to save active session id", e);
         showToast('활성 세션 저장 실패', 'error');
      }
    };
    saveActiveId();
  }, [activeSessionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  // --- Derived State ---
  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId) || null, 
  [sessions, activeSessionId]);

  const currentThread = useMemo(() => {
    if (!activeSession) return [];
    // For DISPLAY, we do NOT include connections (visual clarity)
    return getThreadFromHead(activeSession.currentHeadId, activeSession.messageMap, false);
  }, [activeSession]);

  const treeData = useMemo(() => {
    if (!activeSession) return null;
    return buildHierarchy(activeSession.rootMessageId, activeSession.messageMap, activeSession.currentHeadId);
  }, [activeSession]);
  
  // Track content for modal
  const trackContent = useMemo(() => {
    if (!viewingTrack || !activeSession) return [];
    return getThreadFromHead(viewingTrack.id, activeSession.messageMap, false);
  }, [viewingTrack, activeSession]);

  // Sync current head to track selection A when not in custom mode or initialized
  useEffect(() => {
    if (activeSession?.currentHeadId && !isTrackSelectionMode) {
        // Always reset Track A to current head when exiting mode
        setSelectedTrackIds([activeSession.currentHeadId]);
    } else if (activeSession?.currentHeadId && isTrackSelectionMode && selectedTrackIds.length === 0) {
        setSelectedTrackIds([activeSession.currentHeadId]);
    }
  }, [activeSession?.currentHeadId, isTrackSelectionMode]);

  // --- Helpers ---
  
  // Calculate position for new child node based on parent's existing children
  const calculateNewNodePosition = (parentId: string | null, messageMap: Record<string, Message>): { x: number; y: number } => {
    if (!parentId || !messageMap[parentId]) {
      // Root node: center at (0, 0)
      return { x: 0, y: 0 };
    }

    const parentMsg = messageMap[parentId];
    const parentPos = parentMsg.position || { x: 0, y: 0 };

    if (!parentMsg.childrenIds || parentMsg.childrenIds.length === 0) {
      // First child: place directly below parent (same x, y + 100)
      return { x: parentPos.x, y: parentPos.y + 100 };
    }

    // Get all direct children with their positions
    const childPositions = parentMsg.childrenIds
      .map(childId => {
        const childMsg = messageMap[childId];
        if (!childMsg) return null;
        return {
          id: childMsg.id,
          x: childMsg.position?.x ?? 0,
          y: childMsg.position?.y ?? 0,
          summary: childMsg.summary || childMsg.content?.substring(0, 18) || ''
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Find the child with the MAXIMUM x coordinate (rightmost)
    let rightmostChild = childPositions[0];
    childPositions.forEach((child) => {
      if (child.x > rightmostChild.x) {
        rightmostChild = child;
      }
    });
    
    // Get text width of the rightmost child
    const textWidth = rightmostChild.summary.length * 6.5; // Approximate: length * fontSize * 0.65

    // Calculate new position: rightmost.x + rightmost's text width
    const newX = rightmostChild.x + textWidth;
    const newY = parentPos.y + 100; // Same vertical level as other children

    return { x: newX, y: newY };
  };

  // --- Actions ---

  const createNewSession = () => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: 'New Exploration',
      rootMessageId: null,
      messageMap: {},
      currentHeadId: null,
      lastModified: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsTrackSelectionMode(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        if (activeSessionId === id && newSessions.length > 0) {
            setActiveSessionId(newSessions[0]?.id || null);
        } else if (newSessions.length === 0) {
            setActiveSessionId(null);
        }
        return newSessions;
    });
  }

  // Helper to append message and stream
  const appendAndStream = async (sessionId: string, parentId: string | null, userText: string, attachments?: Attachment[], trackComparison?: string[]) => {
    setIsProcessing(true);
    
    // Find the current session to calculate positions
    const currentSession = sessions.find(s => s.id === sessionId);
    if (!currentSession) {
      setIsProcessing(false);
      return;
    }

    // Calculate position for new user message
    const newNodePos = calculateNewNodePosition(parentId, currentSession.messageMap);
    
    const userMsgId = crypto.randomUUID();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: userText, 
      attachments: attachments,
      parentId: parentId,
      childrenIds: [],
      timestamp: Date.now(),
      // Store IDs only, do NOT pollute content
      attachedTrackIds: trackComparison && trackComparison.length > 0 ? trackComparison : undefined,
      position: newNodePos
    };

    const aiMsgId = crypto.randomUUID();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      content: '', 
      parentId: userMsgId,
      childrenIds: [],
      timestamp: Date.now() + 1,
      position: newNodePos  // Store position for AI message as well
    };

    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      const newMap = { ...s.messageMap };
      newMap[userMsgId] = userMsg;
      newMap[aiMsgId] = aiMsg;

      if (parentId && newMap[parentId]) {
        newMap[parentId] = { 
          ...newMap[parentId], 
          childrenIds: [...newMap[parentId].childrenIds, userMsgId] 
        };
      }

      newMap[userMsgId] = { ...userMsg, childrenIds: [aiMsgId] };
      
      let newTitle = s.title;
      if (!s.rootMessageId || s.rootMessageId === userMsgId) {
          if (userText && userText.trim().length > 0) {
              newTitle = userText.substring(0, 30);
          } else if (attachments && attachments.length > 0) {
              newTitle = "Image";
          }
      }

      return {
        ...s,
        messageMap: newMap,
        rootMessageId: s.rootMessageId || userMsgId,
        currentHeadId: aiMsgId,
        title: newTitle,
        lastModified: Date.now()
      };
    }));

    // Trigger Node Label Generation (Summary)
    generateNodeLabel(userText, labelModel).then(summary => {
        if (!summary) return;
        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            const msg = s.messageMap[userMsgId];
            if (!msg) return s;
            return {
                ...s,
                messageMap: { ...s.messageMap, [userMsgId]: { ...msg, summary } }
            };
        }));
    });

    const currentMap = sessions.find(s => s.id === sessionId)?.messageMap || {};
    const tempMap = { ...currentMap, [userMsgId]: userMsg };
    
    // Get history for the main thread
    const history = getThreadFromHead(userMsgId, tempMap, true);

    // --- PROMPT INJECTION LOGIC ---
    if (trackComparison && trackComparison.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.id === userMsgId) {
             const session = sessions.find(s => s.id === sessionId);
             if (session) {
                const tracksData = trackComparison.map((headId, index) => {
                    const label = String.fromCharCode(65 + index); // A, B, C...
                    // Fetch full thread for the track context
                    const thread = getThreadFromHead(headId, session.messageMap, false);
                    const text = thread.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
                    return `[Track ${label}]:\n${text}\n-------------------`;
                });
                
                const comparisonContext = `\n\n<system_context>\n[Multiverse Comparison Request]\nThe user has selected specific timelines to compare. Analyze the following tracks as parallel possibilities:\n\n${tracksData.join('\n\n')}\n</system_context>\n\n`;
                
                // Mutate the local copy of the message for the prompt only
                lastMsg.content = comparisonContext + lastMsg.content;
             }
        }
    }

    try {
      await streamGeminiResponse(history, (chunk) => {
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          const msg = s.messageMap[aiMsgId];
          if (!msg) return s;
          return {
            ...s,
            messageMap: {
              ...s.messageMap,
              [aiMsgId]: { ...msg, content: msg.content + chunk }
            }
          };
        }));
      }, chatModel, "You are a helpful AI assistant. Answer concisely and clearly.", (errorMessage) => {
        showToast(errorMessage, 'error');
      }); // PASS CHAT MODEL and ERROR HANDLER
    } finally {
      setIsProcessing(false);
      setIsTrackSelectionMode(false); // Exit mode after sending
      setSelectedTrackIds([]); // Clear selection
    }
  };

  // Helper to create a session and immediately stream content
  const createSessionAndSendMessage = async (text: string, attachments?: Attachment[]) => {
      setIsProcessing(true);
      const newSessionId = crypto.randomUUID();
      const userMsgId = crypto.randomUUID();
      const aiMsgId = crypto.randomUUID();

      const userMsg: Message = {
          id: userMsgId,
          role: 'user',
          content: text,
          attachments: attachments,
          parentId: null,
          childrenIds: [aiMsgId],
          timestamp: Date.now(),
      };

      const aiMsg: Message = {
          id: aiMsgId,
          role: 'model',
          content: '',
          parentId: userMsgId,
          childrenIds: [],
          timestamp: Date.now() + 1,
      };

      const newSession: Session = {
          id: newSessionId,
          title: text.substring(0, 30) || 'New Exploration',
          rootMessageId: userMsgId,
          messageMap: { [userMsgId]: userMsg, [aiMsgId]: aiMsg },
          currentHeadId: aiMsgId,
          lastModified: Date.now(),
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSessionId);

      // Trigger Label Generation
      generateNodeLabel(text, labelModel).then(summary => {
         if (!summary) return;
         setSessions(prev => prev.map(s => {
             if (s.id !== newSessionId) return s;
             const msg = s.messageMap[userMsgId];
             if (!msg) return s;
             return {
                 ...s,
                 messageMap: { ...s.messageMap, [userMsgId]: { ...msg, summary } }
             };
         }));
      });

      // History is just the user message
      const history = [userMsg];

      try {
          await streamGeminiResponse(history, (chunk) => {
              setSessions(prev => prev.map(s => {
                  if (s.id !== newSessionId) return s;
                  const msg = s.messageMap[aiMsgId];
                  if (!msg) return s;
                  return {
                      ...s,
                      messageMap: {
                          ...s.messageMap,
                          [aiMsgId]: { ...msg, content: msg.content + chunk }
                      }
                  };
              }));
          }, chatModel); // PASS CHAT MODEL
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSendMessage = (text: string, attachments?: Attachment[]) => {
    if (activeSessionId && activeSession) {
         // Existing active session
         const tracksToCompare = isTrackSelectionMode && selectedTrackIds.length >= 1 ? selectedTrackIds : undefined;
         appendAndStream(activeSessionId, activeSession.currentHeadId, text, attachments, tracksToCompare);
    } else {
        // No active session (e.g., all deleted), create one automatically
        createSessionAndSendMessage(text, attachments);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    if (!activeSession) return;
    
    // Standard Behavior: Change focus
    if (!isTrackSelectionMode) {
        setSessions(prev => prev.map(s => {
            if (s.id !== activeSession.id) return s;
            return { ...s, currentHeadId: nodeId };
        }));
    } else {
        // Track Selection Behavior
        const msg = activeSession.messageMap[nodeId];
        const isLeaf = !msg.childrenIds || msg.childrenIds.length === 0;
        
        if (isLeaf) {
            setSelectedTrackIds(prev => {
                if (nodeId === activeSession.currentHeadId) return prev; // Cannot deselect A
                if (prev.includes(nodeId)) {
                    return prev.filter(id => id !== nodeId);
                } else {
                    return [...prev, nodeId];
                }
            });
        }
    }
  };

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (!activeSession) return;
    if (sourceId === targetId) return; 

    // Check 1: Is Source an ancestor of Target? (Redundant - Target already inherits from Source)
    let curr: string | null = targetId;
    while(curr) {
        if (curr === sourceId) {
            alert("Cannot connect: Source is an ancestor of Target (Redundant).");
            return;
        }
        curr = activeSession.messageMap[curr]?.parentId || null;
    }

    // Check 2: Is Target an ancestor of Source? (Cycle - Source inherits from Target)
    curr = sourceId;
    while(curr) {
        if (curr === targetId) {
            alert("Cannot connect: Target is an ancestor of Source (Cycle detected).");
            return;
        }
        curr = activeSession.messageMap[curr]?.parentId || null;
    }
    
    setSessions(prev => prev.map(s => {
        if (s.id !== activeSession.id) return s;
        const targetMsg = s.messageMap[targetId];
        if (!targetMsg) return s;
        
        if (targetMsg.connections?.includes(sourceId)) return s;

        const updatedMsg = { 
            ...targetMsg, 
            connections: [...(targetMsg.connections || []), sourceId] 
        };

        return {
            ...s,
            messageMap: { ...s.messageMap, [targetId]: updatedMsg },
            lastModified: Date.now()
        };
    }));
  };

  const handleDisconnectNodes = (sourceId: string, targetId: string) => {
      if (!activeSession) return;

      setSessions(prev => prev.map(s => {
          if (s.id !== activeSession.id) return s;
          const targetMsg = s.messageMap[targetId];
          if (!targetMsg || !targetMsg.connections) return s;

          const updatedMsg = {
              ...targetMsg,
              connections: targetMsg.connections.filter(id => id !== sourceId)
          };
          
          return {
              ...s,
              messageMap: { ...s.messageMap, [targetId]: updatedMsg },
              lastModified: Date.now()
          }
      }));
  };

  const handleEditNode = (aiNodeId: string, newText: string) => {
    if (!activeSessionId) return; // Only need ID to start
    setIsProcessing(true);

    const newUserMsgId = crypto.randomUUID();
    const newAiMsgId = crypto.randomUUID();
    
    // We calculate stream context first, but rely on update for state.
    // To ensure data integrity, we calculate targets from current sessions before update.
    let originalUserMsgId: string | null = null;
    let streamParentId: string | null = null;
    
    // Peek at current state synchronously
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if(currentSession) {
         const targetMsg = currentSession.messageMap[aiNodeId];
         if (targetMsg) {
             if (targetMsg.role === 'model' && targetMsg.parentId) {
                 originalUserMsgId = targetMsg.parentId;
             } else if (targetMsg.role === 'user') {
                 originalUserMsgId = aiNodeId;
             }
             if (originalUserMsgId) {
                 streamParentId = currentSession.messageMap[originalUserMsgId]?.parentId || null;
             }
         }
    }

    setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;

        // 1. RE-RESOLVE inside updater for safety to prevent race conditions
        const currentMap = s.messageMap;
        const nodeToCheck = currentMap[aiNodeId];
        if (!nodeToCheck) return s; 

        // Identify the User Message (Prompt) to replace
        let userMsgIdToReplace = aiNodeId;
        if (nodeToCheck.role === 'model' && nodeToCheck.parentId) {
            userMsgIdToReplace = nodeToCheck.parentId;
        }
        
        const userMsgToReplace = currentMap[userMsgIdToReplace];
        if (!userMsgToReplace) return s;

        const parentId = userMsgToReplace.parentId;

        // 2. Identify Descendants to Delete (The Old Branch)
        const idsToDelete = new Set<string>();
        const collectDescendants = (rootId: string) => {
            idsToDelete.add(rootId);
            const m = currentMap[rootId];
            if (m && m.childrenIds) {
                m.childrenIds.forEach(collectDescendants);
            }
        };
        collectDescendants(userMsgIdToReplace);

        // 3. Create Shallow Copy
        const newMap = { ...currentMap };

        // 4. Unlink from Parent (CRITICAL STEP)
        if (parentId && newMap[parentId]) {
            const parent = newMap[parentId];
            newMap[parentId] = {
                ...parent,
                childrenIds: parent.childrenIds.filter(id => id !== userMsgIdToReplace)
            };
        }

        // 5. Delete Old Branch
        idsToDelete.forEach(id => delete newMap[id]);

        // 6. Create New Nodes
        const newUserMsg: Message = {
            id: newUserMsgId,
            role: 'user',
            content: newText,
            parentId: parentId,
            childrenIds: [newAiMsgId],
            timestamp: Date.now(),
            attachments: userMsgToReplace.attachments, // Preserve attachments
            connections: userMsgToReplace.connections // Preserve connections
        };
        
        const newAiMsg: Message = {
            id: newAiMsgId,
            role: 'model',
            content: '',
            parentId: newUserMsgId,
            childrenIds: [],
            timestamp: Date.now() + 1
            // AI message connections usually empty, but could preserve if needed (omitted for now)
        };

        newMap[newUserMsgId] = newUserMsg;
        newMap[newAiMsgId] = newAiMsg;

        // 7. Link New Branch to Parent
        if (parentId && newMap[parentId]) {
            const parent = newMap[parentId];
            newMap[parentId] = {
                ...parent,
                childrenIds: [...parent.childrenIds, newUserMsgId]
            };
        }

        // 8. Update Roots/Head
        const newRootId = s.rootMessageId === userMsgIdToReplace ? newUserMsgId : s.rootMessageId;

        return {
            ...s,
            messageMap: newMap,
            rootMessageId: newRootId,
            currentHeadId: newAiMsgId,
            lastModified: Date.now()
        };
    }));

    // Start Streaming
    if (originalUserMsgId) {
        // Trigger Summary for Edited Text
        generateNodeLabel(newText, labelModel).then(summary => {
            if(!summary) return;
            setSessions(prev => prev.map(s => {
                if (s.id !== activeSessionId) return s;
                const msg = s.messageMap[newUserMsgId];
                if (!msg) return s;
                return {
                    ...s,
                    messageMap: { ...s.messageMap, [newUserMsgId]: { ...msg, summary } }
                }
            }));
        });

        const history = getThreadFromHead(streamParentId, currentSession?.messageMap || {}, true);
        history.push({
            id: newUserMsgId,
            role: 'user',
            content: newText,
            parentId: streamParentId,
            childrenIds: [newAiMsgId],
            timestamp: Date.now()
        });

        streamGeminiResponse(history, (chunk) => {
            setSessions(prev => prev.map(s => {
                if (s.id !== activeSessionId) return s;
                const msg = s.messageMap[newAiMsgId];
                if (!msg) return s;
                return {
                    ...s,
                    messageMap: { ...s.messageMap, [newAiMsgId]: { ...msg, content: msg.content + chunk } }
                }
            }));
        }, chatModel).then(() => setIsProcessing(false)); // PASS CHAT MODEL
    } else {
        setIsProcessing(false);
    }
  };

  const handleEditAndForkNode = (aiNodeId: string, newText: string) => {
    if (!activeSession) return;
    
    const targetMsg = activeSession.messageMap[aiNodeId];
    if (!targetMsg) return;
    
    let parentId: string | null = null;
    
    if (targetMsg.role === 'model' && targetMsg.parentId) {
        const userMsg = activeSession.messageMap[targetMsg.parentId];
        parentId = userMsg.parentId;
    } else if (targetMsg.role === 'user') {
        parentId = targetMsg.parentId;
    }

    appendAndStream(activeSession.id, parentId, newText, undefined, undefined);
  };

  const toggleTrackSelection = () => {
    setIsTrackSelectionMode(prev => !prev);
  };

  if (!hasStarted) {
      return <LandingPage onStart={() => setHasStarted(true)} onError={showToast} />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-space-950 text-gray-200 overflow-hidden font-sans relative">
      
      {/* Toast Message */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] px-4 py-3 rounded-lg font-semibold text-sm animate-in fade-in slide-in-from-top-2 duration-200 max-w-md transition-all ${
          toast.type === 'error' 
            ? 'bg-red-900/90 text-red-200 border border-red-700' 
            : 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
        }`}>
          {toast.message}
        </div>
      )}
      
      {/* Mobile Backdrop for Left Sidebar */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - History */}
      <div 
        style={{ width: window.innerWidth >= 768 ? (sidebarOpen ? leftWidth : 0) : '100%' }}
        className={`
            fixed md:relative z-40 h-full
            bg-space-950 border-r border-space-800 flex flex-col shrink-0
            transition-[transform,opacity] duration-300 ease-in-out md:transition-none
            ${window.innerWidth < 768 
                ? (sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64') 
                : (sidebarOpen ? 'opacity-100 overflow-visible' : 'opacity-0 overflow-hidden border-none')
            }
        `}
      >
        <div className="p-4 flex items-center justify-between shrink-0">
           <button 
             onClick={createNewSession}
             className="flex-1 flex items-center gap-2 bg-space-800 hover:bg-space-700 text-white px-4 py-2 rounded-lg transition-colors text-sm border border-space-700"
           >
             <Plus size={16} /> New Chat
           </button>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-2 text-gray-400 p-2">
             <X size={20} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-2">Recents</div>
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm ${activeSessionId === session.id ? 'bg-space-800 text-white' : 'text-gray-400 hover:bg-space-900 hover:text-gray-200'}`}
            >
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate flex-1">{session.title}</span>
              <button 
                 onClick={(e) => deleteSession(e, session.id)}
                 className="text-gray-400 hover:text-red-400 p-1 transition-colors"
              >
                  <X size={14}/>
              </button>
            </div>
          ))}
        </div>

        {/* --- Return to Home Button (New) --- */}
        <div className="p-4 border-t border-space-800 shrink-0">
            <button
                onClick={() => setHasStarted(false)}
                className="w-full flex items-center gap-2 text-gray-400 hover:text-white hover:bg-space-800 px-3 py-2 rounded-lg transition-colors text-sm"
            >
                <Home size={16} />
                <span>Return Home</span>
            </button>
        </div>
      </div>

      {/* Left Resizer Handle (Desktop Only) */}
      {sidebarOpen && (
          <div 
            className="hidden md:block w-1.5 cursor-col-resize hover:bg-nebula-500 bg-space-800 hover:bg-opacity-50 z-50 shrink-0 transition-colors"
            onMouseDown={startResizingLeft}
          />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 h-full">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-space-800 flex items-center justify-between bg-space-950 shrink-0 z-20">
             <button onClick={() => setSidebarOpen(true)} className="text-gray-400 p-1">
                 <Menu size={24} />
             </button>
             <span className="font-semibold text-gray-200">Cosmic Fork</span>
             <button onClick={() => setRightSidebarOpen(true)} className="text-gray-400 p-1">
                 <GitGraph size={24} />
             </button>
        </div>

        <ChatInterface 
          messages={currentThread} 
          messageMap={activeSession?.messageMap}
          onSendMessage={handleSendMessage}
          onFork={handleNodeSelect}
          onEdit={handleEditNode}
          onEditAndFork={handleEditAndForkNode}
          isProcessing={isProcessing}
          onToggleLeftSidebar={() => setSidebarOpen(!sidebarOpen)}
          leftSidebarOpen={sidebarOpen}
          isTrackSelectionMode={isTrackSelectionMode}
          onToggleTrackSelection={toggleTrackSelection}
          selectedTrackCount={selectedTrackIds.length}
          onViewTrack={setViewingTrack}
          
          // Model Props
          chatModel={chatModel}
          labelModel={labelModel}
          setChatModel={setChatModel}
          setLabelModel={setLabelModel}
        />
        
        {/* Toggle Button for Map (Desktop) - Visible if right sidebar is CLOSED */}
        {!rightSidebarOpen && (
            <button 
            onClick={() => setRightSidebarOpen(true)}
            className="hidden md:flex absolute top-4 right-4 z-20 w-8 h-8 items-center justify-center bg-space-800/80 hover:bg-space-700 backdrop-blur rounded-lg border border-space-700 text-gray-400 transition-colors"
            title="Open Map"
            >
                <GitGraph size={16} />
            </button>
        )}
      </div>

      {/* Right Resizer Handle (Desktop Only) */}
      {rightSidebarOpen && (
          <div 
            className="hidden md:block w-1.5 cursor-col-resize hover:bg-nebula-500 bg-space-800 hover:bg-opacity-50 z-50 shrink-0 transition-colors"
            onMouseDown={startResizingRight}
          />
      )}

      {/* Mobile Backdrop for Right Sidebar */}
      {rightSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setRightSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar - Universe Map */}
      <div 
        style={{ width: window.innerWidth >= 768 ? (rightSidebarOpen ? rightWidth : 0) : '100%' }}
        className={`
            fixed md:relative right-0 top-0 bottom-0 z-40 h-full
            bg-space-950 border-l border-space-800 flex flex-col shadow-2xl md:shadow-none shrink-0
            transition-[transform,opacity] duration-300 ease-in-out md:transition-none
            ${window.innerWidth < 768
                ? (rightSidebarOpen ? 'translate-x-0 w-80' : 'translate-x-full w-80')
                : (rightSidebarOpen ? 'opacity-100 overflow-visible' : 'opacity-0 overflow-hidden border-none')
            }
        `}
      >
          <div className="h-full w-full relative flex flex-col min-w-0">
            <div className="flex-1 relative overflow-hidden">
                {treeData ? (
                    <UniverseMap 
                        data={treeData} 
                        onNodeClick={(id) => {
                            handleNodeSelect(id);
                        }}
                        onConnect={handleConnectNodes}
                        onDisconnect={handleDisconnectNodes}
                        onPositionUpdate={(nodeId, x, y) => {
                            // Update node position in the current session
                            // nodeId is AI message ID, also update its parent User message
                            setSessions(prev => prev.map(session => {
                                if (session.id === activeSessionId) {
                                    const aiMsg = session.messageMap[nodeId];
                                    if (aiMsg) {
                                        const newMap = { ...session.messageMap };
                                        
                                        // Update AI message position
                                        newMap[nodeId] = {
                                            ...aiMsg,
                                            position: { x, y }
                                        };
                                        
                                        // Also update parent User message position
                                        if (aiMsg.parentId) {
                                            const userMsg = newMap[aiMsg.parentId];
                                            if (userMsg) {
                                                newMap[aiMsg.parentId] = {
                                                    ...userMsg,
                                                    position: { x, y }
                                                };
                                            }
                                        }
                                        
                                        return {
                                            ...session,
                                            messageMap: newMap,
                                            lastModified: Date.now()
                                        };
                                    }
                                }
                                return session;
                            }));
                        }}
                        activeSessionId={activeSessionId}
                        processingNodeId={isProcessing ? activeSession?.currentHeadId ?? null : null}
                        // Track Selection
                        isTrackSelectionMode={isTrackSelectionMode}
                        selectedTrackIds={selectedTrackIds}
                        messageMap={activeSession?.messageMap}
                        currentHeadId={activeSession?.currentHeadId ?? null}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 text-sm px-8 text-center">
                        <div className="mb-4 p-3 rounded-full bg-space-800">
                            <GitGraph size={24} />
                        </div>
                        <p>Start a conversation to map the constellations of your thought.</p>
                    </div>
                )}
            </div>
            
            <button 
                onClick={() => setRightSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 bg-space-800/80 rounded text-gray-400 md:flex z-50 hover:bg-space-700"
            >
                <X size={16} />
            </button>
          </div>
      </div>

      {/* Track View Modal */}
      {viewingTrack && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setViewingTrack(null)}
        >
            <div 
                className="bg-space-950 border border-space-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-space-800">
                    <div className="flex items-center gap-3">
                            <div 
                            className="w-8 h-8 rounded flex items-center justify-center font-bold text-space-950 shadow-lg"
                            style={{ backgroundColor: viewingTrack.color }}
                            >
                                {viewingTrack.label}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-100">Historical Track</h3>
                                <p className="text-xs text-gray-500 font-mono">ID: {viewingTrack.id}</p>
                            </div>
                    </div>
                    <button 
                        onClick={() => setViewingTrack(null)}
                        className="text-gray-400 hover:text-white p-2"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {trackContent.length === 0 ? (
                        <div className="text-center text-gray-500 italic">No content found or track deleted.</div>
                    ) : (
                        trackContent.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[85%] rounded-lg p-3 text-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-space-800 text-gray-200 rounded-tr-none' 
                                        : 'bg-space-900 border border-space-800 text-gray-300 rounded-tl-none'
                                    }
                                `}>
                                    <div className="text-[10px] uppercase opacity-50 mb-1 font-bold">
                                        {msg.role === 'user' ? 'User' : 'AI'}
                                    </div>
                                    {msg.role === 'model' ? (
                                            <div className="markdown-content">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-3 border-t border-space-800 bg-space-900/50 text-center">
                    <span className="text-xs text-gray-500">Read-only historical view</span>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;