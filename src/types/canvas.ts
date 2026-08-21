import type { Edge, Node } from '@xyflow/react';

export type NodeType = 'cli_agent' | 'local_llm' | 'cloud_api' | 'input' | 'markdown_output';

export type CLIAgentType = 'claude' | 'codex' | 'agy' | 'gh' | 'custom';

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  isExecuting?: boolean;
  error?: string;
}

export interface CLINodeData extends BaseNodeData {
  agentType: CLIAgentType;
  command: string;
  args: string[];
  workingDir?: string;
  streamingOutput: string;
}

export interface LocalLLMNodeData extends BaseNodeData {
  engine: 'ollama' | 'lmstudio' | 'vllm';
  baseUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  streamingOutput: string;
}

export interface CloudAPINodeData extends BaseNodeData {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey?: string;
  systemPrompt: string;
  streamingOutput: string;
}

export interface InputNodeData extends BaseNodeData {
  text: string;
  filePath?: string;
}

export interface MarkdownOutputNodeData extends BaseNodeData {
  content: string;
}

export type KnotNodeData =
  | CLINodeData
  | LocalLLMNodeData
  | CloudAPINodeData
  | InputNodeData
  | MarkdownOutputNodeData;

export type KnotNode = Node<KnotNodeData, NodeType>;

export interface CanvasSchema {
  version: string;
  nodes: Array<{
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface CLIStreamEvent {
  nodeId: string;
  chunk: string;
  stream: 'stdout' | 'stderr';
}

export type KnotEdge = Edge;
