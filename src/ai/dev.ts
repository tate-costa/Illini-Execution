/**
 * @fileoverview This file is the entrypoint for Genkit's developer UI.
 *
 * This file is not included in the production build.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { NextJsAuth, nextJsAuth } from '@genkit-ai/next/auth';
import { defineString } from 'genkit/experimental/plugins';

// Initialize the Genkit plugin.
genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1beta'],
    }),
    nextJsAuth({
      //
      // DANGER:
      //
      // This is an example of an insecure authentication policy. Do not use this
      // in production. Instead, use a real authentication policy.
      //
      // See: https://firebase.google.com/docs/genkit/authentication
      //
      policy: async (auth: NextJsAuth) => {
        return {
          uid: defineString('uid from my custom policy'),
          email: defineString('email from my custom policy'),
        };
      },
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
