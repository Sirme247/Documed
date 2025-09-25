import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import routes from './routes/index.js';

dotenv.config();

const PORT = process.env.PORT || 9000;

const app = express({limit: '50mb'});
app.use(express.json());

app.use(express.urlencoded({extended: true}));

app.use('/api', routes)

const corsOptions = {
    origin: 'http://localhost:5173'
};
app.use(cors());

app.get('', (req,res)=>{
    res.send('hHello new World');
})
app.get('/api', (req,res)=>{
    res.json({message: 'Hello Something new'});

})

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})

app.use((req,res)=>{
    res.status(404).json(
        {
            status: 'not found',
            message: 'Route not found'
        }
    )
});