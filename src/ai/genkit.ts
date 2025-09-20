/**
 * @fileoverview This file contains the Genkit initialization code.
 *
 * This is the entrypoint for all Genkit-related code in the application.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
