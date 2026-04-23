/**
 * Default FB post templates — marketing-grade copy with emoji/hashtags.
 * Moved out of ListingManager to keep it lean and testable.
 *
 * Placeholders: {{title}}, {{location}}, {{rent}}, {{beds}}, {{bathrooms}},
 *               {{floor_area}}, {{category}}, {{rules_list}}, {{messenger_cta}}
 *
 * The generator substitutes missing values with graceful fallbacks.
 */

export const DEFAULT_TEMPLATES = [
  {
    id: 'template-luxury',
    name: '✨ Luxury Showcase',
    body: `✨ STUNNING FIND ALERT ✨
🏡 {{title}}
📍 {{location}}

💰 Only PHP {{rent}}/month
🛏 {{beds}} Bedroom(s)  |  🛁 {{bathrooms}} Bath  |  📐 {{floor_area}} sqm
🏷️ Category: {{category}}

✅ What's included:
{{rules_list}}

📩 Slide into my DMs → {{messenger_cta}}
🔥 Don't miss out — great properties move fast!

#ForRent #RealEstatePH #{{category}}Philippines #PropertyPH`,
  },
  {
    id: 'template-friendly',
    name: '😊 Friendly Local Agent',
    body: `Hey mga ka-scroll! 👋 I've got a gem for you today! 🏡

📌 {{title}}
📍 Located at {{location}}

💵 Super affordable at PHP {{rent}}/month lang!
🛏 {{beds}} BR  |  🛁 {{bathrooms}} Bath  |  📐 {{floor_area}} sqm
🏷️ {{category}} unit

Here's what makes it great:
{{rules_list}}

Interested? Don't be shy — shoot me a message! 📲
{{messenger_cta}}

Like & Share para makarating sa tamang tao! 🙏
#{{category}}ForRent #RealEstatePH`,
  },
  {
    id: 'template-snapshot',
    name: '📋 Quick Snapshot',
    body: `🏠 FOR RENT | {{title}}

📍 {{location}}
💰 PHP {{rent}}/mo
🛏 {{beds}} BR  🛁 {{bathrooms}} Bath  📐 {{floor_area}} sqm
🏷️ {{category}}

Key Terms:
{{rules_list}}

📬 Inquire: {{messenger_cta}}

#ForRent #{{category}}PH #RealEstatePH`,
  },
];

export const LISTING_CATEGORIES = ['Condo', 'House', 'Apartment', 'Commercial', 'Lot', 'Other'];
export const LISTING_STATUSES = ['available', 'reserved', 'rented', 'archived'];

/**
 * Format a listing's fields into a post using the given template body.
 * @param {Object} data          — listing fields
 * @param {string} templateBody  — template with {{placeholders}}
 * @param {string} messengerHandle
 * @returns {string}
 */
export function formatPost(data, templateBody, messengerHandle) {
  const msg = messengerHandle
    ? `Drop a message here → ${messengerHandle}`
    : 'Drop a message here → [Connect your Messenger in Connections]';

  const rulesList = data.rules
    ? data.rules.split(',').map((r) => `• ${r.trim()}`).join('\n')
    : '• Standard terms apply';

  const replacements = {
    title:        data.title        || '[Property Title]',
    location:     data.location     || '[Location]',
    rent:         data.rent         ? Number(data.rent).toLocaleString() : '[Price]',
    beds:         data.beds         || '—',
    bathrooms:    data.bathrooms    || '—',
    floor_area:   data.floor_area   || '—',
    category:     data.category     || 'Property',
    rules_list:   rulesList,
    messenger_cta: msg,
  };

  return templateBody.replace(/{{\s*([a-z_]+)\s*}}/gi, (_m, key) => replacements[key] ?? '');
}
