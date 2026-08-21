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
  OpenWorkflowTab,
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
  openTabs: OpenWorkflowTab[];
  activeTabId: string;
  nodes: KnotNode[];
  edges: KnotEdge[];
  selectedNodeId?: string;
  isRunning: boolean;
  onNodesChange: (changes: NodeChange<KnotNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<KnotEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, data: KnotNodeData, position?: { x: number; y: number }) => void;
  addConnectedNode: (sourceId: string, type: NodeType, data: KnotNodeData, position?: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<KnotNodeData>) => void;
  appendNodeOutput: (id: string, chunk: string) => void;
  deleteNode: (id: string) => void;
  newCanvas: () => void;
  saveWorkflow: () => void;
  openWorkflow: (id: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
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
    nodes: [
      {
        id: `input-${crypto.randomUUID()}`,
        type: 'input',
        position: { x: 80, y: 140 },
        data: createInputNodeData(),
      },
    ],
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

function schemaFromStateFields(
  workflowName: string,
  workflowContext: WorkflowContext,
  nodes: KnotNode[],
  edges: KnotEdge[],
): CanvasSchema {
  return {
    version: '0.1.0',
    name: workflowName,
    context: workflowContext,
    nodes,
    edges,
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

function syncActiveTab(
  state: CanvasState,
  update: Partial<Pick<CanvasState, 'workflowId' | 'workflowName' | 'workflowContext' | 'nodes' | 'edges'>>,
) {
  const workflowId = update.workflowId ?? state.workflowId;
  const workflowName = update.workflowName ?? state.workflowName;
  const workflowContext = update.workflowContext ?? state.workflowContext;
  const nodes = update.nodes ?? state.nodes;
  const edges = update.edges ?? state.edges;
  const schema = schemaFromStateFields(workflowName, workflowContext, nodes, edges);

  return {
    ...update,
    openTabs: state.openTabs.map((tab) =>
      tab.tabId === state.activeTabId
        ? {
            ...tab,
            workflowId,
            name: workflowName,
            schema,
          }
        : tab,
    ),
  };
}

function createTab(schema: CanvasSchema, workflowId?: string): OpenWorkflowTab {
  return {
    tabId: `tab-${crypto.randomUUID()}`,
    workflowId,
    name: schema.name || 'Untitled Workflow',
    schema,
  };
}

const initialWorkflows = readSavedWorkflows();
const initialSchema = initialWorkflows[0]?.schema ?? createEmptySchema();
const initialTab = createTab(initialSchema, initialWorkflows[0]?.id);

export const useCanvasStore = create<CanvasState>((set) => ({
  workflowId: initialWorkflows[0]?.id,
  workflowName: initialSchema.name || 'Untitled Workflow',
  workflowContext: initialSchema.context || createDefaultContext(),
  workflows: initialWorkflows,
  openTabs: [initialTab],
  activeTabId: initialTab.tabId,
  nodes: initialSchema.nodes as KnotNode[],
  edges: initialSchema.edges,
  selectedNodeId: undefined,
  isRunning: false,
  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      return syncActiveTab(state, { nodes });
    });
  },
  onEdgesChange: (changes) => {
    set((state) => {
      const edges = applyEdgeChanges(changes, state.edges);
      return syncActiveTab(state, { edges });
    });
  },
  onConnect: (connection) => {
    set((state) => {
      const edges = addEdge({ ...connection, animated: true }, state.edges);
      return syncActiveTab(state, { edges });
    });
  },
  addNode: (type, data, position) => {
    set((state) => {
      const nodes: KnotNode[] = [
        ...state.nodes,
        {
          id: `${type}-${crypto.randomUUID()}`,
          type,
          position: position ?? {
            x: 160 + state.nodes.length * 36,
            y: 160 + state.nodes.length * 24,
          },
          data,
        },
      ];
      return syncActiveTab(state, { nodes });
    });
  },
  addConnectedNode: (sourceId, type, data, position) => {
    set((state) => {
      const sourceNode = state.nodes.find((node) => node.id === sourceId);
      if (!sourceNode) return {};

      const nodeId = `${type}-${crypto.randomUUID()}`;
      const siblingCount = state.edges.filter((edge) => edge.source === sourceId).length;
      const targetNode: KnotNode = {
        id: nodeId,
        type,
        position: position ?? {
          x: sourceNode.position.x + 320,
          y: sourceNode.position.y + siblingCount * 150,
        },
        data,
      };
      const nodes = [...state.nodes, targetNode];
      const edges = addEdge(
        {
          id: `${sourceId}-${nodeId}`,
          source: sourceId,
          target: nodeId,
          animated: true,
        },
        state.edges,
      );

      return {
        ...syncActiveTab(state, { nodes, edges }),
        selectedNodeId: nodeId,
      };
    });
  },
  updateNodeData: (id, data) => {
    set((state) => {
      const nodes = state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, ...data },
            }
          : node,
      );
      return syncActiveTab(state, { nodes });
    });
  },
  appendNodeOutput: (id, chunk) => {
    set((state) => {
      const nodes = state.nodes.map((node) => {
        if (node.id !== id) return node;
        const current = String(node.data.streamingOutput ?? '');
        return {
          ...node,
          data: {
            ...node.data,
            streamingOutput: `${current}${chunk}\n`,
          },
        };
      });
      return syncActiveTab(state, { nodes });
    });
  },
  deleteNode: (id) => {
    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== id);
      const edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
      return {
        ...syncActiveTab(state, { nodes, edges }),
        selectedNodeId: state.selectedNodeId === id ? undefined : state.selectedNodeId,
      };
    });
  },
  newCanvas: () => {
    set((state) => {
      const schema = createEmptySchema();
      const tab = createTab(schema);
      return {
        workflowId: undefined,
        workflowName: schema.name || 'Untitled Workflow',
        workflowContext: schema.context || createDefaultContext(),
        openTabs: [...state.openTabs, tab],
        activeTabId: tab.tabId,
        nodes: schema.nodes as KnotNode[],
        edges: schema.edges,
        selectedNodeId: undefined,
        isRunning: false,
      };
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
      return {
        ...syncActiveTab(state, { workflowId: id, workflowName: name }),
        workflows,
      };
    });
  },
  openWorkflow: (id) => {
    set((state) => {
      const workflow = state.workflows.find((candidate) => candidate.id === id);
      if (!workflow) return {};
      const existing = state.openTabs.find((tab) => tab.workflowId === id);
      if (existing) {
        return {
          workflowId: existing.workflowId,
          activeTabId: existing.tabId,
          ...applySchema(existing.schema),
        };
      }
      const tab = createTab(workflow.schema, workflow.id);
      return {
        workflowId: workflow.id,
        openTabs: [...state.openTabs, tab],
        activeTabId: tab.tabId,
        ...applySchema(workflow.schema),
      };
    });
  },
  switchTab: (tabId) => {
    set((state) => {
      const tab = state.openTabs.find((candidate) => candidate.tabId === tabId);
      if (!tab) return {};
      return {
        workflowId: tab.workflowId,
        activeTabId: tab.tabId,
        ...applySchema(tab.schema),
      };
    });
  },
  closeTab: (tabId) => {
    set((state) => {
      if (state.openTabs.length <= 1) return {};
      const openTabs = state.openTabs.filter((tab) => tab.tabId !== tabId);
      if (state.activeTabId !== tabId) return { openTabs };

      const nextTab = openTabs[openTabs.length - 1];
      return {
        openTabs,
        activeTabId: nextTab.tabId,
        workflowId: nextTab.workflowId,
        ...applySchema(nextTab.schema),
      };
    });
  },
  loadWorkflow: (id) => {
    set((state) => {
      const workflow = state.workflows.find((candidate) => candidate.id === id);
      if (!workflow) return {};
      return {
        workflowId: workflow.id,
        activeTabId: state.openTabs.find((tab) => tab.workflowId === workflow.id)?.tabId ?? state.activeTabId,
        ...applySchema(workflow.schema),
      };
    });
  },
  deleteWorkflow: (id) => {
    set((state) => {
      const workflows = state.workflows.filter((workflow) => workflow.id !== id);
      writeSavedWorkflows(workflows);
      let openTabs = state.openTabs.filter((tab) => tab.workflowId !== id);

      if (openTabs.length === 0) {
        openTabs = [createTab(createEmptySchema())];
      }

      if (state.workflowId !== id) {
        return { workflows, openTabs };
      }

      const nextTab = openTabs[openTabs.length - 1];
      return {
        workflows,
        openTabs,
        activeTabId: nextTab.tabId,
        workflowId: nextTab.workflowId,
        ...applySchema(nextTab.schema),
      };
    });
  },
  updateWorkflowName: (workflowName) => {
    set((state) => syncActiveTab(state, { workflowName }));
  },
  updateWorkflowContext: (context) => {
    set((state) => {
      const workflowContext = { ...state.workflowContext, ...context };
      return syncActiveTab(state, { workflowContext });
    });
  },
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  setIsRunning: (isRunning) => set({ isRunning }),
}));

export function buildLocalLLMNode() {
  return createLocalLLMNodeData();
}
