import type {
  AdminOperationsConnectionStatus as AdminOperationsConnectionStatusType,
  AdminOperationsRealtimeEvent,
  AdminOperationsTodoSummary
} from "@moyuxia/shared";
import type { AdminRequestClientOptions } from "./admin-client";
import { requestAdmin } from "./admin-client";

const AdminOperationsConnectionStatus = {
  Connecting: "connecting",
  Live: "live",
  DegradedPolling: "degraded_polling",
  Offline: "offline",
  Recovering: "recovering"
} as const satisfies Record<string, AdminOperationsConnectionStatusType>;

export interface AdminRealtimeOptions extends AdminRequestClientOptions {
  onEvent(event: AdminOperationsRealtimeEvent): void;
  onSummary(summary: AdminOperationsTodoSummary): void;
  onStatus(status: AdminOperationsConnectionStatusType): void;
  onError(error: unknown): void;
  pollIntervalMs?: number;
  reconnectDelayMs?: number;
}

export function connectAdminOperationsRealtime(options: AdminRealtimeOptions): () => void {
  let stopped = false;
  let abortController: AbortController | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startPolling = () => {
    if (pollTimer || stopped) {
      return;
    }
    options.onStatus(AdminOperationsConnectionStatus.DegradedPolling);
    const run = async () => {
      try {
        const summary = (await requestAdmin(
          options,
          "/admin/operations/todo-summary",
          "GET"
        )) as AdminOperationsTodoSummary;
        options.onSummary(summary);
      } catch (error) {
        options.onStatus(AdminOperationsConnectionStatus.Offline);
        options.onError(error);
      }
    };
    void run();
    pollTimer = setInterval(run, options.pollIntervalMs ?? 30000);
  };

  const scheduleReconnect = () => {
    if (reconnectTimer || stopped) {
      return;
    }
    options.onStatus(AdminOperationsConnectionStatus.Recovering);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connectStream();
    }, options.reconnectDelayMs ?? 5000);
  };

  const connectStream = async () => {
    abortController?.abort();
    abortController = new AbortController();
    options.onStatus(AdminOperationsConnectionStatus.Connecting);

    try {
      const response = await fetch(`${options.baseUrl}/admin/operations/events`, {
        method: "GET",
        headers: {
          "x-admin-token": options.getToken(),
          Accept: "text/event-stream"
        },
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(response.status === 403 ? "后台令牌失效" : "实时事件连接失败");
      }

      stopPolling();
      options.onStatus(AdminOperationsConnectionStatus.Live);
      await readSseStream(response.body, options.onEvent);
      if (!stopped) {
        startPolling();
        scheduleReconnect();
      }
    } catch (error) {
      if (stopped || abortController?.signal.aborted) {
        return;
      }
      options.onError(error);
      startPolling();
      scheduleReconnect();
    }
  };

  void connectStream();

  return () => {
    stopped = true;
    abortController?.abort();
    stopPolling();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
  };
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AdminOperationsRealtimeEvent) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) {
        continue;
      }
      const payload = dataLine.slice("data:".length).trim();
      if (!payload) {
        continue;
      }
      onEvent(JSON.parse(payload) as AdminOperationsRealtimeEvent);
    }
  }
}
