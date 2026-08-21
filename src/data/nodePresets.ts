import type {
  CLIAgentType,
  CLINodeData,
  CloudAPINodeData,
  InputNodeData,
  LocalLLMNodeData,
  MarkdownOutputNodeData,
} from '../types/canvas';
import { getRolePreset } from './rolePresets';

interface CLIPreset {
  agentType: CLIAgentType;
  label: string;
  command: string;
  args: string[];
  role: string;
}

export const cliPresets: CLIPreset[] = [
  {
    agentType: 'agy',
    label: 'Antigravity (Gemini)',
    command: 'agy',
    args: ['-p', '{{input}}', '--print-timeout', '90s'],
    role: 'architect',
  },
  {
    agentType: 'claude',
    label: 'Claude',
    command: 'claude',
    args: ['-p', '{{input}}'],
    role: 'implementer',
  },
  {
    agentType: 'codex',
    label: 'Codex',
    command: 'codex',
    args: ['exec', '{{input}}'],
    role: 'reviewer',
  },
  {
    agentType: 'gh',
    label: 'GitHub',
    command: 'gh',
    args: ['issue', 'list'],
    role: 'summarizer',
  },
];

export function createCliNodeData(preset: CLIPreset): CLINodeData {
  const role = getRolePreset(preset.role);
  return {
    label: preset.label,
    agentType: preset.agentType,
    command: preset.command,
    args: preset.args,
    role: role.id,
    rolePrompt: role.prompt,
    workingDir: '',
    streamingOutput: '',
  };
}

export function createInputNodeData(): InputNodeData {
  return {
    label: 'Feature Spec',
    text: 'Describe the task or paste a feature spec here.',
  };
}

export function createLocalLLMNodeData(): LocalLLMNodeData {
  return {
    label: 'Ollama Summary',
    engine: 'ollama',
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen2.5:7b',
    systemPrompt: 'Summarize the workflow output for a developer.',
    temperature: 0.3,
    streamingOutput: '',
  };
}

export function createCloudAPINodeData(): CloudAPINodeData {
  return {
    label: 'OpenAI API',
    provider: 'openai',
    model: 'gpt-4o',
    systemPrompt: 'Review the upstream result and return concise feedback.',
    streamingOutput: '',
  };
}

export function createMarkdownOutputNodeData(): MarkdownOutputNodeData {
  return {
    label: 'Markdown Output',
    content: '',
  };
}
