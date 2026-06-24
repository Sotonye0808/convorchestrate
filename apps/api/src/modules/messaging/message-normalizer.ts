import type { NormalizedMessage } from "@convorchestrate/core";
import type { IncomingRawMessage } from "@convorchestrate/adapters";

export function normalizeMessage(raw: IncomingRawMessage): NormalizedMessage {
    const typeMap: Record<string, NormalizedMessage["type"]> = {
        chat: "text",
        image: "image",
        video: "video",
        document: "document",
        audio: "audio",
    };

    return {
        type: typeMap[raw.type] ?? "text",
        text: raw.body || undefined,
        mediaUrl: undefined,
        mediaLocalPath: undefined,
        timestamp: new Date(raw.timestamp * 1000),
        raw,
    };
}
