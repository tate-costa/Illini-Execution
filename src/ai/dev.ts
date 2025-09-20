/**
 * @fileoverview This file is the entrypoint for Genkit's developer UI.
 *
 * This file is not included in the production build.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize the Genkit plugin.
genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
