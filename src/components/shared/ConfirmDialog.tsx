import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tokens: Record<string, string>;
  primary: string;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Yes, Confirm", cancelLabel = "Cancel",
  confirmColor, icon = "⚠️", onConfirm, onCancel, tokens, primary,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 80);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter") onConfirm();
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, onCancel, onConfirm]);

  // Use confirmColor if explicitly passed, otherwise fall back to primary theme color
  const btnColor = confirmColor || primary;

  // Derive card background and hover from theme tokens, supporting both token naming conventions
  const cardBg    = tokens.card    || tokens.surface    || tokens.bg;
  const cardHover = tokens.cardHover || tokens.surfaceHover || tokens.bg;
  const textSub   = tokens.sub     || tokens.textSub    || tokens.muted || tokens.textMuted;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />

          {/* Card — fully theme-adapted */}
          <motion.div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{
              background: cardBg,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: `0 8px 40px ${btnColor}22, 0 2px 16px rgba(0,0,0,0.18)`,
            }}
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 40 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Subtle top accent bar in primary color */}
            <div
              className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${btnColor}, transparent)` }}
            />

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: `${btnColor}18`,
                  border: `1.5px solid ${btnColor}35`,
                  boxShadow: `0 0 0 4px ${btnColor}10`,
                }}>
                {icon}
              </div>
            </div>

            <h2 className="text-base font-bold text-center mb-2" style={{ color: tokens.text }}>
              {title}
            </h2>
            <p className="text-sm text-center leading-relaxed mb-6" style={{ color: textSub }}>
              {message}
            </p>

            <div className="flex gap-3">
              {/* Cancel button — theme-surface colored */}
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: cardHover,
                  border: `1.5px solid ${tokens.border}`,
                  color: tokens.text,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = btnColor + "60")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = tokens.border)}
              >
                {cancelLabel}
              </button>

              {/* Confirm button — primary/theme color */}
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${btnColor}, ${btnColor}cc)`,
                  color: "#fff",
                  boxShadow: `0 4px 14px ${btnColor}45`,
                  border: `1.5px solid ${btnColor}`,
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Toast notification ─────────────────────────────────────── */
interface ToastProps {
  open: boolean;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ open, message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 3200);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  const colors = {
    success: { bg: "#d4e8d4", text: "#1e4d1e", border: "#22c55e30" },
    error:   { bg: "#fde8e8", text: "#7f1d1d", border: "#ef444430" },
    info:    { bg: "#dbeafe", text: "#1e3a5f", border: "#3b82f630" },
  };
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const c = colors[type];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-xs"
          style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 340, damping: 40 }}
        >
          <span>{icons[type]}</span>
          <span>{message}</span>
          <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100 text-base leading-none">×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── useConfirm hook ────────────────────────────────────────── */
import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: string;
  resolve?: (v: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: "", message: "" });

  const confirm = useCallback((opts: Omit<ConfirmState, "open" | "resolve">): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  const handleConfirm = () => { setState(s => ({ ...s, open: false })); state.resolve?.(true); };
  const handleCancel  = () => { setState(s => ({ ...s, open: false })); state.resolve?.(false); };

  return { confirmState: state, confirm, handleConfirm, handleCancel };
}

/* ── useToast hook ──────────────────────────────────────────── */
interface ToastState {
  open: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({ open: false, message: "", type: "success" });

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToastState({ open: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(s => ({ ...s, open: false }));
  }, []);

  return { toastState, showToast, hideToast };
}
