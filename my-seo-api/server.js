const express = require('express');
const cors = require('cors');
const { COMPETITOR_SEO_DATA } = require('./seoData');

const app = express();
const PORT = 3000;

// Configure CORS to allow requests from your local front-end
const corsOptions = {
    origin: '*', // This allows all origins during development. For production, specify your domain.
    optionsSuccessStatus: 200 // For legacy browsers
};
app.use(cors(corsOptions));

// Define the API endpoint to serve SEO data
app.get('/api/seo-data', (req, res) => {
    console.log('API call received for /api/seo-data');
    res.json(COMPETITOR_SEO_DATA);
});

// Start the server
app.listen(PORT, () => {
    console.log(`SEO Data API server running at http://localhost:${PORT}`);
});
