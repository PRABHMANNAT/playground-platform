// Persisted SSE is a notification channel. Snapshots remain authoritative.
// The cursor advances only after a parsed event; a bounded ID set deduplicates reconnects.
export async function eventFeed(
  runId: string,
  signal: AbortSignal,
  onChange: () => void,
  onConnected: (connected: boolean) => void,
) {
  let cursor = 0;
  const seen = new Set<string>();
  while (!signal.aborted) {
    try {
      const response = await fetch(
        `/api/v1/runs/${runId}/stream?after=${cursor}`,
        { signal },
      );
      if (!response.ok || !response.body) throw new Error("Feed disconnected");
      onConnected(true);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = pending.indexOf("\n\n")) >= 0) {
          const block = pending.slice(0, boundary);
          pending = pending.slice(boundary + 2);
          const line = block
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as {
            event_id: string;
            run_sequence: number;
          };
          if (event.run_sequence > cursor && !seen.has(event.event_id)) {
            cursor = event.run_sequence;
            seen.add(event.event_id);
            if (seen.size > 200) seen.delete(seen.values().next().value!);
            onChange();
          }
        }
      }
    } catch {
      if (signal.aborted) return;
      onConnected(false);
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}
