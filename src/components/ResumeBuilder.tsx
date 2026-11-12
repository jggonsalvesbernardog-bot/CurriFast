import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PersonalInfo, Experience, Education, Certification, ResumeData } from "../types";
import { User, Briefcase, GraduationCap, Code, Plus, Trash2, Sparkles, ArrowRight, ArrowLeft, Loader2, Link2, PlusCircle } from "lucide-react";

interface ResumeBuilderProps {
  initialData: ResumeData;
  onSave: (data: ResumeData) => void;
  onBack: () => void;
}

export default function ResumeBuilder({ initialData, onSave, onBack }: ResumeBuilderProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [personal, setPersonal] = useState<PersonalInfo>(initialData.personal);
  const [experiences, setExperiences] = useState<Experience[]>(initialData.experience);
  const [education, setEducation] = useState<Education[]>(initialData.education);
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [newSkill, setNewSkill] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>(initialData.languages || []);
  const [newLanguage, setNewLanguage] = useState<string>("");
  const [certifications, setCertifications] = useState<Certification[]>(initialData.certifications || []);
  const [newCert, setNewCert] = useState<Certification>({ name: "", issuer: "", year: "" });

  const [improvingId, setImprovingId] = useState<string | null>(null);

  // Experience Handlers
  const addExperience = () => {
    const newExp: Experience = {
      id: `exp_${Date.now()}`,
      company: "",
      role: "",
      period: "",
      current: false,
      description: ""
    };
    setExperiences([...experiences, newExp]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(
      experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const improveExperienceDescription = async (id: string) => {
    const exp = experiences.find((e) => e.id === id);
    if (!exp || !exp.description) return;

    setImprovingId(id);
    try {
      const response = await fetch("/api/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: exp.role,
          company: exp.company,
          description: exp.description
        })
      });
      const data = await response.json();
      if (data.improved) {
        updateExperience(id, "description", data.improved);
      }
    } catch (error) {
      console.error("Falha ao melhorar descrição:", error);
    } finally {
      setImprovingId(null);
    }
  };

  // Education Handlers
  const addEducation = () => {
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      course: "",
      level: "Graduação",
      period: ""
    };
    setEducation([...education, newEdu]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  // Skill Tags
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Languages
  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setLanguages(languages.filter((l) => l !== langToRemove));
  };

  // Certifications
  const addCertification = () => {
    if (newCert.name.trim()) {
      setCertifications([...certifications, { ...newCert }]);
      setNewCert({ name: "", issuer: "", year: "" });
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      const finalResume: ResumeData = {
        ...initialData,
        personal,
        experience: experiences,
        education,
        skills,
        languages,
        certifications,
        updatedAt: new Date().toISOString()
      };
      onSave(finalResume);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const stepInfo = [
    { num: 1, icon: <User className="w-5 h-5" />, label: "Dados Pessoais" },
    { num: 2, icon: <Briefcase className="w-5 h-5" />, label: "Experiências" },
    { num: 3, icon: <GraduationCap className="w-5 h-5" />, label: "Formação" },
    { num: 4, icon: <Code className="w-5 h-5" />, label: "Habilidades & Extras" }
  ];

  return (
    <div id="resume-builder-container" className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Progress Line */}
      <div className="mb-12">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (stepInfo.length - 1)) * 100}%` }}
          />

          {stepInfo.map((s) => (
            <button
              key={s.num}
              onClick={() => s.num <= currentStep ? setCurrentStep(s.num) : null}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all cursor-pointer ${
                currentStep === s.num
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110"
                  : currentStep > s.num
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-slate-300 text-slate-400 hover:border-slate-400"
              }`}
            >
              {currentStep > s.num ? "✓" : s.num}
              <span className="absolute top-12 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-slate-600 hidden md:block">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 p-6 md:p-10 min-h-[500px] flex flex-col justify-between">
        <div>
          <AnimatePresence mode="wait">
            {/* STEP 1: PERSONAL DETAILS */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="text-indigo-600 w-6 h-6" /> Dados Pessoais
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Insira suas informações de contato e seu objetivo de carreira.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={personal.name}
                      onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Email Profissional</label>
                    <input
                      type="email"
                      value={personal.email}
                      onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: joao.silva@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Telefone de Contato</label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Cidade e Estado</label>
                    <input
                      type="text"
                      value={personal.city}
                      onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: São Paulo - SP"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Perfil do LinkedIn</label>
                    <input
                      type="url"
                      value={personal.linkedin}
                      onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: linkedin.com/in/joaosilva"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Portfólio / Site Pessoal</label>
                    <input
                      type="url"
                      value={personal.website}
                      onChange={(e) => setPersonal({ ...personal, website: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Ex: joaosilva.dev"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Objetivo Profissional</label>
                  <textarea
                    value={personal.objective}
                    onChange={(e) => setPersonal({ ...personal, objective: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Ex: Engenheiro de Software Sênior focado em entregar soluções de alta performance..."
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: EXPERIENCE */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Briefcase className="text-indigo-600 w-6 h-6" /> Experiências Profissionais
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Adicione suas passagens profissionais recentes.</p>
                  </div>
                  <button
                    onClick={addExperience}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {experiences.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-4">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-700">Nenhuma experiência adicionada</p>
                      <p className="text-xs text-slate-400 mt-1">Adicione suas experiências anteriores para a IA poder melhorar.</p>
                    </div>
                    <button
                      onClick={addExperience}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar primeira
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    {experiences.map((exp, idx) => (
                      <div key={exp.id} className="border border-slate-200 rounded-2xl p-6 relative bg-slate-50/40 space-y-4">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-200">#{idx + 1}</span>
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remover Experiência"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Empresa</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: Google"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cargo</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: Tech Lead"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Período (Início - Fim)</label>
                            <input
                              type="text"
                              value={exp.period}
                              onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: Mar 2022 - Atual"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              id={`current-${exp.id}`}
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor={`current-${exp.id}`} className="text-xs font-semibold text-slate-600 cursor-pointer">
                              Trabalho atual nesta posição
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Descrição das Atividades</label>
                            <button
                              type="button"
                              onClick={() => improveExperienceDescription(exp.id)}
                              disabled={improvingId !== null || !exp.description}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {improvingId === exp.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Otimizando...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-300" /> ✨ Melhorar descrição com IA
                                </>
                              )}
                            </button>
                          </div>
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-mono"
                            placeholder="Descreva suas tarefas principais. Dica: clique no botão acima para que a nossa IA melhore sua descrição usando padrões modernos do mercado!"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: EDUCATION */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <GraduationCap className="text-indigo-600 w-6 h-6" /> Formação Acadêmica
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Adicione seus graus acadêmicos, faculdade e cursos importantes.</p>
                  </div>
                  <button
                    onClick={addEducation}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-semibold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-4">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-700">Nenhuma formação acadêmica</p>
                      <p className="text-xs text-slate-400 mt-1">Adicione seus certificados, cursos superiores e especializações.</p>
                    </div>
                    <button
                      onClick={addEducation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar primeira
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    {education.map((edu, idx) => (
                      <div key={edu.id} className="border border-slate-200 rounded-2xl p-6 relative bg-slate-50/40 space-y-4">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-200">#{idx + 1}</span>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remover Formação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Instituição</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: Universidade de São Paulo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Curso / Área de Estudo</label>
                            <input
                              type="text"
                              value={edu.course}
                              onChange={(e) => updateEducation(edu.id, "course", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: Engenharia de Software"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Grau / Nível de Formação</label>
                            <select
                              value={edu.level}
                              onChange={(e) => updateEducation(edu.id, "level", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                            >
                              <option value="Ensino Médio">Ensino Médio</option>
                              <option value="Tecnólogo">Tecnólogo</option>
                              <option value="Graduação">Graduação / Bacharelado</option>
                              <option value="Pós-Graduação">Pós-Graduação</option>
                              <option value="MBA">MBA</option>
                              <option value="Mestrado">Mestrado</option>
                              <option value="Doutorado">Doutorado</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Período (Início - Fim)</label>
                            <input
                              type="text"
                              value={edu.period}
                              onChange={(e) => updateEducation(edu.id, "period", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                              placeholder="Ex: 2018 - 2022"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: SKILLS & EXTRAS */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Code className="text-indigo-600 w-6 h-6" /> Habilidades, Idiomas & Certificações
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Acrescente as ferramentas, línguas e conquistas que te diferenciam.</p>
                </div>

                {/* SKILLS TAGS */}
                <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Habilidades / Tecnologias</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), addSkill()) : null}
                      placeholder="Ex: React, Scrum, Python..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {skills.length === 0 && <span className="text-xs text-slate-400">Nenhuma tag adicionada.</span>}
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-100"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-indigo-400 hover:text-indigo-800 font-bold text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* LANGUAGES */}
                <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Idiomas</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), addLanguage()) : null}
                      placeholder="Ex: Inglês (Avançado), Espanhol (Fluente)..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {languages.length === 0 && <span className="text-xs text-slate-400">Nenhum idioma adicionado.</span>}
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-100"
                      >
                        {lang}
                        <button
                          onClick={() => removeLanguage(lang)}
                          className="text-emerald-400 hover:text-emerald-800 font-bold text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Certificações / Licenças</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nome da Certificação"
                      value={newCert.name}
                      onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                      type="text"
                      placeholder="Emissor / Organização"
                      value={newCert.issuer}
                      onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ano"
                        value={newCert.year}
                        onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs w-16 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button
                        type="button"
                        onClick={addCertification}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {certifications.length === 0 && <p className="text-xs text-slate-400">Nenhuma certificação listada.</p>}
                    {certifications.map((cert, index) => (
                      <div key={index} className="flex justify-between items-center bg-white border border-slate-100 px-4 py-2 rounded-xl text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{cert.name}</span>
                          <span className="text-slate-500"> - {cert.issuer} ({cert.year})</span>
                        </div>
                        <button
                          onClick={() => removeCertification(index)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/15 active:scale-95 cursor-pointer"
          >
            {currentStep === 4 ? "✨ Finalizar & Otimizar com IA" : "Próximo"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
