// --- MOCK DATA FOR COURT DETECTOR SAAS ---

// --- Core Data Arrays ---

export const COURT_DATA = [
        { 
          id: 1, name: "Camelback High School", coords: [33.5101, -112.025], type: 'Tennis', status: 'bright', isClient: true, isDue: true,
          // --- Project Management Data ---
          completionDate: "2023-08-15",
          surfaceType: "Post-Tension Concrete w/ Acrylic",
          warrantyExpiration: "2028-08-15",
          projectPhotos: [
            'https://placehold.co/600x400/3b82f6/ffffff?text=Camelback+Court+1',
            'https://placehold.co/600x400/3b82f6/ffffff?text=Camelback+Court+2'
          ],
          googleDriveLink: "https://docs.google.com/folder/d/mock_folder_id_1/view"
        },
        { id: 2, name: "Phoenix Tennis Center", coords: [33.5312, -112.091], type: 'Tennis', status: 'faded', isClient: false, isDue: false },
        { 
          id: 3, name: "Pecos Community Center", coords: [33.3031, -111.979], type: 'Pickleball', status: 'bright', isClient: true, isDue: false,
          // --- Project Management Data ---
          completionDate: "2019-05-20", // This date will trigger a "Resurfacing Recommended" alert
          surfaceType: "Asphalt w/ Acrylic Cushion",
          warrantyExpiration: "2024-05-20", // This date will trigger a "Warranty Expired" alert
          projectPhotos: [
            'https://placehold.co/600x400/14b8a6/ffffff?text=Pecos+Court+1',
            'https://placehold.co/600x400/14b8a6/ffffff?text=Pecos+Court+2'
          ],
          googleDriveLink: "https://docs.google.com/folder/d/mock_folder_id_2/view"
        },
        { id: 4, name: "Encanto Sports Complex", coords: [33.4735, -112.086], type: 'Basketball', status: 'faded', isClient: false, isDue: false },
        { 
          id: 5, name: "Scottsdale Ranch Park", coords: [33.582, -111.87], type: 'Tennis', status: 'bright', isClient: true, isDue: true,
          // --- Project Management Data ---
          completionDate: "2024-01-10",
          surfaceType: "Post-Tension Concrete w/ Acrylic",
          warrantyExpiration: "2029-01-10",
          projectPhotos: [
            'https://placehold.co/600x400/3b82f6/ffffff?text=Scottsdale+Ranch+1',
            'https://placehold.co/600x400/3b82f6/ffffff?text=Scottsdale+Ranch+2'
          ],
          googleDriveLink: "https://docs.google.com/folder/d/mock_folder_id_3/view"
        },
    ];
    
    export const RESIDENTIAL_PROSPECT_DATA = [
        { id: 501, type: 'residential', coords: [33.535, -111.958], name: "Miller Residence", status: "worn" },
        { id: 502, type: 'residential', coords: [33.529, -111.962], name: "Davis Residence", status: "good" },
    ];
    
    // --- AI-Discovered Leads (Unacknowledged) ---
    export const AI_LEAD_DATA = [
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
    export const ACKNOWLEDGED_LEAD_DATA = [
         { 
            id: 103, type: 'permit', name: 'ASU Downtown Campus Rec Center', coords: [33.453, -112.073], 
            isAcknowledged: true,
            aiScore: 7, 
            aiSummary: "Permit filed for general repairs at ASU's downtown recreational center.", 
            isSynced: false, 
            source: "City of Phoenix Permits"
        },
    ];
    
    // --- BACKWARD COMPATIBILITY EXPORT for older components ---
    export const LEAD_DATA = [...AI_LEAD_DATA, ...ACKNOWLEDGED_LEAD_DATA];
    
    export const ALL_PROSPECTS = [...COURT_DATA, ...RESIDENTIAL_PROSPECT_DATA, ...LEAD_DATA];
    
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
            { id: 1, type: 'License Update', date: '2025-09-06', summary: 'Contractor license renewed with the AZ ROC.' },
            { id: 2, type: 'New Ad Campaign', date: '2025-09-04', summary: 'Launched a new Google Ads campaign targeting "pickleball court resurfacing Phoenix".' },
        ],
        'comp2': [
            { id: 4, type: 'Permit Filed', date: '2025-09-05', summary: 'Filed a commercial permit with the City of Glendale for a new multi-court facility.' },
        ],
        'comp3': [
            { id: 6, type: 'SEO Ranking Change', date: '2025-09-02', summary: 'Lost ranking for "running track repair", dropping off the first page.' },
        ],
    };
    
    // --- BACKWARD COMPATIBILITY EXPORT: Create a flattened activity feed ---
    const competitorActivities = Object.entries(COMPETITOR_INTEL_EVENTS).flatMap(([compId, events]) => {
        const competitor = CONTRACTOR_STATUS_DATA.find(c => c.id === compId);
        return events.map(event => ({
            ...event,
            source: competitor?.name || 'Unknown Competitor',
            category: 'Competitor Intel'
        }));
    });
    
    const leadActivities = LEAD_DATA.map(lead => ({
        id: lead.id,
        type: 'New Lead',
        date: '2025-09-07', // Using a static date for mock data consistency
        summary: `New ${lead.type} discovered: ${lead.name}`,
        source: lead.source,
        category: 'Lead Generation'
    }));
    
    // Combine and sort by date (descending)
    export const ACTIVITY_FEED_DATA = [...competitorActivities, ...leadActivities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    
    export const COMPETITOR_SEO_DATA = {
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
        