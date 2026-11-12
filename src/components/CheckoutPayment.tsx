import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  ShoppingBag, 
  QrCode, 
  Copy, 
  Check, 
  Lock,
  Sparkles,
  Settings,
  Building2,
  Calendar,
  Info
} from "lucide-react";
import { generatePixPayload, generatePixQRCode, validateTransactionCode } from "../utils/pix";
import AdminPanelModal from "./AdminPanelModal";

interface CheckoutPaymentProps {
  sessionId: string;
  resumeId: string;
  type: "resume" | "cover_letter";
  resumeTitle: string;
  onPaymentSuccess: (resumeId: string, type: "resume" | "cover_letter", amount: number) => void;
  onCancel: () => void;
}

export default function CheckoutPayment({
  sessionId,
  resumeId,
  type,
  resumeTitle,
  onPaymentSuccess,
  onCancel
}: CheckoutPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifiedBankName, setVerifiedBankName] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  
  // Tab selector: pix_code (QR Code & Copia e Cola) vs receipt (Validar ID Real)
  const [activeTab, setActiveTab] = useState<"pix_code" | "receipt">("pix_code");
  
  // Real PIX transaction ID input
  const [transactionCode, setTransactionCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showBankGuide, setShowBankGuide] = useState(false);
  
  // Real-time polling indicator state
  const [pollingStatus, setPollingStatus] = useState<"checking" | "waiting">("waiting");
  
  // Admin modal state
  const [showConfigModal, setShowConfigModal] = useState(false);

  const pixAmount = 9.90;
  const orderId = sessionId || `ORD-${resumeId.slice(0, 8)}`;

  // Generate safe PIX payload with official EMV BR Code standard
  const pixPayload = generatePixPayload({
    key: "47061350873",
    name: "CURRIFAST PIX",
    city: "SAO PAULO",
    amount: pixAmount,
    txId: orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "CURRIFAST"
  });

  // Render PIX QR Code
  useEffect(() => {
    let isMounted = true;

    generatePixQRCode(pixPayload)
      .then((dataUrl) => {
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch((err) => {
        console.error("Erro ao gerar QR Code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [pixPayload]);

  // Real-time background polling to check if payment was approved by Webhook or Receipt verification
  useEffect(() => {
    if (success) return;

    const interval = setInterval(async () => {
      setPollingStatus("checking");
      try {
        const response = await fetch(`/api/payment/status/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "completed") {
            setSuccess(true);
            setTimeout(() => {
              onPaymentSuccess(resumeId, type, pixAmount);
            }, 1200);
          }
        }
      } catch (err) {
        // Silent catch for background poll
      } finally {
        setTimeout(() => setPollingStatus("waiting"), 800);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, resumeId, type, success, onPaymentSuccess]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  // Real PIX ID input inspector
  const liveCheck = transactionCode.trim() ? validateTransactionCode(transactionCode) : null;

  // Strict anti-fraud: Verify REAL PIX receipt transaction authentication code with backend
  const handleVerifyReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateTransactionCode(transactionCode);
    if (!validation.valid) {
      setValidationError(validation.reason || "ID da transação inválido.");
      return;
    }

    setVerifyingCode(true);

    try {
      const response = await fetch("/api/payment/verify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          transactionCode: transactionCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setValidationError(data.error || "Não foi possível validar este comprovante. Verifique o ID real e tente novamente.");
        setVerifyingCode(false);
        return;
      }

      setVerifiedBankName(data.bankName || validation.bankName || "Instituição Financeira PIX");
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(resumeId, type, pixAmount);
      }, 1400);
    } catch (err: any) {
      console.error("Erro na verificação do ID da transação:", err);
      setValidationError("Erro de comunicação com o servidor de validação. Tente novamente.");
    } finally {
      setVerifyingCode(false);
    }
  };

  // Admin manual approval action
  const handleAdminApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/admin-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        setShowConfigModal(false);
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(resumeId, type, pixAmount);
        }, 1200);
      }
    } catch (err) {
      console.error("Falha ao aprovar:", err);
    } finally {
      setLoading(false);
    }
  };

  const itemName = type === "resume" ? "Currículo Profissional Otimizado" : "Carta de Apresentação Inteligente";

  return (
    <div id="checkout-payment-screen" className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-lg bg-slate-850 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header Ribbon */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-bold tracking-tight text-white text-sm">
            <ShoppingBag className="w-4 h-4 text-emerald-100" />
            <span>Pagamento PIX Seguro • R$ 9,90</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-700 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-200" /> PIX Direto
            </span>
            {/* Admin settings gear */}
            <button
              onClick={() => setShowConfigModal(true)}
              title="Painel do Administrador"
              className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Success Splash */}
        {success ? (
          <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[460px]">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-emerald-500/15 p-5 rounded-full text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-16 h-16" />
            </motion.div>
            <h2 className="text-2xl font-black text-white">PIX Confirmado com Sucesso!</h2>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ID Real Autenticado ({verifiedBankName || "PIX Banco Central"}) • Acesso liberado</span>
            </div>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Obrigado! O pagamento de <strong>R$ 9,90</strong> foi autenticado com comprovante legítimo. A licença vitalícia para <strong>{itemName}</strong> foi liberada e seu download em PDF começará automaticamente.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Gerando seu arquivo PDF profissional...
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Back button & Purchase Summary */}
            <div className="space-y-3">
              <button
                onClick={onCancel}
                type="button"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao currículo
              </button>

              <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Item Selecionado</span>
                  <div className="font-bold text-sm text-white mt-0.5">
                    {itemName}
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                    {resumeTitle || "Meu Currículo"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</div>
                  <div className="font-black text-2xl text-emerald-400 mt-0.5">R$ 9,90</div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: QR Code PIX vs Validar ID Real */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-750 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("pix_code")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "pix_code"
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>1. Pagar via PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("receipt")}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "receipt"
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. Confirmar Comprovante</span>
              </button>
            </div>

            {/* TAB 1: Direct PIX QR Code & Copia e Cola */}
            {activeTab === "pix_code" && (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <QrCode className="w-3.5 h-3.5" /> QR Code PIX Oficial
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Abra o app do seu banco, escolha pagar via <strong>PIX</strong> e aponte a câmera ou use o código Copia e Cola.
                  </p>
                </div>

                {/* Scannable PIX QR Code */}
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-emerald-500/40 relative">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code PIX R$ 9,90" 
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-xs">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    )}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 px-3 py-0.5 rounded-full shadow whitespace-nowrap">
                      PIX • R$ 9,90
                    </div>
                  </div>
                </div>

                {/* Copia e Cola Button */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-95"
                  >
                    {copiedPayload ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Código PIX Copia e Cola Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-100" />
                        <span>Copiar Código PIX Copia e Cola</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Next Step Callout */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab("receipt")}
                    className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 hover:text-emerald-300 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Já fez a transferência? Validar ID do Comprovante →</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REAL PIX TRANSACTION ID VALIDATION */}
            {activeTab === "receipt" && (
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/80 space-y-4">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Validação por ID Real da Transação
                  </div>
                  <p className="text-[11px] text-slate-300">
                    O PDF é liberado mediante verificação do <strong>ID da Transação</strong> real de 32 caracteres do comprovante PIX.
                  </p>
                </div>

                {/* Helper Accordion: How to find in banking app */}
                <div className="border border-emerald-900/50 bg-emerald-950/20 rounded-xl p-3 text-xs space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowBankGuide(!showBankGuide)}
                    className="w-full flex items-center justify-between text-emerald-300 font-bold hover:text-emerald-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      Como localizar o ID Real no comprovante do seu banco?
                    </span>
                    <span className="text-[10px] text-emerald-400">{showBankGuide ? "Ocultar ▲" : "Ver passo a passo ▼"}</span>
                  </button>

                  {showBankGuide && (
                    <div className="text-[11px] text-slate-300 pt-2 border-t border-emerald-900/40 space-y-1.5 leading-relaxed">
                      <p>1. Abra o aplicativo do seu banco onde realizou o PIX.</p>
                      <p>2. Acesse o <strong>Extrato</strong> ou <strong>Área Pix</strong> e selecione a transferência de <strong>R$ 9,90</strong>.</p>
                      <p>3. Toque em <strong>Ver comprovante</strong> e localize o campo <strong>ID da transação / Autenticação</strong>.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifyReceipt} className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        ID Real da Transação PIX (E2E)
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {transactionCode.trim().length}/32 caracteres
                      </span>
                    </div>

                    <input
                      type="text"
                      value={transactionCode}
                      onChange={(e) => {
                        setTransactionCode(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="Cole aqui o ID da transação (32 caracteres)"
                      maxLength={36}
                      className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono tracking-wide"
                    />

                    {/* Live Inspector Preview */}
                    {liveCheck && liveCheck.valid && (
                      <div className="mt-2 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <strong>Banco:</strong> {liveCheck.bankName}
                        </span>
                        {liveCheck.timestamp && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {liveCheck.timestamp}
                          </span>
                        )}
                      </div>
                    )}

                    {validationError && (
                      <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-lg flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{validationError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingCode || !transactionCode.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-95 cursor-pointer"
                  >
                    {verifyingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando ID nos Registros Bancários...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Validar Comprovante e Liberar PDF</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Footer Status Indicators */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${pollingStatus === "checking" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                  {pollingStatus === "checking" ? "Consultando status..." : "Aguardando confirmação"}
                </span>
                <span className="font-mono text-[10px] text-slate-400">Pedido: {orderId}</span>
              </div>

              <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Liberação estrita • O download em PDF só é liberado com comprovante real</span>
              </div>
            </div>
          </div>
        )}

        {/* OWNER CONFIGURATION & APPROVAL MODAL (PROTECTED WITH PASSWORD 230513) */}
        <AdminPanelModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          currentOrderId={orderId}
          onApproveCurrentOrder={handleAdminApprove}
        />

      </div>
    </div>
  );
}
