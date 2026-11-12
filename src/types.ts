export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  website: string;
  objective: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  course: string;
  level: string; // Graduação, Pós, etc.
  period: string;
}

export interface Skill {
  name: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Especialista' | '';
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeData {
  id: string;
  title: string;
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[]; // List of tags
  languages: string[]; // List of languages
  certifications: Certification[];
  summary?: string; // Generated professional summary
  atsScore?: number;
  suggestions?: string[];
  template?: string; // 'modern', 'classic', 'executive', 'minimal'
  fontFamily?: string;
  colorTheme?: string;
  paid?: boolean; // Payment unlock status
  coverLetterUnlocked?: boolean; // Cover letter upsell purchased
  updatedAt: string;
}

export interface CoverLetterData {
  id: string;
  resumeId: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
  content: string;
  updatedAt: string;
  paid?: boolean;
}

export interface UserProfile {
  email: string;
  name: string;
  joinedAt: string;
}

export interface PaymentRecord {
  id: string;
  item: 'resume' | 'cover_letter';
  amount: number;
  status: 'pending' | 'completed';
  date: string;
  resumeTitle: string;
}

export interface ATSEvaluation {
  score: number;
  feedback: string[];
  stars: number; // 1-5 scale
}
