const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const API_KEY = process.env.VIDEOSDK_API_KEY;
const API_SECRET = process.env.VIDEOSDK_SECRET_KEY;
const API_ENDPOINT = process.env.VIDEOSDK_API_ENDPOINT;

// Çevresel değişkenleri kontrol et
console.log("VIDEOSDK_API_KEY:", API_KEY);
console.log("VIDEOSDK_SECRET_KEY:", API_SECRET);
console.log("VIDEOSDK_API_ENDPOINT:", API_ENDPOINT);

// Token oluşturma fonksiyonu
const createToken = () => {
    const payload = {
        apikey: API_KEY,
        permissions: ['allow_join', 'allow_mod'],
        version: 1,
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token 1 saat geçerli
    };

    return jwt.sign(payload, API_SECRET);
};

// Middleware to check token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log("Received token:", token);

    if (!token) {
        console.error('Token is missing!');
        return res.status(401).send({ error: 'Token is missing!' });
    }

    try {
        const decoded = jwt.verify(token, API_SECRET);
        console.log("Token decoded successfully:", decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token is invalid:', err);
        res.status(401).send({ error: 'Token is invalid!' });
    }
};

// Toplantı oluşturma endpointi
app.post('/create-meeting', authMiddleware, (req, res) => {
    const meetingData = {
        topic: 'My Meeting',
        start_time: '2021-07-01T10:00:00Z',
        duration: 60,
        settings: {
            host_video: true,
            participant_video: true
        }
    };

    const token = createToken();
    console.log("Created token for API call:", token);

    axios.post(`${API_ENDPOINT}/v1/meetings`, meetingData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log("API response:", response.data);
            res.send(response.data);
        })
        .catch(error => {
            console.error("API error:", error.response ? error.response.data : error.message);
            res.status(500).send(error.response ? error.response.data : error.message);
        });
});

// Sunucuyu başlat
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
