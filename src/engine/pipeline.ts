import { invoke } from '@tauri-apps/api/core';
import type {
  CLINodeData,
  CloudAPINodeData,
  InputNodeData,
  KnotEdge,
  KnotNode,
  LocalLLMNodeData,
  MarkdownOutputNodeData,
} from '../types/canvas';
import { isTauriRuntime } from '../utils/runtime';

type UpdateNodeState = (id: string, data: Partial<KnotNode['data']>) => void;

export async function executeMultiAgentPipeline(
  nodes: KnotNode[],
  edges: KnotEdge[],
  updateNodeState: UpdateNodeState,
): Promise<void> {
  const executionOrder = getTopologicalOrder(nodes, edges);
  const nodeOutputs: Record<string, string> = {};

  for (const nodeId of executionOrder) {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) continue;

    const combinedInput = collectParentOutputs(nodeId, edges, nodeOutputs);

    updateNodeState(nodeId, { isExecuting: true, error: undefined });

    try {
      const resultText = await executeNode(node, combinedInput);
      nodeOutputs[nodeId] = resultText;
      updateNodeState(nodeId, {
        isExecuting: false,
        streamingOutput: resultText,
        content: node.type === 'markdown_output' ? resultText : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateNodeState(nodeId, { isExecuting: false, error: message });
      throw error;
    }
  }
}

function collectParentOutputs(
  nodeId: string,
  edges: KnotEdge[],
  nodeOutputs: Record<string, string>,
): string {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => nodeOutputs[edge.source] || '')
    .filter(Boolean)
    .join('\n\n---\n\n');
}

async function executeNode(node: KnotNode, combinedInput: string): Promise<string> {
  if (node.type === 'input') {
    return (node.data as InputNodeData).text;
  }

  if (node.type === 'cli_agent') {
    if (!isTauriRuntime()) {
      throw new Error('CLI agent execution requires the Tauri desktop runtime. Use npm run tauri dev.');
    }

    const data = node.data as CLINodeData;
    const processedArgs = data.args.length > 0
      ? data.args.map((arg) => arg.split('{{input}}').join(combinedInput))
      : ['{{input}}'.replace('{{input}}', combinedInput)];

    return invoke<string>('run_agent_cli', {
      nodeId: node.id,
      command: data.command || data.agentType,
      args: processedArgs,
      cwd: data.workingDir || null,
    });
  }

  if (node.type === 'local_llm') {
    return callLocalLLM(node.data as LocalLLMNodeData, combinedInput);
  }

  if (node.type === 'cloud_api') {
    return callCloudAPI(node.data as CloudAPINodeData, combinedInput);
  }

  if (node.type === 'markdown_output') {
    const data = node.data as MarkdownOutputNodeData;
    return combinedInput || data.content;
  }

  return combinedInput;
}

async function callLocalLLM(data: LocalLLMNodeData, input: string): Promise<string> {
  return [
    `# ${data.label}`,
    '',
    `Engine: ${data.engine}`,
    `Model: ${data.model}`,
    '',
    data.systemPrompt,
    '',
    input,
  ].join('\n');
}

async function callCloudAPI(data: CloudAPINodeData, input: string): Promise<string> {
  return [
    `# ${data.label}`,
    '',
    `Provider: ${data.provider}`,
    `Model: ${data.model}`,
    '',
    data.systemPrompt,
    '',
    input,
  ].join('\n');
}

export function getTopologicalOrder(nodes: KnotNode[], edges: KnotEdge[]): string[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  }

  const queue = nodes
    .filter((node) => (indegree.get(node.id) || 0) === 0)
    .map((node) => node.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    order.push(current);

    for (const next of adjacency.get(current) || []) {
      const nextIndegree = (indegree.get(next) || 0) - 1;
      indegree.set(next, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(next);
      }
    }
  }

  if (order.length !== nodes.length) {
    throw new Error('The canvas contains a cycle. KnotAgent can only execute DAG workflows.');
  }

  return order;
}
