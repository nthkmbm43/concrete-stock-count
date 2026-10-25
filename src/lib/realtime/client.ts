"use client";

import { createRealtimeClient, RealtimeClient } from "@neon/realtime/client";

// Global single RealtimeClient instance for the browser
let clientInstance: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (typeof window === "undefined") {
    // Return dummy client if executed on server
    return {} as RealtimeClient;
  }

  if (!clientInstance) {
    const url =
      process.env.NEXT_PUBLIC_NEON_REALTIME_URL ||
      "wss://realtime.neon.tech/v1";

    clientInstance = createRealtimeClient({
      url,
    });
  }

  return clientInstance;
}

// ────────────────────────────────────────────────────────
// MULTI-TAB & INSTANT SYNCHRONIZATION BUS (Rule 75)
// ────────────────────────────────────────────────────────
export type RealtimeEventType =
  | "STOCK_UPDATED"
  | "COUNT_SUBMITTED"
  | "DRAFT_SAVED"
  | "PRODUCT_CHANGED"
  | "ROUND_CHANGED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  productId?: string;
  roundId?: string;
  newQuantity?: number;
  data?: any;
  timestamp: number;
}

let channel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel("concrete_stock_realtime_bus");
  }
  return channel;
}

/**
 * Broadcast event immediately across all open tabs/windows
 */
export function broadcastRealtimeEvent(
  type: RealtimeEventType,
  payload: Omit<RealtimeEventPayload, "type" | "timestamp"> = {}
) {
  const ch = getBroadcastChannel();
  const event: RealtimeEventPayload = {
    type,
    ...payload,
    timestamp: Date.now(),
  };

  if (ch) {
    try {
      ch.postMessage(event);
    } catch (e) {
      console.warn("BroadcastChannel error:", e);
    }
  }

  // Also dispatch CustomEvent on local window for same-tab subscribers
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("concrete_stock_realtime_event", { detail: event })
    );
  }
}

/**
 * Subscribe to cross-tab / local realtime events
 */
export function subscribeRealtimeEvents(
  callback: (event: RealtimeEventPayload) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleBroadcast = (e: MessageEvent<RealtimeEventPayload>) => {
    if (e.data && e.data.type) {
      callback(e.data);
    }
  };

  const handleLocal = (e: Event) => {
    const custom = e as CustomEvent<RealtimeEventPayload>;
    if (custom.detail && custom.detail.type) {
      callback(custom.detail);
    }
  };

  const ch = getBroadcastChannel();
  ch?.addEventListener("message", handleBroadcast);
  window.addEventListener("concrete_stock_realtime_event", handleLocal);

  return () => {
    ch?.removeEventListener("message", handleBroadcast);
    window.removeEventListener("concrete_stock_realtime_event", handleLocal);
  };
}
