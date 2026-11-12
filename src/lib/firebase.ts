import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where
} from "firebase/firestore";
import { ResumeData, CoverLetterData, PaymentRecord } from "../types";
import firebaseConfigJson from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfigJson);

// Select correct database ID (e.g. from firebase-applet-config.json)
const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || "(default)");

const USER_EMAIL = "jg.gonsalves.bernardo.g@gmail.com";

export { db };

// RESUMES
const RESUMES_COLLECTION = "resumes";

export async function fetchResumesFromDb(userEmail: string = USER_EMAIL): Promise<ResumeData[]> {
  try {
    const q = query(collection(db, RESUMES_COLLECTION), where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const resumes: ResumeData[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Remove metadata userEmail from data for the frontend state
      const { userEmail: _, ...resumeData } = data;
      const cleanResume: ResumeData = {
        id: resumeData.id,
        title: resumeData.title || "Meu Currículo Otimizado",
        personal: {
          name: "",
          email: userEmail,
          phone: "",
          city: "",
          linkedin: "",
          website: "",
          objective: "",
          ...(resumeData.personal || {})
        },
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        skills: resumeData.skills || [],
        languages: resumeData.languages || [],
        certifications: resumeData.certifications || [],
        template: resumeData.template || "modern",
        fontFamily: resumeData.fontFamily || "Inter",
        colorTheme: resumeData.colorTheme || "indigo",
        atsScore: resumeData.atsScore || 90,
        suggestions: resumeData.suggestions || [],
        paid: resumeData.paid || false,
        coverLetterUnlocked: resumeData.coverLetterUnlocked || false,
        updatedAt: resumeData.updatedAt || new Date().toISOString()
      };
      resumes.push(cleanResume);
    });
    // Sort by updatedAt descending
    return resumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Erro ao carregar currículos do Firestore:", error);
    return [];
  }
}

// Helper to recursively remove undefined values or convert them to null/omit them for Firestore safety
function sanitizeForFirestore<T>(obj: T): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeForFirestore(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveResumeToDb(resume: ResumeData, userEmail: string = USER_EMAIL): Promise<void> {
  try {
    const docRef = doc(db, RESUMES_COLLECTION, resume.id);
    const cleaned = sanitizeForFirestore({
      ...resume,
      userEmail
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar currículo no Firestore:", error);
  }
}

export async function deleteResumeFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, RESUMES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao deletar currículo do Firestore:", error);
  }
}

// COVER LETTERS
const LETTERS_COLLECTION = "coverLetters";

export async function fetchCoverLettersFromDb(userEmail: string = USER_EMAIL): Promise<CoverLetterData[]> {
  try {
    const q = query(collection(db, LETTERS_COLLECTION), where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const letters: CoverLetterData[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const { userEmail: _, ...letterData } = data;
      letters.push(letterData as CoverLetterData);
    });
    return letters;
  } catch (error) {
    console.error("Erro ao carregar cartas do Firestore:", error);
    return [];
  }
}

export async function saveCoverLetterToDb(letter: CoverLetterData, userEmail: string = USER_EMAIL): Promise<void> {
  try {
    const docRef = doc(db, LETTERS_COLLECTION, letter.resumeId); // Using resumeId as doc id for 1-to-1 matching simplicity
    const cleaned = sanitizeForFirestore({
      ...letter,
      userEmail
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar carta no Firestore:", error);
  }
}

export async function deleteCoverLetterFromDb(resumeId: string): Promise<void> {
  try {
    const docRef = doc(db, LETTERS_COLLECTION, resumeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao deletar carta do Firestore:", error);
  }
}

// PAYMENTS
const PAYMENTS_COLLECTION = "payments";

export async function fetchPaymentsFromDb(userEmail: string = USER_EMAIL): Promise<PaymentRecord[]> {
  try {
    const q = query(collection(db, PAYMENTS_COLLECTION), where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const payments: PaymentRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const { userEmail: _, ...paymentData } = data;
      payments.push(paymentData as PaymentRecord);
    });
    return payments;
  } catch (error) {
    console.error("Erro ao carregar pagamentos do Firestore:", error);
    return [];
  }
}

export async function savePaymentToDb(payment: PaymentRecord, userEmail: string = USER_EMAIL): Promise<void> {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, payment.id);
    const cleaned = sanitizeForFirestore({
      ...payment,
      userEmail
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar pagamento no Firestore:", error);
  }
}
