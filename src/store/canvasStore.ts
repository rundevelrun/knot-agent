import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';
import {
  cliPresets,
  createCliNodeData,
  createInputNodeData,
  createLocalLLMNodeData,
  createMarkdownOutputNodeData,
} from '../data/nodePresets';
import type { KnotEdge, KnotNode, KnotNodeData, NodeType } from '../types/canvas';

interface CanvasState {
  nodes: KnotNode[];
  edges: KnotEdge[];
  selectedNodeId?: string;
  isRunning: boolean;
  onNodesChange: (changes: NodeChange<KnotNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<KnotEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, data: KnotNodeData) => void;
  updateNodeData: (id: string, data: Partial<KnotNodeData>) => void;
  appendNodeOutput: (id: string, chunk: string) => void;
  setSelectedNode: (id?: string) => void;
  setIsRunning: (isRunning: boolean) => void;
}

const initialNodes: KnotNode[] = [
  {
    id: 'input-1',
    type: 'input',
    position: { x: 40, y: 120 },
    data: createInputNodeData(),
  },
  {
    id: 'cli-agy-1',
    type: 'cli_agent',
    position: { x: 360, y: 40 },
    data: createCliNodeData(cliPresets[0]),
  },
  {
    id: 'cli-codex-1',
    type: 'cli_agent',
    position: { x: 680, y: 120 },
    data: createCliNodeData(cliPresets[2]),
  },
  {
    id: 'output-1',
    type: 'markdown_output',
    position: { x: 1000, y: 120 },
    data: createMarkdownOutputNodeData(),
  },
];

const initialEdges: KnotEdge[] = [
  { id: 'input-1-cli-agy-1', source: 'input-1', target: 'cli-agy-1' },
  { id: 'cli-agy-1-cli-codex-1', source: 'cli-agy-1', target: 'cli-codex-1' },
  { id: 'cli-codex-1-output-1', source: 'cli-codex-1', target: 'output-1' },
];

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: undefined,
  isRunning: false,
  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
  },
  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
  },
  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, animated: true }, state.edges),
    }));
  },
  addNode: (type, data) => {
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: `${type}-${crypto.randomUUID()}`,
          type,
          position: {
            x: 160 + state.nodes.length * 36,
            y: 160 + state.nodes.length * 24,
          },
          data,
        },
      ],
    }));
  },
  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, ...data },
            }
          : node,
      ),
    }));
  },
  appendNodeOutput: (id, chunk) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        const current = String(node.data.streamingOutput ?? '');
        return {
          ...node,
          data: {
            ...node.data,
            streamingOutput: `${current}${chunk}\n`,
          },
        };
      }),
    }));
  },
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  setIsRunning: (isRunning) => set({ isRunning }),
}));

export function buildLocalLLMNode() {
  return createLocalLLMNodeData();
}
