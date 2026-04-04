// Session states (discriminated union from TLA+ spec)
export const SESSION_STATES = [
  "questioning",
  "awaitingInput",
  "summaryPresented",
  "signingOff",
  "completed",
  "failed",
] as const;

export type SessionState = (typeof SESSION_STATES)[number];

// Artifact states
export const ARTIFACT_STATES = ["empty", "partial", "complete"] as const;
export type ArtifactState = (typeof ARTIFACT_STATES)[number];

// Q&A pair
export type QuestionAnswer = {
  readonly answer: string;
  readonly question: string;
};

// The typed sub-object stored in artifacts.Questioner
export type QuestionerArtifact = {
  readonly artifactState: ArtifactState;
  readonly questions: readonly QuestionAnswer[];
  readonly sessionState: SessionState;
  readonly summary: null | string;
  readonly turnCount: number;
};

export function createEmptyQuestionerArtifact(): QuestionerArtifact {
  return {
    artifactState: "empty",
    questions: [],
    sessionState: "questioning",
    summary: null,
    turnCount: 0,
  };
}
