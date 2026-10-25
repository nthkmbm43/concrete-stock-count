"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { RealtimeProvider as NeonRealtimeProvider } from "@neon/realtime-react";
import { getRealtimeClient, subscribeRealtimeEvents } from "./client";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeContextValue {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncTime: number | null;
}

const RealtimeStatusContext = createContext<RealtimeContextValue>({
  isOnline: true,
  isConnecting: false,
  lastSyncTime: null,
});

export const useRealtimeConnection = () => useContext(RealtimeStatusContext);

export function ConcreteRealtimeProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const client = getRealtimeClient();

  useEffect(() => {
    setLastSyncTime(Date.now());
    // 41. RECONNECT: Listen to browser network changes & background tab wakeups
    const handleOnline = () => {
      setIsOnline(true);
      setIsConnecting(false);
      setLastSyncTime(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnecting(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsConnecting(false);
        setLastSyncTime(Date.now());
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen to real-time events to update last sync time
    const unsubscribe = subscribeRealtimeEvents(() => {
      setLastSyncTime(Date.now());
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
    };
  }, []);

  return (
    <NeonRealtimeProvider client={client}>
      <RealtimeStatusContext.Provider value={{ isOnline, isConnecting, lastSyncTime }}>
        {/* Subtle Connection Status Bar (Rule 40, 42) */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 shadow-md animate-in slide-in-from-top">
            <WifiOff className="h-3.5 w-3.5" />
            <span>การเชื่อมต่อข้อมูลขาดชั่วคราว (กำลังพยายามเชื่อมต่อใหม่...)</span>
          </div>
        )}

        {isOnline && isConnecting && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600/90 backdrop-blur-xs text-white text-xs font-bold py-1 px-3 flex items-center justify-center gap-1.5 shadow-sm animate-in slide-in-from-top">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>กำลังเชื่อมต่อข้อมูลล่าสุด...</span>
          </div>
        )}

        {children}
      </RealtimeStatusContext.Provider>
    </NeonRealtimeProvider>
  );
}
