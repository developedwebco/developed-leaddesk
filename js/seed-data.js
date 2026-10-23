// ============================================================================
// DevEloped LeadDesk — Intelligence, Scoring Engine, Seed Data & Templates
// Built for DevEloped Web Co. (Albuquerque, NM)
// ============================================================================

export const PIPELINE_STAGES = [
  { id: 'New Lead', label: 'New Lead', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' },
  { id: 'Called', label: 'Called', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.14)' },
  { id: 'Owner Not There', label: 'Owner Not There', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  { id: 'Callback Scheduled', label: 'Callback Scheduled', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.14)' },
  { id: 'Interested', label: 'Interested', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.14)' },
  { id: 'Sample Sent', label: 'Sample Sent', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.18)' },
  { id: 'Sold', label: 'Sold', color: '#10B981', bg: 'rgba(16, 185, 129, 0.18)' },
  { id: 'Not Interested', label: 'Not Interested', color: '#64748B', bg: 'rgba(100, 116, 139, 0.14)' },
  { id: 'Do Not Call', label: 'Do Not Call', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.14)' }
];

export const CATEGORY_CONFIG = {
  'Mexican restaurant': {
    label: 'Mexican Restaurant',
    demandPts: 15,
    bestTime: 'Call 2:00–4:30 PM (avoid lunch & dinner rush)',
    avgPackage: 950,
    icon: 'utensils'
  },
  'restaurants': {
    label: 'Restaurant',
    demandPts: 15,
    bestTime: 'Call 2:00–4:30 PM (avoid lunch & dinner rush)',
    avgPackage: 950,
    icon: 'utensils'
  },
  'food truck': {
    label: 'Food Truck',
    demandPts: 15,
    bestTime: 'Call 9:30–11:00 AM or 2:30–4:00 PM (between prep & service)',
    avgPackage: 750,
    icon: 'truck'
  },
  'bakery': {
    label: 'Bakery',
    demandPts: 15,
    bestTime: 'Call 10:30 AM–2:00 PM (after early morning bake rush)',
    avgPackage: 850,
    icon: 'croissant'
  },
  'barber shop': {
    label: 'Barber Shop',
    demandPts: 15,
    bestTime: 'Call Tue–Thu 9:30–11:30 AM (weekday mid-morning)',
    avgPackage: 800,
    icon: 'scissors'
  },
  'nail salon': {
    label: 'Nail Salon',
    demandPts: 15,
    bestTime: 'Call Mon–Wed 10:00 AM–12:00 PM (weekday mid-morning)',
    avgPackage: 850,
    icon: 'sparkles'
  },
  'beauty': {
    label: 'Beauty Studio',
    demandPts: 15,
    bestTime: 'Call Tue–Thu 10:00 AM–12:00 PM (weekday mid-morning)',
    avgPackage: 900,
    icon: 'heart'
  },
  'tattoo shop': {
    label: 'Tattoo Shop',
    demandPts: 15,
    bestTime: 'Call 12:00–2:00 PM (right at shop open before afternoon sessions)',
    avgPackage: 1100,
    icon: 'pen-tool'
  },
  'auto repair': {
    label: 'Auto Repair',
    demandPts: 15,
    bestTime: 'Call 10:00 AM–12:00 PM or 2:00–3:30 PM (avoid 8 AM drop-off & 4:30 PM pickup)',
    avgPackage: 1200,
    icon: 'wrench'
  },
  'other': {
    label: 'Local Business',
    demandPts: 10,
    bestTime: 'Call Tue–Thu 10:00–11:30 AM or 2:00–4:00 PM',
    avgPackage: 850,
    icon: 'briefcase'
  }
};

export function getCategoryMeta(categoryRaw = '') {
  const lower = (categoryRaw || '').toLowerCase().trim();
  if (CATEGORY_CONFIG[lower]) return CATEGORY_CONFIG[lower];
  if (lower.includes('mexican') || lower.includes('taco') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('diner')) {
    return CATEGORY_CONFIG['Mexican restaurant'];
  }
  if (lower.includes('truck')) return CATEGORY_CONFIG['food truck'];
  if (lower.includes('baker') || lower.includes('panaderia') || lower.includes('pastry')) return CATEGORY_CONFIG['bakery'];
  if (lower.includes('barber') || lower.includes('hair') || lower.includes('fade')) return CATEGORY_CONFIG['barber shop'];
  if (lower.includes('nail')) return CATEGORY_CONFIG['nail salon'];
  if (lower.includes('beauty') || lower.includes('pmu') || lower.includes('lash') || lower.includes('spa') || lower.includes('salon')) return CATEGORY_CONFIG['beauty'];
  if (lower.includes('tattoo') || lower.includes('ink') || lower.includes('pierc')) return CATEGORY_CONFIG['tattoo shop'];
  if (lower.includes('auto') || lower.includes('mechanic') || lower.includes('tire') || lower.includes('body shop') || lower.includes('detail')) return CATEGORY_CONFIG['auto repair'];
  return CATEGORY_CONFIG['other'];
}

export function getBestTimeToCall(categoryRaw = '') {
  return getCategoryMeta(categoryRaw).bestTime;
}

// Website Classifier: Determines if a URL is None, Weak Presence (Social/Booking/Directory), or Real Website
export function classifyWebsiteUrl(url = '') {
  const clean = (url || '').trim().toLowerCase();
  if (!clean) {
    return { status: 'None', detail: 'No website listed', isLead: true };
  }

  const weakPatterns = [
    { match: ['booksy.com'], detail: 'Booksy only' },
    { match: ['square.site', 'squareup.com/appointments', 'squareup.com'], detail: 'Square booking only' },
    { match: ['glossgenius.com'], detail: 'GlossGenius only' },
    { match: ['vagaro.com'], detail: 'Vagaro booking only' },
    { match: ['fresha.com'], detail: 'Fresha booking only' },
    { match: ['schedulicity.com', 'acuityscheduling.com', 'calendly.com'], detail: 'Booking page only' },
    { match: ['linktr.ee', 'beacons.ai', 'bio.site', 'milkshake.app', 'campsite.bio', 'solo.to'], detail: 'Link-in-bio only' },
    { match: ['instagram.com'], detail: 'Instagram only' },
    { match: ['facebook.com', 'fb.com'], detail: 'Facebook page only' },
    { match: ['tiktok.com'], detail: 'TikTok only' },
    { match: ['toasttab.com', 'clover.com', 'chownow.com', 'menufy.com', 'qmenu.us', 'beyondmenu.com'], detail: 'Ordering page only' },
    { match: ['doordash.com', 'ubereats.com', 'grubhub.com', 'postmates.com'], detail: 'Delivery directory only' },
    { match: ['yelp.com', 'yellowpages.com', 'tripadvisor.com', 'mapquest.com'], detail: 'Directory page only' }
  ];

  for (const pattern of weakPatterns) {
    if (pattern.match.some(domain => clean.includes(domain))) {
      return { status: 'Weak Presence', detail: pattern.detail, isLead: true };
    }
  }

  return { status: 'Has Website', detail: 'Custom website exists', isLead: false };
}

// Pitch Score Engine (0–100)
export function calculatePitchScore(lead) {
  const reviews = Number(lead.reviewCount) || 0;
  const rating = Number(lead.rating) || 0;
  const webStatus = (lead.websiteStatus || 'None').toLowerCase();
  const catMeta = getCategoryMeta(lead.category);

  // 1. Review volume (up to 30 pts)
  let reviewPts = 6;
  if (reviews >= 150) reviewPts = 30;
  else if (reviews >= 80) reviewPts = 26;
  else if (reviews >= 45) reviewPts = 23;
  else if (reviews >= 25) reviewPts = 19;
  else if (reviews >= 10) reviewPts = 15;

  // 2. Google rating quality (up to 20 pts)
  let ratingPts = 10;
  if (rating >= 4.8) ratingPts = 20;
  else if (rating >= 4.5) ratingPts = 18;
  else if (rating >= 4.2) ratingPts = 16;
  else if (rating >= 4.0) ratingPts = 14;
  else if (rating > 0) ratingPts = 8;

  // 3. Website lack / opportunity (up to 25 pts)
  let webPts = 25; // No website at all = highest urgency
  if (webStatus.includes('weak')) {
    webPts = 19; // Weak presence (Booksy / Square / Link-in-bio)
  } else if (webStatus.includes('has')) {
    webPts = 0;
  }

  // 4. Category demand (up to 15 pts)
  const categoryPts = catMeta.demandPts || 12;

  // 5. Recent activity & phone availability (up to 10 pts)
  let activityPts = lead.recentActivity !== false ? 8 : 5;
  if (reviews >= 60 && rating >= 4.6) activityPts = 10;
  if (lead.phone && lead.phone.trim().length >= 10) activityPts = Math.min(10, activityPts + 1);

  const total = Math.max(0, Math.min(100, reviewPts + ratingPts + webPts + categoryPts + activityPts));

  return {
    total,
    breakdown: {
      reviewPts,
      ratingPts,
      webPts,
      categoryPts,
      activityPts
    }
  };
}

// Dynamic One-Line Pitch Angle Generator
export function generatePitchAngle(lead) {
  const reviews = Number(lead.reviewCount) || 0;
  const rating = Number(lead.rating) || 0;
  const cat = (lead.category || '').toLowerCase();
  const isWeak = (lead.websiteStatus || '').toLowerCase().includes('weak');
  const detail = lead.weakPresenceDetail || 'a booking link';

  const ratingStr = rating ? `${rating.toFixed(1)}★ rating` : 'strong local reputation';
  const reviewStr = reviews ? `${reviews} Google reviews` : 'steady local traffic';

  if (cat.includes('tattoo')) {
    if (isWeak) {
      return `${reviewStr} (${ratingStr}) and only ${detail.toLowerCase()} — clients searching Google for artist portfolios, flash sheets & booking info hit a dead end.`;
    }
    return `${reviewStr} and no website — customers want to browse artist styles, aftercare & booking rules before walking in.`;
  }

  if (cat.includes('baker') || cat.includes('panaderia')) {
    if (isWeak) {
      return `${reviewStr} (${ratingStr}) with ${detail.toLowerCase()} — custom cake, pan dulce & catering buyers need a real photo gallery and order inquiry page.`;
    }
    return `${reviewStr} and no website — locals are searching for daily pastries, custom cake galleries & hours but can't see a menu online.`;
  }

  if (cat.includes('mexican') || cat.includes('restaurant') || cat.includes('food truck') || cat.includes('taco')) {
    if (cat.includes('truck')) {
      return `${reviewStr} and no website — hungry customers are searching for today's truck location, full taco menu & catering bookings.`;
    }
    return `${reviewStr} (${ratingStr}) and no website — customers are finding them on Google Maps but can't view the menu or order direct without 30% app fees.`;
  }

  if (cat.includes('barber')) {
    if (isWeak) {
      return `${ratingStr} (${reviewStr}) but sending all Google traffic to ${detail} — a custom barbershop site builds brand prestige, showcases fresh fades & captures walk-ins.`;
    }
    return `${reviewStr} (${ratingStr}) and no website — new Albuquerque residents searching "best barber near me" can't see cuts, pricing, or book online.`;
  }

  if (cat.includes('nail') || cat.includes('beauty') || cat.includes('pmu')) {
    if (isWeak) {
      return `${reviewStr} and relying on ${detail.toLowerCase()} — high-ticket beauty clients expect a luxury portfolio website with service menus & instant booking.`;
    }
    return `${reviewStr} (${ratingStr}) with no website — clients searching for nail art, lash/PMU portfolios & price lists have nowhere to look before booking.`;
  }

  if (cat.includes('auto')) {
    return `${reviewStr} (${ratingStr}) and no website — drivers with car trouble want to verify services, warranties & request a quote online before calling.`;
  }

  if (isWeak) {
    return `${reviewStr} (${ratingStr}) and only ${detail.toLowerCase()} — upgrading to a custom website turns Google searchers into high-trust paying customers.`;
  }
  return `${reviewStr} (${ratingStr}) and no website — customers are finding them on Google but can't see services, photos, or contact them online.`;
}

// ============================================================================
// 18 PRE-LOADED REAL ALBUQUERQUE LEADS
// ============================================================================
const rawSeedLeads = [
  {
    id: 'lead-abq-01',
    businessName: 'Gallo Negro Tattoo',
    category: 'tattoo shop',
    phone: '(505) 717-2307',
    email: '',
    ownerName: '',
    address: '2505 Quincy St NE',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 271,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Link-in-bio only',
    websiteUrl: 'https://linktr.ee/gallonegrotattoo',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gallo+Negro+Tattoo+2505+Quincy+St+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://gallo-negro-tattoo.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 1100, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-02',
    businessName: 'El Dorado Bakery',
    category: 'bakery',
    phone: '(505) 247-2979',
    email: '',
    ownerName: '',
    address: '2125 Broadway Blvd SE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 70,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Ordering page only',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=El+Dorado+Bakery+2125+Broadway+Blvd+SE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://el-dorado-bakery-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 850, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-03',
    businessName: 'Helen\'s Bakery',
    category: 'bakery',
    phone: '(505) 475-7608',
    email: '',
    ownerName: '',
    address: '1014 San Pedro Dr NE',
    city: 'Albuquerque, NM',
    rating: 4.3,
    reviewCount: 47,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Helens+Bakery+1014+San+Pedro+Dr+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://helens-bakery-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 850, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-04',
    businessName: 'Barberville NM',
    category: 'barber shop',
    phone: '(505) 234-0435',
    email: '',
    ownerName: '',
    address: '2839 Carlisle Blvd NE Ste 180',
    city: 'Albuquerque, NM',
    rating: 5.0,
    reviewCount: 64,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Booksy only',
    websiteUrl: 'https://booksy.com',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Barberville+NM+2839+Carlisle+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://barberville-nm.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 800, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-05',
    businessName: 'Get Faded Barber Shop',
    category: 'barber shop',
    phone: '(505) 573-1026',
    email: '',
    ownerName: '',
    address: '1406 Rio Grande Blvd NW',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 58,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Booksy only',
    websiteUrl: 'https://booksy.com',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Get+Faded+Barber+Shop+1406+Rio+Grande+Blvd+NW+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://get-faded-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 800, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-06',
    businessName: 'Theo\'s Family Barbershop',
    category: 'barber shop',
    phone: '(505) 503-8836',
    email: '',
    ownerName: 'Theo',
    address: '3812 Carlisle Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.4,
    reviewCount: 42,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Theos+Family+Barbershop+3812+Carlisle+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://theos-barbershop-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 750, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-07',
    businessName: 'Tacos la Piramide',
    category: 'Mexican restaurant',
    phone: '(505) 569-3083',
    email: '',
    ownerName: '',
    address: '5000 Jefferson St NE',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 54,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tacos+la+Piramide+5000+Jefferson+St+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://tacos-la-piramide.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 950, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-08',
    businessName: 'Toy\'s Tacos LLC',
    category: 'food truck',
    phone: '(505) 459-8929',
    email: '',
    ownerName: '',
    address: '801 Comanche Rd NE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 38,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Toys+Tacos+LLC+801+Comanche+Rd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://toys-tacos-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 750, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-09',
    businessName: 'Anthony\'s Tacos',
    category: 'food truck',
    phone: '(505) 569-4736',
    email: '',
    ownerName: 'Anthony',
    address: '2405 Candelaria Rd NE',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 33,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Anthonys+Tacos+2405+Candelaria+Rd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://anthonys-tacos-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 750, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-10',
    businessName: 'Panaderia Zaragoza',
    category: 'bakery',
    phone: '(505) 341-9617',
    email: '',
    ownerName: '',
    address: '803 98th St SW',
    city: 'Albuquerque, NM',
    rating: 4.5,
    reviewCount: 41,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Panaderia+Zaragoza+803+98th+St+SW+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://panaderia-zaragoza.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 850, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-11',
    businessName: 'Exquisite Barber Parlor',
    category: 'barber shop',
    phone: '(505) 639-4271',
    email: '',
    ownerName: '',
    address: '4717 Menaul Blvd NE Ste B',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 36,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Exquisite+Barber+Parlor+4717+Menaul+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://exquisite-barber-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 800, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-12',
    businessName: 'Nail Slay Beauty Bar',
    category: 'nail salon',
    phone: '(505) 274-2707',
    email: '',
    ownerName: '',
    address: '1305 San Mateo Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 29,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nail+Slay+Beauty+Bar+1305+San+Mateo+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://nail-slay-beauty.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 850, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-13',
    businessName: 'The Nail Boutique / Nails by Andrea',
    category: 'nail salon',
    phone: '(505) 400-3221',
    email: '',
    ownerName: 'Andrea',
    address: '5005 4th St NW #106',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 34,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Nail+Boutique+Nails+by+Andrea+5005+4th+St+NW+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://nails-by-andrea-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 850, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-14',
    businessName: 'Tipsy Beauty Lounge',
    category: 'nail salon',
    phone: '(505) 884-0058',
    email: '',
    ownerName: '',
    address: '3500 Menaul Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.5,
    reviewCount: 52,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tipsy+Beauty+Lounge+3500+Menaul+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://tipsy-beauty-lounge.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 900, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-15',
    businessName: 'Candied PMU',
    category: 'beauty',
    phone: '(505) 410-8943',
    email: '',
    ownerName: '',
    address: '3321 Candelaria Rd NE',
    city: 'Albuquerque, NM',
    rating: 4.9,
    reviewCount: 26,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Candied+PMU+3321+Candelaria+Rd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Hot',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://candied-pmu-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 950, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-16',
    businessName: 'Glam Sesh Studio',
    category: 'beauty',
    phone: '(505) 319-9950',
    email: '',
    ownerName: '',
    address: '901 Lamberton Pl NE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 22,
    websiteStatus: 'None',
    weakPresenceDetail: 'No website',
    websiteUrl: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Glam+Sesh+Studio+901+Lamberton+Pl+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://glam-sesh-studio.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 900, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-17',
    businessName: 'Enchantment Fadez',
    category: 'barber shop',
    phone: '(505) 315-1879',
    email: '',
    ownerName: '',
    address: '4208 Central Ave SE',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 39,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Booksy only',
    websiteUrl: 'https://booksy.com',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Enchantment+Fadez+4208+Central+Ave+SE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://enchantment-fadez-abq.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 800, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  },
  {
    id: 'lead-abq-18',
    businessName: 'Revolution Men\'s Hair',
    category: 'barber shop',
    phone: '(505) 363-7145',
    email: '',
    ownerName: '',
    address: '6001 San Mateo Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 45,
    websiteStatus: 'Weak Presence',
    weakPresenceDetail: 'Square booking only',
    websiteUrl: 'https://square.site',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Revolution+Mens+Hair+6001+San+Mateo+Blvd+NE+Albuquerque+NM',
    stage: 'New Lead',
    temperature: 'Warm',
    nextFollowUp: null,
    sampleSite: {
      url: 'https://revolution-mens-hair.developedweb.co',
      dateSent: '',
      method: 'Text / SMS'
    },
    deal: { priceAgreed: 800, depositPaid: 0, paidInFull: false },
    notes: [],
    callLogs: []
  }
];

export const INITIAL_LEADS = rawSeedLeads.map(lead => {
  const scoreObj = calculatePitchScore(lead);
  return {
    ...lead,
    pitchScore: scoreObj.total,
    pitchBreakdown: scoreObj.breakdown,
    pitchAngle: generatePitchAngle(lead),
    bestTimeToCall: getBestTimeToCall(lead.category),
    createdAt: '2026-10-22T08:00:00-06:00'
  };
});

// ============================================================================
// STARTER SCRIPTS LIBRARY
// ============================================================================
export const DEFAULT_SCRIPTS = {
  opener: {
    title: 'Cold Call Opener',
    badge: 'Core Pitch',
    content: `Hi, can I speak to the owner?

(Once owner is on the line):
"Hey {OwnerName}, I'm Dev, a local web designer here in Albuquerque with DevEloped Web Co. I found {BusinessName} on Google — saw you have {ReviewCount} awesome reviews — and noticed you don't have a real website yet. Is there a specific reason for that?

(Listen briefly — usually 'haven't gotten around to it' or 'just use social media/Booksy')

Totally get it. Because your reviews are so strong, I actually went ahead and built a quick custom sample site for {BusinessName} so you can see exactly what it would look like on a phone. No strings attached at all — what's the best cell number to text you the preview link?"`
  },
  gatekeeper: {
    title: 'Gatekeeper Script ("Owner Not Available")',
    badge: 'Gatekeeper',
    content: `"No problem at all! I'm Dev — I'm a local web designer here in town and I put together a quick custom website preview for {BusinessName}.

Who's the owner so I know who to ask for next time? And is it usually better to catch them in the morning or mid-afternoon?

Awesome, I'll jot their name down and try back then. Thanks so much!"`
  },
  voicemail: {
    title: 'Voicemail Script',
    badge: '30-Sec Drop',
    content: `"Hey there, this message is for the owner of {BusinessName}. My name is Dev, I run DevEloped Web Co. right here in Albuquerque.

I saw your Google listing with {ReviewCount} reviews and noticed there wasn't a website linked, so I actually mocked up a custom homepage design for {BusinessName} just to show you what's possible.

Shoot me a quick text back at this number and I'll text you the live link to check out. Again, this is Dev in Albuquerque — talk soon!"`
  },
  objections: {
    tooExpensive: {
      title: '"It\'s probably too expensive / We don\'t have the budget"',
      content: `"I hear that a lot — big agencies in town try to charge $3,000 to $5,000, which is crazy for a local spot. Because I already built out the layout for {BusinessName}, I do a simple flat one-time build for local Albuquerque businesses that pays for itself in just a handful of new customers. Let me text you the sample link first — if you don't love how it looks, you don't owe me a dime."`
    },
    alreadyHaveSomeone: {
      title: '"I already have someone working on it / My nephew is doing it"',
      content: `"Oh nice! Since they're working on it right now, it actually helps to have a live design reference. Since I already built the sample for {BusinessName}, let me text you the link anyway — you can steal ideas from it or keep me in your back pocket if things get delayed."`
    },
    notInterested: {
      title: '"We\'re not interested / Word of mouth is enough"',
      content: `"Respect that 100% — clearly word of mouth is working with {ReviewCount} Google reviews! The only catch is when someone hears about {BusinessName} from a friend, the first thing they do is Google you to see photos, pricing, or menus. Since I already made the sample for you, can I just text you the link so it doesn't go to waste?"`
    },
    justSendInfo: {
      title: '"Just send me some info / Email me"',
      content: `"You got it — instead of a boring PDF brochure, I'll send you the actual live sample website I built for {BusinessName}. Is this number a cell I can text the link to right now, or what's the best mobile number so you can tap it on your phone?"`
    },
    callMeLater: {
      title: '"I\'m slammed right now, call me later"',
      content: `"Totally understand, I won't hold you up! Real quick before I let you run — can I text the sample link for {BusinessName} to this number so you can peek at it tonight when things slow down, and I'll follow up in two days?"`
    }
  },
  sampleReveal: {
    title: 'Sample Reveal Script (Live Walkthrough)',
    badge: 'Demo Call',
    content: `"Awesome, did that text with the link come through? Go ahead and tap it.

1. Right at the top, I highlighted your {Rating}★ Google rating and {ReviewCount} reviews so new customers trust {BusinessName} in the first 3 seconds.
2. Below that is a mobile-first layout built specifically for {Category} customers — super fast tap-to-call, directions, and showcase gallery.
3. Most importantly, you own 100% of it — no marketplace commissions or sending your customers to competitors' pages.

Between 1 and 10, how close is this to the vibe of {BusinessName}?"`
  },
  closing: {
    title: 'Closing Script',
    badge: 'Close Deal',
    content: `"Love that you like the direction. Here's how simple I make it:

To customize all the photos, finalize your exact menu/service list, hook up your custom .com domain, and get {BusinessName} live on Google Maps takes me 72 hours.

It's a flat $850 complete package — we just do half ($425) today to lock in your domain and build slot, and the other half only after it's live and you're 100% thrilled with every pixel.

Do you want to use {BusinessName}.com for your domain, and should I send the deposit invoice to your cell or email?"`
  }
};

// ============================================================================
// STARTER MESSAGE TEMPLATES
// ============================================================================
export const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-sms-sample',
    name: 'Send Sample Site Link (Text / SMS)',
    channel: 'sms',
    subject: '',
    body: `Hey {OwnerName}! It's Dev from DevEloped Web Co. here in Albuquerque. Great chatting with you — here is the live custom sample website I put together for {BusinessName}: {SampleLink}\n\nTake a look on your phone when you have 2 minutes and let me know what you think!`
  },
  {
    id: 'tpl-email-sample',
    name: 'Send Sample Site Link (Email)',
    channel: 'email',
    subject: `Custom Website Preview for {BusinessName} (DevEloped Web Co.)`,
    body: `Hi {OwnerName},\n\nI'm Dev, a local web designer here in Albuquerque (DevEloped Web Co.). I came across {BusinessName} on Google and saw your awesome {Rating}★ rating across {ReviewCount} reviews, and noticed you didn't have a custom website linked yet.\n\nInstead of just pitching you, I went ahead and built a working sample homepage for {BusinessName} so you can see how clean it looks on mobile and desktop:\n\n👉 Live Preview: {SampleLink}\n\nI can customize any photos, colors, menus/services, and connect it directly to your Google Maps listing within 72 hours.\n\nLet me know what you think or reply here if you'd like to hop on a quick 5-minute call!\n\nBest,\nDev\nDevEloped Web Co. — Albuquerque, NM`
  },
  {
    id: 'tpl-3day-nudge',
    name: '3-Day Follow-Up Nudge',
    channel: 'sms',
    subject: `Quick follow-up on the {BusinessName} sample site`,
    body: `Hey {OwnerName}, Dev here in ABQ! Just wanted to bump the sample site I made for {BusinessName} to the top of your texts: {SampleLink}\n\nDid you get a chance to peek at it? Happy to swap in any of your favorite photos or tweak the colors!`
  },
  {
    id: 'tpl-2week-nudge',
    name: '2-Week Follow-Up Nudge',
    channel: 'sms',
    subject: `Keeping the {BusinessName} demo live for you`,
    body: `Hey {OwnerName}! Hope business at {BusinessName} has been booming. I'm wrapping up my web builds for this month and still have the {BusinessName} preview saved on my server ({SampleLink}).\n\nIf you want to get it live on Google Maps before next month, let me know and I'll lock it in for you!`
  },
  {
    id: 'tpl-thank-you-sale',
    name: 'Thank-You After a Sale (Onboarding)',
    channel: 'sms',
    subject: `Welcome to DevEloped Web Co. — {BusinessName} Build Started!`,
    body: `Awesome working with you today, {OwnerName}! 🎉 I've officially started the final build for {BusinessName}.\n\nText or email me any favorite photos, logos, or price updates you want included, and I'll send you the final live link to review within 48–72 hours.\n\n— Dev, DevEloped Web Co.`
  }
];

// ============================================================================
// SIMULATED / DEMO DISCOVERY POOL FOR LEAD FINDER
// Includes valid leads (No Website & Weak Presence) AND filtered-out businesses
// (Has Real Website or <10 Reviews) so the Lead Finder filter works authentically!
// ============================================================================
export const DEMO_SCRUB_POOL = [
  // Restaurants / Mexican / Food Trucks
  {
    businessName: 'Taqueria El Paisa ABQ',
    category: 'Mexican restaurant',
    phone: '(505) 242-8194',
    address: '820 Bridge Blvd SW',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 318,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Burritos Alinstante Yale',
    category: 'Mexican restaurant',
    phone: '(505) 842-0913',
    address: '2102 Yale Blvd SE',
    city: 'Albuquerque, NM',
    rating: 4.5,
    reviewCount: 164,
    websiteUrl: 'https://doordash.com/store/burritos',
    isSampleDemo: true
  },
  {
    businessName: 'Mariscos Altamar Local Kitchen',
    category: 'restaurants',
    phone: '(505) 831-5520',
    address: '6215 Central Ave NW',
    city: 'Albuquerque, NM',
    rating: 4.4,
    reviewCount: 89,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Birrieria Los Compadres Truck',
    category: 'food truck',
    phone: '(505) 615-4410',
    address: '4400 Central Ave SW',
    city: 'Albuquerque, NM',
    rating: 4.9,
    reviewCount: 112,
    websiteUrl: 'https://instagram.com/birrierialoscompadres',
    isSampleDemo: true
  },
  {
    businessName: 'Zia Green Chile Smashburgers',
    category: 'food truck',
    phone: '(505) 908-2219',
    address: '3100 San Mateo Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 63,
    websiteUrl: '',
    isSampleDemo: true
  },
  // Barber Shops
  {
    businessName: 'Duke City Classic Cuts',
    category: 'barber shop',
    phone: '(505) 299-4108',
    address: '7200 Montgomery Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 94,
    websiteUrl: 'https://booksy.com/en-us/duke-city-cuts',
    isSampleDemo: true
  },
  {
    businessName: 'Nob Hill Razor & Fade Studio',
    category: 'barber shop',
    phone: '(505) 265-7731',
    address: '3410 Central Ave SE',
    city: 'Albuquerque, NM',
    rating: 4.9,
    reviewCount: 141,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Westside Blendz Barbershop',
    category: 'barber shop',
    phone: '(505) 897-3312',
    address: '10131 Coors Blvd NW',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 51,
    websiteUrl: 'https://square.site/book/westsideblendz',
    isSampleDemo: true
  },
  // Nail Salons & Beauty
  {
    businessName: 'Sandia Luxe Nails & Spa',
    category: 'nail salon',
    phone: '(505) 881-6044',
    address: '4500 Osuna Rd NE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 128,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Desert Rose Gel & Acrylic Studio',
    category: 'nail salon',
    phone: '(505) 255-9182',
    address: '2210 Juan Tabo Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 76,
    websiteUrl: 'https://glossgenius.com/desertrosenails',
    isSampleDemo: true
  },
  {
    businessName: 'Brows & Lashes by Marisol',
    category: 'beauty',
    phone: '(505) 323-7190',
    address: '5800 Eubank Blvd NE',
    city: 'Albuquerque, NM',
    rating: 5.0,
    reviewCount: 49,
    websiteUrl: 'https://linktr.ee/marisolbrowsabq',
    isSampleDemo: true
  },
  // Bakeries
  {
    businessName: 'Pasteleria La Reina del Sur',
    category: 'bakery',
    phone: '(505) 877-4092',
    address: '1620 Isleta Blvd SW',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 134,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Bosque Artisan Tortillas & Pan',
    category: 'bakery',
    phone: '(505) 344-8821',
    address: '4109 4th St NW',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 59,
    websiteUrl: 'https://facebook.com/bosquepanaderia',
    isSampleDemo: true
  },
  // Tattoo Shops
  {
    businessName: 'Black Mesa Ink Collective',
    category: 'tattoo shop',
    phone: '(505) 268-9012',
    address: '118 Tulane Dr SE',
    city: 'Albuquerque, NM',
    rating: 4.9,
    reviewCount: 195,
    websiteUrl: 'https://instagram.com/blackmesainkabq',
    isSampleDemo: true
  },
  {
    businessName: 'Route 66 Traditional Tattoo',
    category: 'tattoo shop',
    phone: '(505) 243-6619',
    address: '912 Central Ave SW',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 84,
    websiteUrl: '',
    isSampleDemo: true
  },
  // Auto Repair
  {
    businessName: 'Montaño Honest Auto & Brake',
    category: 'auto repair',
    phone: '(505) 345-7710',
    address: '3901 Pan American Fwy NE',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 172,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Lomas Transmission & Muffler Shop',
    category: 'auto repair',
    phone: '(505) 256-3390',
    address: '5112 Lomas Blvd NE',
    city: 'Albuquerque, NM',
    rating: 4.6,
    reviewCount: 91,
    websiteUrl: '',
    isSampleDemo: true
  },
  {
    businessName: 'Rio Grande Foreign & Domestic Garage',
    category: 'auto repair',
    phone: '(505) 836-4120',
    address: '7400 Central Ave SW',
    city: 'Albuquerque, NM',
    rating: 4.5,
    reviewCount: 44,
    websiteUrl: 'https://yelp.com/biz/rio-grande-garage',
    isSampleDemo: true
  },
  // Businesses that SHOULD BE FILTERED OUT (already have real custom websites or <10 reviews)
  {
    businessName: 'Frontier Restaurant',
    category: 'restaurants',
    phone: '(505) 266-0550',
    address: '2400 Central Ave SE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 8420,
    websiteUrl: 'https://www.frontierrestaurant.com',
    isSampleDemo: true
  },
  {
    businessName: 'Golden Crown Panaderia',
    category: 'bakery',
    phone: '(505) 243-2424',
    address: '1103 Mountain Rd NW',
    city: 'Albuquerque, NM',
    rating: 4.8,
    reviewCount: 1650,
    websiteUrl: 'https://www.goldencrown.biz',
    isSampleDemo: true
  },
  {
    businessName: 'Ace Barbershop Downtown',
    category: 'barber shop',
    phone: '(505) 508-2211',
    address: '414 Central Ave SE',
    city: 'Albuquerque, NM',
    rating: 4.7,
    reviewCount: 310,
    websiteUrl: 'https://www.acebarbershopabq.com',
    isSampleDemo: true
  },
  {
    businessName: 'New Popup Taco Cart (Too New)',
    category: 'food truck',
    phone: '(505) 999-0102',
    address: '1200 Central Ave SW',
    city: 'Albuquerque, NM',
    rating: 5.0,
    reviewCount: 4, // Filtered out: < 10 reviews
    websiteUrl: '',
    isSampleDemo: true
  }
];
