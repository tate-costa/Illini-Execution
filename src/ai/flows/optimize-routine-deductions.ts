'use server';

/**
 * @fileOverview An AI agent that optimizes routine deductions.
 *
 * - optimizeRoutineDeductions - A function that optimizes routine deductions.
 * - OptimizeRoutineDeductionsInput - The input type for the optimizeRoutineDeductions function.
 * - OptimizeRoutineDeductionsOutput - The return type for the optimizeRoutineDeductions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRoutineDeductionsInputSchema = z.object({
  event: z
    .string()
    .describe("The event for the routine (FX, PH, SR, VT, PB, HB)."),
  skills: z
    .array(z.object({
      skill: z.string().describe('The name of the skill.'),
      value: z.number().describe('The value of the skill.'),
      deduction: z.number().describe('The current deduction for the skill.'),
    }))
    .describe('The list of skills in the routine with their values and deductions.'),
});
export type OptimizeRoutineDeductionsInput = z.infer<typeof OptimizeRoutineDeductionsInputSchema>;

const OptimizeRoutineDeductionsOutputSchema = z.object({
  optimizedSkills: z
    .array(z.object({
      skill: z.string().describe('The name of the skill.'),
      value: z.number().describe('The optimized value of the skill.'),
      deduction: z.number().describe('The optimized deduction for the skill.'),
      explanation: z.string().describe('Explanation of why the deduction was changed')
    }))
    .describe('The list of optimized skills in the routine with their values and deductions.'),
});
export type OptimizeRoutineDeductionsOutput = z.infer<typeof OptimizeRoutineDeductionsOutputSchema>;

export async function optimizeRoutineDeductions(input: OptimizeRoutineDeductionsInput): Promise<OptimizeRoutineDeductionsOutput> {
  return optimizeRoutineDeductionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutineDeductionsPrompt',
  input: {schema: OptimizeRoutineDeductionsInputSchema},
  output: {schema: OptimizeRoutineDeductionsOutputSchema},
  prompt: `You are an expert gymnastics coach. Given a gymnast's routine for a specific event and their current deductions, provide suggestions for small numerical changes to the skill values that would improve the deduction score. Do not recommend changes to the skills themselves, but only to the value, within a reasonable amount, or the deduction.

Event: {{{event}}}
Skills:
{{#each skills}}
- Skill: {{{skill}}}, Value: {{{value}}}, Deduction: {{{deduction}}}
{{/each}}

Optimize the routine to minimize deductions by making small numerical value adjustments to the skills or deductions. Provide an explanation for each suggested change.

Return the optimized routine in the following format:
{
  "optimizedSkills": [
    {
      "skill": "Skill Name",
      "value": Optimized Value (number),
      "deduction": Optimized Deduction (number),
      "explanation": "Explanation of why the value/deduction was changed"
    }
  ]
}
`,
});

const optimizeRoutineDeductionsFlow = ai.defineFlow(
  {
    name: 'optimizeRoutineDeductionsFlow',
    inputSchema: OptimizeRoutineDeductionsInputSchema,
    outputSchema: OptimizeRoutineDeductionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
