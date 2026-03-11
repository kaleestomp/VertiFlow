// Get API base URL (use environment variable or default to localhost)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function loadChunks(path, onChunk, onDone) {
  const url = `${API_BASE}/api/read-sim/chunks?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Chunk stream failed (${res.status}): ${bodyText.slice(0, 200)}`);
  }
  if (!res.body) throw new Error('Chunk stream response has no body');
  if (!contentType.includes('application/x-ndjson')) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Expected NDJSON but got '${contentType}'. Body starts with: ${bodyText.slice(0, 120)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    // console.log('Received chunk:', lines);
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);

      if (msg.done) {
        onDone?.(msg);
      } else {
        onChunk?.(msg);
      }
    }
  }

  if (buffer.trim()) {
    const msg = JSON.parse(buffer);
    if (msg.done) onDone?.(msg);
    else onChunk?.(msg);
  }
}