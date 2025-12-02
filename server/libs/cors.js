const getAllowedOrigins = () => {
    const origins = [
        process.env.CLIENT_URL,           // Primary origin from env
        'http://localhost:5173',          // Vite dev
        'http://localhost:3000',          // Docker dev
        'http://localhost:5174',          // Vite alternative port
    ];

    // In production, only allow specific domains
    if (process.env.NODE_ENV === 'production') {
        return [
            process.env.CLIENT_URL,
            process.env.CLIENT_URL_PROD,  // e.g., https://your-app.vercel.app
        ].filter(Boolean); // Remove undefined values
    }

    return origins.filter(Boolean);
};

export const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

