import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import ResumeBuilder from "./components/ResumeBuilder";
import ResumePreview from "./components/ResumePreview";
import CoverLetterBuilder from "./components/CoverLetterBuilder";
import Dashboard from "./components/Dashboard";
import CheckoutPayment from "./components/CheckoutPayment";
import AntiScreenshotProtection from "./components/AntiScreenshotProtection";
import { ResumeData, CoverLetterData, PaymentRecord, PersonalInfo } from "./types";
import { Sparkles, Loader2, Moon, Sun } from "lucide-react";
import { 
  fetchResumesFromDb, 
  saveResumeToDb, 
  deleteResumeFromDb, 
  fetchCoverLettersFromDb, 
  saveCoverLetterToDb, 
  deleteCoverLetterFromDb, 
  fetchPaymentsFromDb, 
  savePaymentToDb 
} from "./lib/firebase";

const USER_EMAIL = "jg.gonsalves.bernardo.g@gmail.com";

const INITIAL_PERSONAL: PersonalInfo = {
  name: "Felipe Rodrigues",
  email: "felipe.rodrigues@email.com",
  phone: "(11) 98888-7777",
  city: "São Paulo - SP",
  linkedin: "linkedin.com/in/felipe-rodrigues",
  website: "felipe-dev.com",
  objective: "Engenheiro de Software Full Stack"
};

const INITIAL_EXPERIENCES = [
  {
    id: "exp_1",
    company: "Tech Solutions",
    role: "Desenvolvedor Full Stack Sênior",
    period: "Jan 2023 - Atual",
    current: true,
    description: "• Desenvolvi o front-end principal utilizando React e Tailwind CSS.\n• Otimizei consultas no banco de dados e reduzi o tempo de resposta das APIs em 40%.\n• Liderava equipe de 4 desenvolvedores juniores."
  }
];

const INITIAL_EDUCATION = [
  {
    id: "edu_1",
    institution: "FIAP",
    course: "Análise e Desenvolvimento de Sistemas",
    level: "Graduação",
    period: "2020 - 2022"
  }
];

const INITIAL_SKILLS = ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Docker"];
const INITIAL_LANGUAGES = ["Português (Nativo)", "Inglês (Avançado)"];
const INITIAL_CERTIFICATIONS = [
  { name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", year: "2024" }
];

const ensureCleanResume = (r: any): ResumeData => {
  return {
    id: r.id || `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: r.title || "Meu Currículo Otimizado",
    personal: {
      name: r.personal?.name || "",
      email: r.personal?.email || USER_EMAIL,
      phone: r.personal?.phone || "",
      city: r.personal?.city || "",
      linkedin: r.personal?.linkedin || "",
      website: r.personal?.website || "",
      objective: r.personal?.objective || ""
    },
    experience: r.experience || [],
    education: r.education || [],
    skills: r.skills || [],
    languages: r.languages || [],
    certifications: r.certifications || [],
    template: r.template || "modern",
    fontFamily: r.fontFamily || "Inter",
    colorTheme: r.colorTheme || "indigo",
    atsScore: r.atsScore || 90,
    suggestions: r.suggestions || [],
    paid: r.paid || false,
    coverLetterUnlocked: r.coverLetterUnlocked || false,
    updatedAt: r.updatedAt || new Date().toISOString()
  };
};

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "builder" | "preview" | "cover-letter" | "checkout">("landing");
  const [dbLoading, setDbLoading] = useState(true);
  
  // Theme state & Sync with DOM & localStorage
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("resumeai_theme");
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("resumeai_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  
  // Persistence states
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetterData[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<{
    sessionId: string;
    resumeId: string;
    type: "resume" | "cover_letter";
  } | null>(null);

  // Load state from Firestore on init (with localStorage fallback and syncing)
  useEffect(() => {
    async function loadData() {
      try {
        const [dbResumes, dbLetters, dbPayments] = await Promise.all([
          fetchResumesFromDb(USER_EMAIL),
          fetchCoverLettersFromDb(USER_EMAIL),
          fetchPaymentsFromDb(USER_EMAIL)
        ]);

        if (dbResumes.length > 0) {
          setResumes(dbResumes.map(ensureCleanResume));
        } else {
          const savedResumes = localStorage.getItem("resumeai_resumes");
          if (savedResumes) {
            const parsed = (JSON.parse(savedResumes) as ResumeData[]).map(ensureCleanResume);
            setResumes(parsed);
            parsed.forEach(r => saveResumeToDb(r, USER_EMAIL));
          }
        }

        if (dbLetters.length > 0) {
          setCoverLetters(dbLetters);
        } else {
          const savedLetters = localStorage.getItem("resumeai_letters");
          if (savedLetters) {
            const parsed = JSON.parse(savedLetters) as CoverLetterData[];
            setCoverLetters(parsed);
            parsed.forEach(l => saveCoverLetterToDb(l, USER_EMAIL));
          }
        }

        if (dbPayments.length > 0) {
          setPayments(dbPayments);
        } else {
          const savedPayments = localStorage.getItem("resumeai_payments");
          if (savedPayments) {
            const parsed = JSON.parse(savedPayments) as PaymentRecord[];
            setPayments(parsed);
            parsed.forEach(p => savePaymentToDb(p, USER_EMAIL));
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar com banco de dados:", error);
      } finally {
        setDbLoading(false);
      }
    }
    loadData();
  }, []);

  // Save states helper
  const saveResumesState = async (newResumes: ResumeData[], itemToSave?: ResumeData) => {
    setResumes(newResumes);
    localStorage.setItem("resumeai_resumes", JSON.stringify(newResumes));
    if (itemToSave) {
      await saveResumeToDb(itemToSave, USER_EMAIL);
    }
  };

  const saveLettersState = async (newLetters: CoverLetterData[], itemToSave?: CoverLetterData) => {
    setCoverLetters(newLetters);
    localStorage.setItem("resumeai_letters", JSON.stringify(newLetters));
    if (itemToSave) {
      await saveCoverLetterToDb(itemToSave, USER_EMAIL);
    }
  };

  const savePaymentsState = async (newPayments: PaymentRecord[], itemToSave?: PaymentRecord) => {
    setPayments(newPayments);
    localStorage.setItem("resumeai_payments", JSON.stringify(newPayments));
    if (itemToSave) {
      await savePaymentToDb(itemToSave, USER_EMAIL);
    }
  };

  // Create a clean new resume
  const handleCreateNewResume = async () => {
    const newId = `resume_${Date.now()}`;
    const newResume: ResumeData = {
      id: newId,
      title: `Currículo Otimizado - ${resumes.length + 1}`,
      personal: INITIAL_PERSONAL,
      experience: INITIAL_EXPERIENCES,
      education: INITIAL_EDUCATION,
      skills: INITIAL_SKILLS,
      languages: INITIAL_LANGUAGES,
      certifications: INITIAL_CERTIFICATIONS,
      updatedAt: new Date().toISOString()
    };

    const updated = [...resumes, newResume];
    await saveResumesState(updated, newResume);
    setSelectedResumeId(newId);
    setCurrentView("builder");
  };

  const handleSaveResume = async (updatedResume: ResumeData) => {
    const updated = resumes.map((r) => (r.id === updatedResume.id ? updatedResume : r));
    await saveResumesState(updated, updatedResume);
    setSelectedResumeId(updatedResume.id);
    setCurrentView("preview");
  };

  const handleDeleteResume = async (id: string) => {
    const remainingResumes = resumes.filter((r) => r.id !== id);
    const remainingLetters = coverLetters.filter((l) => l.resumeId !== id);
    
    setResumes(remainingResumes);
    localStorage.setItem("resumeai_resumes", JSON.stringify(remainingResumes));
    
    setCoverLetters(remainingLetters);
    localStorage.setItem("resumeai_letters", JSON.stringify(remainingLetters));

    if (selectedResumeId === id) {
      setSelectedResumeId(null);
    }

    await deleteResumeFromDb(id);
    await deleteCoverLetterFromDb(id);
  };

  const handleSaveCoverLetter = async (updatedLetter: CoverLetterData) => {
    const exists = coverLetters.find((l) => l.resumeId === updatedLetter.resumeId);
    let newLetters = [];
    if (exists) {
      newLetters = coverLetters.map((l) => (l.resumeId === updatedLetter.resumeId ? updatedLetter : l));
    } else {
      newLetters = [...coverLetters, updatedLetter];
    }
    await saveLettersState(newLetters, updatedLetter);
  };

  // Payment triggers
  const handleUnlockPayment = async (type: "resume" | "cover_letter") => {
    if (!selectedResumeId) return;
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId, type })
      });
      const data = await response.json();
      if (data.sessionId) {
        setCheckoutSession({
          sessionId: data.sessionId,
          resumeId: selectedResumeId,
          type
        });
        setCurrentView("checkout");
      }
    } catch (error) {
      console.error("Falha ao abrir checkout:", error);
    }
  };

  const handlePaymentSuccess = async (resumeId: string, type: "resume" | "cover_letter", amount: number) => {
    // 1. Update resume status
    const targetResume = resumes.find((r) => r.id === resumeId);
    if (!targetResume) return;

    const updatedResume = {
      ...targetResume,
      paid: type === "resume" ? true : targetResume.paid,
      coverLetterUnlocked: type === "cover_letter" ? true : targetResume.coverLetterUnlocked
    };

    const updatedResumes = resumes.map((r) => (r.id === resumeId ? updatedResume : r));
    await saveResumesState(updatedResumes, updatedResume);

    // 2. Register payment invoice
    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      item: type,
      amount,
      status: "completed",
      date: new Date().toISOString(),
      resumeTitle: targetResume.title
    };
    await savePaymentsState([...payments, newPayment], newPayment);

    // 3. Mark for automatic download on arrival
    if (type === "resume") {
      sessionStorage.setItem("just_paid_resume_id", resumeId);
    } else {
      sessionStorage.setItem("just_paid_letter_id", resumeId);
    }

    // 4. Navigate back to workspace
    setCheckoutSession(null);
    setCurrentView(type === "resume" ? "preview" : "cover-letter");
  };

  // Automatically detect return from payment link / gateway with ?status=approved
  useEffect(() => {
    if (resumes.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") || params.get("collection_status");
    const targetResumeId = params.get("resumeId") || selectedResumeId || resumes[0]?.id;
    const paymentType = (params.get("type") as "resume" | "cover_letter") || "resume";

    if (status === "approved" && targetResumeId) {
      handlePaymentSuccess(targetResumeId, paymentType, 9.90);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [resumes, selectedResumeId]);

  // Active items mapping
  const activeResume = resumes.find((r) => r.id === selectedResumeId) || null;
  const activeCoverLetter = coverLetters.find((l) => l.resumeId === selectedResumeId) || null;

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <div className="text-center space-y-1">
          <h2 className="font-bold text-lg tracking-tight">Sincronizando Banco de Dados</h2>
          <p className="text-xs text-slate-400">Carregando seus currículos otimizados e histórico da nuvem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Anti-Screenshot & Content Protection Active Across Entire App */}
      <AntiScreenshotProtection />

      {/* Dynamic Navigation for internal pages */}
      {currentView !== "landing" && currentView !== "checkout" && (
        <nav className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => setCurrentView("landing")}
              className="flex items-center gap-2 text-slate-900 font-bold tracking-tight text-lg cursor-pointer"
            >
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              Curri<span className="text-indigo-600">Fast</span>
            </button>

            <div className="flex gap-4 items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center bg-white"
                title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer transition-all ${
                  currentView === "dashboard" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Painel
              </button>
              {activeResume && (
                <>
                  <button
                    onClick={() => setCurrentView("builder")}
                    className={`text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer transition-all ${
                      currentView === "builder" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Formulário
                  </button>
                  <button
                    onClick={() => setCurrentView("preview")}
                    className={`text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer transition-all ${
                      currentView === "preview" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Currículo
                  </button>
                  <button
                    onClick={() => setCurrentView("cover-letter")}
                    className={`text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer transition-all ${
                      currentView === "cover-letter" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Carta
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Views Router Container */}
      <main className="flex-grow">
        {currentView === "landing" && (
          <LandingPage
            onStart={handleCreateNewResume}
            onGoToDashboard={() => setCurrentView("dashboard")}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {currentView === "dashboard" && (
          <Dashboard
            resumes={resumes}
            coverLetters={coverLetters}
            payments={payments}
            userEmail={USER_EMAIL}
            onEditResume={(id) => {
              setSelectedResumeId(id);
              setCurrentView("builder");
            }}
            onViewResume={(id) => {
              setSelectedResumeId(id);
              setCurrentView("preview");
            }}
            onCreateNewResume={handleCreateNewResume}
            onDeleteResume={handleDeleteResume}
            onEditCoverLetter={(resumeId) => {
              setSelectedResumeId(resumeId);
              setCurrentView("cover-letter");
            }}
          />
        )}

        {currentView === "builder" && activeResume && (
          <ResumeBuilder
            initialData={activeResume}
            onSave={handleSaveResume}
            onBack={() => setCurrentView("dashboard")}
          />
        )}

        {currentView === "preview" && activeResume && (
          <ResumePreview
            resume={activeResume}
            onUpdate={(updated) => {
              const list = resumes.map((r) => (r.id === updated.id ? updated : r));
              saveResumesState(list, updated);
            }}
            onUnlockPayment={(item) => handleUnlockPayment(item)}
            onGoToCoverLetter={() => setCurrentView("cover-letter")}
          />
        )}

        {currentView === "cover-letter" && activeResume && (
          <CoverLetterBuilder
            resume={activeResume}
            coverLetter={activeCoverLetter}
            onSave={handleSaveCoverLetter}
            onUnlockPayment={() => handleUnlockPayment("cover_letter")}
            onBack={() => setCurrentView("preview")}
          />
        )}

        {currentView === "checkout" && checkoutSession && (
          <CheckoutPayment
            sessionId={checkoutSession.sessionId}
            resumeId={checkoutSession.resumeId}
            type={checkoutSession.type}
            resumeTitle={activeResume?.title || "Sem Título"}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setCurrentView(checkoutSession.type === "resume" ? "preview" : "cover-letter")}
          />
        )}
      </main>
    </div>
  );
}
