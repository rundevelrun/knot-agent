import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import {
  Braces,
  Cloud,
  FolderOpen,
  FileText,
  GitBranch,
  Play,
  Plus,
  Save,
  Server,
  Settings,
  SquareTerminal,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cliPresets, createCliNodeData, createCloudAPINodeData, createInputNodeData, createLocalLLMNodeData, createMarkdownOutputNodeData } from './data/nodePresets';
import { rolePresets } from './data/rolePresets';
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

type InspectorMode = 'workflow' | 'node' | undefined;

export function App() {
  useCliStream();
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>();
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const {
    workflowId,
    nodes,
    edges,
    workflowName,
    workflowContext,
    workflows,
    openTabs,
    activeTabId,
    selectedNodeId,
    isRunning,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    newCanvas,
    saveWorkflow,
    openWorkflow,
    switchTab,
    closeTab,
    deleteWorkflow,
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
    setInspectorMode('node');
  };

  async function runPipeline() {
    setIsRunning(true);
    try {
      await executeMultiAgentPipeline(nodes, edges, workflowContext, updateNodeData);
    } catch (error) {
      console.error('Pipeline execution failed', error);
    } finally {
      setIsRunning(false);
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) return;

      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveWorkflow();
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        if (!isRunning) {
          newCanvas();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRunning, newCanvas, saveWorkflow]);

  function addPresetNode(type: NodeType) {
    if (type === 'input') addNode(type, createInputNodeData());
    if (type === 'local_llm') addNode(type, createLocalLLMNodeData());
    if (type === 'cloud_api') addNode(type, createCloudAPINodeData());
    if (type === 'markdown_output') addNode(type, createMarkdownOutputNodeData());
    setAddMenuOpen(false);
  }

  return (
    <div className={`app-shell ${inspectorMode ? '' : 'inspector-closed'}`}>
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

        <section className="tree-section">
          <div className="tree-header">
            <h2>Workflows</h2>
            <button className="tree-action" aria-label="New workflow" disabled={isRunning} onClick={newCanvas}>
              <Plus size={14} />
            </button>
          </div>
          <div className="workflow-list">
            {workflows.length === 0 && <div className="saved-empty">No saved workflows</div>}
            {workflows.map((workflow) => (
              <div className="tree-workflow" key={workflow.id}>
                <div className="workflow-item">
                  <button
                    className={`workflow-load ${workflow.id === workflowId ? 'active' : ''}`}
                    onClick={() => {
                      openWorkflow(workflow.id);
                      setInspectorMode(undefined);
                    }}
                  >
                    <FolderOpen size={15} />
                    <span>{workflow.name}</span>
                  </button>
                  <button className="icon-button" aria-label={`Delete ${workflow.name}`} onClick={() => deleteWorkflow(workflow.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                {workflow.id === workflowId && (
                  <div className="tree-children">
                    <button className="tree-child" onClick={() => setInspectorMode('workflow')}>
                      <Settings size={13} />
                      Overview
                    </button>
                    <button className="tree-child" onClick={() => setInspectorMode(undefined)}>
                      <GitBranch size={13} />
                      Canvas
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="canvas-region">
        <div className="tab-strip">
          <button className="new-tab-button" disabled={isRunning} onClick={newCanvas}>
            <Plus size={14} />
          </button>
          <div className="tabs">
            {openTabs.map((tab) => (
              <button
                key={tab.tabId}
                className={`tab ${tab.tabId === activeTabId ? 'active' : ''}`}
                onClick={() => switchTab(tab.tabId)}
              >
                <span>{tab.name}</span>
                {openTabs.length > 1 && (
                  <X
                    size={13}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.tabId);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="tab-actions">
            <div className="add-menu-wrap">
              <button className="secondary-button" onClick={() => setAddMenuOpen((open) => !open)}>
                <Plus size={15} />
                Add Node
              </button>
              {addMenuOpen && (
                <div className="add-menu">
                  <div className="add-menu-section">CLI Agents</div>
                  {cliPresets.map((preset) => (
                    <button
                      key={preset.agentType}
                      onClick={() => {
                        addNode('cli_agent', createCliNodeData(preset));
                        setAddMenuOpen(false);
                      }}
                    >
                      <SquareTerminal size={15} />
                      {preset.label}
                    </button>
                  ))}
                  <div className="add-menu-section">Core Nodes</div>
                  <button onClick={() => addPresetNode('input')}>
                    <FileText size={15} />
                    Input
                  </button>
                  <button onClick={() => addPresetNode('local_llm')}>
                    <Server size={15} />
                    Local LLM
                  </button>
                  <button onClick={() => addPresetNode('cloud_api')}>
                    <Cloud size={15} />
                    Cloud API
                  </button>
                  <button onClick={() => addPresetNode('markdown_output')}>
                    <Braces size={15} />
                    Markdown Output
                  </button>
                </div>
              )}
            </div>
            <button className="secondary-button" disabled={isRunning} onClick={saveWorkflow}>
              <Save size={15} />
              Save
            </button>
            <button className="run-button compact" disabled={isRunning} onClick={runPipeline}>
              <Play size={16} />
              {isRunning ? 'Running' : 'Run'}
            </button>
          </div>
        </div>

        <div className="canvas-help">
          Drag from a right handle to a left handle to connect nodes. Select nodes or edges and press Delete.
        </div>

        <div className="flow-area">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => {
              setSelectedNode(undefined);
              setInspectorMode(undefined);
              setAddMenuOpen(false);
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{ animated: true }}
            deleteKeyCode={['Delete', 'Backspace']}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </main>

      <Inspector
        mode={inspectorMode}
        selectedNode={selectedNode}
        onClose={() => {
          setSelectedNode(undefined);
          setInspectorMode(undefined);
        }}
      />
    </div>
  );
}

function Inspector({
  mode,
  selectedNode,
  onClose,
}: {
  mode: InspectorMode;
  selectedNode?: KnotNode;
  onClose: () => void;
}) {
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const workflowName = useCanvasStore((state) => state.workflowName);
  const workflowContext = useCanvasStore((state) => state.workflowContext);
  const updateWorkflowName = useCanvasStore((state) => state.updateWorkflowName);
  const updateWorkflowContext = useCanvasStore((state) => state.updateWorkflowContext);

  if (!mode) {
    return null;
  }

  if (mode === 'workflow') {
    return (
      <aside className="inspector">
        <div className="inspector-header">
          <span className="node-kind">workflow</span>
          <button className="close-button" onClick={onClose} aria-label="Close inspector">
            <X size={15} />
          </button>
        </div>
        <h2>{workflowName}</h2>

        <label className="field">
          <span>Name</span>
          <input value={workflowName} onChange={(event) => updateWorkflowName(event.target.value)} />
        </label>
        <label className="field">
          <span>Goal</span>
          <textarea
            rows={5}
            value={workflowContext.goal}
            onChange={(event) => updateWorkflowContext({ goal: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Constraints</span>
          <textarea
            rows={7}
            value={workflowContext.constraints}
            onChange={(event) => updateWorkflowContext({ constraints: event.target.value })}
          />
        </label>
      </aside>
    );
  }

  if (!selectedNode) {
    return null;
  }

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <span className="node-kind">{selectedNode.type}</span>
        <button className="close-button" onClick={onClose} aria-label="Close inspector">
          <X size={15} />
        </button>
      </div>
      <h2>{selectedNode.data.label}</h2>

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
            <span>Role</span>
            <select
              value={String(selectedNode.data.role ?? 'architect')}
              onChange={(event) => {
                const role = rolePresets.find((candidate) => candidate.id === event.target.value);
                updateNodeData(selectedNode.id, {
                  role: event.target.value,
                  rolePrompt: role?.prompt ?? String(selectedNode.data.rolePrompt ?? ''),
                });
              }}
            >
              {rolePresets.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Role prompt</span>
            <textarea
              rows={5}
              value={String(selectedNode.data.rolePrompt ?? '')}
              onChange={(event) => updateNodeData(selectedNode.id, { rolePrompt: event.target.value })}
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
