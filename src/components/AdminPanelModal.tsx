import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Settings, 
  RefreshCw, 
  X, 
  Eye, 
  EyeOff, 
  LogOut,
  ShoppingBag,
  ExternalLink,
  Clock
} from "lucide-react";

interface OrderItem {
  orderId: string;
  resumeId: string;
  type: string;
  amount: number;
  status: "pending" | "completed";
  createdAt: string;
  verifiedAt?: string;
  authCode?: string;
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrderId?: string;
  onApproveCurrentOrder?: () => Promise<void> | void;
}

const ADMIN_PASSWORD_CORRECT = "230513";
const AUTH_STORAGE_KEY = "currifast_admin_session_auth";

export default function AdminPanelModal({
  isOpen,
  onClose,
  currentOrderId,
  onApproveCurrentOrder
}: AdminPanelModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === ADMIN_PASSWORD_CORRECT;
  });

  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Orders list state
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);

  // Fetch orders when authenticated
  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch("/api/payment/orders", {
        headers: {
          "x-admin-password": ADMIN_PASSWORD_CORRECT
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Falha ao buscar pedidos:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadOrders();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  // Handle Login attempt
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError(null);

    // Validate password (230513)
    setTimeout(() => {
      if (passwordInput === ADMIN_PASSWORD_CORRECT) {
        setIsAuthenticated(true);
        sessionStorage.setItem(AUTH_STORAGE_KEY, ADMIN_PASSWORD_CORRECT);
        setPasswordInput("");
        setAuthError(null);
        loadOrders();
      } else {
        setAuthError("Senha incorreta. Acesso não autorizado.");
      }
      setIsSubmittingAuth(false);
    }, 250);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setPasswordInput("");
    setAuthError(null);
  };

  // Approve a specific order
  const handleApproveOrder = async (orderIdToApprove: string) => {
    setApprovingOrderId(orderIdToApprove);
    setActionMessage(null);
    try {
      const response = await fetch("/api/payment/admin-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD_CORRECT
        },
        body: JSON.stringify({ 
          orderId: orderIdToApprove,
          adminPassword: ADMIN_PASSWORD_CORRECT
        })
      });

      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: "success", text: `Pedido ${orderIdToApprove} aprovado com sucesso!` });
        await loadOrders();
        // If it's the current order on checkout page, notify parent
        if (currentOrderId && orderIdToApprove === currentOrderId && onApproveCurrentOrder) {
          onApproveCurrentOrder();
        }
      } else {
        setActionMessage({ type: "error", text: data.error || "Falha ao aprovar pedido." });
      }
    } catch {
      setActionMessage({ type: "error", text: "Erro ao comunicar com o servidor." });
    } finally {
      setApprovingOrderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                Painel do Administrador
                {isAuthenticated && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Gerenciamento de pagamentos e aprovação de pedidos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Bloquear e Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* 1. PASSWORD AUTHENTICATION SCREEN */}
          {!isAuthenticated ? (
            <div className="py-4 space-y-5 max-w-sm mx-auto text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <KeyRound className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Acesso Restrito
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Digite a senha mestra para desbloquear o painel administrativo do CurriFast.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha do Administrador
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder="Digite a senha de acesso"
                      autoFocus
                      required
                      className="w-full bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none pr-10 transition-colors font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth || !passwordInput}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingAuth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Desbloquear Painel
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* 2. AUTHENTICATED ADMIN DASHBOARD */
            <div className="space-y-6">

              {/* Feedback Alert */}
              {actionMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
                    actionMessage.type === "success"
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/60 border-red-500/40 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {actionMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setActionMessage(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Fast Action: Current Checkout Order */}
              {currentOrderId && (
                <div className="bg-gradient-to-br from-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" /> Pedido Atual em Aberto
                    </span>
                    <span className="font-mono text-xs bg-slate-800 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700">
                      {currentOrderId}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você está no checkout deste pedido. Se o cliente realizou o Pix de <strong>R$ 9,90</strong> e você já confirmou no seu banco, clique abaixo para liberá-lo imediatamente:
                  </p>

                  <button
                    type="button"
                    onClick={() => handleApproveOrder(currentOrderId)}
                    disabled={approvingOrderId === currentOrderId}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-60"
                  >
                    {approvingOrderId === currentOrderId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Aprovando Pedido...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Aprovar e Liberar Download Imediatamente
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Orders Monitor List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" /> Histórico Geral de Pedidos PIX
                  </h4>
                  <button
                    type="button"
                    onClick={loadOrders}
                    disabled={isLoadingOrders}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    Carregando pedidos...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Nenhum pedido registrado no servidor ainda.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {orders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{ord.orderId}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                ord.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {ord.status === "completed" ? "Aprovado" : "Pendente"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>R$ {ord.amount?.toFixed(2) || "9,90"}</span>
                            <span>•</span>
                            <span>{new Date(ord.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
                            <span>•</span>
                            <span>{ord.type === "cover_letter" ? "Carta" : "Currículo"}</span>
                          </div>
                        </div>

                        {ord.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(ord.orderId)}
                            disabled={approvingOrderId === ord.orderId}
                            className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
                          >
                            {approvingOrderId === ord.orderId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Aprovar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Server Info Footer */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Webhook: <code className="text-slate-400">/api/payment/webhook</code></span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Acesso Protegido por Senha
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
