import dotenv from 'dotenv';
import path from 'path';
import { readEnvironment } from './environment';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
export const env = readEnvironment(process.env);
