export type Skill = {
  name: string;
  value: number | '';
};

export type Routine = Skill[];

export type UserRoutines = {
  [event: string]: Routine;
};

export type SubmissionSkill = {
  name: string;
  value: number | '';
  deduction: number | '';
};

export type Submission = {
  id: string;
  event: string;
  timestamp: string;
  isComplete: boolean;
  skills: SubmissionSkill[];
};

export type UserData = {
  routines: UserRoutines;
  submissions: Submission[];
};

export type AppData = {
  [userId: string]: UserData;
};

export type User = {
  id: string;
  name: string;
};
