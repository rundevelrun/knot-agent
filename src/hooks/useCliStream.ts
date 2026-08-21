import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CLIStreamEvent } from '../types/canvas';
import { isTauriRuntime } from '../utils/runtime';

export function useCliStream() {
  const appendNodeOutput = useCanvasStore((state) => state.appendNodeOutput);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (!isTauriRuntime()) {
      return undefined;
    }

    listen<CLIStreamEvent>('cli-agent-stream', (event) => {
      const prefix = event.payload.stream === 'stderr' ? '[stderr] ' : '';
      appendNodeOutput(event.payload.nodeId, `${prefix}${event.payload.chunk}`);
    }).then((handler) => {
      unlisten = handler;
    });

    return () => {
      unlisten?.();
    };
  }, [appendNodeOutput]);
}
