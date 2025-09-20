'use server';

import {
  optimizeRoutineDeductions,
  type OptimizeRoutineDeductionsInput,
} from '@/ai/flows/optimize-routine-deductions';
import type { AppData, SubmissionSkill } from '@/lib/types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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

export async function downloadDataAsExcel(data: AppData) {
  const wb = XLSX.utils.book_new();

  // Submissions Sheet
  const submissionsData: any[] = [];
  Object.values(data).forEach(userData => {
      userData.submissions.forEach(sub => {
          sub.skills.forEach(skill => {
              submissionsData.push({
                  'User Name': userData.userName,
                  'Event': sub.event,
                  'Date': format(new Date(sub.timestamp), "yyyy-MM-dd HH:mm:ss"),
                  'Skill': skill.name,
                  'Value': skill.value,
                  'Deduction': skill.deduction,
                  'Routine Complete': sub.isComplete ? 'Yes' : 'No'
              });
          });
      });
  });
  const submissionsWs = XLSX.utils.json_to_sheet(submissionsData);
  XLSX.utils.book_append_sheet(wb, submissionsWs, "Submissions");
  
   // Routines Sheet
  const routinesData: any[] = [];
  Object.values(data).forEach(userData => {
      Object.entries(userData.routines).forEach(([event, skills]) => {
          skills.forEach(skill => {
              routinesData.push({
                  'User Name': userData.userName,
                  'Event': event,
                  'Skill': skill.name,
                  'Value': skill.value,
              });
          });
      });
  });
  const routinesWs = XLSX.utils.json_to_sheet(routinesData);
  XLSX.utils.book_append_sheet(wb, routinesWs, "Routines");

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer).toString('base64');
}
