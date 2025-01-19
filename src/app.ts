import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './route/authRoute';
import userRouter from './route/userRoute';

const app = express();

app.use(helmet());
app.use(cors({ credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

export default app;
