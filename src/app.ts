import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { validateRequestQuery } from './middlewares/appMiddleware';

import authRouter from './routes/authRoute';
import userRouter from './routes/userRoute';

const app = express();

app.use(helmet());
app.use(cors({ credentials: true }));
app.use(express.json());

// Log request
app.use(
  morgan('tiny', {
    skip: (_req, res) => res.statusCode === 404,
    stream: {
      write: (message) => {
        console.log(decodeURIComponent(message.trim()));
      },
    },
  })
);

// Validate request query
app.use(validateRequestQuery);

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

export default app;
