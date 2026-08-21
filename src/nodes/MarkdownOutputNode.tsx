import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Loader2 } from 'lucide-react';
import type { MarkdownOutputNodeData } from '../types/canvas';
import { renderMarkdown } from '../utils/markdown';

export function MarkdownOutputNode({ data }: NodeProps) {
  const nodeData = data as MarkdownOutputNodeData;
  const content = nodeData.content || 'Pipeline output renders here.';

  return (
    <div className="knot-node output-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <Braces size={16} />
        <span>{nodeData.label}</span>
        {nodeData.isExecuting && <Loader2 className="spin" size={14} />}
      </div>
      <div
        className="node-output markdown-preview"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  );
}
