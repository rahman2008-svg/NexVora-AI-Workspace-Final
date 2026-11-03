/** Identity strings shown in About. Not translated on purpose (names and contact details). */
export const BRAND = {
  appName: "NexVora AI Workspace",
  tagline: 'Your Intelligent Digital Workspace',
  developer: 'Prince AR Abdur Rahman',
  company: "NexVora Lab's Ofc",
  copyright: "© 2026 NexVora Lab's Ofc. All Rights Reserved.",
  whatsapp: ['01707424006', '01796951709'],
  /** Bangladesh numbers are written locally with a leading 0; WhatsApp links need the country code (880). */
  whatsappIntl: (local: string) => `880${local.replace(/^0/, '')}`,
  facebook: 'https://www.facebook.com/share/1BNn32qoJo/',
  instagram: 'https://www.instagram.com/ur___abdur____rahman__',
  email: 'prince.ar.abdur.rahman2008@gmail.com',
} as const;
