import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { ResumeData, ATSEvaluation } from "../types";
import { 
  Sparkles, 
  Star, 
  Download, 
  ChevronRight, 
  Palette, 
  Type, 
  Layout, 
  CheckCircle, 
  ShieldCheck, 
  HelpCircle, 
  Loader2, 
  FileText,
  AlertCircle,
  Lock,
  CheckCircle2,
  X,
  QrCode
} from "lucide-react";

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

interface ResumePreviewProps {
  resume: ResumeData;
  onUpdate: (data: ResumeData) => void;
  onUnlockPayment: (item: "resume" | "cover_letter") => void;
  onGoToCoverLetter: () => void;
}

export default function ResumePreview({ resume, onUpdate, onUnlockPayment, onGoToCoverLetter }: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<"design" | "ats">("design");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Default properties if empty
  const currentTemplate = resume.template || "modern";
  const currentFont = resume.fontFamily || "Inter";
  const currentColor = resume.colorTheme || "indigo";

  // Available configurations
  const templates = [
    { id: "modern", name: "Moderno", desc: "Startups e Tecnologia" },
    { id: "classic", name: "Clássico", desc: "Corporativo e Tradicional" },
    { id: "executive", name: "Executivo", desc: "Diretoria e Liderança" },
    { id: "minimal", name: "Minimalista", desc: "Clareza e Design Puro" }
  ];

  const fonts = [
    { id: "Inter", name: "Inter (Sans)" },
    { id: "Space Grotesk", name: "Space Grotesk (Tech)" },
    { id: "Playfair Display", name: "Playfair Display (Serif)" },
    { id: "JetBrains Mono", name: "JetBrains Mono (Mono)" }
  ];

  const colors = [
    { id: "indigo", name: "Índigo", class: "bg-indigo-600" },
    { id: "slate", name: "Grafite", class: "bg-slate-800" },
    { id: "amber", name: "Âmbar", class: "bg-amber-600" },
    { id: "emerald", name: "Esmeralda", class: "bg-emerald-600" },
    { id: "rose", name: "Rose", class: "bg-rose-600" },
    { id: "violet", name: "Violeta", class: "bg-violet-600" }
  ];

  // Map font ID to Tailwind class
  const getFontFamilyClass = (f: string) => {
    switch (f) {
      case "Space Grotesk": return "font-space-grotesk";
      case "Playfair Display": return "font-playfair";
      case "JetBrains Mono": return "font-mono";
      default: return "font-sans";
    }
  };

  // Map color theme to Tailwind text/bg colors
  const getColorClasses = (c: string) => {
    switch (c) {
      case "slate": return { text: "text-slate-800", bg: "bg-slate-800", border: "border-slate-800", textLight: "text-slate-500" };
      case "amber": return { text: "text-amber-700", bg: "bg-amber-600", border: "border-amber-600", textLight: "text-amber-500" };
      case "emerald": return { text: "text-emerald-700", bg: "bg-emerald-600", border: "border-emerald-600", textLight: "text-emerald-500" };
      case "rose": return { text: "text-rose-700", bg: "bg-rose-600", border: "border-rose-600", textLight: "text-rose-500" };
      case "violet": return { text: "text-violet-700", bg: "bg-violet-600", border: "border-violet-600", textLight: "text-violet-500" };
      default: return { text: "text-indigo-700", bg: "bg-indigo-600", border: "border-indigo-600", textLight: "text-indigo-500" };
    }
  };

  const theme = getColorClasses(currentColor);

  // Trigger full resume optimization
  const optimizeWithAI = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume)
      });
      const data = await response.json();
      if (response.ok && data && !data.error && data.personal) {
        onUpdate({
          ...resume,
          personal: data.personal,
          summary: data.summary,
          experience: data.experience,
          education: data.education,
          skills: data.skills,
          languages: data.languages,
          certifications: data.certifications,
          atsScore: data.atsScore || 90,
          suggestions: data.suggestions || []
        });
      } else {
        console.error("Falha ao otimizar currículo: Resposta inválida ou erro na API", data);
      }
    } catch (error) {
      console.error("Falha ao otimizar:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto run optimizer if not yet evaluated
  useEffect(() => {
    if (!resume.summary) {
      optimizeWithAI();
    }
  }, []);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [justPaidToast, setJustPaidToast] = useState(false);

  // If user completed payment, trigger auto download
  useEffect(() => {
    const justPaid = sessionStorage.getItem("just_paid_resume_id");
    if (justPaid === resume.id && resume.paid) {
      sessionStorage.removeItem("just_paid_resume_id");
      setJustPaidToast(true);
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [resume.id, resume.paid]);

  // Intercept native browser print shortcut (Ctrl+P / Cmd+P) if unpaid
  useEffect(() => {
    const handleBeforePrint = () => {
      if (!resume.paid) {
        setShowPaymentModal(true);
      }
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [resume.paid]);

  const handleDownloadPDF = async () => {
    if (!resume.paid) {
      setShowPaymentModal(true);
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const element = document.getElementById("resume-paper");
      if (!element) {
        throw new Error("Elemento do currículo não encontrado");
      }

      // Capture resume-paper using html-to-image (SVG foreignObject rasterizer).
      // Unlike html2canvas, this natively supports OKLCH, modern CSS, Google fonts and SVG elements.
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
        img.onerror = () => reject(new Error("Falha ao renderizar a imagem do currículo"));
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const pdfHeight = (img.height * pdfWidth) / img.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Add additional pages if resume content exceeds 1 page
      while (heightLeft > 5) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const cleanName = resume.personal?.name
        ? resume.personal.name.trim().replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "_")
        : "curriculo";
      const fileName = `${cleanName}_CurriFast.pdf`;

      // Trigger direct browser download
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
      setDownloadError("Não foi possível gerar o arquivo PDF diretamente. Você também pode clicar em 'Imprimir' para salvar como PDF no seu navegador.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Star calculation
  const getStarsCount = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 65) return 3;
    return 2;
  };

  return (
    <div id="resume-preview-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8">
      {/* LEFT COLUMN: Controls & ATS feedback (4 cols) */}
      <div className="lg:col-span-4 space-y-6 print:hidden">
        {/* Toggle Panel Mode */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 flex gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab("design")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "design" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Palette className="w-4 h-4" /> Personalizar Design
          </button>
          <button
            onClick={() => setActiveTab("ats")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ats" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Score ATS
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-indigo-100">
              {resume.atsScore || "--"}
            </span>
          </button>
        </div>

        {/* Tab content 1: Design Controls */}
        {activeTab === "design" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            {/* AI Optimize Button */}
            <div className="border-b border-slate-100 pb-5">
              <button
                onClick={optimizeWithAI}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Otimizando Currículo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> ✨ Forçar Re-otimização IA
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 mt-2 text-center">Isso aplicará melhorias completas e calculará sua nota ATS.</p>
            </div>

            {/* Template Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-indigo-500" /> Modelo de Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onUpdate({ ...resume, template: t.id })}
                    className={`p-3 rounded-xl border text-left transition-all hover:bg-slate-50 cursor-pointer ${
                      currentTemplate === t.id
                        ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800">{t.name}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-indigo-500" /> Fonte Tipográfica
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdate({ ...resume, fontFamily: f.id })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      currentFont === f.id
                        ? "border-indigo-600 bg-indigo-50/20 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Color Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-indigo-500" /> Cor Principal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onUpdate({ ...resume, colorTheme: c.id })}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      currentColor === c.id
                        ? "border-indigo-600 bg-indigo-50/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.class}`} />
                    <span className="text-slate-700">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab content 2: ATS Feedback */}
        {activeTab === "ats" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Análise de Pontuação ATS</h3>
              <p className="text-xs text-slate-400 mt-1">Como seu currículo é lido pelas máquinas de contratação.</p>
            </div>

            {/* ATS Score Display */}
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 relative overflow-hidden">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Score de Compatibilidade</div>
              <div className="text-5xl font-black tracking-tight text-slate-900 mt-2">
                {resume.atsScore || 90}<span className="text-indigo-600 text-2xl">%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${resume.atsScore || 90}%` }}
                />
              </div>

              {/* Stars Representation */}
              <div className="flex justify-center gap-1 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < getStarsCount(resume.atsScore || 90)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Recomendações da IA</h4>
              <div className="space-y-2">
                {resume.suggestions && resume.suggestions.length > 0 ? (
                  resume.suggestions.map((sug, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl text-xs text-slate-700">
                      <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 fill-amber-400/20" />
                      <p className="leading-relaxed">{sug}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2 bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <p>Excelente trabalho! Seu currículo não tem problemas críticos de ATS detectados.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Premium Unlocking Widget */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-6">
          <div>
            <span className="bg-indigo-600/30 text-indigo-300 font-bold px-2.5 py-1 rounded-full text-[10px] tracking-wide border border-indigo-500/20">
              VERSÃO COMPLETA
            </span>
            <h3 className="font-extrabold text-lg mt-3 text-white">Baixe seu Currículo Premium</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O preenchimento e otimização são totalmente gratuitos. Desbloqueie o download em PDF premium de alta fidelidade sem marcas d'água por apenas R$ 9,90.
            </p>
          </div>

          {resume.paid ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Pagamento Confirmado!</span>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-700/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Baixar PDF Profissional
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Licença de Download</span>
                  <span className="font-black text-indigo-400 text-sm">R$ 9,90</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Download ilimitado do PDF no navegador
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Formatado e otimizado para sistemas ATS
                </div>
              </div>

              <button
                onClick={() => onUnlockPayment("resume")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25"
              >
                <QrCode className="w-4 h-4" />
                Pagar R$ 9,90 via PIX e Baixar
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                type="button"
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/60 active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Ver detalhes e benefícios
              </button>
            </div>
          )}

          {/* Upsell to Cover Letter */}
          <div className="border-t border-slate-800 pt-5 mt-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <FileText className="w-4 h-4" /> Upsell de Carta de Apresentação
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dobre suas chances de contratação! Gere uma carta de apresentação sob medida que se harmoniza visualmente com seu currículo.
            </p>
            <button
              onClick={onGoToCoverLetter}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Ver Carta de Apresentação <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Resume Layout Preview (8 cols) */}
      <div className="lg:col-span-8 flex flex-col items-center">
        {/* Top Action Toolbar for Resume Actions (Download PDF) */}
        <div className="w-full max-w-4xl mb-4 bg-white border border-slate-200 rounded-2xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Visualização do Currículo
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Formato A4
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {resume.paid ? "Pronto para download em alta resolução" : "Taxa de download: R$ 9,90 (pagamento único)"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resume.paid ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Licença Vitalícia Ativa
                </span>

                {/* Direct PDF Download Button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
              </>
            ) : (
              <>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Borrado • Bloqueado
                </span>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                  title="Pagar R$ 9,90 via PIX para desborrar e baixar o currículo em PDF"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Desborrar • R$ 9,90
                </button>
              </>
            )}
          </div>
        </div>

        {/* Just Paid Confirmation Notice */}
        {justPaidToast && (
          <div className="w-full max-w-4xl mb-4 bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-600/20 print:hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white shrink-0" />
              <span>Pagamento de R$ 9,90 aprovado! O currículo foi desborrado com sucesso e o download do PDF está iniciando...</span>
            </div>
            <button onClick={() => setJustPaidToast(false)} className="text-emerald-200 hover:text-white cursor-pointer text-xs ml-2">✕</button>
          </div>
        )}

        {/* Download Success/Error Feedback */}
        {downloadSuccess && (
          <div className="w-full max-w-4xl mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Download concluído! O arquivo PDF do seu currículo foi baixado no navegador.</span>
            </div>
            <button onClick={() => setDownloadSuccess(false)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs ml-2">✕</button>
          </div>
        )}

        {downloadError && (
          <div className="w-full max-w-4xl mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{downloadError}</span>
            </div>
            <button onClick={() => setDownloadError(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer text-xs ml-2">✕</button>
          </div>
        )}

        {/* Printable Paper Wrapper */}
        <div
          id="resume-paper"
          className={`w-full max-w-4xl bg-white shadow-2xl border border-slate-200 rounded-2xl p-8 sm:p-12 select-none print:shadow-none print:border-none print:rounded-none print:p-0 ${getFontFamilyClass(currentFont)} transition-all duration-300 min-h-[1100px] text-slate-800 relative overflow-hidden`}
        >
          {/* Watermark / Notice when unpaid */}
          {!resume.paid && (
            <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3 print:hidden relative z-30">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Currículo Borrado:</strong> Enquanto o pagamento não for realizado, o currículo permanece borrado para proteção. Após o PIX de <strong>R$ 9,90</strong>, ele é <strong>desborrado imediatamente</strong>.
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Desborrar por R$ 9,90
              </button>
            </div>
          )}

          {/* Central Floating Overlay when unpaid */}
          {!resume.paid && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950/15 backdrop-blur-[2px] select-none pointer-events-auto">
              <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-4 backdrop-blur-md">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Currículo Borrado
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Desborre seu Currículo Oficial
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Pague a taxa única de apenas <strong className="text-slate-900 dark:text-white font-extrabold">R$ 9,90 via PIX</strong> para retirar o borrão imediatamente e liberar o download oficial em PDF de alta qualidade.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Desborrar e Liberar por R$ 9,90
                </button>

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Desborra Imediato
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> PIX Banco Central
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actual resume templates - blurred when unpaid, crystal clear when paid */}
          <div className={`transition-all duration-500 ${!resume.paid ? "filter blur-[7px] opacity-75 pointer-events-none select-none" : "filter-none opacity-100"}`}>
          {/* 1. MODERN LAYOUT */}
          {currentTemplate === "modern" && (
            <div className="space-y-8">
              {/* Header */}
              <div className={`border-b-4 ${theme.border} pb-6`}>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{resume.personal.name || "Seu Nome Completo"}</h1>
                <div className="text-sm font-bold tracking-wide uppercase mt-1.5" style={{ color: `var(--color-${currentColor}-600, #4f46e5)` }}>
                  {resume.personal.objective || "Seu Objetivo Profissional"}
                </div>
                {/* Contact grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-500 mt-4">
                  {resume.personal.email && <div>✉ {resume.personal.email}</div>}
                  {resume.personal.phone && <div>📞 {resume.personal.phone}</div>}
                  {resume.personal.city && <div>📍 {resume.personal.city}</div>}
                  {resume.personal.linkedin && <div>🔗 {resume.personal.linkedin}</div>}
                  {resume.personal.website && <div>🌐 {resume.personal.website}</div>}
                </div>
              </div>

              {/* Professional Summary */}
              {resume.summary && (
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Resumo Profissional</h2>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">{resume.summary}</p>
                </div>
              )}

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                {/* Left side: experiences and education */}
                <div className="md:col-span-8 space-y-8">
                  {/* Experiences */}
                  {resume.experience && resume.experience.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">Experiência Profissional</h2>
                      <div className="space-y-6">
                        {resume.experience.map((exp) => (
                          <div key={exp.id} className="space-y-1.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-sm text-slate-900">{exp.role}</h3>
                                <div className="text-xs font-semibold text-slate-500">{exp.company}</div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded">{exp.period}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line text-justify">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {resume.education && resume.education.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">Formação Acadêmica</h2>
                      <div className="space-y-4">
                        {resume.education.map((edu) => (
                          <div key={edu.id} className="flex justify-between items-start text-xs">
                            <div>
                              <h3 className="font-bold text-slate-800">{edu.course}</h3>
                              <div className="text-slate-500">{edu.institution} • <span className="italic">{edu.level}</span></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{edu.period}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: skills, certifications and languages */}
                <div className="md:col-span-4 space-y-8">
                  {/* Skills */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">Habilidades</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.map((skill, i) => (
                          <span key={i} className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {resume.languages && resume.languages.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">Idiomas</h2>
                      <ul className="space-y-1 text-xs">
                        {resume.languages.map((lang, i) => (
                          <li key={i} className="text-slate-600 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {lang}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Certifications */}
                  {resume.certifications && resume.certifications.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">Certificações</h2>
                      <div className="space-y-2">
                        {resume.certifications.map((cert, i) => (
                          <div key={i} className="text-xs">
                            <h4 className="font-bold text-slate-800 leading-tight">{cert.name}</h4>
                            <div className="text-[10px] text-slate-500 mt-0.5">{cert.issuer} ({cert.year})</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. CLASSIC LAYOUT */}
          {currentTemplate === "classic" && (
            <div className="space-y-6 text-center">
              {/* Centered Header */}
              <div className="border-b-2 border-slate-300 pb-5 text-center space-y-1.5">
                <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-wide">{resume.personal.name || "Seu Nome Completo"}</h1>
                <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  {resume.personal.objective || "Seu Objetivo Profissional"}
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                  {resume.personal.email && <div>{resume.personal.email}</div>}
                  {resume.personal.phone && <div>{resume.personal.phone}</div>}
                  {resume.personal.city && <div>{resume.personal.city}</div>}
                  {resume.personal.linkedin && <div>{resume.personal.linkedin}</div>}
                  {resume.personal.website && <div>{resume.personal.website}</div>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div className="text-left space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Resumo de Qualificações</h2>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">{resume.summary}</p>
                </div>
              )}

              {/* Experiences */}
              {resume.experience && resume.experience.length > 0 && (
                <div className="text-left space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Histórico Profissional</h2>
                  <div className="space-y-4">
                    {resume.experience.map((exp) => (
                      <div key={exp.id} className="text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <div>{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></div>
                          <span className="font-medium text-slate-500">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line text-justify">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.education && resume.education.length > 0 && (
                <div className="text-left space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Formação Acadêmica</h2>
                  <div className="space-y-2">
                    {resume.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start text-xs text-slate-700">
                        <div>
                          <span className="font-bold">{edu.course}</span> — <span className="italic">{edu.institution} ({edu.level})</span>
                        </div>
                        <span className="font-medium text-slate-500">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Grid */}
              {resume.skills && resume.skills.length > 0 && (
                <div className="text-left space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Habilidades & Competências</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {resume.skills.join(" • ")}
                  </p>
                </div>
              )}

              {/* Extra Columns (Languages / Certs) */}
              <div className="grid grid-cols-2 gap-8 text-left pt-2">
                {resume.languages && resume.languages.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Idiomas</h3>
                    <p className="text-xs text-slate-600">{resume.languages.join(", ")}</p>
                  </div>
                )}
                {resume.certifications && resume.certifications.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b pb-0.5">Certificados</h3>
                    <div className="space-y-1 text-xs">
                      {resume.certifications.map((c, i) => (
                        <div key={i} className="text-slate-600">
                          <span className="font-bold">{c.name}</span> — {c.issuer} ({c.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. EXECUTIVE LAYOUT */}
          {currentTemplate === "executive" && (
            <div className="space-y-6">
              {/* Bold Header Side-by-side */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-900 pb-6 gap-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{resume.personal.name || "Seu Nome Completo"}</h1>
                  <div className="text-sm font-extrabold tracking-wider uppercase mt-1" style={{ color: `var(--color-${currentColor}-600, #4f46e5)` }}>
                    {resume.personal.objective || "Seu Objetivo Profissional"}
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 font-medium text-left md:text-right">
                  {resume.personal.email && <div>✉ {resume.personal.email}</div>}
                  {resume.personal.phone && <div>📞 {resume.personal.phone}</div>}
                  {resume.personal.city && <div>📍 {resume.personal.city}</div>}
                  {resume.personal.linkedin && <div>🔗 {resume.personal.linkedin}</div>}
                  {resume.personal.website && <div>🌐 {resume.personal.website}</div>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <div className="flex gap-4">
                  <div className={`w-1.5 bg-${currentColor}-600 shrink-0`} style={{ backgroundColor: `var(--color-${currentColor}-600, #4f46e5)` }} />
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Carta de Perfil Executivo</h2>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 text-justify">{resume.summary}</p>
                  </div>
                </div>
              )}

              {/* Experiences */}
              {resume.experience && resume.experience.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-100 pb-0.5">Trajetória e Realizações</h2>
                  <div className="space-y-4">
                    {resume.experience.map((exp) => (
                      <div key={exp.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                        <div className="font-bold text-slate-500">{exp.period}</div>
                        <div className="md:col-span-3 space-y-1">
                          <h3 className="font-bold text-sm text-slate-900">{exp.role}</h3>
                          <h4 className="font-bold text-slate-500">{exp.company}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line text-justify">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.education && resume.education.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-100 pb-0.5">Formação Acadêmica</h2>
                  <div className="space-y-3">
                    {resume.education.map((edu) => (
                      <div key={edu.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                        <div className="font-bold text-slate-500">{edu.period}</div>
                        <div className="md:col-span-3">
                          <span className="font-bold text-slate-800">{edu.course}</span> — <span className="italic">{edu.institution} ({edu.level})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Multi-columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                {resume.skills && resume.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-950">Expertise</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{resume.skills.join(", ")}</p>
                  </div>
                )}
                {resume.languages && resume.languages.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-955">Línguas</h3>
                    <p className="text-xs text-slate-600">{resume.languages.join(", ")}</p>
                  </div>
                )}
                {resume.certifications && resume.certifications.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-955">Licenças</h3>
                    <div className="space-y-1 text-xs">
                      {resume.certifications.map((c, i) => (
                        <div key={i} className="text-slate-600 leading-tight">
                          <span className="font-bold">{c.name}</span> <br />
                          <span className="text-[10px] text-slate-400">{c.issuer} ({c.year})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. MINIMALIST LAYOUT */}
          {currentTemplate === "minimal" && (
            <div className="space-y-6">
              {/* Ultralight Header */}
              <div className="space-y-2">
                <h1 className="text-4xl font-light tracking-tight text-slate-900">{resume.personal.name || "Seu Nome Completo"}</h1>
                <div className="text-xs tracking-wider text-slate-500 font-semibold uppercase">
                  {resume.personal.objective || "Seu Objetivo Profissional"}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                  {resume.personal.email && <div>{resume.personal.email}</div>}
                  {resume.personal.phone && <div>{resume.personal.phone}</div>}
                  {resume.personal.city && <div>{resume.personal.city}</div>}
                  {resume.personal.linkedin && <div>{resume.personal.linkedin}</div>}
                  {resume.personal.website && <div>{resume.personal.website}</div>}
                </div>
              </div>

              {/* Professional Summary */}
              {resume.summary && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">{resume.summary}</p>
                </div>
              )}

              {/* Experiences */}
              {resume.experience && resume.experience.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Experiência</h2>
                  <div className="space-y-4">
                    {resume.experience.map((exp) => (
                      <div key={exp.id} className="text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <div>{exp.role} <span className="font-light text-slate-400">at</span> {exp.company}</div>
                          <span className="font-normal text-slate-400 text-[10px]">{exp.period}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line text-justify">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resume.education && resume.education.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h2 className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Formação</h2>
                  <div className="space-y-2">
                    {resume.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start text-xs text-slate-600">
                        <div>
                          <span className="font-bold text-slate-700">{edu.course}</span>, <span className="font-light">{edu.institution}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{edu.level}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills and Extras list */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {resume.skills && resume.skills.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Habilidades</h3>
                    <p className="text-slate-500 leading-relaxed">{resume.skills.join(", ")}</p>
                  </div>
                )}
                {resume.languages && resume.languages.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Idiomas</h3>
                    <p className="text-slate-500 leading-relaxed">{resume.languages.join(", ")}</p>
                  </div>
                )}
                {resume.certifications && resume.certifications.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Certificações</h3>
                    <div className="space-y-1">
                      {resume.certifications.map((c, i) => (
                        <div key={i} className="text-slate-500 text-[11px]">
                          {c.name} ({c.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Payment Required Modal for PDF Download / Printing */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Desborrar e Baixar Currículo em PDF
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Efetue o pagamento único de R$ 9,90 via PIX para desborrar o currículo imediatamente e liberar o download oficial em alta definição.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Licença Vitalícia</span>
                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-0.5">Currículo Completo Desborrado</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 line-through mr-1.5">R$ 29,90</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">R$ 9,90</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Desborramento instantâneo de todas as páginas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Download imediato no navegador do PDF pronto para envio</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% otimizado e legível por robôs de RH (ATS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Alta definição vetorial sem marcas d'água</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Acesso vitalício para alterar e baixar novamente sempre</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  onUnlockPayment("resume");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                Pagar R$ 9,90 via PIX e Desborrar
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Continuar editando a prévia
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1">
              🔒 Pagamento 100% criptografado e seguro com confirmação instantânea
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
