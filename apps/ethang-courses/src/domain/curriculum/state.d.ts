export type Curriculum = {
  readonly curriculumId: string;
  readonly learningPathIds: readonly string[];
  readonly name: string;
  readonly url?: null | string;
};
