import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import type { InputNodeData } from '../types/canvas';

export function InputNode({ data }: NodeProps) {
  const nodeData = data as InputNodeData;

  return (
    <div className="knot-node input-node">
      <div className="node-header">
        <FileText size={16} />
        <span>{nodeData.label}</span>
      </div>
      <p className="node-text">{nodeData.text}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
