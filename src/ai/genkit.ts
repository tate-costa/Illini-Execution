/**
 * @fileoverview This file contains the Genkit initialization code.
 *
 * This is the entrypoint for all Genkit-related code in the application.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { nextJsAuth } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
    nextJsAuth(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
