import type { CLINodeData, WorkflowContext } from '../types/canvas';

export function composeAgentPrompt(
  context: WorkflowContext,
  nodeData: CLINodeData,
  upstreamInput: string,
): string {
  return [
    '# Shared Workflow Context',
    '',
    '## Goal',
    context.goal || 'No shared goal provided.',
    '',
    '## Constraints',
    context.constraints || 'No shared constraints provided.',
    '',
    '# Agent Role',
    '',
    nodeData.rolePrompt || 'Handle the upstream input according to this node configuration.',
    '',
    '# Upstream Input',
    '',
    upstreamInput || 'No upstream input provided.',
  ].join('\n');
}
