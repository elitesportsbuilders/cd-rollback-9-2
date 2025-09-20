console.log("SUCCESS: The data/index.ts file is loading! Version: Final");
// --- MOCK DATA FOR COURT DETECTOR SAAS ---

// --- INTERFACES FOR MOCK DATA ---
// Define Prospect interface directly here for mock data
// This is specific to your mock data structure and what Reports.vue expects.
// It should align with or extend your global Prospect interface if you have one.
export interface ResidentialProspectData { // Exported
    id: number;
    type: string;
    coords: [number, number]; // Assuming always [lat, lng]
    name: string;
    status: string; // e.g., "worn", "good"
    homeowner: string; // Added for Reports.vue
    address: string;   // Added for Reports.vue
    courtType: string; // Added for Reports.vue (e.g., "Tennis", "Pickleball")
    conditionScore: number; // Added for Reports.vue (e.g., 1-10)
    aiSummary?: string; // Added for consistency with AI-assessed condition
}

export interface CourtData { // Exported
    id: number;
    name: string;
    coords: [number, number];
    type: string; // e.g., "Tennis", "Pickleball"
    status: string; // e.g., "bright", "faded"
    isClient: boolean;
    isDue: boolean; // e.g., for resurface or warranty
    conditions?: string[]; // Used in Court Condition Report
}

export interface AiLeadData { // Exported
    id: number;
    type: string;
    name: string;
    coords: [number, number];
    isAcknowledged: boolean;
    aiScore: number;
    aiSummary: string;
    source: string;
    sourceUrl?: string;
    extractedData?: { [key: string]: any };
    isSynced?: boolean; // For acknowledged leads
}

// New interface for the raw event data inside COMPETITOR_INTEL_EVENTS
interface RawCompetitorEvent {
    id: number;
    type: string;
    date: string;
    summary: string;
    isImportant?: boolean;
}

// Existing interface for processed competitor events (has source and category)
export interface CompetitorIntelEvent extends RawCompetitorEvent { // Exported
    source: string;
    category: string;
}

export interface CompetitorStatusData { // Exported
    id: string;
    name: string;
    licenseNumber: string;
    status: string;
    violations: any[];
    lawsuits: any[];
}

interface CompetitorSeoHistory {
    labels: string[];
    datasets: { label: string; data: number[] }[];
}

interface CompetitorSeoRanking {
    competitor: string;
    keyword: string;
    rank: number;
    change: number;
    url: string;
}

export interface CompetitorSeoData { // Exported
    keywords: string[];
    rankings: CompetitorSeoRanking[];
    history: { [key: string]: CompetitorSeoHistory };
}


// --- Core Data Arrays ---

export const COURT_DATA: CourtData[] = [
    { id: 1, name: "Camelback High School", coords: [33.5101, -112.025], type: 'Tennis', status: 'bright', isClient: true, isDue: true, conditions: ["Good surface", "Clean lines"] },
    { id: 2, name: "Phoenix Tennis Center", coords: [33.5312, -112.091], type: 'Tennis', status: 'faded', isClient: false, isDue: false, conditions: ["Faded lines", "Minor cracks"] },
    { id: 3, name: "Pecos Community Center", coords: [33.3031, -111.979], type: 'Pickleball', status: 'bright', isClient: true, isDue: false, conditions: ["Excellent condition"] },
    { id: 4, name: "Encanto Sports Complex", coords: [33.4735, -112.086], type: 'Basketball', status: 'faded', isClient: false, isDue: false, conditions: ["Worn paint", "Some puddling"] },
    { id: 5, name: "Scottsdale Ranch Park", coords: [33.582, -111.87], type: 'Tennis', status: 'bright', isClient: true, isDue: true, conditions: ["Good surface", "Ready for play"] },
];

export const RESIDENTIAL_PROSPECT_DATA: ResidentialProspectData[] = [
    {
        id: 501, type: 'residential', coords: [33.535, -111.958], name: "Miller Residence", status: "worn",
        homeowner: "John Miller", address: "123 Main St, Phoenix, AZ", courtType: "Tennis", conditionScore: 4,
        aiSummary: "Older tennis court with significant surface wear. Good candidate for resurfacing in the next 6-12 months."
    },
    {
        id: 502, type: 'residential', coords: [33.529, -111.962], name: "Davis Residence", status: "good",
        homeowner: "Sarah Davis", address: "456 Oak Ave, Phoenix, AZ", courtType: "Pickleball", conditionScore: 8,
        aiSummary: "Recently installed pickleball court in excellent condition. Potential for maintenance contract in 2-3 years."
    },
    // Add more mock residential prospects here if needed
];

// --- AI-Discovered Leads (Unacknowledged) ---
export const AI_LEAD_DATA: AiLeadData[] = [
    {
        id: 101, type: 'permit', name: 'Paradise Valley Country Club Expansion', coords: [33.541, -111.965],
        isAcknowledged: false, // <-- This is the key flag
        aiScore: 9,
        aiSummary: "High-value permit for new athletic facilities, explicitly mentioning pickleball courts. Prime opportunity.",
        source: "Maricopa County Permits Dept.", sourceUrl: "#", extractedData: { "Project Type": "New Construction", "Stated Value": "$750,000" },
    },
    {
        id: 102, type: 'news', name: 'City of Mesa Announces Park Upgrades', coords: [33.415, -111.831],
        isAcknowledged: false, // <-- This is the key flag
        aiScore: 8,
        aiSummary: "News article details city budget approval for park renovations, including resurfacing of basketball courts.",
        source: "Mesa Tribune", sourceUrl: "#", extractedData: { "Status": "Budget Approved" },
    },
];

// --- Existing Leads (Acknowledged) ---
export const ACKNOWLEDGED_LEAD_DATA: AiLeadData[] = [
     {
        id: 103, type: 'permit', name: 'ASU Downtown Campus Rec Center', coords: [33.453, -112.073],
        isAcknowledged: true,
        aiScore: 7,
        aiSummary: "Permit filed for general repairs at ASU's downtown recreational center.",
        isSynced: false,
        source: "City of Phoenix Permits"
    },
];

export const ALL_PROSPECTS = [...COURT_DATA, ...RESIDENTIAL_PROSPECT_DATA, ...AI_LEAD_DATA, ...ACKNOWLEDGED_LEAD_DATA];

// --- Competitor & Market Intel ---

export const COMPETITORS: string[] = ["Ace Resurfacing Co.", "Sunstate Courts", "C&S Sport Surfaces", "Pro Courts Arizona", "Arizona Court Masters"];

export const CONTRACTOR_STATUS_DATA: CompetitorStatusData[] = [
    { id: 'comp1', name: "Ace Resurfacing Co.", licenseNumber: "AZ-123456", status: "Active", violations: [], lawsuits: [] },
    { id: 'comp2', name: "Sunstate Courts", licenseNumber: "AZ-654321", status: "Active", violations: [], lawsuits: [] },
    { id: 'comp3', name: "C&S Sport Surfaces", licenseNumber: "AZ-789012", status: "Suspended", violations: [{ date: "07/15/2025", description: "Failure to complete project", resolution: "License suspended pending review" }], lawsuits: [] },
    { id: 'comp4', name: "Pro Courts Arizona", licenseNumber: "CV-2025-001234", status: "Active", violations: [], lawsuits: [{ caseNumber: "CV-2025-001234", filingDate: "06/20/2025", court: "Maricopa Superior Court", description: "Breach of contract dispute with a supplier.", status: "Active" }] },
    { id: 'comp5', name: "Arizona Court Masters", licenseNumber: "N/A", status: "Pending", violations: [], lawsuits: [] }
];

export const COMPETITOR_INTEL_EVENTS: { [key: string]: RawCompetitorEvent[] } = { // Uses RawCompetitorEvent
    'comp1': [
        { id: 1, type: 'License Update', date: '2025-09-06', summary: 'Contractor license renewed with the AZ ROC.', isImportant: false },
        { id: 2, type: 'New Ad Campaign', date: '2025-09-04', summary: 'Launched a new Google Ads campaign targeting "pickleball court resurfacing Phoenix".', isImportant: true },
    ],
    'comp2': [
        { id: 4, type: 'Permit Filed', date: '2025-09-05', summary: 'Filed a commercial permit with the City of Glendale for a new multi-court facility.', isImportant: true },
    ],
    'comp3': [
        { id: 6, type: 'SEO Ranking Change', date: '2025-09-02', summary: 'Lost ranking for "running track repair", dropping off the first page.', isImportant: false },
    ],
};

const competitorActivities: CompetitorIntelEvent[] = Object.entries(COMPETITOR_INTEL_EVENTS).flatMap(([compId, events]) => {
    const competitor = CONTRACTOR_STATUS_DATA.find(c => c.id === compId);
    return events.map((event: RawCompetitorEvent) => ({ // Explicitly type 'event'
        ...event,
        source: competitor?.name || 'Unknown Competitor', // Source is added here
        category: 'Competitor Intel' // Category is added here
    }));
});

const leadActivities: CompetitorIntelEvent[] = [...AI_LEAD_DATA, ...ACKNOWLEDGED_LEAD_DATA].map(lead => ({
    id: lead.id,
    type: 'New Lead',
    date: '2025-09-07', // Using a static date for mock data consistency
    summary: `New ${lead.type} discovered: ${lead.name}`,
    source: lead.source, // Source is already on AiLeadData
    category: 'Lead Generation' // Category is hardcoded here
}));

export const ACTIVITY_FEED_DATA = [...competitorActivities, ...leadActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const COMPETITOR_SEO_DATA: CompetitorSeoData = {
    keywords: ['tennis court resurfacing phoenix', 'pickleball court construction az', 'running track repair arizona'],
    rankings: [
        { competitor: 'Ace Resurfacing Co.', keyword: 'tennis court resurfacing phoenix', rank: 2, change: 1, url: '#' },
        { competitor: 'Sunstate Courts', keyword: 'tennis court resurfacing phoenix', rank: 5, change: -1, url: '#' },
        { competitor: 'C&S Sport Surfaces', keyword: 'tennis court resurfacing phoenix', rank: 6, change: 0, url: '#' },
        { competitor: 'Ace Resurfacing Co.', keyword: 'pickleball court construction az', rank: 3, change: 0, url: '#' },
        { competitor: 'Sunstate Courts', keyword: 'pickleball court construction az', rank: 1, change: 0, url: '#' },
        { competitor: 'C&S Sport Surfaces', keyword: 'running track repair arizona', rank: 9, change: -2, url: '#' },
    ],
    history: {
        'tennis court resurfacing phoenix': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [ { label: 'Ace Resurfacing Co.', data: [4, 3, 3, 2] }, { label: 'Sunstate Courts', data: [5, 5, 4, 5] }, { label: 'C&S Sport Surfaces', data: [6, 6, 6, 6] }, ]
        },
        'pickleball court construction az': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [ { label: 'Ace Resurfacing Co.', data: [3, 3, 3, 3] }, { label: 'Sunstate Courts', data: [1, 1, 1, 1] }, ]
        },
         'running track repair arizona': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [ { label: 'C&S Sport Surfaces', data: [7, 7, 7, 9] }, ]
        }
    }
};

export const USER_INTEL_DATA = [ { id: 1, date: "08/12/2025", content: "Met with the facilities manager at Scottsdale Ranch Park." }];

// Mock Competitor Intel Events for Dashboard Alert Box
export const CompetitorIntelEvent = [
  {
    id: 1,
    summary: 'Competitor A launched a new product line targeting our key market.',
    source: 'Industry News',
    isImportant: true
  },
  {
    id: 2,
    summary: 'Competitor B received a major contract from a school district.',
    source: 'Press Release',
    isImportant: false
  },
  {
    id: 3,
    summary: 'Competitor C is rumored to be expanding into our region.',
    source: 'Market Rumor',
    isImportant: true
  }
];

// --- Core Data Arrays ---

export const mockLeads = [
  {
    id: 201,
    type: 'lead',
    name: 'Desert Ridge Tennis Expansion',
    coords: [33.683, -111.978],
    isAcknowledged: false,
    aiScore: 8,
    aiSummary: 'Expansion project for tennis courts at Desert Ridge. Good opportunity for resurfacing contract.',
    source: 'Phoenix Permits',
    sourceUrl: '#',
    extractedData: { "Project Type": "Expansion", "Budget": "$250,000" }
  },
  {
    id: 202,
    type: 'lead',
    name: 'Scottsdale Pickleball Complex',
    coords: [33.494, -111.926],
    isAcknowledged: false,
    aiScore: 7,
    aiSummary: 'New pickleball complex planned for Scottsdale. Potential for multi-year maintenance contract.',
    source: 'Scottsdale City Council',
    sourceUrl: '#',
    extractedData: { "Status": "Planning" }
  }
];

export const mockProspects = [
  {
    id: 601,
    type: 'prospect',
    coords: [33.600, -111.900],
    name: 'Smith Residence',
    status: 'good',
    homeowner: 'Alice Smith',
    address: '789 Pine St, Scottsdale, AZ',
    courtType: 'Pickleball',
    conditionScore: 9,
    aiSummary: 'Excellent condition pickleball court. Maintenance contract possible.'
  },
  {
    id: 602,
    type: 'prospect',
    coords: [33.610, -111.910],
    name: 'Johnson Residence',
    status: 'worn',
    homeowner: 'Bob Johnson',
    address: '321 Elm St, Scottsdale, AZ',
    courtType: 'Tennis',
    conditionScore: 5,
    aiSummary: 'Tennis court with moderate wear. Resurfacing needed soon.'
  }
];

export const mockUserIntel = [
  { id: 2, date: "09/01/2025", content: "Called back the HOA president for Desert Ridge Tennis Expansion." },
  { id: 3, date: "09/10/2025", content: "Received email from Scottsdale Pickleball Complex project manager." }
];
