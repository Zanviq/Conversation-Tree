import { Message, TreeNode } from "../types";

/**
 * Finds the Lowest Common Ancestor (LCA) ID between two nodes.
 */
export const findLCA = (
  nodeAId: string,
  nodeBId: string,
  messageMap: Record<string, Message>
): string | null => {
  const ancestorsA = new Set<string>();
  
  let curr: string | null = nodeAId;
  while (curr) {
    ancestorsA.add(curr);
    curr = messageMap[curr]?.parentId || null;
  }

  curr = nodeBId;
  while (curr) {
    if (ancestorsA.has(curr)) {
      return curr;
    }
    curr = messageMap[curr]?.parentId || null;
  }
  return null;
};

/**
 * Gets the unique path from a StartNode UP TO (but not including) the EndNode (LCA).
 * Returns array ordered [StartNode, Parent, ..., ChildOfLCA].
 * Since we want chronological order for context, we often reverse this result later.
 */
const getPathToAncestor = (
  startNodeId: string,
  ancestorId: string | null,
  messageMap: Record<string, Message>
): Message[] => {
  const path: Message[] = [];
  let curr: string | null = startNodeId;

  while (curr && curr !== ancestorId) {
    const msg = messageMap[curr];
    if (!msg) break;
    path.push(msg); // [Child, Parent, ...]
    curr = msg.parentId;
  }
  return path;
};

/**
 * Traverses from a specific node ID back to the root to build the conversation thread.
 * NOW UPDATED: Incorporates "Connected Memories".
 * If a node has `connections`, we fetch the unique history of that connection relative to the current point,
 * and INJECT it into the current message's content rather than adding a separate message.
 * This ensures the AI treats it as context for the current turn, not a separate turn.
 */
export const getThreadFromHead = (
  headId: string | null,
  messageMap: Record<string, Message>,
  includeConnections: boolean = false
): Message[] => {
  if (!headId) return [];
  
  // We build the thread from bottom to top, then reverse it at the end.
  const thread: Message[] = [];
  let currentId: string | null = headId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break; // Cycle protection
    visited.add(currentId);

    const msg = messageMap[currentId];
    if (!msg) break;

    // Create a copy of the message so we can modify it for context injection without mutating state
    const processedMsg = { ...msg };

    // Check for Connections (Incoming Memories)
    // Conceptually, if Node A connects to Node B, Node B "remembers" Node A's unique history.
    if (includeConnections && msg.connections && msg.connections.length > 0) {
      const memoryTexts: string[] = [];

      msg.connections.forEach(connSourceId => {
        // Calculate LCA between the Connection Source and the Current Node (msg)
        const lcaId = findLCA(connSourceId, msg.id, messageMap);
        
        // Get path from Source -> LCA (exclusive)
        // sidePath is [Newest ... Oldest] relative to the branch
        const sidePath = getPathToAncestor(connSourceId, lcaId, messageMap);
        
        // Reverse to get chronological order for the memory block
        const chronologicalSidePath = [...sidePath].reverse();
        
        if (chronologicalSidePath.length > 0) {
            const memoryBlock = chronologicalSidePath
                .map(m => `[${m.role === 'user' ? 'User' : 'AI'}]: ${m.content}`)
                .join('\n');
            memoryTexts.push(memoryBlock);
        }
      });

      if (memoryTexts.length > 0) {
          // PREPEND the memories into the message content.
          // Changed prompt to encourage recognition of the memory as part of the conversation history.
          const contextBlock = `\n[Connected Memory from Parallel Timeline]\n(System Note: The following text is a memory retrieved from another timeline. Treat it as valid context and part of the conversation history when summarizing or answering questions.)\n\n${memoryTexts.join('\n\n---\n\n')}\n\n[End of Memory]\n\n`;
          
          // Prepend to content
          processedMsg.content = contextBlock + processedMsg.content;
      }
    }

    // Add current (potentially enriched) message
    thread.push(processedMsg);

    currentId = msg.parentId;
  }

  // Reverse to get Chronological Order: [Root -> ... -> Head]
  return thread.reverse();
};

/**
 * Converts the flat message map into a hierarchical tree object for D3.
 * We highlight the path that contains the currentHeadId.
 * 
 * CHANGE: Groups (User Message + AI Message) into a single Node.
 * This represents a "Turn" or "Exchange".
 */
export const buildHierarchy = (
  rootId: string | null,
  messageMap: Record<string, Message>,
  currentHeadId: string | null
): TreeNode | null => {
  if (!rootId || !messageMap[rootId]) return null;

  // First, identify the set of IDs in the current active path for highlighting
  const activePathIds = new Set<string>();
  let tempId = currentHeadId;
  while(tempId) {
    activePathIds.add(tempId);
    tempId = messageMap[tempId]?.parentId || null;
  }

  // Recursive function that consumes a USER message ID (start of a turn)
  const buildNode = (userMsgId: string): TreeNode | null => {
    const userMsg = messageMap[userMsgId];
    if (!userMsg) return null;

    // Find the paired AI message (the response)
    // In this app, User always triggers AI, so User -> AI is the atomic unit.
    const aiMsgId = userMsg.childrenIds[0];
    const aiMsg = aiMsgId ? messageMap[aiMsgId] : null;

    // The Node ID in the tree corresponds to the END of the turn (the AI message ID).
    // This ensures that clicking the node restores the state *after* the AI has spoken.
    // Fallback to userMsgId only if AI hasn't responded yet (rare/error case).
    const nodeId = aiMsg ? aiMsg.id : userMsg.id;
    
    // Determine if this turn is in the current active path
    const isCurrentPath = activePathIds.has(nodeId);

    // Determine Label: Use summary if available, else truncate content
    let nodeName = "";
    if (userMsg.summary) {
        nodeName = userMsg.summary;
    } else if (userMsg.content && userMsg.content.trim() !== '') {
        nodeName = userMsg.content.substring(0, 18) + (userMsg.content.length > 18 ? "..." : "");
    } else if (userMsg.attachments && userMsg.attachments.length > 0) {
        nodeName = "Image";
    }

    // Collect connections. Connections might be attached to the User Msg (if connected before sending)
    // or AI msg. We aggregate them.
    const connections: string[] = [];
    if (userMsg.connections) connections.push(...userMsg.connections);
    if (aiMsg && aiMsg.connections) connections.push(...aiMsg.connections);

    // Collect attached tracks (from User Msg)
    const attachedTrackIds = userMsg.attachedTrackIds;

    const node: TreeNode = {
      id: nodeId,
      // Label the node with the User's topic
      name: nodeName,
      role: 'model', // We treat the finished pair as a Model node for visualization color
      isCurrentPath,
      connections: connections.length > 0 ? connections : undefined,
      attachedTrackIds: attachedTrackIds && attachedTrackIds.length > 0 ? attachedTrackIds : undefined,
      isLeaf: false, // Will be set below
      children: []
    };

    // Recursion: The children of this *Pair* are the next User messages 
    // that branch off from this AI response.
    if (aiMsg && aiMsg.childrenIds) {
      const childNodes = aiMsg.childrenIds
        .map(childId => buildNode(childId))
        .filter((n): n is TreeNode => n !== null);
        
      if (childNodes.length > 0) {
        node.children = childNodes;
      } else {
        delete node.children;
        node.isLeaf = true; // No children = Leaf
      }
    } else {
      delete node.children;
      node.isLeaf = true; // No children = Leaf
    }

    return node;
  };

  // Start building from the root user message
  return buildNode(rootId);
};