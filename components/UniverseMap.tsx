
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TreeNode, Message } from '../types';
import { GitFork, Link as LinkIcon, Unlink, Info, LocateFixed } from 'lucide-react';

interface UniverseMapProps {
  data: TreeNode | null;
  onNodeClick: (nodeId: string) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onDisconnect: (sourceId: string, targetId: string) => void;
  onPositionUpdate?: (nodeId: string, x: number, y: number) => void; // Callback to save position
  activeSessionId: string | null;
  processingNodeId: string | null;
  isTrackSelectionMode?: boolean;
  selectedTrackIds?: string[];
  messageMap?: Record<string, Message>;
  currentHeadId: string | null;
  isVisible?: boolean; // Whether the sidebar is visible
}

interface Point { x: number; y: number; }

interface ConnectionLinkData {
    source: Point;
    target: Point;
    sourceId: string;
    targetId: string;
    id: string;
}

// Visual Constants
const SOCKET_RING_RADIUS = 22; 
const CONNECTION_DOT_RADIUS = 3; 

// Colors for tracks: A, B, C, D...
const TRACK_COLORS = [
    '#a78bfa', // A (Purple - Nebula)
    '#22d3ee', // B (Cyan)
    '#fbbf24', // C (Amber)
    '#f472b6', // D (Pink)
    '#34d399', // E (Emerald)
    '#f87171', // F (Red)
];

const UniverseMap: React.FC<UniverseMapProps> = ({ 
    data, 
    onNodeClick,
    onConnect,
    onDisconnect,
    onPositionUpdate,
    activeSessionId,
    processingNodeId,
    isTrackSelectionMode = false,
    selectedTrackIds = [],
    messageMap,
    currentHeadId,
    isVisible = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  // Layer Refs
  const hierarchyGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const connectionsGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  
  const [selectedNode, setSelectedNode] = useState<{ id: string, x: number, y: number, name: string } | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<{ id: string, x: number, y: number, sourceId: string, targetId: string } | null>(null);
  
  // Track Popup State
  const [showingTracksForNodeId, setShowingTracksForNodeId] = useState<string | null>(null);
  
  // Connection Mode State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);

  // Track dimensions to handle initialization correctly
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // Persist zoom transform
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity.translate(0, 80).scale(0.8));
  
  // Persist Node Positions { [id]: {x, y} }
  const nodePositionsRef = useRef<Record<string, Point>>({});
  
  // Track previous session ID to detect when to hard reset
  const prevSessionIdRef = useRef<string | null>(activeSessionId);
  // Track previous head ID for auto-recentering logic. Start null to trigger on first valid ID.
  const prevHeadIdRef = useRef<string | null>(null);

  // --- Helpers ---
  const isValidTarget = (targetId: string) => {
    if (!connectingSourceId || !messageMap) return false;
    if (targetId === connectingSourceId) return false;

    // Check 1: Is Source an ancestor of Target? (Descendant check)
    let curr: string | null = targetId;
    while(curr) {
        if (curr === connectingSourceId) return false;
        curr = messageMap[curr]?.parentId || null;
    }

    // Check 2: Is Target an ancestor of Source? (Ancestor check)
    curr = connectingSourceId;
    while(curr) {
        if (curr === targetId) return false;
        curr = messageMap[curr]?.parentId || null;
    }
    
    return true;
  };

  const handleRecenter = () => {
    if (!currentHeadId || !svgRef.current || !wrapperRef.current || !zoomRef.current) return;
    
    // Find position of the current head node
    const pos = nodePositionsRef.current[currentHeadId];
    if (!pos) return;

    const width = dimensions.width;
    const height = dimensions.height;
    
    // Center logic: Translate (width/2, height/2) then scale(1) then translate(-x, -y)
    const newTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1)
        .translate(-pos.x, -pos.y);

    d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, newTransform);
  };

  // Close popup on click elsewhere (Document level fallback)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if ((e.target as Element).closest('#node-menu') || 
            (e.target as Element).closest('#connection-menu') ||
            (e.target as Element).closest('.track-info-popup') // Do not close if clicking the popup itself
           ) return;
        
        // If clicking a track-btn, don't clear immediate state
        if ((e.target as Element).closest('.track-btn-group')) return;
        
        setShowingTracksForNodeId(null);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); 
    return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []); 

  // Handle Mouse Move for Connection Line
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!connectingSourceId || !svgRef.current || !contentGRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        
        const transform = transformRef.current;
        const x = (rawX - transform.x) / transform.k;
        const y = (rawY - transform.y) / transform.k;
        
        setMousePos({ x, y });
    };

    if (connectingSourceId) {
        document.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [connectingSourceId]);

  // --- EFFECT: Resize Observer ---
  useEffect(() => {
      if (!wrapperRef.current) return;
      
      const updateSize = (width: number, height: number) => {
          setDimensions({ width, height });
          if (svgRef.current) {
            d3.select(svgRef.current)
                .attr("width", width)
                .attr("height", height);
          }
      };

      const resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
              const { width, height } = entry.contentRect;
              if (width > 0 && height > 0) {
                  requestAnimationFrame(() => updateSize(width, height));
              }
          }
      });

      resizeObserver.observe(wrapperRef.current);
      return () => resizeObserver.disconnect();
  }, []);

  // --- Helper to handle Background Clicks ---
  const handleBackgroundClick = (e: any) => {
      const target = (e.target || e.sourceEvent?.target) as Element;
      
      // If clicking inside a menu, button, or a node, do NOT clear selection.
      if (target.closest('#node-menu') || 
          target.closest('#connection-menu') || 
          target.closest('.track-btn-group') || 
          target.closest('.node') || 
          target.closest('.connection-hit') ||
          target.closest('.track-info-popup')) {
          return;
      }

      if (connectingSourceId) {
          setConnectingSourceId(null);
          setMousePos(null);
      }
      setSelectedNode(null);
      setSelectedConnection(null);
      setShowingTracksForNodeId(null);
  };
  
  // Use Ref for D3 access to latest closure
  const handleBackgroundClickRef = useRef(handleBackgroundClick);
  handleBackgroundClickRef.current = handleBackgroundClick;

  // --- Core Node Logic: Handled in React to access latest State closures ---
  const handleNodeClick = (nodeData: TreeNode, x: number, y: number) => {
    // 1. Track Selection Mode
    if (isTrackSelectionMode) {
        if (nodeData.isLeaf) {
            onNodeClick(nodeData.id); // Toggle selection in App parent
        } 
        return;
    }

    // 2. Connection Mode
    if (connectingSourceId) {
        if (connectingSourceId !== nodeData.id) {
            if (isValidTarget(nodeData.id)) {
                onConnect(connectingSourceId, nodeData.id);
            }
        }
        setConnectingSourceId(null);
        setMousePos(null);
        return;
    }

    // 3. Default: Select Node
    const transform = transformRef.current;
    const screenX = transform.applyX(x);
    const screenY = transform.applyY(y);

    setSelectedNode({
        id: nodeData.id,
        x: screenX,
        y: screenY,
        name: nodeData.name
    });
    setSelectedConnection(null);
  };

  // --- EFFECT 1: Initialization & Zoom Setup ---
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;

    const isNewSession = prevSessionIdRef.current !== activeSessionId;
    
    if (isNewSession || !isReady) {
        prevSessionIdRef.current = activeSessionId;
        
        if (isNewSession) {
            nodePositionsRef.current = {};
            setConnectingSourceId(null);
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        svg.attr("width", width).attr("height", height);

        // 1. Defs (Filters)
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%")
            .attr("y", "-50%")
            .attr("width", "200%")
            .attr("height", "200%");
        
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");
        
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // 2. Background Rect (For capturing clicks)
        const bgRect = svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "transparent")
            .style("cursor", "grab");

        // 3. Content Group
        const g = svg.append("g");
        contentGRef.current = g;
        
        // --- SEPARATE LAYERS ---
        // Order: Hierarchy (Bottom) -> Nodes (Middle) -> Connections (Top, as requested)
        hierarchyGRef.current = g.append("g").attr("class", "hierarchy-layer");
        nodesGRef.current = g.append("g").attr("class", "nodes-layer");
        connectionsGRef.current = g.append("g").attr("class", "connections-layer");

        // 4. Zoom Behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                transformRef.current = event.transform; 
            })
            .on("end", (event) => {
                 bgRect.style("cursor", "grab");
            })
            .on("start", () => {
                 bgRect.style("cursor", "grabbing");
            });
        
        svg.call(zoom).on("dblclick.zoom", null);
        zoomRef.current = zoom; // Capture zoom behavior

        // Attach Click Listener to Background via D3 to bypass Zoom blocking
        bgRect.on("click", (event) => {
            if (handleBackgroundClickRef.current) {
                handleBackgroundClickRef.current(event);
            }
        });

        const initialTransform = d3.zoomIdentity.translate(width / 2, 80).scale(0.8);
        transformRef.current = initialTransform;
        svg.call(zoom.transform, initialTransform);

        setIsReady(true);
    }
  }, [activeSessionId, dimensions.width, dimensions.height, isReady]); 


  // Helper: Calculate text width in pixels for summary
  const getTextWidth = (text: string, fontSize: number = 10): number => {
    if (!text) return 0;
    // Approximate width: average character width = fontSize * 0.65
    return text.length * (fontSize * 0.65);
  };

  // Helper: Get summary text for a node
  const getNodeSummary = (nodeId: string): string => {
    return messageMap?.[nodeId]?.summary || messageMap?.[nodeId]?.content?.substring(0, 18) || '';
  };

  // --- EFFECT 2: Data Rendering & Auto-Recenter ---
  useEffect(() => {
    if (!data || !contentGRef.current || !isReady) return;

    // Use specific layers
    const hierarchyLayer = hierarchyGRef.current!;
    const nodesLayer = nodesGRef.current!;
    const connectionsLayer = connectionsGRef.current!;

    // 1. Calculate Tree Layout
    const treeLayout = d3.tree<TreeNode>().nodeSize([80, 100]);
    const root = d3.hierarchy<TreeNode>(data);
    const treeData = treeLayout(root);
    
    // 2. Apply Custom Position Adjustment for New Children
    // This ensures new children are positioned correctly based on saved positions
    const adjustNodePositions = (node: d3.HierarchyPointNode<TreeNode>): void => {
      // Recursively process all children first (post-order traversal)
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => adjustNodePositions(child));

        // Now adjust this node's **direct children** positions
        const directChildren = node.children;

        // Get all direct children with their saved positions
        const childrenWithPos = directChildren.map((child) => {
          const savedPos = messageMap?.[child.data.id]?.position;
          return {
            child,
            x: savedPos?.x ?? child.x,
            y: savedPos?.y ?? child.y,
            summary: getNodeSummary(child.data.id)
          };
        });

        // Find the child with the MAXIMUM x coordinate (rightmost)
        let rightmostIdx = 0;
        let maxX = childrenWithPos[0].x;
        for (let i = 1; i < childrenWithPos.length; i++) {
          if (childrenWithPos[i].x > maxX) {
            maxX = childrenWithPos[i].x;
            rightmostIdx = i;
          }
        }

        // Apply positions to all children
        childrenWithPos.forEach((item, idx) => {
          item.child.x = item.x;
          item.child.y = item.y;
        });
      }
    };

    const allNodes = treeData.descendants();
    adjustNodePositions(treeData);

    // 3. Reconcile Positions
    const nodes = treeData.descendants();
    const idealPositions = new Map<string, Point>();
    nodes.forEach(d => {
        idealPositions.set(d.data.id, {x: d.x, y: d.y});
    });

    nodes.forEach((d) => {
        const cached = nodePositionsRef.current[d.data.id];
        if (cached) {
            d.x = cached.x;
            d.y = cached.y;
        } else {
            let newX = d.x;
            let newY = d.y;
            if (d.parent) {
                const parentId = d.parent.data.id;
                const parentCached = nodePositionsRef.current[parentId];
                const parentIdeal = idealPositions.get(parentId);
                if (parentCached && parentIdeal) {
                    const dx = parentCached.x - parentIdeal.x;
                    const dy = parentCached.y - parentIdeal.y;
                    newX += dx;
                    newY += dy;
                }
            }
            d.x = newX;
            d.y = newY;
            nodePositionsRef.current[d.data.id] = { x: newX, y: newY };
        }
    });

    // --- PREPARE HIGHLIGHT DATA FOR CONTEXT TRACKS ---
    let highlightTrackIds: string[] = [];
    if (showingTracksForNodeId) {
        const findNode = (n: TreeNode): TreeNode | null => {
            if (n.id === showingTracksForNodeId) return n;
            if (n.children) {
                for (const c of n.children) {
                    const r = findNode(c);
                    if (r) return r;
                }
            }
            return null;
        };
        const target = findNode(data);
        const nodeSet = new Set(nodes.map(n => n.data.id));
        if (target && target.attachedTrackIds) {
            highlightTrackIds = target.attachedTrackIds.filter(id => nodeSet.has(id));
        }
    }

    // 3. Draw Hierarchy Links
    const hierarchyLinkGenerator = d3.linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x((d) => d.x)
        .y((d) => d.y);

    const links = hierarchyLayer.selectAll(".link")
        .data(treeData.links(), (d: any) => d.target.data.id);

    links.join(
        enter => enter.append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke-width", (d) => d.target.data.isCurrentPath ? 2 : 1)
            .attr("opacity", 0)
            .attr("d", hierarchyLinkGenerator)
            .style("pointer-events", "none")
            .call(enter => enter.transition().duration(300).attr("opacity", (d) => d.target.data.isCurrentPath ? 0.8 : 0.3)),
        update => update
            .attr("stroke", (d) => d.target.data.isCurrentPath ? "#c084fc" : "#4b5563")
            .attr("stroke-width", (d) => d.target.data.isCurrentPath ? 2 : 1)
            .attr("opacity", (d) => d.target.data.isCurrentPath ? 0.8 : 0.3)
            .attr("d", hierarchyLinkGenerator),
        exit => exit.remove()
    );

    // 4. Draw Connection Links
    const connectionLinks: ConnectionLinkData[] = [];
    nodes.forEach(node => {
        if (node.data.connections) {
            node.data.connections.forEach((sourceId, idx) => {
                const sourcePos = nodePositionsRef.current[sourceId];
                const targetPos = nodePositionsRef.current[node.data.id];
                if (sourcePos && targetPos) {
                    connectionLinks.push({
                        source: sourcePos,
                        target: targetPos,
                        sourceId: sourceId,
                        targetId: node.data.id,
                        id: `${sourceId}-${node.data.id}-${idx}`
                    });
                }
            });
        }
    });

    const renderData = connectionLinks.map(d => {
        const isStandardDown = d.target.y >= d.source.y;
        const sourcePoint = {
            x: d.source.x,
            y: d.source.y + (isStandardDown ? SOCKET_RING_RADIUS : -SOCKET_RING_RADIUS)
        };
        const targetPoint = {
            x: d.target.x,
            y: d.target.y + (isStandardDown ? -SOCKET_RING_RADIUS : SOCKET_RING_RADIUS)
        };
        return { ...d, sourcePoint, targetPoint };
    });

    const connCurveGenerator = d3.linkVertical<any, any>()
        .source(d => d.sourcePoint)
        .target(d => d.targetPoint)
        .x(d => d.x)
        .y(d => d.y);

    const connGroup = connectionsLayer.selectAll(".connection-group")
        .data(renderData, (d: any) => d.id);
    
    const connGroupEnter = connGroup.enter()
        .append("g")
        .attr("class", "connection-group")
        .attr("opacity", 0);
    
    connGroupEnter.transition().duration(500).attr("opacity", 1);

    connGroupEnter.append("path")
        .attr("class", "connection-visible")
        .attr("fill", "none")
        .attr("stroke", "#22d3ee")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 4")
        .attr("d", connCurveGenerator);
    
    connGroupEnter.append("circle")
        .attr("class", "socket-ring-source")
        .attr("r", SOCKET_RING_RADIUS)
        .attr("fill", "none")
        .attr("stroke", "#22d3ee")
        .attr("stroke-width", 1.5)
        .attr("cx", d => d.source.x)
        .attr("cy", d => d.source.y);

    connGroupEnter.append("circle")
        .attr("class", "socket-ring-target")
        .attr("r", SOCKET_RING_RADIUS)
        .attr("fill", "none")
        .attr("stroke", "#22d3ee")
        .attr("stroke-width", 1.5)
        .attr("cx", d => d.target.x)
        .attr("cy", d => d.target.y);

    connGroupEnter.append("circle")
        .attr("class", "socket-dot-source")
        .attr("r", CONNECTION_DOT_RADIUS)
        .attr("fill", "#22d3ee")
        .attr("cx", d => d.sourcePoint.x)
        .attr("cy", d => d.sourcePoint.y);

    connGroupEnter.append("circle")
        .attr("class", "socket-dot-target")
        .attr("r", CONNECTION_DOT_RADIUS)
        .attr("fill", "#22d3ee")
        .attr("cx", d => d.targetPoint.x)
        .attr("cy", d => d.targetPoint.y);
    
    connGroupEnter.append("path")
        .attr("class", "connection-hit")
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 15)
        .attr("cursor", "pointer")
        .attr("d", connCurveGenerator)
        .on("click", (event, d) => {
            event.stopPropagation();
            const mouseX = (event.clientX - wrapperRef.current!.getBoundingClientRect().left);
            const mouseY = (event.clientY - wrapperRef.current!.getBoundingClientRect().top);

            setSelectedNode(null); 
            setSelectedConnection({
                id: d.id,
                x: mouseX,
                y: mouseY,
                sourceId: d.sourceId,
                targetId: d.targetId
            });
        });

    const connGroupUpdate = connGroup.merge(connGroupEnter);
    
    connGroupUpdate.select(".connection-visible").attr("d", connCurveGenerator);
    connGroupUpdate.select(".connection-hit").attr("d", connCurveGenerator);
    connGroupUpdate.select(".socket-ring-source").attr("cx", d => d.source.x).attr("cy", d => d.source.y);
    connGroupUpdate.select(".socket-ring-target").attr("cx", d => d.target.x).attr("cy", d => d.target.y);
    connGroupUpdate.select(".socket-dot-source").attr("cx", d => d.sourcePoint.x).attr("cy", d => d.sourcePoint.y);
    connGroupUpdate.select(".socket-dot-target").attr("cx", d => d.targetPoint.x).attr("cy", d => d.targetPoint.y);

    connGroup.exit().remove();

    // 5. Draw Nodes
    const nodesSelection = nodesLayer.selectAll(".node")
        .data(nodes, (d: any) => d.data.id);

    // FIX: Remove exiting nodes!
    nodesSelection.exit().transition().duration(300).attr("opacity", 0).remove();

    const nodeEnter = nodesSelection.enter()
        .append("g")
        .attr("class", "node cursor-pointer")
        .attr("opacity", 0);
    
    nodeEnter.transition().duration(300).attr("opacity", 1);

    // HIT AREA: Larger transparent circle for easier clicking
    nodeEnter.append("circle")
        .attr("class", "node-hit-area")
        .attr("r", 24)
        .attr("fill", "transparent");

    // Node Glow
    nodeEnter.append("circle")
        .attr("class", "node-glow animate-pulse pointer-events-none")
        .attr("r", 16)
        .attr("fill", "rgba(167, 139, 250, 0.2)");
    
    // Node Core
    nodeEnter.append("circle")
        .attr("class", "node-core")
        .attr("r", 8)
        .attr("stroke-width", 2);

    // Node Label
    nodeEnter.append("text")
        .attr("class", "node-label")
        .attr("dy", "2.5em")
        .attr("x", 0)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-family", "sans-serif")
        .style("pointer-events", "none")
        .style("text-shadow", "0px 2px 4px rgba(0,0,0,0.8)")
        .attr("fill", "#94a3b8");

    // Track Selection Badge
    const badgeGroup = nodeEnter.append("g")
        .attr("class", "node-badge")
        .style("display", "none");
    
    badgeGroup.append("rect")
        .attr("x", 8)
        .attr("y", -20)
        .attr("width", 16)
        .attr("height", 16)
        .attr("rx", 4)
        .attr("fill", "#333");

    badgeGroup.append("text")
        .attr("x", 16)
        .attr("y", -9)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text("A");

    // Track Button Group
    const trackBtnGroup = nodeEnter.append("g")
        .attr("class", "track-btn-group")
        .style("display", "none")
        .style("cursor", "pointer");

    trackBtnGroup.append("rect")
        .attr("class", "track-btn-bg")
        .attr("x", 36) 
        .attr("y", -2)
        .attr("width", 24)
        .attr("height", 12)
        .attr("rx", 6)
        .attr("fill", "#16a34a")
        .attr("fill-opacity", 1)
        .attr("stroke", "#14532d")
        .attr("stroke-width", 1);
        
    trackBtnGroup.append("rect")
        .attr("class", "track-btn-hit")
        .attr("x", 32)
        .attr("y", -6)
        .attr("width", 32)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("fill", "transparent");

    trackBtnGroup.append("circle").attr("cx", 42).attr("cy", 4).attr("r", 2).attr("fill", "white");
    trackBtnGroup.append("circle").attr("cx", 48).attr("cy", 4).attr("r", 2).attr("fill", "white");
    trackBtnGroup.append("circle").attr("cx", 54).attr("cy", 4).attr("r", 2).attr("fill", "white");

    trackBtnGroup
        .on("mousedown", (event) => event.stopPropagation()) 
        .on("touchstart", (event) => event.stopPropagation())
        .on("pointerdown", (event) => event.stopPropagation())
        .on("click", (event, d) => {
            event.stopPropagation();
            event.preventDefault(); 
            setShowingTracksForNodeId(prev => prev === d.data.id ? null : d.data.id);
        });

    const nodeUpdate = nodeEnter.merge(nodesSelection);

    nodeUpdate.attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Update nodePositionsRef with current positions for connection rendering
    nodeUpdate.each(function(d) {
        nodePositionsRef.current[d.data.id] = { x: d.x, y: d.y };
    });

    // Dynamic Coloring and Styling
    nodeUpdate.each(function(d) {
        const sel = d3.select(this);
        const isSelectedTrack = selectedTrackIds.includes(d.data.id);
        const trackIndex = selectedTrackIds.indexOf(d.data.id);
        const isCurrentPath = d.data.isCurrentPath;
        
        const validAttachedIds = d.data.attachedTrackIds?.filter(id => nodePositionsRef.current[id]) || [];
        const hasAttachedTracks = validAttachedIds.length > 0;

        const contextIndex = highlightTrackIds.indexOf(d.data.id);
        const isContextTrack = contextIndex !== -1;
        
        let fillColor = "#6366f1"; 
        let strokeColor = "#4338ca";
        let glowDisplay = "none";
        let opacity = 1;
        let cursorStyle = "pointer";
        
        sel.select(".node-label").text(d.data.name);

        if (connectingSourceId) {
             // CONNECTION MODE STYLING
             if (d.data.id === connectingSourceId) {
                 // Source
                 fillColor = "#22d3ee"; // Cyan
                 strokeColor = "#ffffff";
                 glowDisplay = "block";
                 opacity = 1;
             } else if (isValidTarget(d.data.id)) {
                 // Valid Target - Blue Glow (Requested)
                 fillColor = "#3b82f6"; // Blue-500
                 strokeColor = "#60a5fa"; // Blue-400
                 glowDisplay = "block";
                 opacity = 1;
                 cursorStyle = "pointer";
             } else {
                 // Invalid Target - Normal Style (Do not dim, just change cursor)
                 if (isContextTrack) {
                    fillColor = TRACK_COLORS[contextIndex % TRACK_COLORS.length];
                    strokeColor = "#ffffff";
                    glowDisplay = "block";
                } else if (isCurrentPath) {
                    fillColor = "#e9d5ff";
                    strokeColor = "#c084fc";
                    glowDisplay = "block";
                } else {
                    fillColor = "#1f2937"; 
                    strokeColor = "#374151";
                    glowDisplay = "none";
                }
                 opacity = 1; 
                 cursorStyle = "not-allowed";
             }
             // Always show labels in this mode since we are not dimming
             sel.select(".node-label").attr("fill", (isCurrentPath || isContextTrack) ? "#e9d5ff" : "#94a3b8").attr("opacity", 1);

        } else if (isTrackSelectionMode) {
            if (isSelectedTrack) {
                fillColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
                strokeColor = "#ffffff";
                glowDisplay = "block";
            } else if (d.data.isLeaf) {
                fillColor = "#4b5563"; 
                strokeColor = "#9ca3af";
                glowDisplay = "none";
            } else {
                fillColor = "#1f2937"; 
                strokeColor = "#374151";
            }
            opacity = d.data.isLeaf || isSelectedTrack ? 1 : 0.4;
            sel.select(".node-label").attr("fill", isSelectedTrack ? "#e9d5ff" : "#94a3b8").attr("opacity", 1);
        } else {
            // NORMAL MODE
            opacity = 1;
            if (isContextTrack) {
                fillColor = TRACK_COLORS[contextIndex % TRACK_COLORS.length];
                strokeColor = "#ffffff";
                glowDisplay = "block";
            } else if (isCurrentPath) {
                fillColor = "#e9d5ff";
                strokeColor = "#c084fc";
                glowDisplay = "block";
            }
            sel.select(".node-label").attr("fill", isCurrentPath || isContextTrack ? "#e9d5ff" : "#94a3b8").attr("opacity", 1);
        }

        sel.attr("opacity", opacity);
        sel.style("cursor", cursorStyle);

        sel.select(".node-core")
           .attr("fill", fillColor)
           .attr("stroke", strokeColor)
           .style("filter", glowDisplay === "block" ? "url(#glow)" : "none");

        sel.select(".node-glow").attr("display", glowDisplay);
        
        // Update click handler locally to respect validity
        sel.on("click", (event) => {
             event.stopPropagation();
             if (connectingSourceId) {
                 if (d.data.id === connectingSourceId) {
                     // Click source to cancel
                     setConnectingSourceId(null);
                     setMousePos(null);
                 } else if (!isValidTarget(d.data.id)) {
                     return; // Ignore click on invalid target
                 } else {
                     handleNodeClick(d.data, d.x, d.y);
                 }
                 return;
             }
             handleNodeClick(d.data, d.x, d.y);
        });

        const badge = sel.select(".node-badge");
        if (isTrackSelectionMode && isSelectedTrack) {
            badge.style("display", "block");
            badge.select("rect").attr("fill", TRACK_COLORS[trackIndex % TRACK_COLORS.length]);
            badge.select("text").text(String.fromCharCode(65 + trackIndex)); 
        } else if (!isTrackSelectionMode && isContextTrack) {
            badge.style("display", "block");
            badge.select("rect").attr("fill", TRACK_COLORS[contextIndex % TRACK_COLORS.length]);
            badge.select("text").text(String.fromCharCode(65 + contextIndex)); 
        } else {
            badge.style("display", "none");
        }

        const trackBtn = sel.select(".track-btn-group");
        if (!isTrackSelectionMode && !connectingSourceId && hasAttachedTracks) {
            trackBtn.style("display", "block");
             if (d.data.id === showingTracksForNodeId) {
                 trackBtn.select(".track-btn-bg").attr("stroke", "#ffffff").attr("stroke-width", 2);
             } else {
                 trackBtn.select(".track-btn-bg").attr("stroke", "#14532d").attr("stroke-width", 1);
             }
        } else {
            trackBtn.style("display", "none");
        }
    });

    // 6. Drag & Click Behavior
    const drag = d3.drag<SVGGElement, d3.HierarchyPointNode<TreeNode>>()
        .on("start", function(event, d) {
            if (processingNodeId && d.data.id === processingNodeId) return;
            
            event.sourceEvent.stopPropagation(); 
            
            (d as any)._dragStartX = event.x;
            (d as any)._dragStartY = event.y;
            (d as any)._isDragging = false;
            
            if (!connectingSourceId && !isTrackSelectionMode) {
                d3.select(this).style("cursor", "grabbing");
                d3.select(this).raise();
            }
        })
        .on("drag", function(event, d) {
             if (processingNodeId && d.data.id === processingNodeId) return;
             if (connectingSourceId || isTrackSelectionMode) return; 

            const dx = event.x - (d as any)._dragStartX;
            const dy = event.y - (d as any)._dragStartY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                 (d as any)._isDragging = true;
            }

            if ((d as any)._isDragging) {
                const newX = event.x;
                let newY = event.y;
                const buffer = 20;

                // Constraint 1: Child cannot go above Parent
                if (d.parent) {
                    const limitY = d.parent.y + buffer;
                    if (newY < limitY) newY = limitY;
                }

                // Constraint 2: Parent cannot go below any Child
                if (d.children && d.children.length > 0) {
                    let minChildY = Infinity;
                    d.children.forEach(child => {
                        // Use current positions from children as they might have been dragged or laid out
                        if (child.y < minChildY) minChildY = child.y;
                    });
                    
                    const limitYBottom = minChildY - buffer;
                    if (newY > limitYBottom) newY = limitYBottom;
                }

                d.x = newX;
                d.y = newY;
                d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
                
                hierarchyLayer.selectAll(".link").attr("d", hierarchyLinkGenerator);
                nodePositionsRef.current[d.data.id] = { x: d.x, y: d.y };

                connectionsLayer.selectAll(".connection-group")
                    .each(function(linkD: any) {
                        const sel = d3.select(this);
                        const rawSource = linkD.sourceId === d.data.id ? {x: d.x, y: d.y} : linkD.source;
                        const rawTarget = linkD.targetId === d.data.id ? {x: d.x, y: d.y} : linkD.target;
                        const isStandardDown = rawTarget.y >= rawSource.y;
                        const sp = { x: rawSource.x, y: rawSource.y + (isStandardDown ? SOCKET_RING_RADIUS : -SOCKET_RING_RADIUS) };
                        const tp = { x: rawTarget.x, y: rawTarget.y + (isStandardDown ? -SOCKET_RING_RADIUS : SOCKET_RING_RADIUS) };
                        const newPath = connCurveGenerator({sourcePoint: sp, targetPoint: tp} as any);
                        sel.select(".connection-visible").attr("d", newPath);
                        sel.select(".connection-hit").attr("d", newPath);
                        sel.select(".socket-ring-source").attr("cx", rawSource.x).attr("cy", rawSource.y);
                        sel.select(".socket-ring-target").attr("cx", rawTarget.x).attr("cy", rawTarget.y);
                        sel.select(".socket-dot-source").attr("cx", sp.x).attr("cy", sp.y);
                        sel.select(".socket-dot-target").attr("cx", tp.x).attr("cy", tp.y);
                        linkD.source = rawSource;
                        linkD.target = rawTarget;
                        linkD.sourcePoint = sp;
                        linkD.targetPoint = tp;
                    });
            }
        })
        .on("end", function(event, d) {
            d3.select(this).style("cursor", "pointer");
            if ((d as any)._isDragging) {
                 // Save the new position to messageMap via callback
                 if (onPositionUpdate) {
                     onPositionUpdate(d.data.id, d.x, d.y);
                 }
            }
            delete (d as any)._dragStartX;
            delete (d as any)._dragStartY;
            delete (d as any)._isDragging;
        });

    nodeUpdate.call(drag as any);
    
    // Auto-recenter if head changed
    // We do this inside this effect because we know node positions are now updated
    if (currentHeadId && currentHeadId !== prevHeadIdRef.current) {
         prevHeadIdRef.current = currentHeadId;
         handleRecenter();
    }

  }, [data, processingNodeId, isReady, connectingSourceId, isTrackSelectionMode, selectedTrackIds, showingTracksForNodeId, currentHeadId, dimensions.width, dimensions.height, messageMap, onPositionUpdate, isVisible]); 

  // --- Dynamic Connection Line ---
  useEffect(() => {
     if (!connectionsGRef.current || !connectingSourceId || !mousePos) {
         connectionsGRef.current?.select(".temp-connection-group").remove();
         return;
     }
     const sourcePos = nodePositionsRef.current[connectingSourceId];
     if (!sourcePos) return;
     const startPoint = { x: sourcePos.x, y: sourcePos.y + SOCKET_RING_RADIUS };
     const endPoint = mousePos; 
     const tempGroup = connectionsGRef.current.selectAll(".temp-connection-group").data([1]);
     const tempEnter = tempGroup.enter().append("g").attr("class", "temp-connection-group").style("pointer-events", "none"); 
     tempEnter.append("path").attr("class", "temp-path").attr("fill", "none").attr("stroke", "#22d3ee").attr("stroke-width", 2).attr("stroke-dasharray", "4 4");
     tempEnter.append("circle").attr("class", "temp-socket-ring").attr("r", SOCKET_RING_RADIUS).attr("fill", "none").attr("stroke", "#22d3ee").attr("stroke-width", 1.5);
     tempEnter.append("circle").attr("class", "temp-socket-start").attr("r", CONNECTION_DOT_RADIUS).attr("fill", "#22d3ee");
     tempEnter.append("circle").attr("class", "temp-socket-end").attr("r", CONNECTION_DOT_RADIUS).attr("fill", "#22d3ee");

     const tempUpdate = tempGroup.merge(tempEnter);
     const curve = d3.linkVertical().source((d:any) => d.source).target((d:any) => d.target).x((d:any) => d.x).y((d:any) => d.y);
     const linkData = { source: startPoint, target: endPoint };

     tempUpdate.select(".temp-path").attr("d", curve(linkData));
     tempUpdate.select(".temp-socket-ring").attr("cx", sourcePos.x).attr("cy", sourcePos.y);
     tempUpdate.select(".temp-socket-start").attr("cx", startPoint.x).attr("cy", startPoint.y);
     tempUpdate.select(".temp-socket-end").attr("cx", endPoint.x).attr("cy", endPoint.y);

  }, [connectingSourceId, mousePos]);

  // --- Track Info Popup Position Logic ---
  const getTrackInfoPopup = () => {
    if (!showingTracksForNodeId || !wrapperRef.current) return null;
    const pos = nodePositionsRef.current[showingTracksForNodeId];
    if (!pos) return null;

    const transform = transformRef.current;
    const screenX = transform.applyX(pos.x);
    const screenY = transform.applyY(pos.y);
    
    const findNodeData = (node: TreeNode): TreeNode | null => {
        if (node.id === showingTracksForNodeId) return node;
        if (node.children) {
            for (const c of node.children) {
                const res = findNodeData(c);
                if (res) return res;
            }
        }
        return null;
    };
    const targetNode = data ? findNodeData(data) : null;
    const attachedIds = targetNode?.attachedTrackIds?.filter(id => nodePositionsRef.current[id]) || [];

    if (attachedIds.length === 0) return null;

    return (
        <div 
            className="absolute z-50 track-info-popup bg-space-900 border border-green-800 rounded-lg p-3 shadow-xl text-xs animate-in fade-in zoom-in-95 duration-100"
            style={{ 
                left: screenX + 60, 
                top: screenY, 
                transform: 'translateY(-50%)',
                minWidth: '150px'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="font-bold text-green-400 mb-2 flex items-center gap-1 border-b border-green-900/50 pb-1">
                <Info size={12}/> Connected Tracks
            </div>
            
            <ul className="space-y-1">
                {attachedIds.map((id, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-300 bg-space-950/50 p-1 rounded">
                            <div 
                            className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold text-space-950"
                            style={{ backgroundColor: TRACK_COLORS[idx % TRACK_COLORS.length] }}
                            >
                                {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="truncate max-w-[120px] font-mono">
                                {id.substring(0, 8)}...
                            </span>
                    </li>
                ))}
            </ul>
            
            <div className="mt-2 text-[10px] text-gray-500 border-t border-space-800 pt-1">
                Context used for generation
            </div>
        </div>
    );
  };

  const getMenuPosition = () => {
    if (!wrapperRef.current) return {};
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    if (selectedNode) {
        const menuWidth = 192; const menuHeight = 90; // Reduced height
        let left = selectedNode.x + 20; let top = selectedNode.y;
        if (left + menuWidth > wrapperRect.width) left = selectedNode.x - menuWidth - 20; 
        if (top + (menuHeight/2) > wrapperRect.height) top = wrapperRect.height - (menuHeight/2) - 10;
        if (top - (menuHeight/2) < 0) top = (menuHeight/2) + 10;
        if (left < 10) left = 10;
        return { left, top, transform: 'translateY(-50%)' };
    }
    if (selectedConnection) {
        let left = selectedConnection.x; let top = selectedConnection.y;
        const menuWidth = 160; const menuHeight = 50;
        if (left + menuWidth > wrapperRect.width) left = left - menuWidth;
        if (top + menuHeight > wrapperRect.height) top = top - menuHeight;
        return { left, top };
    }
    return {};
  };

  const startConnection = (e: React.MouseEvent) => {
      if(!selectedNode || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const transform = transformRef.current;
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const x = (rawX - transform.x) / transform.k;
      const y = (rawY - transform.y) / transform.k;
      setConnectingSourceId(selectedNode.id);
      setSelectedNode(null);
      setMousePos({ x, y }); 
  };

  return (
    <div 
        ref={wrapperRef} 
        tabIndex={-1} 
        className="w-full h-full bg-space-950 relative overflow-hidden outline-none" 
        style={{ touchAction: 'none' }}
        onClick={handleBackgroundClick} 
    >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#1e1b4b_10%,_transparent_50%)]"></div>
        
        <div className="absolute top-4 left-4 z-10 flex flex-col pointer-events-none opacity-60">
             <span className="text-xs text-nebula-400 font-mono tracking-[0.2em]">STAR CHART</span>
             <span className="text-[10px] text-gray-500 font-mono">NAVIGATE TIMELINES</span>
             
             {isTrackSelectionMode && (
                 <div className="mt-2 text-[10px] text-cyan-400 font-mono animate-pulse bg-cyan-900/30 px-2 py-1 rounded border border-cyan-800">
                     SELECTION MODE: PICK LEAF NODES
                 </div>
             )}
        </div>

        {/* Recenter Button */}
        <button
            onClick={handleRecenter}
            className="absolute bottom-4 right-4 p-2 bg-space-800/80 rounded text-gray-400 hover:bg-space-700 hover:text-white transition-colors border border-space-700 z-50 shadow-lg backdrop-blur-sm"
            title="Recenter Map"
        >
            <LocateFixed size={20} />
        </button>

        {connectingSourceId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in pointer-events-none">
                <div 
                    className="bg-space-800 border border-space-700 text-cyan-400 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                >
                    <LinkIcon size={16} />
                    <span className="text-xs font-medium">Select Target Node</span>
                    <span className="text-[10px] text-gray-500 ml-1">(Click bg to cancel)</span>
                </div>
            </div>
        )}

      <svg ref={svgRef} className="w-full h-full block relative z-10"></svg>

      {getTrackInfoPopup()}

      {selectedNode && !isTrackSelectionMode && (
        <div 
            id="node-menu"
            className="absolute z-50 bg-space-900 border border-space-700 rounded-lg shadow-xl p-2 w-48 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
            style={getMenuPosition()}
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="text-[10px] uppercase text-gray-500 px-2 py-1 border-b border-space-800 mb-1 truncate">
                {selectedNode.name}
            </div>
            
            <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    onNodeClick(selectedNode.id);
                    setSelectedNode(null);
                }}
                className="flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:bg-space-800 rounded transition-colors text-left w-full"
            >
                <GitFork size={14} className="rotate-90 text-nebula-400"/>
                Focus / View
            </button>

            <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    startConnection(e);
                }}
                className="flex items-center gap-2 px-2 py-2 text-xs text-gray-300 hover:bg-space-800 hover:text-cyan-400 rounded transition-colors text-left w-full"
            >
                <LinkIcon size={14} />
                Connect Memory
            </button>
        </div>
      )}

      {selectedConnection && (
          <div 
            id="connection-menu"
            className="absolute z-50 bg-space-900 border border-space-700 rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
            style={getMenuPosition()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    onDisconnect(selectedConnection.sourceId, selectedConnection.targetId);
                    setSelectedConnection(null);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-space-800 rounded transition-colors w-full whitespace-nowrap"
              >
                  <Unlink size={14} />
                  Delete Connection
              </button>
          </div>
      )}
    </div>
  );
};

export default UniverseMap;
