export type JobApplication = {
  applied: Date;
  company: string;
  id: string;
  rejected?: Date | null;
  title: string;
  url: string;
};
