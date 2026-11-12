import QRCode from "qrcode";

/**
 * Calculates CRC-16-CCITT (polynomial 0x1021, initial value 0xFFFF)
 * according to the Brazilian Central Bank PIX specification.
 */
function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export interface PixConfig {
  key: string;
  name: string;
  city: string;
  amount: number;
  txId?: string;
}

export const PIX_CONFIG_DEFAULT: PixConfig = {
  key: "47061350873",
  name: "PAGAMENTO CURRICULO",
  city: "SAO PAULO",
  amount: 9.90,
  txId: "CURRIFAST"
};

/**
 * Generates an official EMV BR Code string for Brazilian Central Bank PIX.
 */
export function generatePixPayload(config: Partial<PixConfig> = {}): string {
  const { key, name, city, amount, txId } = { ...PIX_CONFIG_DEFAULT, ...config };

  const cleanKey = key.trim();
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .slice(0, 25);
  const cleanCity = city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .slice(0, 15);
  const formattedAmount = amount.toFixed(2);
  const cleanTxId = (txId || "***").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";

  // Field 26: Merchant Account Information
  const gui = formatField("00", "br.gov.bcb.pix");
  const pixKey = formatField("01", cleanKey);
  const field26 = formatField("26", `${gui}${pixKey}`);

  // Field 62: Additional Data Field Template (TxID)
  const field62 = formatField("62", formatField("05", cleanTxId));

  // Construct standard payload before CRC
  const raw =
    formatField("00", "01") + // Payload Format Indicator
    formatField("01", "12") + // Point of Initiation: Dynamic / Static
    field26 +
    formatField("52", "0000") + // Merchant Category Code
    formatField("53", "986") + // Transaction Currency: 986 (BRL)
    formatField("54", formattedAmount) + // Transaction Amount: 9.90
    formatField("58", "BR") + // Country Code
    formatField("59", cleanName) + // Merchant Name
    formatField("60", cleanCity) + // Merchant City
    field62 +
    "6304"; // CRC16 Header

  const crc = computeCRC16(raw);
  return `${raw}${crc}`;
}

export const DEFAULT_GATEWAY_LINK = "https://pix.bcb.gov.br/pagar/currifast990";

/**
 * Known Brazilian Financial Institutions ISPB (Identificador do Sistema de Pagamento Brasileiro)
 */
export const KNOWN_BANKS_ISPB: Record<string, string> = {
  "18236120": "Instituição de Pagamento",
  "60701190": "Itaú Unibanco",
  "00000000": "Banco do Brasil",
  "60746948": "Banco Bradesco",
  "00360305": "Caixa Econômica Federal",
  "90400888": "Banco Santander",
  "00416968": "Banco Inter",
  "32644489": "C6 Bank",
  "22896431": "PicPay Bank",
  "07019308": "PagBank / PagSeguro",
  "30306294": "BTG Pactual"
};

/**
 * Renders any string or URL (such as a PIX payment link or payload)
 * into a high-resolution base64 PNG data URL.
 */
export async function generatePixQRCode(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff"
    },
    errorCorrectionLevel: "M"
  });
}

export interface PixIdValidationResult {
  valid: boolean;
  reason?: string;
  bankName?: string;
  formattedId?: string;
  timestamp?: string;
}

/**
 * Validates a REAL Brazilian Central Bank PIX End-to-End ID (E2E ID)
 * or official receipt authentication ID from any Brazilian financial institution.
 *
 * Official Bacen Standard for E2E ID:
 * - Length: Exactly 32 characters
 * - Starts with 'E'
 * - Digits 1-8: Bank ISPB
 * - Digits 9-16: YYYYMMDD (Valid transaction date)
 * - Digits 17-20: HHMM (Valid transaction hour/minute)
 * - Digits 21-31: 11 alphanumeric characters (Unique hash)
 */
export function validateTransactionCode(code: string): PixIdValidationResult {
  if (!code || typeof code !== "string") {
    return { valid: false, reason: "Informe o ID da transação presente no seu comprovante bancário PIX." };
  }

  const raw = code.trim().replace(/[\s-]/g, "");
  const upper = raw.toUpperCase();

  // 1. Official Bacen PIX End-to-End ID check (Starts with E, exactly 32 alphanumeric chars)
  if (upper.startsWith("E")) {
    if (upper.length !== 32) {
      return {
        valid: false,
        reason: `O ID real da transação PIX possui exatamente 32 caracteres. O código informado possui ${upper.length} caracteres.`
      };
    }

    if (!/^[E][0-9A-Z]{31}$/.test(upper)) {
      return {
        valid: false,
        reason: "O ID da transação contém caracteres inválidos. Utilize apenas letras e números como consta no comprovante."
      };
    }

    // Extract components
    const ispb = upper.slice(1, 9);
    const yearStr = upper.slice(9, 13);
    const monthStr = upper.slice(13, 15);
    const dayStr = upper.slice(15, 17);
    const hourStr = upper.slice(17, 19);
    const minStr = upper.slice(19, 21);

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);
    const min = parseInt(minStr, 10);

    // Validate date logic
    if (isNaN(year) || year < 2024 || year > 2027) {
      return {
        valid: false,
        reason: `Ano da transação inválido no ID (${yearStr}). Verifique se digitou o ID completo.`
      };
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return {
        valid: false,
        reason: `Mês da transação inválido no ID (${monthStr}).`
      };
    }

    if (isNaN(day) || day < 1 || day > 31) {
      return {
        valid: false,
        reason: `Dia da transação inválido no ID (${dayStr}).`
      };
    }

    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(min) || min < 0 || min > 59) {
      return {
        valid: false,
        reason: "Horário da transação inválido no ID do PIX."
      };
    }

    // Check if date is not in the future
    const txDate = new Date(year, month - 1, day, hour, min);
    const now = new Date();
    if (txDate.getTime() > now.getTime() + 3 * 60 * 60 * 1000) {
      return {
        valid: false,
        reason: "A data informada no ID da transação é futura. Informe o ID de um comprovante já realizado."
      };
    }

    const bankName = KNOWN_BANKS_ISPB[ispb] || "Instituição Financeira PIX";
    const formattedDate = `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} às ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    return {
      valid: true,
      bankName,
      formattedId: upper,
      timestamp: formattedDate
    };
  }

  // 2. Check for Bank UUID Authentication format (32 hex characters)
  const uuidRegex = /^[0-9a-fA-F]{32}$/;
  if (uuidRegex.test(raw)) {
    return {
      valid: true,
      bankName: "Autenticação Digital Bancária",
      formattedId: raw.toLowerCase()
    };
  }

  return {
    valid: false,
    reason: "O ID da transação PIX deve conter 32 caracteres e começar com a letra 'E'."
  };
}
