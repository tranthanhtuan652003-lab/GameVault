"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Plugs, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

interface BackendStatusContextValue {
  isOffline: boolean;
  checkHealth: () => Promise<boolean>;
}

const BackendStatusContext = createContext<BackendStatusContextValue>({
  isOffline: false,
  checkHealth: async () => true,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";

export function BackendStatusProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const res = await fetch(`${API_URL}/api/Games/genres`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        setIsOffline(false);
        setIsChecking(false);
        return true;
      }
      setIsOffline(true);
      setIsChecking(false);
      return false;
    } catch {
      setIsOffline(true);
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("gamevault:backend-offline", handleOffline);
    window.addEventListener("gamevault:backend-online", handleOnline);

    // Initial silent ping check
    checkHealth();

    return () => {
      window.removeEventListener("gamevault:backend-offline", handleOffline);
      window.removeEventListener("gamevault:backend-online", handleOnline);
    };
  }, [checkHealth]);

  // Polling every 6 seconds when offline to auto-recover when backend turns back on
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      checkHealth();
    }, 6000);
    return () => clearInterval(interval);
  }, [isOffline, checkHealth]);

  return (
    <BackendStatusContext.Provider value={{ isOffline, checkHealth }}>
      {children}
      {isOffline && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-canvas/90 backdrop-blur-md p-4 sm:p-6 transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-surface p-6 sm:p-8 shadow-2xl shadow-danger/10 text-center relative overflow-hidden">
            {/* Top warning ambient glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-danger/15 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/20">
              <Plugs size={36} className="animate-pulse" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger border border-danger/20 mb-3">
              <WarningCircle size={14} /> Mất kết nối Backend
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-ink mb-2">
              Máy chủ Backend đã bị đóng
            </h2>

            <p className="text-sm text-ink-soft mb-6 leading-relaxed">
              Không thể kết nối tới máy chủ API (<code className="text-accent font-mono bg-surface-hover px-1.5 py-0.5 rounded">{API_URL}</code>).
              Toàn bộ dữ liệu hiển thị đã bị ngắt để đảm bảo tính toàn vẹn và tránh xung đột dữ liệu.
            </p>

            <div className="rounded-xl border border-edge bg-canvas/60 p-4 text-xs text-left text-ink-soft mb-6 space-y-1.5">
              <p className="font-semibold text-ink">💡 Hướng dẫn khắc phục:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Mở terminal backend và khởi chạy lệnh <code className="text-accent">dotnet run</code>.</li>
                <li>Đảm bảo máy chủ lắng nghe tại cổng <code className="text-accent">5080</code>.</li>
                <li>Bấm <strong>Thử kết nối lại</strong> bên dưới để tiếp tục.</li>
              </ol>
            </div>

            <button
              onClick={() => checkHealth()}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <ArrowClockwise size={18} className={isChecking ? "animate-spin" : ""} />
              {isChecking ? "Đang kiểm tra kết nối..." : "Thử kết nối lại"}
            </button>
          </div>
        </div>
      )}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
