import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { corsOptions } from './libs/cors.js';

import routes from './routes/index.js';
import { scheduleAuditCleanup } from './controllers/auditController.js';



dotenv.config();

const PORT = process.env.PORT || 9000;

const app = express();

// CORS must be before other middleware

app.use(cors(corsOptions));

// Body parsers with proper limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api-v1', routes);

app.get('', (req, res) => {
    res.send('Hello new World');
});

app.get('/api', (req, res) => {
    res.json({ message: 'Hello Something new' });
});

// 404 handler must be AFTER all routes
app.use((req, res) => {
    res.status(404).json({
        status: 'not found',
        message: 'Route not found'
    });
});

scheduleAuditCleanup();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});