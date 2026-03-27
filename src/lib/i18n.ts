export type AppLanguage = "en" | "zh" | "hi" | "es";

export interface LanguageConfig {
  id: AppLanguage;
  label: string;
  nativeLabel: string;
  speechLang: string; // BCP-47 for Web Speech API
  flag: string;
}

export const LANGUAGES: LanguageConfig[] = [
  { id: "en", label: "English", nativeLabel: "English", speechLang: "en-US", flag: "" },
  { id: "zh", label: "Chinese", nativeLabel: "中文", speechLang: "zh-CN", flag: "" },
  { id: "hi", label: "Hindi", nativeLabel: "हिन्दी", speechLang: "hi-IN", flag: "" },
  { id: "es", label: "Spanish", nativeLabel: "Español", speechLang: "es-ES", flag: "" },
];

export function getLanguageConfig(id: AppLanguage): LanguageConfig {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}

/** Build the language instruction to prepend to LLM prompts */
export function buildLanguageInstruction(lang: AppLanguage): string {
  if (lang === "en") return "";

  const config = getLanguageConfig(lang);
  return `\n\nIMPORTANT: The user's preferred language is ${config.label} (${config.nativeLabel}). You MUST respond with ALL text content (labels, descriptions, options, tradeoffs, consequences, blind spots, critique, values, comparisons, insights) in ${config.label}. Keep the JSON structure keys in English, but all human-readable string VALUES must be in ${config.label}. This includes node labels, descriptions, option labels, tradeoff text, consequence text, blind spot text, critique text, value labels, and value descriptions.\n`;
}

/** UI labels for each language */
export const UI_LABELS: Record<AppLanguage, {
  speakYourIdea: string;
  stopRecording: string;
  startDeliberation: string;
  describeGoal: string;
  save: string;
  share: string;
  gallery: string;
  forest: string;
  compareWith: string;
}> = {
  en: {
    speakYourIdea: "Speak your idea",
    stopRecording: "Stop recording",
    startDeliberation: "Start deliberation",
    describeGoal: "Describe your goal, decision, or challenge with as much detail as possible...",
    save: "Save to file",
    share: "Share to Gallery",
    gallery: "Gallery",
    forest: "My Forest",
    compareWith: "Compare with others",
  },
  zh: {
    speakYourIdea: "\u8bf4\u51fa\u4f60\u7684\u60f3\u6cd5",
    stopRecording: "\u505c\u6b62\u5f55\u97f3",
    startDeliberation: "\u5f00\u59cb\u5ba1\u8bae",
    describeGoal: "\u5c3d\u53ef\u80fd\u8be6\u7ec6\u5730\u63cf\u8ff0\u4f60\u7684\u76ee\u6807\u3001\u51b3\u5b9a\u6216\u6311\u6218\u2026\u2026",
    save: "\u4fdd\u5b58\u6587\u4ef6",
    share: "\u5206\u4eab\u5230\u753b\u5eca",
    gallery: "\u753b\u5eca",
    forest: "\u6211\u7684\u68ee\u6797",
    compareWith: "\u4e0e\u4ed6\u4eba\u6bd4\u8f83",
  },
  hi: {
    speakYourIdea: "\u0905\u092a\u0928\u093e \u0935\u093f\u091a\u093e\u0930 \u092c\u094b\u0932\u0947\u0902",
    stopRecording: "\u0930\u093f\u0915\u0949\u0930\u094d\u0921\u093f\u0902\u0917 \u092c\u0902\u0926 \u0915\u0930\u0947\u0902",
    startDeliberation: "\u0935\u093f\u091a\u093e\u0930-\u0935\u093f\u092e\u0930\u094d\u0936 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    describeGoal: "\u0905\u092a\u0928\u0947 \u0932\u0915\u094d\u0937\u094d\u092f, \u0928\u093f\u0930\u094d\u0923\u092f \u092f\u093e \u091a\u0941\u0928\u094c\u0924\u0940 \u0915\u094b \u092f\u0925\u093e\u0938\u0902\u092d\u0935 \u0935\u093f\u0938\u094d\u0924\u093e\u0930 \u0938\u0947 \u0935\u0930\u094d\u0923\u0928 \u0915\u0930\u0947\u0902\u2026",
    save: "\u092b\u093c\u093e\u0907\u0932 \u092e\u0947\u0902 \u0938\u0939\u0947\u091c\u0947\u0902",
    share: "\u0917\u0948\u0932\u0930\u0940 \u092e\u0947\u0902 \u0938\u093e\u091d\u093e \u0915\u0930\u0947\u0902",
    gallery: "\u0917\u0948\u0932\u0930\u0940",
    forest: "\u092e\u0947\u0930\u093e \u0935\u0928",
    compareWith: "\u0926\u0942\u0938\u0930\u094b\u0902 \u0938\u0947 \u0924\u0941\u0932\u0928\u093e \u0915\u0930\u0947\u0902",
  },
  es: {
    speakYourIdea: "Di tu idea",
    stopRecording: "Detener grabaci\u00f3n",
    startDeliberation: "Iniciar deliberaci\u00f3n",
    describeGoal: "Describe tu objetivo, decisi\u00f3n o desaf\u00edo con el mayor detalle posible...",
    save: "Guardar archivo",
    share: "Compartir en galer\u00eda",
    gallery: "Galer\u00eda",
    forest: "Mi bosque",
    compareWith: "Comparar con otros",
  },
};
