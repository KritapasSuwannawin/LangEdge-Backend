import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const port = Number(process.env.PORT) || 8000;

app.listen(port, () => {
  console.log(`Express-starter running on port ${port}...`);
});
