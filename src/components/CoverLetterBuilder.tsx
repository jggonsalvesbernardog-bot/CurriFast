import { useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { ResumeData, CoverLetterData } from "../types";
import { Sparkles, ArrowLeft, Download, ShieldCheck, Mail, Loader2, FileText, CheckCircle2, AlertCircle, Lock } from "lucide-react";

const oklchCache: Record<string, string> = {};

const oklchToRgbMath = (oklchStr: string): string => {
  try {
    const matches = oklchStr.match(/oklch\(\s*([0-9.]+%?)[,\s]+([0-9.]+)[,\s]+([0-9.]+)(?:\s*[/,]\s*([0-9.]+%?))?\s*\)/i);
    if (!matches) return oklchStr;

    const l = matches[1].endsWith('%') ? parseFloat(matches[1]) / 100 : parseFloat(matches[1]);
    const c = parseFloat(matches[2]);
    const h = parseFloat(matches[3]);
    const a = matches[4] ? (matches[4].endsWith('%') ? parseFloat(matches[4]) / 100 : parseFloat(matches[4])) : 1;

    // OKLCH to OKLAB
    const hRad = (h * Math.PI) / 180;
    const a_lab = c * Math.cos(hRad);
    const b_lab = c * Math.sin(hRad);

    // OKLAB to LMS
    const l_lms = l + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
    const m_lms = l - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
    const s_lms = l - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

    // LMS to LMS cubed
    const l_cube = l_lms * l_lms * l_lms;
    const m_cube = m_lms * m_lms * m_lms;
    const s_cube = s_lms * s_lms * s_lms;

    // LMS cubed to linear sRGB
    let r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    let g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    let b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

    // linear sRGB to sRGB gamma
    const gammaCorrect = (val: number) => {
      if (val <= 0.0031308) {
        return 12.92 * val;
      }
      return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
    };

    let r = Math.max(0, Math.min(255, Math.round(gammaCorrect(r_lin) * 255)));
    let g = Math.max(0, Math.min(255, Math.round(gammaCorrect(g_lin) * 255)));
    let b = Math.max(0, Math.min(255, Math.round(gammaCorrect(b_lin) * 255)));

    if (a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    console.warn("Failed to parse oklch color:", oklchStr, err);
    return oklchStr;
  }
};

const resolveSingleOklch = (oklchStr: string): string => {
  if (oklchCache[oklchStr]) {
    return oklchCache[oklchStr];
  }
  try {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgb(123, 45, 67)"; // Set a sentinel value to detect support
      ctx.fillStyle = oklchStr;
      const resolved = ctx.fillStyle;
      if (resolved && resolved !== "rgb(123, 45, 67)") {
        oklchCache[oklchStr] = resolved;
        return resolved;
      }
    }
  } catch (e) {
    console.warn("Failed to resolve oklch via canvas:", e);
  }
  // Math fallback
  const resolved = oklchToRgbMath(oklchStr);
  if (typeof resolved === "string" && resolved.includes("oklch")) {
    // Ultimate fallback to guarantee html2canvas never sees oklch
    return "rgb(100, 110, 120)";
  }
  oklchCache[oklchStr] = resolved;
  return resolved;
};

const convertOklchToRgb = (str: string): string => {
  if (typeof str !== "string" || !str.includes("oklch")) return str;
  return str.replace(/oklch\([^)]+\)/gi, (match) => {
    return resolveSingleOklch(match);
  });
};

interface CoverLetterBuilderProps {
  resume: ResumeData;
  coverLetter: CoverLetterData | null;
  onSave: (letter: CoverLetterData) => void;
  onUnlockPayment: () => void;
  onBack: () => void;
}

export default function CoverLetterBuilder({ resume, coverLetter, onSave, onUnlockPayment, onBack }: CoverLetterBuilderProps) {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [content, setContent] = useState(coverLetter?.content || "");

  const generateLetter = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: resume,
          companyName,
          jobTitle,
          recipientName
        })
      });
      const data = await response.json();
      if (data.content) {
        setContent(data.content);
        onSave({
          id: coverLetter?.id || `letter_${Date.now()}`,
          resumeId: resume.id,
          recipientName,
          companyName,
          jobTitle,
          content: data.content,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Falha ao gerar carta:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // If user completed payment for cover letter, auto download
  useEffect(() => {
    const justPaid = sessionStorage.getItem("just_paid_letter_id");
    if (justPaid === resume.id && resume.coverLetterUnlocked && content) {
      sessionStorage.removeItem("just_paid_letter_id");
      setTimeout(() => {
        handleDownloadPDF();
      }, 700);
    }
  }, [resume.id, resume.coverLetterUnlocked, content]);

  const handleDownloadPDF = async () => {
    if (!content) return;
    if (!resume.coverLetterUnlocked) {
      onUnlockPayment();
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const element = document.getElementById("cover-letter-paper");
      if (!element) {
        throw new Error("Elemento da carta não encontrado");
      }

      const imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipFonts: true,
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao renderizar a imagem da carta"));
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pageHeight = 297;
      const pdfHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanName = resume.personal?.name
        ? resume.personal.name.trim().replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_")
        : "curriculo";
      const fileName = `Carta_Apresentacao_${cleanName}_CurriFast.pdf`;

      try {
        pdf.save(fileName);
      } catch (saveErr) {
        console.warn("pdf.save fallback:", saveErr);
        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = blobUrl;
        downloadAnchor.download = fileName;
        downloadAnchor.style.display = "none";
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        setTimeout(() => {
          document.body.removeChild(downloadAnchor);
          URL.revokeObjectURL(blobUrl);
        }, 3000);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      setDownloadError("Não foi possível gerar o arquivo PDF diretamente. Você pode usar a opção 'Imprimir' para salvar como PDF no navegador.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="cover-letter-builder-container" className="max-w-6xl mx-auto px-4 py-8">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="mb-6 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 border border-slate-200 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Currículo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input Form & Upsell Card */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" /> Carta de Apresentação
              </h2>
              <p className="text-xs text-slate-400 mt-1">Gere uma carta de negócios elegante para acompanhar seu currículo.</p>
            </div>

            {/* Target Job Info Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Empresa Alvo</label>
                <input
                  type="text"
                  placeholder="Ex: Google Brasil"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Título da Vaga de Interesse</label>
                <input
                  type="text"
                  placeholder="Ex: Engenheiro de Software Full Stack"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nome do Recrutador / Destinatário (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Amanda Santos"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={generateLetter}
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Escrevendo com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" /> ✨ Escrever Carta com IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upsell Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <span className="bg-amber-600/30 text-amber-300 font-bold px-2.5 py-1 rounded-full text-[10px] tracking-wide border border-amber-500/20">
                UPSELL PREPARADO
              </span>
              <h3 className="font-extrabold text-lg mt-3 text-white">Carta de Apresentação Premium</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Apresente-se com estilo. A carta de apresentação combina perfeitamente com seu currículo, chamando a atenção de gerentes de contratação antes de lerem sua experiência técnica.
              </p>
            </div>

            {resume.coverLetterUnlocked ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold">Liberada com Sucesso!</span>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading || !content}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Baixar PDF da Carta
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Licença da Carta</span>
                    <span className="font-black text-amber-400 text-sm">R$ 9,90</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Download ilimitado do PDF da carta
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Layout harmonizado com o currículo
                  </div>
                </div>

                <button
                  onClick={onUnlockPayment}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Lock className="w-4 h-4" />
                  Liberar Carta Premium • R$ 9,90 via PIX
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Top Action Toolbar for Cover Letter Actions */}
          <div className="w-full max-w-2xl mb-4 bg-white border border-slate-200 rounded-2xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  Carta de Apresentação
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    A4
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {resume.coverLetterUnlocked ? "Pronto para download" : "Taxa de download: R$ 9,90"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {resume.coverLetterUnlocked ? (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading || !content}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Baixar arquivo PDF diretamente no navegador"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Baixar PDF
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onUnlockPayment}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  title="Adquirir por R$ 9,90 para fazer o download em PDF"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Baixar PDF • R$ 9,90
                </button>
              )}
            </div>
          </div>

          {/* Feedback toasts */}
          {downloadSuccess && (
            <div className="w-full max-w-2xl mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Download concluído! O arquivo PDF da carta foi salvo no seu computador.</span>
              </div>
              <button onClick={() => setDownloadSuccess(false)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs ml-2">✕</button>
            </div>
          )}

          {downloadError && (
            <div className="w-full max-w-2xl mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{downloadError}</span>
              </div>
              <button onClick={() => setDownloadError(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer text-xs ml-2">✕</button>
            </div>
          )}
          <div
            id="cover-letter-paper"
            className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 rounded-2xl p-10 sm:p-14 min-h-[850px] flex flex-col justify-between text-slate-800 select-none print:shadow-none print:border-none print:rounded-none print:p-0 relative overflow-hidden"
          >
            {/* Overlay when content exists but not unlocked */}
            {content && !resume.coverLetterUnlocked && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/15 backdrop-blur-[2px] select-none pointer-events-auto">
                <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-4 backdrop-blur-md">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Carta Borrada
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Desborre sua Carta
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      Adquira por apenas <strong className="text-slate-900 dark:text-white font-extrabold">+ R$ 9,90 via PIX</strong> para retirar o borrão na hora e baixar o arquivo PDF oficial.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onUnlockPayment}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    Desborrar e Liberar por R$ 9,90
                  </button>

                  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Desborra Imediato
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> PIX Banco Central
                    </span>
                  </div>
                </div>
              </div>
            )}

            {content ? (
              <div className={`space-y-6 transition-all duration-500 ${!resume.coverLetterUnlocked ? "filter blur-[6px] opacity-75 pointer-events-none select-none" : "filter-none opacity-100"}`}>
                {/* Header Information (Sender Info) */}
                <div className="border-b-2 border-slate-100 pb-5 text-sm space-y-1">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{resume.personal.name}</h1>
                  <p className="text-xs text-indigo-600 font-semibold">{resume.personal.objective}</p>
                  <div className="text-xs text-slate-400 pt-1">
                    {resume.personal.email} | {resume.personal.phone} | {resume.personal.city}
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs text-slate-400">
                  {new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}
                </div>

                {/* Body Content */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-justify font-sans">
                  {content}
                </div>

                {/* Signature */}
                <div className="pt-8 text-xs text-slate-600">
                  <p>Atenciosamente,</p>
                  <p className="font-bold text-slate-900 mt-4 text-sm">{resume.personal.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center text-slate-400 space-y-4">
                <FileText className="w-16 h-16 text-slate-200 animate-bounce" />
                <div>
                  <h3 className="font-semibold text-slate-700 text-sm">Sua carta será exibida aqui</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Preencha as informações à esquerda e clique em "Escrever Carta com IA" para gerar um texto impecável.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
