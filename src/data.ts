// --- MOCK DATA FOR COURT DETECTOR SAAS ---

// --- Core Data Arrays ---

export const COURT_DATA = [
    { id: 1, name: "Camelback High School", coords: [33.5101, -112.025], type: 'Tennis', status: 'bright', conditions: [], isClient: true, isDue: true },
    { id: 2, name: "Phoenix Tennis Center", coords: [33.5312, -112.091], type: 'Tennis', status: 'faded', conditions: ["Multiple hairline cracks", "Surface fading near baselines"], isClient: false, isDue: false },
    { id: 3, name: "Pecos Community Center", coords: [33.3031, -111.979], type: 'Pickleball', status: 'bright', conditions: [], isClient: true, isDue: false },
    { id: 4, name: "Encanto Sports Complex", coords: [33.4735, -112.086], type: 'Basketball', status: 'faded', conditions: ["Worn acrylic surface", "Faded line markings"], isClient: false, isDue: false },
    { id: 5, name: "Scottsdale Ranch Park", coords: [33.582, -111.87], type: 'Tennis', status: 'bright', conditions: [], isClient: true, isDue: true },
];

export const LEAD_DATA = [
    { id: 101, type: 'permit', name: 'Paradise Valley Country Club Expansion', coords: [33.541, -111.965], aiScore: 9, aiSummary: "High-value permit for new athletic facilities, explicitly mentioning pickleball courts. Prime opportunity.", isSynced: false, extractedData: { "Project Type": "New Construction", "Value": "$750,000" }, details: { contractor: "Pavement Perfectionists" } },
    { id: 102, type: 'news', name: 'City of Mesa Announces Park Upgrades', coords: [33.415, -111.831], aiScore: 8, aiSummary: "News article details city budget approval for park renovations, including resurfacing of basketball courts.", isSynced: true, extractedData: { "Source": "Mesa Tribune", "Status": "Budget Approved" }, details: { contractor: "Sport Surfaces Inc." } },
    { id: 103, type: 'permit', name: 'ASU Downtown Campus Rec Center', coords: [33.453, -112.073], aiScore: 7, aiSummary: "Permit filed for general repairs at ASU's downtown recreational center. Potential for court work.", isSynced: false, extractedData: { "Project Type": "Repair/Maintenance", "Value": "$50,000" }, details: { contractor: "Hard-Court Pros" } },
    { id: 104, type: 'permit', name: 'Anthem Community Center', coords: [33.865, -112.14], aiScore: 9, aiSummary: "Permit for new pickleball court construction.", isSynced: false, extractedData: { "Project Type": "New Construction", "Value": "$120,000" }, details: { contractor: "Asphalt Aces" } },
];

export const RESIDENTIAL_PROSPECT_DATA = [
    { id: 501, type: 'residential', coords: [33.535, -111.958], name: "Miller Residence", homeowner: "Robert Miller", address: "6548 E Ironwood Dr, Paradise Valley, AZ", courtType: "Tennis", conditionScore: 6.2, status: "worn", aiSummary: "Visible wear and fading on the tennis court surface. High potential for a resurfacing lead.", isSynced: false, isClient: false, isDue: false },
    { id: 502, type: 'residential', coords: [33.529, -111.962], name: "Davis Residence", homeowner: "Jessica Davis", address: "6701 E Saguaro Ln, Paradise Valley, AZ", courtType: "Pickleball", conditionScore: 8.8, status: "good", aiSummary: "Well-maintained pickleball court on a large property.", isSynced: false, isClient: false, isDue: false },
];

export const ALL_PROSPECTS = [...COURT_DATA, ...LEAD_DATA, ...RESIDENTIAL_PROSPECT_DATA];

// --- Heatmap Data ---

export const LEAD_HEATMAP_DATA = LEAD_DATA.map(d => [d.coords[0], d.coords[1], d.aiScore * 10]);
export const CLIENT_HEATMAP_DATA = COURT_DATA.filter(c => c.isClient).map(d => [d.coords[0], d.coords[1], 50]);

// --- Competitor & Market Intel ---

export const COMPETITORS = ["Hard-Court Pros", "Asphalt Aces", "Sport Surfaces Inc.", "Pavement Perfectionists"];

export const CONTRACTOR_STATUS_DATA = [
    { id: 1, name: "Hard-Court Pros", licenseNumber: "AZ-123456", status: "Active", violations: [], lawsuits: [] },
    { id: 2, name: "Asphalt Aces", licenseNumber: "AZ-654321", status: "Suspended", violations: [{ date: "07/15/2025", description: "Failure to complete project", resolution: "License suspended pending review" }], lawsuits: [] },
    { id: 3, name: "Sport Surfaces Inc.", licenseNumber: "AZ-789012", status: "Active", violations: [], lawsuits: [{ caseNumber: "CV-2025-001234", filingDate: "06/20/2025", court: "Maricopa Superior Court", description: "Breach of contract dispute with a supplier.", status: "Active" }] },
    { id: 4, name: "Pavement Perfectionists", licenseNumber: "AZ-345678", status: "Active", violations: [], lawsuits: [] },
    { id: 5, name: "New Wave Courts", licenseNumber: "N/A", status: "Pending", violations: [], lawsuits: [] }
];

export const COMPETITOR_WEB_INTEL = [
    { id: 1, competitorName: 'Hard-Court Pros', date: 'August 5, 2025', headline: 'Hard-Court Pros Awarded Contract for Phoenix Union High School District', aiSummary: "Hard-Court Pros announced a significant multi-year contract to resurface and maintain tennis courts across the Phoenix Union High School District, highlighting their growing dominance in the educational sector.", sourceUrl: '#', extractedData: { 'Sector': 'Education', 'Contract Type': 'Multi-Year Maintenance' } },
    { id: 2, competitorName: 'Asphalt Aces', date: 'July 28, 2025', headline: 'Asphalt Aces Launches New "Eco-Friendly Surfacing" Option', aiSummary: "Asphalt Aces has introduced a new sustainable court surfacing product made from recycled materials, targeting environmentally conscious residential and commercial clients.", sourceUrl: '#', extractedData: { 'Offering': 'New Product', 'Target Market': 'Residential, Commercial' } },
    { id: 3, competitorName: 'Sport Surfaces Inc.', date: 'July 19, 2025', headline: 'Case Study: Transforming a Community Park in Tempe', aiSummary: "A new case study on their website details the successful renovation of Kiwanis Park's basketball courts, emphasizing their quick turnaround time and community engagement.", sourceUrl: '#', extractedData: { 'Project Location': 'Tempe', 'Key Strength': 'Speed' } }
];

export const COMPETITOR_SEO_DATA = {
    keywords: ['tennis court resurfacing phoenix', 'pickleball court construction az', 'basketball court painters'],
    rankings: [
        { competitor: 'Hard-Court Pros', keyword: 'tennis court resurfacing phoenix', rank: 2, change: 1, url: '/services/tennis-resurfacing' },
        { competitor: 'Asphalt Aces', keyword: 'tennis court resurfacing phoenix', rank: 5, change: -1, url: '/tennis-courts' },
        { competitor: 'Sport Surfaces Inc.', keyword: 'tennis court resurfacing phoenix', rank: 6, change: 0, url: '/portfolio/phoenix-courts' },
        { competitor: 'Hard-Court Pros', keyword: 'pickleball court construction az', rank: 3, change: 0, url: '/pickleball' },
        { competitor: 'Asphalt Aces', keyword: 'pickleball court construction az', rank: 1, change: 0, url: '/services/pickleball-construction' },
        { competitor: 'Sport Surfaces Inc.', keyword: 'basketball court painters', rank: 4, change: 1, url: '/services/painting' },
    ],
    history: {
        'tennis court resurfacing phoenix': [
            { month: 'June', 'Hard-Court Pros': 3, 'Asphalt Aces': 4, 'Sport Surfaces Inc.': 6 },
            { month: 'July', 'Hard-Court Pros': 3, 'Asphalt Aces': 4, 'Sport Surfaces Inc.': 6 },
            { month: 'August', 'Hard-Court Pros': 2, 'Asphalt Aces': 5, 'Sport Surfaces Inc.': 6 },
        ],
        'pickleball court construction az': [
            { month: 'June', 'Hard-Court Pros': 3, 'Asphalt Aces': 1 },
            { month: 'July', 'Hard-Court Pros': 3, 'Asphalt Aces': 1 },
            { month: 'August', 'Hard-Court Pros': 3, 'Asphalt Aces': 1 },
        ],
    }
};

// --- Dashboard & Misc ---

export const ACTIVITY_FEED_DATA = [
    { id: 1, icon: 'file-text', text: "New permit lead detected: 'Paradise Valley Country Club Expansion'", time: '5m ago', prospectId: 101 },
    { id: 2, icon: 'home', text: "5 new residential prospects identified in Paradise Valley", time: '1h ago', view: 'ResidentialProspecting' },
    { id: 3, icon: 'bell-ring', text: "Client 'Camelback High School' is due for a follow-up visit.", time: '3h ago', prospectId: 1 },
    { id: 4, icon: 'newspaper', text: "News lead detected: 'City of Mesa Announces Park Upgrades'", time: '8h ago', prospectId: 102 },
    { id: 5, icon: 'swords', text: "Competitor 'Asphalt Aces' had a license status change.", time: 'yesterday', view: 'CompetitorIntel' },
];

export const USER_INTEL_DATA = [
    { id: 1, date: "08/12/2025", content: "Met with the facilities manager at Scottsdale Ranch Park. They mentioned a potential budget for pickleball court conversions next year." },
    { id: 2, date: "08/10/2025", content: "Asphalt Aces seems to be underbidding on smaller repair jobs. Need to watch their pricing strategy." },
];
