import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cloud, Loader2 } from 'lucide-react';
import type { CloudAPINodeData } from '../types/canvas';

export function CloudNode({ data }: NodeProps) {
  const nodeData = data as CloudAPINodeData;

  return (
    <div className="knot-node cloud-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <Cloud size={16} />
        <span>{nodeData.label}</span>
        {nodeData.isExecuting && <Loader2 className="spin" size={14} />}
      </div>
      <div className="node-meta">{nodeData.provider} · {nodeData.model}</div>
      <pre className="node-output">{nodeData.streamingOutput || 'Cloud API node'}</pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
