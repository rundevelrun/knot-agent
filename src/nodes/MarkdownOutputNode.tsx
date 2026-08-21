import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Loader2 } from 'lucide-react';
import type { MarkdownOutputNodeData } from '../types/canvas';

export function MarkdownOutputNode({ data }: NodeProps) {
  const nodeData = data as MarkdownOutputNodeData;

  return (
    <div className="knot-node output-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <Braces size={16} />
        <span>{nodeData.label}</span>
        {nodeData.isExecuting && <Loader2 className="spin" size={14} />}
      </div>
      <pre className="node-output">{nodeData.content || 'Pipeline output renders here.'}</pre>
    </div>
  );
}
