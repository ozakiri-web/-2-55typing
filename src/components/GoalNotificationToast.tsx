import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, CheckCircle, Flame, Percent, Zap, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "kpm" | "accuracy" | "streak";
  title: string;
  value: number;
}

interface GoalNotificationToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const GoalNotificationToast: React.FC<GoalNotificationToastProps> = ({
  toasts,
  onDismiss
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          // Color choices based on target type
          let colorClass = "border-[#00ff88] text-[#00ff88] shadow-emerald-950/20";
          let bgClass = "bg-[#0c1a13]";
          let Icon = Zap;

          if (toast.type === "accuracy") {
            colorClass = "border-cyan-500 text-cyan-400 shadow-cyan-950/20";
            bgClass = "bg-[#091722]";
            Icon = Percent;
          } else if (toast.type === "streak") {
            colorClass = "border-orange-500 text-orange-400 shadow-orange-950/20";
            bgClass = "bg-[#1c120a]";
            Icon = Flame;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`pointer-events-auto w-full p-4 rounded-xl border-2 ${colorClass} ${bgClass} shadow-xl flex gap-3.5 items-center relative overflow-hidden`}
              role="alert"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none"></div>

              {/* Icon Container */}
              <div className={`p-2.5 rounded-lg bg-black/40 border border-current flex items-center justify-center shrink-0`}>
                <Icon size={18} className="animate-pulse" />
              </div>

              {/* Text Context */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black font-mono tracking-widest uppercase opacity-70">
                  目標達成 // TARGET ACHIEVED
                </p>
                <h4 className="text-white text-xs font-black tracking-tight mt-0.5 leading-snug">
                  {toast.title}
                </h4>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  実績値: <span className="font-extrabold text-white">{toast.value}</span>
                  {toast.type === "accuracy" ? "%" : toast.type === "streak" ? " combo" : " KPM"}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-black/20 rounded shrink-0 cursor-pointer self-start"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
