import type {
  CLIAgentType,
  CLINodeData,
  CloudAPINodeData,
  InputNodeData,
  LocalLLMNodeData,
  MarkdownOutputNodeData,
} from '../types/canvas';

interface CLIPreset {
  agentType: CLIAgentType;
  label: string;
  command: string;
  args: string[];
}

export const cliPresets: CLIPreset[] = [
  {
    agentType: 'agy',
    label: 'Gemini CLI Architect',
    command: 'agy',
    args: ['{{input}}'],
  },
  {
    agentType: 'claude',
    label: 'Claude Code Builder',
    command: 'claude',
    args: ['-p', '{{input}}'],
  },
  {
    agentType: 'codex',
    label: 'Codex Reviewer',
    command: 'codex',
    args: ['exec', '{{input}}'],
  },
  {
    agentType: 'gh',
    label: 'GitHub CLI',
    command: 'gh',
    args: ['issue', 'list'],
  },
];

export function createCliNodeData(preset: CLIPreset): CLINodeData {
  return {
    label: preset.label,
    agentType: preset.agentType,
    command: preset.command,
    args: preset.args,
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
