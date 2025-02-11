export type JobApplication = {
  applied: Date;
  company: string;
  id: string;
  interviewRounds?: (Date | null)[];
  rejected?: Date | null;
  title: string;
  url: string;
};
