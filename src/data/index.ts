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
  
  // --- Competitor & Market Intel ---
  
  export const COMPETITORS = ["Ace Resurfacing Co.", "Sunstate Courts", "C&S Sport Surfaces", "Pro Courts Arizona", "Arizona Court Masters"];
  
  export const CONTRACTOR_STATUS_DATA = [
      { id: 'comp1', name: "Ace Resurfacing Co.", licenseNumber: "AZ-123456", status: "Active", violations: [], lawsuits: [] },
      { id: 'comp2', name: "Sunstate Courts", licenseNumber: "AZ-654321", status: "Active", violations: [], lawsuits: [] },
      { id: 'comp3', name: "C&S Sport Surfaces", licenseNumber: "AZ-789012", status: "Suspended", violations: [{ date: "07/15/2025", description: "Failure to complete project", resolution: "License suspended pending review" }], lawsuits: [] },
      { id: 'comp4', name: "Pro Courts Arizona", licenseNumber: "AZ-345678", status: "Active", violations: [], lawsuits: [{ caseNumber: "CV-2025-001234", filingDate: "06/20/2025", court: "Maricopa Superior Court", description: "Breach of contract dispute with a supplier.", status: "Active" }] },
      { id: 'comp5', name: "Arizona Court Masters", licenseNumber: "N/A", status: "Pending", violations: [], lawsuits: [] }
  ];
  
  export const COMPETITOR_INTEL_EVENTS = {
    'comp1': [
      { id: 1, type: 'License Update', date: '2025-09-06', summary: 'Contractor license renewed with the AZ ROC.', details: 'ROC #12345 renewed for 2 years, no changes in classification.' },
      { id: 2, type: 'New Ad Campaign', date: '2025-09-04', summary: 'Launched a new Google Ads campaign targeting "pickleball court resurfacing Phoenix".', details: 'Ad copy focuses on a "24-hour quote guarantee". Budget appears to be moderate.' },
      { id: 3, type: 'SEO Ranking Change', date: '2025-09-01', summary: 'Ranked #3 on Google for "tennis court builders Scottsdale", up from #7.', details: 'AI Analysis: Change likely due to new blog post about post-tension concrete benefits.' },
    ],
    'comp2': [
      { id: 4, type: 'Permit Filed', date: '2025-09-05', summary: 'Filed a commercial permit with the City of Glendale for a new multi-court facility.', details: 'Permit #GL-2025-08-112 for "athletic court construction". Valuation: $250,000.' },
      { id: 5, type: 'New Ad Campaign', date: '2025-08-28', summary: 'Facebook ad campaign started, targeting homeowners in the West Valley.', details: 'Video ad showcases a recently completed backyard basketball court.' },
    ],
    'comp3': [
      { id: 6, type: 'SEO Ranking Change', date: '2025-09-02', summary: 'Lost ranking for "running track repair", dropping off the first page.', details: 'AI Analysis: Their website\'s page on track maintenance has not been updated in over a year.' },
    ],
  };
  
  // --- ROBUST SEO DATA ---
  export const COMPETITOR_SEO_DATA = {
    keywords: ['tennis court resurfacing phoenix', 'pickleball court construction az', 'running track repair arizona'],
    rankings: [
        { competitor: 'Ace Resurfacing Co.', keyword: 'tennis court resurfacing phoenix', rank: 2, change: 1, url: '/services/tennis-resurfacing' },
        { competitor: 'Sunstate Courts', keyword: 'tennis court resurfacing phoenix', rank: 5, change: -1, url: '/tennis-courts' },
        { competitor: 'C&S Sport Surfaces', keyword: 'tennis court resurfacing phoenix', rank: 6, change: 0, url: '/portfolio/phoenix-courts' },
        { competitor: 'Ace Resurfacing Co.', keyword: 'pickleball court construction az', rank: 3, change: 0, url: '/pickleball' },
        { competitor: 'Sunstate Courts', keyword: 'pickleball court construction az', rank: 1, change: 0, url: '/services/pickleball-construction' },
        { competitor: 'C&S Sport Surfaces', keyword: 'running track repair arizona', rank: 9, change: -2, url: '/services/tracks' },
    ],
    // Historical data for charting
    history: {
        'tennis court resurfacing phoenix': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [
                { label: 'Ace Resurfacing Co.', data: [4, 3, 3, 2] },
                { label: 'Sunstate Courts', data: [5, 5, 4, 5] },
                { label: 'C&S Sport Surfaces', data: [6, 6, 6, 6] },
            ]
        },
        'pickleball court construction az': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [
                { label: 'Ace Resurfacing Co.', data: [3, 3, 3, 3] },
                { label: 'Sunstate Courts', data: [1, 1, 1, 1] },
            ]
        },
         'running track repair arizona': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [
                { label: 'C&S Sport Surfaces', data: [7, 7, 7, 9] },
            ]
        }
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
  
  