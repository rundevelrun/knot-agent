export interface RolePreset {
  id: string;
  label: string;
  prompt: string;
}

export const rolePresets: RolePreset[] = [
  {
    id: 'architect',
    label: 'Architect',
    prompt: 'You are the architecture planner. Produce a concise plan, tradeoffs, and the next concrete steps.',
  },
  {
    id: 'implementer',
    label: 'Implementer',
    prompt: 'You are the implementation agent. Turn the input into concrete code changes or implementation instructions.',
  },
  {
    id: 'reviewer',
    label: 'Reviewer',
    prompt: 'You are the reviewer. Find bugs, risks, missing tests, and unclear assumptions. Be specific and actionable.',
  },
  {
    id: 'summarizer',
    label: 'Summarizer',
    prompt: 'You are the summarizer. Produce a clear markdown summary of the upstream results.',
  },
];

export function getRolePreset(id: string): RolePreset {
  return rolePresets.find((role) => role.id === id) ?? rolePresets[0];
}
