const express = require('express');
const puppeteer = require('puppeteer');
const nodeFetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

let browser: { close: () => void; };

// Initialize Puppeteer browser instance
async function initBrowser() {
    browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
}

// Function to load SVG content from URL
async function loadSVG(svgUrl: any) {
    try {
        const response = await nodeFetch(svgUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching SVG:', error);
        throw error;
    }
}

// Function to directly manipulate SVG content
function modifySVG(svgContent: string, locations: string | string[]) {
    // Convert single location to array for consistent handling
    const locationArray = Array.isArray(locations) ? locations : [locations];
    
    return svgContent.replace(/id="([^"]*?)"/g, (match, id) => {
        // Apply style changes directly within SVG where the ID matches any location in the array
        if (locationArray.includes(id)) {
            return `id="${id}" style="fill: blue !important;"`;
        }
        return match;
    });
}

app.get('/', (req: any, res: any) => {
    res.send('Dynamic Maps API is running');
}, 

(error: any) => {
    console.error('Error during request:', error);
}
);

app.get('/SVG-Map', async (req: { query: { svgUrl: any; location: any; locations?: string; }; }, res: { set: (arg0: string, arg1: string) => void; send: (arg0: string) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }) => {
    try {
        const { svgUrl, location, locations } = req.query;
        
        // Handle both single location and multiple locations parameters
        let locationArray: string | string[] = location;
        
        // If locations parameter exists, parse it (assuming comma-separated format)
        if (locations) {
            locationArray = locations.split(',').map(loc => loc.trim());
        }
        
        const svgContent = await loadSVG(svgUrl);
        const modifiedSVGContent = modifySVG(svgContent, locationArray);

        res.set('Content-Type', 'image/svg+xml');
        res.send(modifiedSVGContent);
    } catch (error) {
        console.error('Error during request:', error);
        res.status(500).json({ error: 'Unexpected error' });
    }
});

const server = app.listen(port, async () => {
    await initBrowser();
    console.log(`Server is running on port ${port}`);
});

server.setTimeout(60000);

process.on('exit', () => {
    if (browser) browser.close();
});