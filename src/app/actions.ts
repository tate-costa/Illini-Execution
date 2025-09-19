'use server';

import {
  optimizeRoutineDeductions,
  type OptimizeRoutineDeductionsInput,
} from '@/ai/flows/optimize-routine-deductions';
import type { SubmissionSkill } from '@/lib/types';

export async function getOptimizedDeductions(
  event: string,
  skills: SubmissionSkill[]
) {
  try {
    const input: OptimizeRoutineDeductionsInput = {
      event,
      skills: skills
        .filter(s => typeof s.value === 'number' && typeof s.deduction === 'number')
        .map(s => ({
          skill: s.name,
          value: s.value as number,
          deduction: s.deduction as number,
        })),
    };

    if (input.skills.length === 0) {
      return { optimizedSkills: [] };
    }

    return await optimizeRoutineDeductions(input);
  } catch (error) {
    console.error('Error optimizing routine:', error);
    throw new Error('Failed to get AI optimizations.');
  }
}
