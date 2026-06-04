import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, UserPlus, Trash2, Edit3, ChevronDown, ChevronUp, User, Clock, Map } from 'lucide-react';
import { Person, ViewportState } from '../types';
import { computeTreeLayout, PositionedNode, ConnectorLine } from '../utils/treeLayout';

interface TreeViewProps {
  members: Person[];
  onAddSon: (parentId: string) => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  onContextMenu: (e: React.MouseEvent, person: Person | null) => void;
  highlightQuery?: string;
  isRtl?: boolean;
}

export default function TreeView({
  members,
  onAddSon,
  onEdit,
  onDelete,
  onContextMenu,
  highlightQuery = '',
  isRtl = true,
}: TreeViewProps) {
  const [viewport, setViewport] = useState<ViewportState>({ x: 100, y: 50, zoom: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize ALL nodes as expanded by default on first load
  useEffect(() => {
    if (members.length > 0 && expandedNodes.size === 0) {
      setExpandedNodes(new Set(members.map((m) => m.id)));
    }
  }, [members]);

  // Handle single node expand/collapse toggle
  const toggleNodeExpansion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
  };

  // Compute Layout positions
  const { nodes, connectors, width: treeWidth, height: treeHeight } = useMemo(() => {
    return computeTreeLayout(members, expandedNodes);
  }, [members, expandedNodes]);

  // Center View logic
  const handleCenterView = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Find average coordinates of nodes to center them properly
    let sumX = 0;
    let sumY = 0;
    for (const node of nodes) {
      sumX += node.x;
      sumY += node.y;
    }
    const avgX = sumX / nodes.length;
    const avgY = sumY / nodes.length;

    // Center layout coordinates relative to container size
    const targetX = rect.width / 2 - (avgX + 100) * 0.8;
    const targetY = rect.height / 2 - (avgY + 40) * 0.8;

    setViewport({ x: targetX, y: targetY, zoom: 0.8 });
  };

  // Run initial centering after mounted or workspace loads
  useEffect(() => {
    setTimeout(handleCenterView, 100);
  }, [members.length === 0]);

  // Zoom Helpers
  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.15, 5.0) }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.15, 0.25) }));
  };

  const handleFitToScreen = () => {
    handleCenterView();
  };

  // Mouse drag functions for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left trigger panning
    
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node-element') || target.closest('button') || target.closest('input')) {
      return; // Ignored if user clicked buttons or input boxes
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewport({
      ...viewport,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom with cursor focus tracking
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomStep = 1.08;
    let newZoom = viewport.zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(viewport.zoom * zoomStep, 5.0);
    } else {
      newZoom = Math.max(viewport.zoom / zoomStep, 0.25);
    }

    const dx = mouseX - viewport.x;
    const dy = mouseY - viewport.y;

    const nextX = mouseX - dx * (newZoom / viewport.zoom);
    const nextY = mouseY - dy * (newZoom / viewport.zoom);

    setViewport({ x: nextX, y: nextY, zoom: newZoom });
  };

  // Inline name editor submit
  const handleInlineEditSubmit = (person: Person) => {
    if (editNameValue.trim() && editNameValue !== person.name) {
      onEdit({ ...person, name: editNameValue.trim() });
    }
    setEditingNodeId(null);
  };

  // Mini-map viewport translation mapping
  const miniMapBox = useMemo(() => {
    if (!containerRef.current || treeWidth === 0) return { scale: 0.1, x: 0, y: 0, w: 0, h: 0 };
    const rect = containerRef.current.getBoundingClientRect();

    const mapMaxHeight = 110;
    const mapMaxWidth = 160;

    // Scale mapping layout bounds into the map bounds
    const scaleX = mapMaxWidth / Math.max(treeWidth, 1000);
    const scaleY = mapMaxHeight / Math.max(treeHeight, 800);
    const scale = Math.min(scaleX, scaleY);

    // Compute visible viewport bounds
    const visibleX = -viewport.x / viewport.zoom;
    const visibleY = -viewport.y / viewport.zoom;
    const visibleW = rect.width / viewport.zoom;
    const visibleH = rect.height / viewport.zoom;

    return {
      scale,
      x: Math.max(0, visibleX * scale),
      y: Math.max(0, visibleY * scale),
      w: Math.min(mapMaxWidth, visibleW * scale),
      h: Math.min(mapMaxHeight, visibleH * scale),
    };
  }, [viewport, treeWidth, treeHeight, nodes]);

  // Jump to coordinate on mini-map click
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // Map click coordinates back to original canvas layout coords
    const layoutX = clickX / miniMapBox.scale;
    const layoutY = clickY / miniMapBox.scale;

    setViewport((prev) => ({
      x: containerRect.width / 2 - layoutX * prev.zoom,
      y: containerRect.height / 2 - layoutY * prev.zoom,
      zoom: prev.zoom,
    }));
  };

  return (
    <div 
      className="relative flex-1 bg-[#FAFCFF] border border-slate-200 rounded-2xl overflow-hidden select-none"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, null); // Trigger workspace context menu
      }}
      style={{ height: '620px', direction: 'ltr' }} // viewport is absolute coordinates LTR standard for SVG placements
    >
      {/* Visual Canvas containing SVG links and nodes */}
      <div
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          width: `${treeWidth}px`,
          height: `${treeHeight}px`,
        }}
      >
        {/* Connection links SVG */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={treeWidth}
          height={treeHeight}
        >
          <defs>
            <linearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#24B1B1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#24B1B1" stopOpacity="0.15" stopDelay="1" />
            </linearGradient>
            <marker
              id="dot-marker"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
            >
              <circle cx="5" cy="5" r="3" fill="#24B1B1" />
            </marker>
          </defs>

          {connectors.map((line) => {
            // Draw professional bezier or orthogonal elbow connectors
            const midY = (line.fromY + line.toY) / 2;
            const pathData = `
              M ${line.fromX} ${line.fromY}
              V ${midY}
              H ${line.toX}
              V ${line.toY}
            `.trim();

            return (
              <path
                key={line.id}
                d={pathData}
                fill="none"
                stroke="#24B1B1"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all opacity-80"
                markerStart="url(#dot-marker)"
              />
            );
          })}
        </svg>

        {/* Node absolute layout containers */}
        {nodes.map((node) => {
          const isHighlighted =
            highlightQuery &&
            node.person.name.toLowerCase().includes(highlightQuery.toLowerCase());
          const isExpanded = expandedNodes.has(node.id);
          const hasChildren = members.some((m) => m.parentId === node.id);
          const isRoot = !node.person.parentId;

          const themeColor = node.person.colorTheme || 'teal';
          const colorMap = {
            teal: { 
              hex: '#24B1B1', 
              ring: 'ring-[#24B1B1]/40', 
              borderSelected: 'border-[#24B1B1]', 
              hover: 'hover:border-[#24B1B1]', 
              text: 'text-[#24B1B1]', 
              textHover: 'hover:text-[#24B1B1]', 
              bgLight: 'bg-[#24B1B1]/5', 
              borderLight: 'border-[#24B1B1]/10', 
              focusBorder: 'focus:border-[#24B1B1]',
              textDark: 'text-teal-900'
            },
            blue: { 
              hex: '#3B82F6', 
              ring: 'ring-blue-400/40', 
              borderSelected: 'border-blue-500', 
              hover: 'hover:border-blue-500', 
              text: 'text-blue-600', 
              textHover: 'hover:text-blue-500', 
              bgLight: 'bg-blue-50/70', 
              borderLight: 'border-blue-100', 
              focusBorder: 'focus:border-blue-500',
              textDark: 'text-blue-950'
            },
            emerald: { 
              hex: '#10B981', 
              ring: 'ring-emerald-400/40', 
              borderSelected: 'border-emerald-500', 
              hover: 'hover:border-emerald-500', 
              text: 'text-emerald-600', 
              textHover: 'hover:text-emerald-500', 
              bgLight: 'bg-emerald-50/70', 
              borderLight: 'border-emerald-100', 
              focusBorder: 'focus:border-emerald-500',
              textDark: 'text-emerald-950'
            },
            amber: { 
              hex: '#F59E0B', 
              ring: 'ring-amber-400/40', 
              borderSelected: 'border-amber-500', 
              hover: 'hover:border-amber-500', 
              text: 'text-amber-600', 
              textHover: 'hover:text-amber-500', 
              bgLight: 'bg-amber-50/70', 
              borderLight: 'border-amber-100', 
              focusBorder: 'focus:border-amber-500',
              textDark: 'text-amber-950'
            },
            rose: { 
              hex: '#EE466E', 
              ring: 'ring-rose-400/40', 
              borderSelected: 'border-rose-500', 
              hover: 'hover:border-rose-500', 
              text: 'text-rose-600', 
              textHover: 'hover:text-rose-500', 
              bgLight: 'bg-rose-50/75', 
              borderLight: 'border-rose-100', 
              focusBorder: 'focus:border-rose-500',
              textDark: 'text-rose-950'
            },
          };
          const colors = colorMap[themeColor] || colorMap.teal;

          return (
            <div
              key={node.id}
              className="absolute interactive-node-element"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '200px',
                height: '80px',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, node.person); // Trigger node context action
              }}
            >
              <div
                className={`w-full h-full rounded-xl border p-2.5 shadow-sm transition-all flex flex-col justify-between ${
                  isHighlighted
                    ? `bg-[#FFF0E4]/90 ${colors.borderSelected} ring-2 ${colors.ring} scale-105 shadow-md shadow-orange-100/40 text-slate-900`
                    : `bg-white border-slate-200 ${colors.hover} hover:shadow-md`
                }`}
                style={{ 
                  direction: isRtl ? 'rtl' : 'ltr',
                  borderTop: isRoot ? `4px solid ${colors.hex}` : undefined,
                  borderRight: !isRoot ? (isRtl ? `4px solid ${colors.hex}` : undefined) : undefined,
                  borderLeft: !isRoot ? (!isRtl ? `4px solid ${colors.hex}` : undefined) : undefined
                }}
              >
                {/* Header info (ID or dates) */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>#{node.id.substring(0, 4)}</span>
                  {node.person.birthYear && (
                    <span className="flex items-center gap-0.5 bg-slate-50 px-1 rounded">
                      <Clock size={8} />
                      {node.person.birthYear}
                    </span>
                  )}
                </div>

                {/* Inline Double Click Name Edit */}
                <div className="flex-1 my-0.5 flex items-center justify-between">
                  {editingNodeId === node.id ? (
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={() => handleInlineEditSubmit(node.person)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineEditSubmit(node.person);
                        if (e.key === 'Escape') setEditingNodeId(null);
                      }}
                      className={`w-full px-1 py-0.5 text-xs font-bold border ${colors.focusBorder} rounded focus:outline-none ${colors.bgLight}`}
                      autoFocus
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setEditingNodeId(node.id);
                        setEditNameValue(node.person.name);
                      }}
                      title={isRtl ? 'دوو کلیک بکە بۆ گۆڕینی ناوی' : 'Double click to edit'}
                      className={`text-xs font-extrabold text-slate-800 truncate flex-1 ${colors.textHover} block cursor-text text-right`}
                      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                    >
                      {node.person.name}
                    </span>
                  )}
                </div>

                {/* Bottom Node action controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onAddSon(node.id)}
                      title={isRtl ? 'کوڕەکەی زیادبکە' : 'Add Son'}
                      className={`p-1 ${colors.text} hover:bg-slate-100 rounded transition-colors cursor-pointer`}
                    >
                      <UserPlus size={12} />
                    </button>
                    <button
                      onClick={() => onEdit(node.person)}
                      title={isRtl ? 'دەستکاری زیاتر' : 'Full edit'}
                      className={`p-1 text-slate-400 ${colors.textHover} rounded transition-colors cursor-pointer hover:bg-slate-50`}
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={() => onDelete(node.id)}
                      title={isRtl ? 'سڕینەوەی ئەم ناوە' : 'Delete'}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {/* Toggle hierarchy dropdown */}
                  {hasChildren && (
                    <button
                      onClick={(e) => toggleNodeExpansion(node.id, e)}
                      className={`p-0.5 text-slate-400 ${colors.textHover} rounded cursor-pointer hover:bg-slate-50 flex items-center`}
                    >
                      {isExpanded ? (
                        <ChevronUp size={11} />
                      ) : (
                        <span className={`text-[9px] ${colors.bgLight} ${colors.text} px-1 font-bold rounded flex items-center gap-0.5`}>
                          <ChevronDown size={8} />
                          {members.filter((m) => m.parentId === node.id).length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Workspace controls (Adobe XD style) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-xl p-1.5" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <button
          onClick={handleZoomIn}
          title={isRtl ? 'نزیککردنەوە (Zoom In)' : 'Zoom In'}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          title={isRtl ? 'دوورکردنەوە (Zoom Out)' : 'Zoom Out'}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleFitToScreen}
          title={isRtl ? 'گونجاندن لەگەڵ شاشە' : 'Fit to Screen'}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer transition-colors"
        >
          <Maximize2 size={16} />
        </button>
        
        {/* Zoom Value indicator */}
        <div className="text-[10px] text-center font-bold font-mono text-slate-500 py-1 border-t border-slate-100">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      {/* Interactive Mini-map navigation overlay */}
      <div
        className="absolute bottom-4 right-4 z-10 border border-slate-200/80 bg-white/95 backdrop-blur shadow-xl rounded-xl p-2 cursor-pointer w-44"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Map size={11} className="text-[#24B1B1]" />
            {isRtl ? 'نەخشەی گشتی' : 'Minimap'}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {nodes.length} {isRtl ? 'ناو' : 'nodes'}
          </span>
        </div>

        {/* Interactive minimap container */}
        <div
          onClick={handleMiniMapClick}
          className="relative bg-[#24B1B1]/5 border border-[#24B1B1]/20 rounded-lg h-24 overflow-hidden"
        >
          {/* Visual miniature node dots */}
          {nodes.map((node) => {
            const miniatureX = node.x * miniMapBox.scale;
            const miniatureY = node.y * miniMapBox.scale;
            return (
              <div
                key={node.id}
                className="absolute w-1 h-1 bg-[#24B1B1]/75 rounded-full"
                style={{
                  left: `${Math.min(155, Math.max(2, miniatureX))}px`,
                  top: `${Math.min(90, Math.max(2, miniatureY))}px`,
                }}
              />
            );
          })}

          {/* Dynamic tracking view box */}
          <div
            className="absolute border border-red-500/80 bg-red-500/10 rounded transition-all pointer-events-none"
            style={{
              left: `${miniMapBox.x}px`,
              top: `${miniMapBox.y}px`,
              width: `${Math.max(16, miniMapBox.w)}px`,
              height: `${Math.max(12, miniMapBox.h)}px`,
            }}
          />
        </div>
      </div>

      {/* Floating Canvas Empty Note descriptor help */}
      {members.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-white/70 backdrop-blur-sm pointer-events-none">
          <div className="max-w-md space-y-3">
            <div className="w-14 h-14 bg-[#24B1B1]/10 text-[#24B1B1] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <User size={26} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">
              {isRtl ? 'هیچ ئەندامێک نییە!' : 'No family tree records yet'}
            </h4>
            <p className="text-sm text-slate-500">
              {isRtl 
                ? 'کلیک بکە لەسەر دوگمەی "کەسێکی نوێ زیادبکە" بۆ خستنەڕووی سەرقافڵەکە یان مامی کورد و دەستپێکردنی ڕێچکەی باوکانەت.'
                : 'Click "Add New Member" to create your starting patriarch root and expand your family trees.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
