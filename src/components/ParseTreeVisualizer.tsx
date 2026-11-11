/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { GitFork, Maximize2, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { ParseTreeNode, RecentReduction } from '../compiler/types';

interface ParseTreeVisualizerProps {
  forest: ParseTreeNode[];
  recentReduction: RecentReduction | null;
  isAccepted: boolean;
}

interface LayoutNode {
  id: string;
  label: string;
  value?: string;
  x: number;
  y: number;
  children: LayoutNode[];
}

export const ParseTreeVisualizer: React.FC<ParseTreeVisualizerProps> = ({
  forest,
  recentReduction,
  isAccepted,
}) => {
  const [zoom, setZoom] = useState(1);

  // Compute tree layout from parseForest array
  const { roots, nodeMap, width, height } = useMemo(() => {
    if (!forest || forest.length === 0) {
      return { roots: [], nodeMap: new Map(), width: 600, height: 350 };
    }

    const map = new Map<string, ParseTreeNode>();
    forest.forEach((n) => map.set(n.id, n));

    // Find all nodes that are referenced as a child
    const childSet = new Set<string>();
    forest.forEach((n) => {
      n.children.forEach((cId) => childSet.add(cId));
    });

    // Root nodes of the current forest are those not referenced as a child
    const forestRoots = forest.filter((n) => !childSet.has(n.id));

    // Calculate maximum depth for dynamic height
    let maxDepth = 0;
    const computeDepth = (id: string, depth = 0): number => {
      maxDepth = Math.max(maxDepth, depth);
      const node = map.get(id);
      if (!node || node.children.length === 0) return depth;
      let m = depth;
      node.children.forEach((c) => {
        m = Math.max(m, computeDepth(c, depth + 1));
      });
      return m;
    };

    forestRoots.forEach((r) => computeDepth(r.id, 0));

    // Layout nodes recursively
    let currentLeafX = 40;
    const leafSpacing = 65;
    const levelHeight = 65;
    const layoutMap = new Map<string, LayoutNode>();

    const layoutSubtree = (nodeId: string, depth: number): LayoutNode => {
      const node = map.get(nodeId)!;
      if (!node.children || node.children.length === 0) {
        const x = currentLeafX;
        currentLeafX += leafSpacing;
        // Invert Y so root is at top and leaves at bottom
        // or top-down: root depth 0 at y=50, leaves at y = 50 + depth * levelHeight
        const lNode: LayoutNode = {
          id: node.id,
          label: node.label,
          value: node.value,
          x,
          y: 50 + depth * levelHeight,
          children: [],
        };
        layoutMap.set(node.id, lNode);
        return lNode;
      }

      const childLayouts = node.children.map((cId) =>
        layoutSubtree(cId, depth + 1),
      );

      // Parent x is the midpoint of children
      const firstX = childLayouts[0].x;
      const lastX = childLayouts[childLayouts.length - 1].x;
      const x = (firstX + lastX) / 2;

      const lNode: LayoutNode = {
        id: node.id,
        label: node.label,
        value: node.value,
        x,
        y: 50 + depth * levelHeight,
        children: childLayouts,
      };
      layoutMap.set(node.id, lNode);
      return lNode;
    };

    const rootLayouts = forestRoots.map((r) => {
      const res = layoutSubtree(r.id, 0);
      currentLeafX += 30; // separation between separate forest trees
      return res;
    });

    const computedWidth = Math.max(640, currentLeafX + 40);
    const computedHeight = Math.max(340, (maxDepth + 1) * levelHeight + 100);

    return {
      roots: rootLayouts,
      nodeMap: layoutMap,
      width: computedWidth,
      height: computedHeight,
    };
  }, [forest]);

  // Collect all edges from parents to children
  const edges = useMemo(() => {
    const list: { from: LayoutNode; to: LayoutNode; isRecent: boolean }[] = [];
    nodeMap.forEach((node) => {
      node.children.forEach((child: LayoutNode) => {
        const isRecent =
          recentReduction?.createdNodeId === node.id &&
          recentReduction?.poppedNodeIds.includes(child.id);
        list.push({ from: node, to: child, isRecent: !!isRecent });
      });
    });
    return list;
  }, [nodeMap, recentReduction]);

  const getNodeColor = (label: string, isRecentCreated: boolean) => {
    if (isRecentCreated) {
      return {
        bg: '#FCE7F3', // Light pink
        border: '#EC4899',
        text: '#BE185D',
        ring: 'ring-4 ring-pink-200',
      };
    }
    switch (label) {
      case 'E':
        return { bg: '#E0F2FE', border: '#0284C7', text: '#0369A1' };
      case 'T':
        return { bg: '#E0F2FE', border: '#0ea5e9', text: '#0284c7' };
      case 'F':
        return { bg: '#FCE7F3', border: '#F472B6', text: '#BE185D' };
      case 'id':
        return { bg: '#FAF7F2', border: '#D8CEBE', text: '#44403C' };
      default:
        return { bg: '#F5EFEB', border: '#D8CEBE', text: '#57534E' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 flex flex-col h-full shadow-xs">
      {/* Header with Title and Zoom Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-stone-800">
                Parse Tree / Forest
              </h3>
              {isAccepted && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Complete AST
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Incremental Bottom-Up Reduction Tree
            </p>
          </div>
        </div>

        {/* Zoom & Viewport controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-stone-500 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors ml-1"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="flex-1 overflow-auto p-2 bg-[#FAF7F2] rounded-xl border border-[#E8DFD3] relative min-h-[300px]">
        {forest.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
            <Sparkles className="w-8 h-8 text-pink-300 mb-2" />
            <p className="text-sm font-semibold text-stone-600">
              No Tree Nodes Yet
            </p>
            <p className="text-xs max-w-xs mt-1 text-stone-500">
              Advance the parser trace (SHIFT or REDUCE) to synthesize leaf
              terminals and parent non-terminal nodes.
            </p>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
              minWidth: `${width}px`,
              minHeight: `${height}px`,
            }}
          >
            <svg
              width={width}
              height={height}
              className="overflow-visible select-none"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#D8CEBE" />
                </marker>
              </defs>

              {/* Render edges */}
              {edges.map((edge, i) => (
                <line
                  key={`edge-${i}`}
                  x1={edge.from.x}
                  y1={edge.from.y + 14}
                  x2={edge.to.x}
                  y2={edge.to.y - 14}
                  stroke={edge.isRecent ? '#F472B6' : '#C8BDAB'}
                  strokeWidth={edge.isRecent ? 2.5 : 1.5}
                  strokeDasharray={edge.isRecent ? '4,2' : undefined}
                  className="transition-all duration-200"
                />
              ))}

              {/* Render nodes */}
              {Array.from(nodeMap.values()).map((node) => {
                const isRecentCreated =
                  recentReduction?.createdNodeId === node.id;
                const isPoppedChild =
                  recentReduction?.poppedNodeIds.includes(node.id);
                const colors = getNodeColor(node.label, isRecentCreated);
                const isLeaf = !node.children || node.children.length === 0;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer transition-transform duration-200"
                  >
                    {/* Pulsing ring for freshly reduced parent */}
                    {isRecentCreated && (
                      <circle
                        r={22}
                        fill="none"
                        stroke="#F472B6"
                        strokeWidth="2"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Node Shape */}
                    {isLeaf ? (
                      <rect
                        x={-18}
                        y={-14}
                        width={36}
                        height={28}
                        rx={6}
                        fill={colors.bg}
                        stroke={isPoppedChild ? '#EC4899' : colors.border}
                        strokeWidth={isPoppedChild || isRecentCreated ? 2 : 1.5}
                      />
                    ) : (
                      <circle
                        r={16}
                        fill={colors.bg}
                        stroke={colors.border}
                        strokeWidth={isRecentCreated ? 2.5 : 1.5}
                      />
                    )}

                    {/* Node Symbol Label */}
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize="12"
                      fontWeight="bold"
                      fill={colors.text}
                      fontFamily="monospace"
                    >
                      {node.label}
                    </text>

                    {/* If leaf has a distinct user-entered value (e.g., number 3 or variable a), render value under node */}
                    {isLeaf && node.value && node.value !== node.label && (
                      <text
                        textAnchor="middle"
                        y={24}
                        fontSize="9"
                        fontWeight="600"
                        fill="#78716C"
                        fontFamily="monospace"
                      >
                        "{node.value}"
                      </text>
                    )}

                    {/* Node ID tooltip tag */}
                    <text
                      textAnchor="middle"
                      y={-18}
                      fontSize="8"
                      fill="#A8A29E"
                      fontFamily="monospace"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex items-center justify-between text-[11px] pt-2 text-stone-500 font-medium flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-200 border border-sky-400" />
            Expression (E, T)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-200 border border-pink-400" />
            Factor (F)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-stone-100 border border-stone-300" />
            Terminals / Leaves
          </span>
        </div>
        {recentReduction && (
          <span className="text-pink-600 font-mono text-[10px] bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
            ★ {recentReduction.rule}
          </span>
        )}
      </div>
    </div>
  );
};
