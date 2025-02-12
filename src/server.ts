import dotenv from 'dotenv';
dotenv.config();

import app from './app';

import packageJson from '../package.json';

const port = Number(process.env.PORT) || 8000;

app.listen(port, () => {
  console.log(`${packageJson.name} running on port ${port}...`);
});
