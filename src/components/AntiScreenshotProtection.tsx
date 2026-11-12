import React, { useEffect, useState, useCallback, useRef } from "react";
import { ShieldAlert, Lock, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AntiScreenshotProtectionProps {
  customNotice?: string;
}

export default function AntiScreenshotProtection({ customNotice }: AntiScreenshotProtectionProps) {
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSecurityNotice = useCallback((message: string, flashBlackout = true) => {
    // Clear any existing toast timer
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    // Overwrite system clipboard to clear any captured image
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("🚫 Captura de tela bloqueada por motivos de segurança.").catch(() => {});
      }
    } catch {
      // Ignore clipboard permission issues
    }

    if (flashBlackout) {
      if (shieldTimeoutRef.current) {
        clearTimeout(shieldTimeoutRef.current);
      }
      setIsShieldActive(true);
      shieldTimeoutRef.current = setTimeout(() => {
        setIsShieldActive(false);
      }, 1600);
    }
  }, []);

  useEffect(() => {
    // 1. Keydown event listener for PrintScreen and screenshot combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const keyCode = e.keyCode || e.which;

      // PrintScreen key
      if (key === "PrintScreen" || keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice(customNotice || "A função de tirar print (Print Screen) foi bloqueada neste site.");
        return;
      }

      // Browser Print shortcut (Ctrl+P or Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (key === "p" || key === "P" || keyCode === 80)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("A impressão direta foi bloqueada. Conclua seu currículo e faça o download oficial em PDF.", true);
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Save page (Ctrl+S / Cmd+S)
      if (e.shiftKey && (key === "s" || key === "S" || keyCode === 83) && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("O atalho de captura de tela foi bloqueado por segurança.");
        return;
      }

      // Page Save shortcut (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (key === "s" || key === "S" || keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("O salvamento da página foi desativado por proteção de direitos autorais.", false);
        return;
      }

      // Mac screenshot shortcuts: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("Captura de tela no Mac bloqueada por motivos de proteção de dados.");
        return;
      }

      // View Source (Ctrl+U / Cmd+U)
      if ((e.ctrlKey || e.metaKey) && (key === "u" || key === "U" || keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("Visualização de código-fonte desativada.", false);
        return;
      }

      // Developer tools (F12 or Ctrl+Shift+I or Cmd+Option+I)
      if (keyCode === 123 || ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "i" || key === "I" || key === "c" || key === "C" || key === "j" || key === "J"))) {
        showSecurityNotice("Ferramentas de desenvolvedor desativadas nesta página.", false);
      }
    };

    // 2. Keyup event (some browsers trigger PrintScreen primarily on keyup)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityNotice("Captura de tela bloqueada.");
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("🚫 Captura de tela bloqueada por segurança.").catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };

    // 3. Context menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click on editable form inputs and textareas so users can paste their info
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      e.preventDefault();
      showSecurityNotice("O clique com o botão direito foi desativado para proteção do conteúdo.", false);
    };

    // 4. Before print handler
    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      showSecurityNotice("A função de impressão foi desativada neste site.", true);
    };

    // 5. Blur & Visibility change (Snipping tools / background recording)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear clipboard just in case an OS tool was triggered
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("🚫 Captura de tela bloqueada por segurança.").catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("beforeprint", handleBeforePrint, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("beforeprint", handleBeforePrint, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);
    };
  }, [showSecurityNotice, customNotice]);

  return (
    <>
      {/* Instant Privacy Blackout Shield when PrintScreen is triggered */}
      <AnimatePresence>
        {isShieldActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center text-white p-6 select-none cursor-not-allowed"
            style={{ pointerEvents: "all" }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="max-w-md text-center flex flex-col items-center bg-slate-900/90 border border-red-500/40 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-5 shadow-lg shadow-red-500/10">
                <EyeOff className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                Captura de Tela Bloqueada
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                O recurso de tirar print foi desativado neste site para proteção de modelos, direitos autorais e segurança dos dados.
              </p>
              <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-800/40 text-red-300 text-xs px-3.5 py-1.5 rounded-full font-semibold">
                <Lock className="w-3.5 h-3.5" /> Proteção Anti-Print Ativa
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[99990] max-w-lg w-[90%] sm:w-auto shadow-2xl"
          >
            <div className="flex items-center gap-3.5 bg-slate-950/95 text-white border border-red-500/40 px-5 py-3.5 rounded-2xl backdrop-blur-md shadow-xl shadow-black/40">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Ação Bloqueada
                </div>
                <div className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5">
                  {toastMessage}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
