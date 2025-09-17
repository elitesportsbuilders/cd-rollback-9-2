const COMPETITOR_SEO_DATA = {
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
            datasets: [{ label: 'Ace Resurfacing Co.', data: [4, 3, 3, 2] }, { label: 'Sunstate Courts', data: [5, 5, 4, 5] }, { label: 'C&S Sport Surfaces', data: [6, 6, 6, 6] }]
        },
        'pickleball court construction az': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [{ label: 'Ace Resurfacing Co.', data: [3, 3, 3, 3] }, { label: 'Sunstate Courts', data: [1, 1, 1, 1] }]
        },
        'running track repair arizona': {
            labels: ['June', 'July', 'August', 'September'],
            datasets: [{ label: 'C&S Sport Surfaces', data: [7, 7, 7, 9] }]
        }
    }
};

module.exports = {
  COMPETITOR_SEO_DATA
};
