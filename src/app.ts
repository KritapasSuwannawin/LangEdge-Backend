import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './route/authRoute';
import adminRouter from './route/adminRoute';

const app = express();

app.use(helmet());
app.use(cors({ credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

export default app;
