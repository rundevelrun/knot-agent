import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Loader2, Server } from 'lucide-react';
import type { LocalLLMNodeData } from '../types/canvas';

export function LocalLLMNode({ data }: NodeProps) {
  const nodeData = data as LocalLLMNodeData;

  return (
    <div className="knot-node llm-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <Server size={16} />
        <span>{nodeData.label}</span>
        {nodeData.isExecuting && <Loader2 className="spin" size={14} />}
      </div>
      <div className="node-meta">{nodeData.engine} · {nodeData.model}</div>
      <pre className="node-output">{nodeData.streamingOutput || `Connectable placeholder\n${nodeData.baseUrl}`}</pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
