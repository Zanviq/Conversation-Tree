
import * as d3 from 'd3';

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string (raw, without data URI prefix)
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  parentId: string | null;
  childrenIds: string[];
  connections?: string[]; // IDs of nodes that connect INTO this node (transfer memory here)
  timestamp: number;
  // A label to briefly describe this node in the graph (e.g. first few words)
  summary?: string; 
  // IDs of tracks (leaf nodes) that were used as context for this message (Multiverse Fork)
  attachedTrackIds?: string[];
}

export interface Session {
  id: string;
  title: string;
  rootMessageId: string | null;
  // A flat map of all messages in this session for O(1) access
  messageMap: Record<string, Message>;
  // The ID of the message currently at the bottom of the view (the "active" leaf)
  currentHeadId: string | null;
  lastModified: number;
}

export interface D3Node extends d3.HierarchyPointNode<TreeNode> {
  x: number;
  y: number;
}

export interface TreeNode {
  id: string;
  name: string;
  role: 'user' | 'model';
  isCurrentPath: boolean;
  isLeaf: boolean; 
  connections?: string[]; 
  attachedTrackIds?: string[]; // Visual indicator for green button
  children?: TreeNode[];
}
