/**
 * lib/phone-utils.ts
 * Pure client-side phone OSINT utilities.
 * Zero-cost, no external paid services.
 * Strong focus on India (+91) with public data patterns.
 */

import { parsePhoneNumberFromString, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

// Basic India-focused carrier prefix map (public knowledge / common patterns)
// Extend this over time. Sources like public carrier allocation lists.
const INDIA_CARRIER_MAP: Record<string, string> = {
  // Jio (Reliance Jio) - very common 70xx-79xx range
  '700': 'Reliance Jio',
  '701': 'Reliance Jio',
  '702': 'Reliance Jio',
  '703': 'Reliance Jio',
  '704': 'Reliance Jio',
  '705': 'Reliance Jio',
  '706': 'Reliance Jio',
  '707': 'Reliance Jio',
  '708': 'Reliance Jio',
  '709': 'Reliance Jio',
  '750': 'Reliance Jio',
  '751': 'Reliance Jio',
  '752': 'Reliance Jio',
  '753': 'Reliance Jio',
  '754': 'Reliance Jio',
  '755': 'Reliance Jio',
  '756': 'Reliance Jio',
  '757': 'Reliance Jio',
  '758': 'Reliance Jio',
  '759': 'Reliance Jio',
  '760': 'Reliance Jio',
  '761': 'Reliance Jio',
  '762': 'Reliance Jio',
  '763': 'Reliance Jio',
  '764': 'Reliance Jio',
  '765': 'Reliance Jio',
  '766': 'Reliance Jio',
  '767': 'Reliance Jio',
  '768': 'Reliance Jio',
  '769': 'Reliance Jio',
  '770': 'Reliance Jio',
  '771': 'Reliance Jio',
  '772': 'Reliance Jio',
  '773': 'Reliance Jio',
  '774': 'Reliance Jio',
  '775': 'Reliance Jio',
  '776': 'Reliance Jio',
  '777': 'Reliance Jio',
  '778': 'Reliance Jio',
  '779': 'Reliance Jio',
  '780': 'Reliance Jio',
  '781': 'Reliance Jio',
  '782': 'Reliance Jio',
  '783': 'Reliance Jio',
  '784': 'Reliance Jio',
  '785': 'Reliance Jio',
  '786': 'Reliance Jio',
  '787': 'Reliance Jio',
  '788': 'Reliance Jio',
  '789': 'Reliance Jio',
  '790': 'Reliance Jio',
  '791': 'Reliance Jio',
  '792': 'Reliance Jio',
  '793': 'Reliance Jio',
  '794': 'Reliance Jio',
  '795': 'Reliance Jio',
  '796': 'Reliance Jio',
  '797': 'Reliance Jio',
  '798': 'Reliance Jio',
  '799': 'Reliance Jio',

  // Airtel (higher priority prefixes)
  '98': 'Bharti Airtel',
  '99': 'Bharti Airtel / Others',
  '97': 'Bharti Airtel',
  '96': 'Bharti Airtel',
  '95': 'Bharti Airtel',
  '93': 'Bharti Airtel',
  '92': 'Bharti Airtel',
  '91': 'Bharti Airtel',
  '90': 'Bharti Airtel',

  // Vi (Vodafone Idea)
  '85': 'Vi (Vodafone Idea)',
  '86': 'Vi (Vodafone Idea)',
  '87': 'Vi (Vodafone Idea)',
  '88': 'Vi (Vodafone Idea)',
  '89': 'Vi (Vodafone Idea)',

  // BSNL (use more specific where possible)
  '944': 'BSNL',
  '945': 'BSNL',
  '948': 'BSNL',
  '949': 'BSNL',
};

export interface ParsedPhone {
  isValid: boolean;
  nationalNumber: string;
  countryCode: number;
  e164: string;           // +919876543210
  international: string;  // +91 98765 43210
  country?: string;
  type?: string;          // MOBILE, FIXED_LINE etc.
  possible?: boolean;
}

export interface PhoneCarrierInfo {
  carrier: string;
  region: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Parse and validate any phone number using libphonenumber-js (excellent +91 support)
 */
export function parsePhone(input: string): ParsedPhone | null {
  if (!input || input.trim().length < 7) return null;

  try {
    const cleaned = input.replace(/[^\d+]/g, '');
    const phoneNumber = parsePhoneNumberFromString(cleaned);

    if (!phoneNumber) {
      // Fallback for common India numbers
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        return {
          isValid: true,
          nationalNumber: digits,
          countryCode: 91,
          e164: `+91${digits}`,
          international: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
          country: 'IN',
          type: 'MOBILE',
          possible: true,
        };
      }
      return null;
    }

    return {
      isValid: isValidPhoneNumber(cleaned) || phoneNumber.isPossible(),
      nationalNumber: phoneNumber.nationalNumber,
      countryCode: phoneNumber.countryCallingCode ? Number(phoneNumber.countryCallingCode) : 91,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.formatInternational(),
      country: phoneNumber.country,
      type: phoneNumber.getType() || undefined,
      possible: phoneNumber.isPossible(),
    };
  } catch {
    return null;
  }
}

/**
 * Get approximate carrier / operator using public prefix data.
 * Focused on India. Extend the map as needed.
 */
export function getCarrierInfo(phone: ParsedPhone): PhoneCarrierInfo {
  if (!phone || phone.countryCode !== 91) {
    return { carrier: 'Unknown / International', region: 'Global', confidence: 'low' };
  }

  const national = phone.nationalNumber;
  const prefix4 = national.slice(0, 4);
  const prefix3 = national.slice(0, 3);
  const prefix2 = national.slice(0, 2);

  let carrier = 'Unknown Mobile Operator';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (INDIA_CARRIER_MAP[prefix4]) {
    carrier = INDIA_CARRIER_MAP[prefix4];
    confidence = 'high';
  } else if (INDIA_CARRIER_MAP[prefix3]) {
    carrier = INDIA_CARRIER_MAP[prefix3];
    confidence = 'medium';
  } else if (INDIA_CARRIER_MAP[prefix2]) {
    carrier = INDIA_CARRIER_MAP[prefix2];
    confidence = 'medium';
  }

  // Rough region guess (North/South/East/West) - can be expanded
  const region =
    /^[6-7]/.test(national) ? 'North / West India' :
    /^[8]/.test(national) ? 'South / East India' : 'Pan India';

  return { carrier, region, confidence };
}

/**
 * Powerful Dork Generator (PhoneInfoga-style, pure client JS)
 * Generates categorized, ready-to-use search dorks.
 */
export interface PhoneDork {
  category: string;
  title: string;
  dork: string;
  description: string;
}

export function generatePhoneDorks(parsed: ParsedPhone): PhoneDork[] {
  if (!parsed) return [];

  const { nationalNumber, e164, international } = parsed;
  const cleanNational = nationalNumber.replace(/\s+/g, '');
  const noPlus = e164.replace('+', '');
  const spaced = international.replace(/\s+/g, ' ');

  const dorks: PhoneDork[] = [
    // Social & Messaging
    {
      category: 'Social Media & Messaging',
      title: 'Facebook / Instagram',
      dork: `"${cleanNational}" OR "${e164}" OR "${noPlus}" (facebook OR instagram OR whatsapp)`,
      description: 'Social profiles and mentions',
    },
    {
      category: 'Social Media & Messaging',
      title: 'WhatsApp / Telegram',
      dork: `"${e164}" OR "${cleanNational}" (whatsapp OR telegram OR "wa.me")`,
      description: 'Messaging app hints',
    },

    // Professional / India Directories
    {
      category: 'Professional Directories',
      title: 'LinkedIn',
      dork: `"${cleanNational}" OR "${e164}" site:linkedin.com`,
      description: 'Professional profiles',
    },
    {
      category: 'Professional Directories',
      title: 'Justdial / IndiaMART / Sulekha',
      dork: `"${cleanNational}" OR "${e164}" (justdial OR indiamart OR sulekha OR "business listing")`,
      description: 'Local business directories',
    },

    // Documents & Public Records
    {
      category: 'Documents & Files',
      title: 'PDFs & Documents',
      dork: `"${cleanNational}" OR "${e164}" filetype:pdf OR filetype:doc OR filetype:txt`,
      description: 'Public documents containing the number',
    },
    {
      category: 'Documents & Files',
      title: 'Government / Public Lists',
      dork: `"${cleanNational}" OR "${e164}" (gov.in OR nic.in OR "voter" OR "aadhaar" OR "pan")`,
      description: 'Public records (use responsibly)',
    },

    // Spam & Reputation
    {
      category: 'Spam & Reputation',
      title: 'Spam Reports',
      dork: `"${cleanNational}" OR "${e164}" (spam OR "truecaller" OR "whocalls" OR "call" OR complaint)`,
      description: 'Reputation and spam reports',
    },

    // Classifieds & Local
    {
      category: 'Classifieds & Local',
      title: 'OLX / Quikr / Local Listings',
      dork: `"${cleanNational}" OR "${e164}" (olx.in OR quikr OR "for sale" OR "contact")`,
      description: 'Classifieds and local ads',
    },
  ];

  // Add a few more powerful variations
  dorks.push({
    category: 'Broad Investigation',
    title: 'Exact Number Variations',
    dork: `"${e164}" OR "+91-${cleanNational.slice(0,5)}-${cleanNational.slice(5)}" OR "${spaced}"`,
    description: 'Multiple formatting combinations',
  });

  return dorks;
}

/**
 * Quick links to free public lookup tools (no API keys)
 */
export function getFreeLookupLinks(e164: string, national: string) {
  const clean = national.replace(/\D/g, '');
  return [
    {
      name: 'FreeCarrierLookup',
      url: `https://freecarrierlookup.com/?phone=${encodeURIComponent(e164)}`,
      note: 'US/International carrier info',
    },
    {
      name: 'NumLookup (Public)',
      url: `https://www.numlookup.com/${e164}`,
      note: 'Free basic lookup',
    },
    {
      name: 'Truecaller Web Search',
      url: `https://www.truecaller.com/search/in/${clean}`,
      note: 'Community spam database (web view)',
    },
  ];
}

/**
 * Format phone nicely for display
 */
export function formatPhoneDisplay(parsed: ParsedPhone): string {
  if (!parsed) return '';
  return parsed.international || parsed.e164;
}
