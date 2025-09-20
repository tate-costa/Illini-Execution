'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SubmissionSkill } from '@/lib/types';

export const OptimizeDeductionsInputSchema = z.object({
    skills: z.array(z.object({
        name: z.string(),
        value: z.union([z.number(), z.string()]),
        deduction: z.union([z.number(), z.string()]),
        isDismount: z.boolean(),
    })),
    event: z.string(),
});

export const OptimizeDeductionsOutputSchema = z.object({
    suggestions: z.array(z.string()).describe("A list of suggestions to improve the routine and reduce deductions."),
});

export async function getOptimizedDeductions(input: { skills: SubmissionSkill[], event: string }): Promise<z.infer<typeof OptimizeDeductionsOutputSchema>> {
    const { output } = await optimizeDeductionsPrompt(input);
    if (!output) {
        throw new Error("No output from prompt");
    }
    return output;
}

const optimizeDeductionsPrompt = ai.definePrompt({
    name: 'optimizeDeductionsPrompt',
    input: { schema: OptimizeDeductionsInputSchema },
    output: { schema: OptimizeDeductionsOutputSchema },
    prompt: `You are an expert gymnastics coach. Analyze the following routine for the {{event}} event and provide 3-5 specific, actionable suggestions to reduce deductions. Focus on common errors related to the skills performed.

    Skills and Deductions:
    {{#each skills}}
    - Skill: {{name}} (Value: {{value}}), Deduction: {{deduction}}
    {{/each}}
    
    Based on these deductions, provide targeted advice. For example, if a skill has a high deduction, suggest drills or focus points to improve execution (e.g., "For the dismount, focus on keeping your chest up during the landing to avoid a step forward."). Do not suggest replacing skills.
    `,
});
