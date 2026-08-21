import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Loader2, SquareTerminal } from 'lucide-react';
import type { CLINodeData } from '../types/canvas';

export function AgentNode({ data }: NodeProps) {
  const nodeData = data as CLINodeData;

  return (
    <div className="knot-node cli-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <SquareTerminal size={16} />
        <span>{nodeData.label}</span>
        {nodeData.isExecuting && <Loader2 className="spin" size={14} />}
      </div>
      <div className="node-meta">{nodeData.command}</div>
      <pre className="node-output">{nodeData.streamingOutput || 'Waiting for execution...'}</pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
