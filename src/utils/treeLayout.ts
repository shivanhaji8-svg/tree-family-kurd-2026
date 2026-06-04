import { Person } from '../types';

export interface PositionedNode {
  id: string;
  person: Person;
  x: number; // pixel position of node center
  y: number; // pixel position of node top
}

export interface ConnectorLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 120;

export function computeTreeLayout(
  members: Person[],
  expandedNodes: Set<string>
): { nodes: PositionedNode[]; connectors: ConnectorLine[]; width: number; height: number } {
  if (members.length === 0) {
    return { nodes: [], connectors: [], width: 0, height: 0 };
  }

  // Build parent-child relationships and map by ID
  const personMap = new Map<string, Person>();
  const childrenMap = new Map<string, Person[]>();
  
  for (const person of members) {
    personMap.set(person.id, person);
    if (person.parentId) {
      const parentSons = childrenMap.get(person.parentId) || [];
      parentSons.push(person);
      childrenMap.set(person.parentId, parentSons);
    }
  }

  // Find all roots (members with no parents, or parents not present in the current database)
  const roots = members.filter(
    (m) => !m.parentId || !personMap.has(m.parentId)
  );

  const nodePositions = new Map<string, { x: number; y: number }>();
  
  // Track the rightmost coordinate occupied at each generation level
  // to prevent nodes in different branches from overlapping
  const nextXAtDepth: Record<number, number> = {};

  // For a sub-tree layout: recursively place children, then center the parent
  function layoutSubtree(personId: string, depth: number) {
    const isExpanded = expandedNodes.has(personId);
    const sons = isExpanded ? (childrenMap.get(personId) || []) : [];
    
    const y = depth * (NODE_HEIGHT + VERTICAL_GAP) + 50;
    
    if (sons.length === 0) {
      // Leaf node: place at the next available X position at this level
      const currentNextX = nextXAtDepth[depth] || 50;
      const x = currentNextX;
      nodePositions.set(personId, { x, y });
      nextXAtDepth[depth] = x + NODE_WIDTH + HORIZONTAL_GAP;
      return x;
    }

    // layout all sub-elements first (Bottom-UP layout)
    const childXPositions: number[] = [];
    for (const son of sons) {
      const childX = layoutSubtree(son.id, depth + 1);
      childXPositions.push(childX);
    }

    // Centered position under children
    let xTarget = (childXPositions[0] + childXPositions[childXPositions.length - 1]) / 2;
    
    // Check if the parent coordinate conflicts with existing nodes on its own depth level
    const currentNextX = nextXAtDepth[depth] || 50;
    
    if (xTarget < currentNextX) {
      // If there is an overlap, we must shift this tree to the right
      const shiftAmount = currentNextX - xTarget;
      
      // Shift this node and recursively shift all its placed descendants
      shiftSubtree(personId, shiftAmount, depth);
      xTarget = currentNextX;
    }

    nodePositions.set(personId, { x: xTarget, y });
    nextXAtDepth[depth] = xTarget + NODE_WIDTH + HORIZONTAL_GAP;
    return xTarget;
  }

  // Recursive shifting utility
  function shiftSubtree(personId: string, shift: number, startDepth: number) {
    const pos = nodePositions.get(personId);
    if (pos) {
      nodePositions.set(personId, { x: pos.x + shift, y: pos.y });
    }
    
    // Sync the nextXAtDepth tracking metrics
    const currentNext = nextXAtDepth[startDepth] || 50;
    if (pos && pos.x + shift + NODE_WIDTH + HORIZONTAL_GAP > currentNext) {
      nextXAtDepth[startDepth] = pos.x + shift + NODE_WIDTH + HORIZONTAL_GAP;
    }

    const isExpanded = expandedNodes.has(personId);
    const sons = isExpanded ? (childrenMap.get(personId) || []) : [];
    for (const son of sons) {
      shiftSubtree(son.id, shift, startDepth + 1);
    }
  }

  // Lay out each root subtree side by side
  for (const root of roots) {
    layoutSubtree(root.id, 0);
  }

  // Convert map to layout lists and connectors
  const positionedNodes: PositionedNode[] = [];
  const connectors: ConnectorLine[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const person of members) {
    const pos = nodePositions.get(person.id);
    if (!pos) continue;

    positionedNodes.push({
      id: person.id,
      person,
      x: pos.x,
      y: pos.y,
    });

    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT);

    // Build connections with expanded children only
    if (expandedNodes.has(person.id)) {
      const sons = childrenMap.get(person.id) || [];
      for (const son of sons) {
        const sonPos = nodePositions.get(son.id);
        if (sonPos) {
          // Draw orthogonal connection line:
          // Center-bottom of parent -> midway vertical -> Center-top of child
          const pCenterX = pos.x + NODE_WIDTH / 2;
          const pBottomY = pos.y + NODE_HEIGHT;
          const cCenterX = sonPos.x + NODE_WIDTH / 2;
          const cTopY = sonPos.y;
          
          connectors.push({
            id: `line-${person.id}-${son.id}`,
            fromX: pCenterX,
            fromY: pBottomY,
            toX: cCenterX,
            toY: cTopY,
          });
        }
      }
    }
  }

  const canvasWidth = maxX > minX ? maxX + 200 : 800;
  const canvasHeight = maxY > minY ? maxY + 200 : 600;

  return {
    nodes: positionedNodes,
    connectors,
    width: canvasWidth,
    height: canvasHeight,
  };
}
