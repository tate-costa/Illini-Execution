import type { User } from './types';

export const USERS: User[] = [
  { id: 'user1', name: 'Simone Biles' },
  { id: 'user2', name: 'Kohei Uchimura' },
  { id: 'user3', name: 'Nadia Comăneci' },
];

export const EVENTS = ['FX', 'PH', 'SR', 'VT', 'PB', 'HB'];

const standardSkillNames = [
  'Skill 1',
  'Skill 2',
  'Skill 3',
  'Skill 4',
  'Skill 5',
  'Skill 6',
  'Skill 7',
  'Dismount',
  'Upgrade 1',
  'Upgrade 2',
];

const vaultSkillNames = ['Vault 1', 'Vault 2'];

export const getSkillNamesForEvent = (event: string) => {
  if (event === 'VT') {
    return vaultSkillNames;
  }
  return standardSkillNames;
};

export const getSubmissionSkillNamesForEvent = (event: string) => {
    if (event === 'VT') {
        return vaultSkillNames;
    }
    return standardSkillNames.slice(0, 8); // Only skill 1-7 and dismount for submission
}
