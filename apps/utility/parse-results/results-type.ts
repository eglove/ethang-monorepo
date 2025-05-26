export type AssertionResult = {
  ancestorTitles: string[];
  duration: number;
  failureMessages: string[];
  fullName: string;
  location: Location;
  meta: Record<string, unknown>;
  status: string;
  title: string;
};

export type Location = {
  column: number;
  line: number;
};

export type Snapshot = {
  added: number;
  didUpdate: boolean;
  failure: boolean;
  filesAdded: number;
  filesRemoved: number;
  filesRemovedList: any[];
  filesUnmatched: number;
  filesUpdated: number;
  matched: number;
  total: number;
  unchecked: number;
  uncheckedKeysByFile: any[];
  unmatched: number;
  updated: number;
};

export type TestResult = {
  assertionResults: AssertionResult[];
  endTime: number;
  message: string;
  name: string;
  startTime: number;
  status: string;
};

export type TestResults = {
  numFailedTests: number;
  numFailedTestSuites: number;
  numPassedTests: number;
  numPassedTestSuites: number;
  numPendingTests: number;
  numPendingTestSuites: number;
  numTodoTests: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  snapshot: Snapshot;
  startTime: number;
  success: boolean;
  testResults: TestResult[];
};
