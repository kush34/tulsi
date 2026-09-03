export const locales = [
  "en",
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "gu",
  "ur",
  "kn",
  "ml",
  "or",
  "pa",
  "as",
  "mai",
  "sa",
  "kok",
  "ne",
  "sd",
  "doi",
  "mni",
  "brx",
  "ks",
  "sat",
  "bho",
  "raj",
  "hne",
  "gom",
  "awa",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  te: "తెలుగు",
  mr: "मराठी",
  ta: "தமிழ்",
  gu: "ગુજરાતી",
  ur: "اردو",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  or: "ଓଡ଼ିଆ",
  pa: "ਪੰਜਾਬੀ",
  as: "অসমীয়া",
  mai: "मैथिली",
  sa: "संस्कृतम्",
  kok: "कोंकणी",
  ne: "नेपाली",
  sd: "سنڌي",
  doi: "डोगरी",
  mni: "মৈতৈলোন্",
  brx: "बड़ो",
  ks: "कॉशुर",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ",
  bho: "भोजपुरी",
  raj: "राजस्थानी",
  hne: "छत्तीसगढ़ी",
  gom: "कोंकणी",
  awa: "अवधी",
};

export const rtlLocales: Locale[] = ["ur", "sd", "ks"];

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}