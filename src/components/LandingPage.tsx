import { motion } from "motion/react";
import { Sparkles, FileText, CheckCircle2, TrendingUp, Cpu, Award, MessageSquare, HelpCircle, ArrowRight, ShieldCheck, Zap, Moon, Sun, Lock } from "lucide-react";
import { useState } from "react";
import AdminPanelModal from "./AdminPanelModal";

interface LandingPageProps {
  onStart: () => void;
  onGoToDashboard: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function LandingPage({ onStart, onGoToDashboard, theme, onToggleTheme }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const stats = [
    { label: "Currículos gerados", value: "45.000+" },
    { label: "Aprovação em ATS", value: "98.4%" },
    { label: "Média de aumento salarial", value: "32%" },
    { label: "Tempo médio de criação", value: "1.5 min" },
  ];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-indigo-500" />,
      title: "Otimização ATS em Tempo Real",
      description: "A inteligência artificial analisa seu currículo contra algoritmos de recrutadores comuns, sugerindo e integrando palavras-chave cruciais automaticamente."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      title: "Melhoria de Textos com IA",
      description: "Transforme descrições vagas em conquistas profissionais poderosas usando o método STAR com um clique."
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "Design Premium e Minimalista",
      description: "Quatro modelos desenvolvidos com base em pesquisas com recrutadores de grandes empresas (Google, McKinsey, iFood, Vercel)."
    },
    {
      icon: <Zap className="w-6 h-6 text-green-500" />,
      title: "Upsell de Carta de Apresentação",
      description: "Gere uma carta de apresentação altamente persuasiva combinando perfeitamente os dados do seu currículo com a vaga de interesse."
    }
  ];

  const templates = [
    { name: "Moderno", desc: "Perfeito para tecnologia, design e startups", color: "from-indigo-500 to-purple-600" },
    { name: "Clássico", desc: "Ideal para finanças, direito e empresas tradicionais", color: "from-slate-700 to-slate-900" },
    { name: "Executivo", desc: "Desenhado para posições de diretoria e liderança", color: "from-amber-600 to-yellow-700" },
    { name: "Minimalista", desc: "Clareza absoluta, focado no conteúdo puro", color: "from-emerald-500 to-teal-600" }
  ];

  const testimonials = [
    {
      name: "Guilherme Santos",
      role: "Engenheiro de Software Sênior na Uber",
      quote: "Eu preenchi meu currículo simples, cliquei em 'Melhorar com IA' e o resultado foi absurdo. Fui chamado para 3 entrevistas na mesma semana após reestruturar o currículo pelo CurriFast.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
    },
    {
      name: "Amanda Oliveira",
      role: "Gerente de Produto Tech",
      quote: "O ATS Score mudou meu jogo. Consegui ver exatamente onde o algoritmo de triagem me descartaria e corrigi tudo antes de enviar. Vale cada centavo!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop"
    }
  ];

  const faqs = [
    {
      q: "O que é um Sistema ATS e como o CurriFast ajuda?",
      a: "ATS (Applicant Tracking System) são softwares usados por empresas para filtrar currículos por palavras-chave antes de um humano ler. O CurriFast otimiza seu vocabulário profissional usando IA para garantir que você passe pelos filtros automáticos com a maior pontuação possível."
    },
    {
      q: "Quanto custa para gerar meu currículo e a carta de apresentação?",
      a: "O preenchimento e a visualização completa do currículo na tela são totalmente gratuitos. O download do PDF do currículo premium otimizado pela IA custa apenas R$ 9,90. Caso queira, você também pode adicionar uma Carta de Apresentação personalizada gerada sob medida por adicionais R$ 9,90."
    },
    {
      q: "Os modelos são realmente eficientes?",
      a: "Sim. Nossos modelos evitam decorações exageradas ou gráficos desnecessários que confundem os leitores automáticos (ATS). Eles são limpos, bem-espaçados e desenhados seguindo os rígidos padrões internacionais de recrutamento."
    },
    {
      q: "Posso atualizar minhas informações após a compra?",
      a: "Sim! Você possui acesso vitalício e pode editar o currículo criado quantas vezes desejar na sua área do painel."
    }
  ];

  return (
    <div id="landing-page" className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-600/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-slate-900">
              Curri<span className="text-indigo-600">Fast</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center justify-center bg-white"
              title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={onGoToDashboard}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Meus Currículos
            </button>
            <button
              onClick={onStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1"
            >
              Começar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 lg:py-32 overflow-hidden bg-radial from-indigo-50/50 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-8 border border-indigo-100"
          >
            <Zap className="w-3.5 h-3.5" /> NOVA ERA: Gerador Inteligente de Currículos Otimizados
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight"
          >
            Crie um currículo profissional com <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">IA</span> em menos de 2 minutos.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed"
          >
            Transforme suas experiências brutas em um currículo moderno, polido e 100% otimizado para superar os filtros automáticos (ATS) de grandes recrutadores.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={onStart}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Criar meu currículo <Sparkles className="w-5 h-5 text-amber-400" />
            </button>
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-4 rounded-2xl text-base transition-all border border-slate-200 shadow-sm active:scale-95 cursor-pointer"
            >
              Acessar Painel
            </button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 border-y border-slate-200 py-10 max-w-5xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Benefits / Features Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Por que escolher o CurriFast?</h2>
            <p className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 tracking-tight">Recursos premium projetados para sua aprovação profissional.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {features.map((feat, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all bg-slate-50/50">
                <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-sm border border-slate-100 h-12 w-12 flex items-center justify-center">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{feat.title}</h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">O Fluxo</h2>
            <p className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 tracking-tight">Do rascunho ao currículo pronto em 4 etapas rápidas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "01", title: "Rascunho Rápido", desc: "Insira seus dados pessoais, experiências e habilidades de forma livre." },
              { step: "02", title: "Otimização IA", desc: "Nossa IA reescreve cada texto, corrige gramática e otimiza para filtros ATS." },
              { step: "03", title: "Ajuste de Design", desc: "Escolha cores, fontes e 4 modelos clássicos aprovados por especialistas." },
              { step: "04", title: "Download e Upsell", desc: "Gere o PDF premium por apenas R$ 9,90 e receba opcionalmente a Carta de Apresentação." }
            ].map((step, idx) => (
              <div key={idx} className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-4xl font-black text-indigo-100 absolute top-4 right-4">{step.step}</div>
                <h3 className="font-bold text-lg text-slate-900 mt-4">{step.title}</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid Showcase */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Design de Alto Padrão</h2>
            <p className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 tracking-tight">Quatro estilos testados com recrutadores.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {templates.map((temp, i) => (
              <div key={i} className="group cursor-pointer">
                <div className={`aspect-3/4 rounded-2xl bg-gradient-to-br ${temp.color} p-6 text-white flex flex-col justify-between shadow-md transition-transform group-hover:-translate-y-2 h-72`}>
                  <FileText className="w-10 h-10 opacity-80" />
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase opacity-75">Template</span>
                    <h3 className="text-2xl font-black tracking-tight">{temp.name}</h3>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 mt-4 text-sm">{temp.name}</h4>
                <p className="text-slate-500 text-xs mt-1">{temp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Depoimentos reais</h2>
            <p className="text-3xl sm:text-4xl font-bold mt-3 text-slate-900 tracking-tight">O que dizem os profissionais contratados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((test, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <p className="text-slate-600 italic text-base leading-relaxed">"{test.quote}"</p>
                <div className="flex items-center gap-4 mt-6 border-t border-slate-100 pt-6">
                  <img src={test.avatar} alt={test.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{test.name}</h4>
                    <span className="text-slate-500 text-xs">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Pronto para conquistar sua próxima vaga?
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            Preencha agora gratuitamente. Só pague quando estiver 100% satisfeito com o resultado final e desejar baixar o PDF premium.
          </p>

          <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 p-8 rounded-3xl border border-slate-700/50 max-w-2xl mx-auto text-left mb-12">
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">CURRÍCULO PREMIUM IA</div>
              <div className="text-3xl font-black">R$ 9,90</div>
              <ul className="text-xs text-slate-300 mt-4 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Otimização por IA em tempo real</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acesso aos 4 modelos modernos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pontuação de Score ATS ativa</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Download em PDF ilimitado</li>
              </ul>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-700 pt-6 sm:pt-0 sm:pl-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">UPSELL OPCIONAL</div>
                <div className="text-3xl font-black">+ R$ 9,90</div>
                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                  Gere uma **Carta de Apresentação** perfeitamente harmonizada com os detalhes do seu currículo e com a descrição da sua vaga ideal.
                </p>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={onStart}
              className="bg-white text-slate-950 font-bold px-10 py-5 rounded-2xl text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
            >
              Criar meu currículo grátis <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <HelpCircle className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dúvidas Frequentes</h2>
            <p className="text-slate-500 text-sm mt-2">Tudo o que você precisa saber sobre o CurriFast.</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/50 transition-colors text-left font-semibold text-slate-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-indigo-600 font-bold text-lg">{openFaq === idx ? "−" : "+"}</span>
                </button>
                {openFaq === idx && (
                  <div className="p-6 bg-white border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-lg tracking-tight text-slate-900">
              Curri<span className="text-indigo-600">Fast</span>
            </span>
            <span className="text-slate-400 text-xs">| © 2026 CurriFast Corporation.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Suporte</a>
            <button
              onClick={() => setShowAdminModal(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer text-slate-400 flex items-center gap-1"
            >
              <Lock className="w-3 h-3" /> Painel do Administrador
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal with Password Protection (Senha: 230513) */}
      <AdminPanelModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
