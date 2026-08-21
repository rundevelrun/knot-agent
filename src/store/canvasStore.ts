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
import type {
  CanvasSchema,
  KnotEdge,
  KnotNode,
  KnotNodeData,
  NodeType,
  SavedWorkflow,
  WorkflowContext,
} from '../types/canvas';

const STORAGE_KEY = 'knotagent.workflows.v1';
const SEED_KEY = 'knotagent.example.seeded.v1';

interface CanvasState {
  workflowId?: string;
  workflowName: string;
  workflowContext: WorkflowContext;
  workflows: SavedWorkflow[];
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
  deleteNode: (id: string) => void;
  newCanvas: () => void;
  saveWorkflow: () => void;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  updateWorkflowName: (name: string) => void;
  updateWorkflowContext: (context: Partial<WorkflowContext>) => void;
  setSelectedNode: (id?: string) => void;
  setIsRunning: (isRunning: boolean) => void;
}

function createExampleNodes(): KnotNode[] {
  return [
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
}

function createExampleEdges(): KnotEdge[] {
  return [
    { id: 'input-1-cli-agy-1', source: 'input-1', target: 'cli-agy-1' },
    { id: 'cli-agy-1-cli-codex-1', source: 'cli-agy-1', target: 'cli-codex-1' },
    { id: 'cli-codex-1-output-1', source: 'cli-codex-1', target: 'output-1' },
  ];
}

function createDefaultContext(): WorkflowContext {
  return {
    goal: 'Coordinate local CLI agents to solve the feature request.',
    constraints: 'Keep outputs concise. Preserve useful implementation details. Pass only relevant results downstream.',
  };
}

function createExampleSchema(): CanvasSchema {
  return {
    version: '0.1.0',
    name: 'Example: Antigravity to Codex',
    context: createDefaultContext(),
    nodes: createExampleNodes(),
    edges: createExampleEdges(),
  };
}

function createEmptySchema(): CanvasSchema {
  return {
    version: '0.1.0',
    name: 'Untitled Workflow',
    context: createDefaultContext(),
    nodes: [],
    edges: [],
  };
}

function readSavedWorkflows(): SavedWorkflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const workflows = raw ? (JSON.parse(raw) as SavedWorkflow[]) : [];
    return seedExampleWorkflow(workflows);
  } catch {
    return seedExampleWorkflow([]);
  }
}

function writeSavedWorkflows(workflows: SavedWorkflow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

function seedExampleWorkflow(workflows: SavedWorkflow[]): SavedWorkflow[] {
  if (localStorage.getItem(SEED_KEY)) return workflows;

  const example: SavedWorkflow = {
    id: 'example-antigravity-codex',
    name: 'Example: Antigravity to Codex',
    updatedAt: new Date().toISOString(),
    schema: createExampleSchema(),
  };

  const seeded = workflows.some((workflow) => workflow.id === example.id)
    ? workflows
    : [example, ...workflows];
  writeSavedWorkflows(seeded);
  localStorage.setItem(SEED_KEY, '1');
  return seeded;
}

function schemaFromState(state: CanvasState): CanvasSchema {
  return {
    version: '0.1.0',
    name: state.workflowName,
    context: state.workflowContext,
    nodes: state.nodes,
    edges: state.edges,
  };
}

function applySchema(schema: CanvasSchema) {
  return {
    workflowName: schema.name || 'Untitled Workflow',
    workflowContext: schema.context || createDefaultContext(),
    nodes: schema.nodes as KnotNode[],
    edges: schema.edges,
    selectedNodeId: undefined,
    isRunning: false,
  };
}

const initialWorkflows = readSavedWorkflows();
const initialSchema = initialWorkflows[0]?.schema ?? createEmptySchema();

export const useCanvasStore = create<CanvasState>((set) => ({
  workflowId: initialWorkflows[0]?.id,
  workflowName: initialSchema.name || 'Untitled Workflow',
  workflowContext: initialSchema.context || createDefaultContext(),
  workflows: initialWorkflows,
  nodes: initialSchema.nodes as KnotNode[],
  edges: initialSchema.edges,
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
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? undefined : state.selectedNodeId,
    }));
  },
  newCanvas: () => {
    set({
      workflowId: undefined,
      workflowName: 'Untitled Workflow',
      workflowContext: createDefaultContext(),
      nodes: [],
      edges: [],
      selectedNodeId: undefined,
      isRunning: false,
    });
  },
  saveWorkflow: () => {
    set((state) => {
      const id = state.workflowId || `workflow-${crypto.randomUUID()}`;
      const name = state.workflowName.trim() || 'Untitled Workflow';
      const saved: SavedWorkflow = {
        id,
        name,
        updatedAt: new Date().toISOString(),
        schema: {
          ...schemaFromState({ ...state, workflowName: name }),
          name,
        },
      };
      const workflows = [
        saved,
        ...state.workflows.filter((workflow) => workflow.id !== id),
      ];
      writeSavedWorkflows(workflows);
      return { workflowId: id, workflowName: name, workflows };
    });
  },
  loadWorkflow: (id) => {
    set((state) => {
      const workflow = state.workflows.find((candidate) => candidate.id === id);
      if (!workflow) return {};
      return {
        workflowId: workflow.id,
        ...applySchema(workflow.schema),
      };
    });
  },
  deleteWorkflow: (id) => {
    set((state) => {
      const workflows = state.workflows.filter((workflow) => workflow.id !== id);
      writeSavedWorkflows(workflows);
      return {
        workflows,
        ...(state.workflowId === id
          ? { workflowId: undefined, ...applySchema(createEmptySchema()) }
          : {}),
      };
    });
  },
  updateWorkflowName: (workflowName) => set({ workflowName }),
  updateWorkflowContext: (context) => {
    set((state) => ({
      workflowContext: { ...state.workflowContext, ...context },
    }));
  },
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  setIsRunning: (isRunning) => set({ isRunning }),
}));

export function buildLocalLLMNode() {
  return createLocalLLMNodeData();
}
