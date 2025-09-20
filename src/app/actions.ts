'use server';

import type { AppData, SubmissionSkill } from '@/lib/types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { getOptimizedDeductions } from '@/ai/flows/optimize-routine-deductions';

export async function downloadDataAsExcel(data: AppData): Promise<string> {
  const wb = XLSX.utils.book_new();
  let hasData = false;

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
                  'Is Dismount': skill.isDismount ? 'Yes' : 'No',
                  'Dismount Stuck': sub.stuckDismount ? 'Yes' : 'No',
                  'Routine Complete': sub.isComplete ? 'Yes' : 'No'
              });
          });
      });
  });
  if (submissionsData.length > 0) {
    const submissionsWs = XLSX.utils.json_to_sheet(submissionsData);
    XLSX.utils.book_append_sheet(wb, submissionsWs, "Submissions");
    hasData = true;
  }
  
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

  if(routinesData.length > 0) {
    const routinesWs = XLSX.utils.json_to_sheet(routinesData);
    XLSX.utils.book_append_sheet(wb, routinesWs, "Routines");
    hasData = true;
  }

  if (!hasData) {
    return '';
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer).toString('base64');
}

export async function getOptimizedDeductionsAction(skills: SubmissionSkill[], event: string): Promise<any> {
  try {
    const result = await getOptimizedDeductions({ skills, event });
    return result;
  } catch (error) {
    console.error("Error in getOptimizedDeductionsAction:", error);
    return { error: 'Failed to get AI suggestions.' };
  }
}
