// Ordered for PH solo real-estate agents — Messenger first, then WhatsApp, Viber, Facebook Page.
export const PLATFORMS = [
  {
    id: 'messenger',
    name: 'Messenger',
    tagline: 'Auto-reply to buyer DMs the moment an inquiry lands.',
    inputLabel: 'Messenger link',
    placeholder: 'm.me/your.handle',
    brandClass: 'from-sky-500 to-blue-600',
    ringClass: 'ring-sky-400/30',
    icon: 'Send',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    tagline: 'Send listing details to overseas OFW buyers in one tap.',
    inputLabel: 'WhatsApp number',
    placeholder: '+63 9XX XXX XXXX',
    brandClass: 'from-emerald-500 to-green-600',
    ringClass: 'ring-emerald-400/30',
    icon: 'MessageCircle',
  },
  {
    id: 'viber',
    name: 'Viber',
    tagline: 'Keep existing clients in the loop on viewings & offers.',
    inputLabel: 'Viber number',
    placeholder: '+63 9XX XXX XXXX',
    brandClass: 'from-purple-500 to-indigo-600',
    ringClass: 'ring-purple-400/30',
    icon: 'Phone',
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    tagline: 'Post generated listings straight to your business page.',
    inputLabel: 'Page URL',
    placeholder: 'facebook.com/your.page',
    brandClass: 'from-blue-600 to-indigo-700',
    ringClass: 'ring-blue-400/30',
    icon: 'ThumbsUp',
  },
];

export const getPlatform = (id) => PLATFORMS.find((p) => p.id === id);
