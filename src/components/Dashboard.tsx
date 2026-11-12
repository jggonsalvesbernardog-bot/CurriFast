import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResumeData, CoverLetterData, PaymentRecord } from "../types";
import { Plus, FileText, Sparkles, Star, Trash2, Calendar, Award, Receipt, Mail, Eye, User, CreditCard, AlertTriangle, X, Lock } from "lucide-react";
import AdminPanelModal from "./AdminPanelModal";

interface DashboardProps {
  resumes: ResumeData[];
  coverLetters: CoverLetterData[];
  payments: PaymentRecord[];
  userEmail: string;
  onEditResume: (id: string) => void;
  onViewResume: (id: string) => void;
  onCreateNewResume: () => void;
  onDeleteResume: (id: string) => void;
  onEditCoverLetter: (resumeId: string) => void;
}

export default function Dashboard({
  resumes,
  coverLetters,
  payments,
  userEmail,
  onEditResume,
  onViewResume,
  onCreateNewResume,
  onDeleteResume,
  onEditCoverLetter
}: DashboardProps) {

  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const totalPayments = payments.reduce((sum, p) => p.status === "completed" ? sum + p.amount : sum, 0);

  return (
    <div id="dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Card banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-indigo-950/10">
        <div className="space-y-2">
          <span className="bg-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full text-xs border border-indigo-500/20">
            Painel Geral
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">Bem-vindo(a) ao CurriFast</h1>
          <p className="text-slate-300 text-sm max-w-xl">Gerencie seus currículos profissionais, faça testes de aderência ATS e otimize suas chances de contratação com Inteligência Artificial.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAdminModal(true)}
            className="bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-white font-bold px-4 py-4 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
            title="Acessar Painel do Administrador (Requer Senha)"
          >
            <Lock className="w-4 h-4 text-emerald-400" /> Painel Admin
          </button>
          <button
            onClick={onCreateNewResume}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-4 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Criar Novo Currículo
          </button>
        </div>
      </div>

      {/* Grid: Resume lists & payment statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT PANEL: My Resumes List (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Meus Currículos Otimizados
            </h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {resumes.length} {resumes.length === 1 ? "Currículo" : "Currículos"}
            </span>
          </div>

          {resumes.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-3xl p-16 text-center space-y-4 bg-white">
              <FileText className="w-12 h-12 text-slate-200 mx-auto animate-pulse" />
              <div>
                <p className="font-extrabold text-slate-700 text-lg">Nenhum currículo gerado ainda</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Você pode criar e editar seu currículo gratuitamente agora mesmo e testar sua aderência com a nossa IA.</p>
              </div>
              <button
                onClick={onCreateNewResume}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Criar Primeiro Currículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {resumes.map((resume) => {
                const letter = coverLetters.find(l => l.resumeId === resume.id);
                return (
                  <div key={resume.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-64">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-slate-900 text-base line-clamp-1">{resume.title || resume.personal?.name || "Currículo Sem Título"}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {resume.paid ? (
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-200">Desbloqueado</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-200">Borrado • R$ 9,90</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Última alteração: {new Date(resume.updatedAt).toLocaleDateString("pt-BR")}</p>

                      {/* ATS Score mini visualization */}
                      <div className="mt-4 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Score ATS</span>
                            <span>{resume.atsScore || 90}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${resume.atsScore || 90}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between gap-2 mt-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onViewResume(resume.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2.5 rounded-xl border border-indigo-100 transition-colors cursor-pointer"
                          title="Visualizar e Customizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditResume(resume.id)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Editar Form
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onEditCoverLetter(resume.id)}
                          className="bg-amber-50/50 hover:bg-amber-50 text-amber-700 px-3 py-2 rounded-xl border border-amber-100 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" /> Carta
                        </button>
                        <button
                          onClick={() => setResumeToDelete(resume.id)}
                          className="text-slate-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover Currículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: User Account Statistics & Logs (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User profile card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-indigo-600" /> Perfil do Candidato
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-lg">
                {userEmail.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">Candidato ResumeAI</div>
                <div className="text-[11px] text-slate-400">{userEmail}</div>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <div>Acesso: <span className="font-bold text-indigo-600">Vitalício</span></div>
              <div>Membro desde: <span className="font-semibold text-slate-700">{new Date().toLocaleDateString("pt-BR")}</span></div>
            </div>
          </div>

          {/* Payment statistics panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Extrato Financeiro
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Investido</div>
                <div className="text-xl font-black mt-1">R$ {totalPayments.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Faturas</div>
                <div className="text-xl font-black mt-1">{payments.length}</div>
              </div>
            </div>

            {/* Invoices sub-history */}
            <div className="pt-2">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-slate-400" /> Histórico de Transações
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {payments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Nenhum pagamento registrado.</p>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-800 uppercase text-[10px]">
                          {p.item === "resume" ? "Currículo Premium" : "Carta de Apresentação"}
                        </div>
                        <div className="text-[9px] text-slate-400">{p.resumeTitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600">R$ {p.amount.toFixed(2)}</div>
                        <div className="text-[9px] text-emerald-600 font-semibold uppercase">PAGO</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {resumeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResumeToDelete(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">Excluir Currículo?</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Esta ação é permanente e removerá este currículo (e qualquer carta de apresentação vinculada) de nossos servidores de forma permanente.
                  </p>
                </div>
                <button
                  onClick={() => setResumeToDelete(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setResumeToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteResume(resumeToDelete);
                    setResumeToDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/10 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal with Password Protection (Senha: 230513) */}
      <AdminPanelModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
