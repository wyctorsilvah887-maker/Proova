import { config } from 'dotenv';
config();

import '@/ai/flows/process-spoken-query.ts';
import '@/ai/flows/speak-gen-ai-response.ts';
import '@/ai/flows/generate-copy-flow.ts';
import '@/ai/flows/optimize-card-flow.ts';
import '@/ai/flows/generate-card-bg-flow.ts';
import '@/ai/flows/support-ai-flow.ts';
