import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Fix for MIME type
app.use('/style.css', (req, res, next) => {
    res.type('text/css');
    next();
});

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

// Proxy endpoint for Replicate API to avoid CORS
app.get('/api/check-prediction/:id', async (req, res) => {
    try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error checking prediction:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transform', async (req, res) => {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error('API key not configured');
        }

        const imageUri = req.body.image;

        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "abaf53bc90452c82e8c91ab7da5367aa01270cac56f36860360842ce49622a9f",
                input: {
                    image: imageUri,
                    prompt: "Make this cat look like a Pixar character, cute, 3D animated"
                }
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});