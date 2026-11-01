import { config } from 'dotenv';
config();

import '@/ai/flows/process-spoken-query.ts';
import '@/ai/flows/speak-gen-ai-response.ts';
import '@/ai/flows/generate-copy-flow.ts';