import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import {
  Bot,
  Braces,
  Cloud,
  FileText,
  GitBranch,
  RotateCcw,
  Play,
  Plus,
  Server,
  SquareTerminal,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import { cliPresets, createCliNodeData, createCloudAPINodeData, createInputNodeData, createLocalLLMNodeData, createMarkdownOutputNodeData } from './data/nodePresets';
import { executeMultiAgentPipeline } from './engine/pipeline';
import { useCliStream } from './hooks/useCliStream';
import { AgentNode } from './nodes/AgentNode';
import { CloudNode } from './nodes/CloudNode';
import { InputNode } from './nodes/InputNode';
import { LocalLLMNode } from './nodes/LocalLLMNode';
import { MarkdownOutputNode } from './nodes/MarkdownOutputNode';
import { useCanvasStore } from './store/canvasStore';
import type { KnotNode, NodeType } from './types/canvas';

const nodeTypes = {
  cli_agent: AgentNode,
  local_llm: LocalLLMNode,
  cloud_api: CloudNode,
  input: InputNode,
  markdown_output: MarkdownOutputNode,
};

export function App() {
  useCliStream();

  const {
    nodes,
    edges,
    selectedNodeId,
    isRunning,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    newCanvas,
    loadExamplePipeline,
    updateNodeData,
    setSelectedNode,
    setIsRunning,
  } = useCanvasStore();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const onNodeClick: NodeMouseHandler<KnotNode> = (_, node) => {
    setSelectedNode(node.id);
  };

  async function runPipeline() {
    setIsRunning(true);
    try {
      await executeMultiAgentPipeline(nodes, edges, updateNodeData);
    } catch (error) {
      console.error('Pipeline execution failed', error);
    } finally {
      setIsRunning(false);
    }
  }

  function addPresetNode(type: NodeType) {
    if (type === 'input') addNode(type, createInputNodeData());
    if (type === 'local_llm') addNode(type, createLocalLLMNodeData());
    if (type === 'cloud_api') addNode(type, createCloudAPINodeData());
    if (type === 'markdown_output') addNode(type, createMarkdownOutputNodeData());
  }

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand">
          <div className="brand-mark">
            <GitBranch size={20} />
          </div>
          <div>
            <h1>KnotAgent</h1>
            <p>Universal AI agent canvas</p>
          </div>
        </div>

        <button className="run-button" disabled={isRunning} onClick={runPipeline}>
          <Play size={16} />
          {isRunning ? 'Running pipeline' : 'Run pipeline'}
        </button>

        <div className="canvas-actions">
          <button className="secondary-button" disabled={isRunning} onClick={newCanvas}>
            <Plus size={15} />
            New
          </button>
          <button className="secondary-button" disabled={isRunning} onClick={loadExamplePipeline}>
            <RotateCcw size={15} />
            Example
          </button>
        </div>

        <section className="palette-section">
          <h2>CLI Agents</h2>
          <div className="palette-list">
            {cliPresets.map((preset) => (
              <button
                key={preset.agentType}
                className="palette-item"
                onClick={() => addNode('cli_agent', createCliNodeData(preset))}
              >
                <SquareTerminal size={16} />
                <span>{preset.label}</span>
                <Plus size={14} />
              </button>
            ))}
          </div>
        </section>

        <section className="palette-section">
          <h2>Core Nodes</h2>
          <div className="palette-list">
            <PaletteButton icon={<FileText size={16} />} label="Input" onClick={() => addPresetNode('input')} />
            <PaletteButton icon={<Server size={16} />} label="Local LLM" onClick={() => addPresetNode('local_llm')} />
            <PaletteButton icon={<Cloud size={16} />} label="Cloud API" onClick={() => addPresetNode('cloud_api')} />
            <PaletteButton icon={<Braces size={16} />} label="Markdown Output" onClick={() => addPresetNode('markdown_output')} />
          </div>
        </section>
      </aside>

      <main className="canvas-region">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNode(undefined)}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </main>

      <Inspector selectedNode={selectedNode} />
    </div>
  );
}

function PaletteButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="palette-item" onClick={onClick}>
      {icon}
      <span>{label}</span>
      <Plus size={14} />
    </button>
  );
}

function Inspector({ selectedNode }: { selectedNode?: KnotNode }) {
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  if (!selectedNode) {
    return (
      <aside className="inspector">
        <div className="empty-state">
          <Bot size={22} />
          <h2>Select a node</h2>
          <p>Node settings and live output appear here.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <span className="node-kind">{selectedNode.type}</span>
        <h2>{selectedNode.data.label}</h2>
      </div>

      <button className="danger-button" onClick={() => deleteNode(selectedNode.id)}>
        <Trash2 size={15} />
        Delete node
      </button>

      <label className="field">
        <span>Label</span>
        <input
          value={selectedNode.data.label}
          onChange={(event) => updateNodeData(selectedNode.id, { label: event.target.value })}
        />
      </label>

      {selectedNode.type === 'input' && (
        <label className="field">
          <span>Input text</span>
          <textarea
            rows={10}
            value={String(selectedNode.data.text ?? '')}
            onChange={(event) => updateNodeData(selectedNode.id, { text: event.target.value })}
          />
        </label>
      )}

      {selectedNode.type === 'cli_agent' && (
        <>
          <label className="field">
            <span>Command</span>
            <input
              value={String(selectedNode.data.command ?? '')}
              onChange={(event) => updateNodeData(selectedNode.id, { command: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Arguments</span>
            <textarea
              rows={5}
              value={(selectedNode.data.args as string[]).join('\n')}
              onChange={(event) =>
                updateNodeData(selectedNode.id, {
                  args: event.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
            <small className="field-help">One argument per line. Use {'{{input}}'} for upstream output.</small>
          </label>
          <label className="field">
            <span>Working directory</span>
            <input
              value={String(selectedNode.data.workingDir ?? '')}
              onChange={(event) => updateNodeData(selectedNode.id, { workingDir: event.target.value })}
            />
          </label>
        </>
      )}

      {(selectedNode.type === 'local_llm' || selectedNode.type === 'cloud_api') && (
        <>
          <label className="field">
            <span>Model</span>
            <input
              value={String(selectedNode.data.model ?? '')}
              onChange={(event) => updateNodeData(selectedNode.id, { model: event.target.value })}
            />
          </label>
          <label className="field">
            <span>System prompt</span>
            <textarea
              rows={5}
              value={String(selectedNode.data.systemPrompt ?? '')}
              onChange={(event) => updateNodeData(selectedNode.id, { systemPrompt: event.target.value })}
            />
          </label>
        </>
      )}

      {selectedNode.data.error && <div className="error-box">{selectedNode.data.error}</div>}

      <div className="output-panel">
        <div className="output-title">Live output</div>
        <pre>{String(selectedNode.data.streamingOutput ?? selectedNode.data.content ?? '')}</pre>
      </div>
    </aside>
  );
}
