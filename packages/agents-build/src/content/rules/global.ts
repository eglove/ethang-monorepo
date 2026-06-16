import type { RuleDefinition } from "../../define.ts";

import { actorActionFormat } from "./actor-action-format.ts";
import { architecturalDocumentation } from "./architectural-documentation.ts";
import { architecturalEvaluation } from "./architectural-evaluation.ts";
import { architecturalSynthesis } from "./architectural-synthesis.ts";
import { architecturalTactics } from "./architectural-tactics.ts";
import { atomicDesign } from "./atomic-design.ts";
import { automatedReleaseEngineering } from "./automated-release-engineering.ts";
import { booleanLogic } from "./boolean-logic.ts";
import { boundaryValueAnalysis } from "./boundary-value-analysis.ts";
import { concurrencyControl } from "./concurrency-control.ts";
import { configurationBaselines } from "./configuration-baselines.ts";
import { configurationChangeProcess } from "./configuration-change-process.ts";
import { conventionalCommits } from "./conventional-commits.ts";
import { conwaysLaw } from "./conways-law.ts";
import { costBenefitAnalysis } from "./cost-benefit-analysis.ts";
import { couplingAndCohesion } from "./coupling-and-cohesion.ts";
import { databaseNormalization } from "./database-normalization.ts";
import { dddStrategic } from "./ddd-strategic.ts";
import { dddTactical } from "./ddd-tactical.ts";
import { dependencyMinimization } from "./dependency-minimization.ts";
import { designCompleteness } from "./design-completeness.ts";
import { designQualityReviews } from "./design-quality-reviews.ts";
import { effortEstimation } from "./effort-estimation.ts";
import { empiricalExperiments } from "./empirical-experiments.ts";
import { equivalencePartitioning } from "./equivalence-partitioning.ts";
import { eslintSelfLearning } from "./eslint-self-learning.ts";
import { exceptionHandlingPolicy } from "./exception-handling-policy.ts";
import { experienceBasedTesting } from "./experience-based-testing.ts";
import { formalMethods } from "./formal-methods.ts";
import { incidentVsProblemManagement } from "./incident-vs-problem-management.ts";
import { informationHiding } from "./information-hiding.ts";
import { intellectualProperty } from "./intellectual-property.ts";
import { interfaceControl } from "./interface-control.ts";
import { internationalizationStrings } from "./internationalization-strings.ts";
import { linterQualityGates } from "./linter-quality-gates.ts";
import { maintainabilityCleanCode } from "./maintainability-clean-code.ts";
import { maintenanceClassification } from "./maintenance-classification.ts";
import { maintenanceImpactAnalysis } from "./maintenance-impact-analysis.ts";
import { mutationTestingAdequacy } from "./mutation-testing-adequacy.ts";
import { operationsMonitoring } from "./operations-monitoring.ts";
import { performanceTuning } from "./performance-tuning.ts";
import { philosophy } from "./philosophy.ts";
import { privacyDataProtection } from "./privacy-data-protection.ts";
import { processMeasurement } from "./process-measurement.ts";
import { professionalEthics } from "./professional-ethics.ts";
import { projectLinking } from "./project-linking.ts";
import { qualityAssuranceReviews } from "./quality-assurance-reviews.ts";
import { regressionTestingStrategy } from "./regression-testing-strategy.ts";
import { requirementsAttributes } from "./requirements-attributes.ts";
import { requirementsChangeControl } from "./requirements-change-control.ts";
import { requirementsCompleteness } from "./requirements-completeness.ts";
import { requirementsElicitation } from "./requirements-elicitation.ts";
import { requirementsPrioritization } from "./requirements-prioritization.ts";
import { requirementsTraceability } from "./requirements-traceability.ts";
import { reverseEngineering } from "./reverse-engineering.ts";
import { reviewEdgeCases } from "./review-edge-cases.ts";
import { riskManagement } from "./risk-management.ts";
import { rollbackRevertPlanning } from "./rollback-revert-planning.ts";
import { scopeMatching } from "./scope-matching.ts";
import { securityByDesign } from "./security-by-design.ts";
import { securityVulnerabilityScanning } from "./security-vulnerability-scanning.ts";
import { softwareLifecycles } from "./software-lifecycles.ts";
import { stateBasedModeling } from "./state-based-modeling.ts";
import { tableDrivenConstruction } from "./table-driven-construction.ts";
import { tddDiscipline } from "./tdd-discipline.ts";
import { tddPrinciples } from "./tdd-principles.ts";
import { tddStateCoverage } from "./tdd-state-coverage.ts";
import { tddTestAsDocumentation } from "./tdd-test-as-documentation.ts";
import { technicalDebtValuation } from "./technical-debt-valuation.ts";
import { testCompletionCriteria } from "./test-completion-criteria.ts";
import { testFirstProgramming } from "./test-first-programming.ts";
import { testLevels } from "./test-levels.ts";
import { testProcessDocumentation } from "./test-process-documentation.ts";
import { userStorySpecification } from "./user-story-specification.ts";
import { verificationVsValidation } from "./verification-vs-validation.ts";
import { verification } from "./verification.ts";
import { workspaceTools } from "./workspace-tools.ts";

export const GLOBAL_RULES: RuleDefinition[] = [
  philosophy,
  tddDiscipline,
  verification,
  reviewEdgeCases,
  dddStrategic,
  dddTactical,
  tddPrinciples,
  tddStateCoverage,
  tddTestAsDocumentation,
  actorActionFormat,
  architecturalDocumentation,
  atomicDesign,
  automatedReleaseEngineering,
  boundaryValueAnalysis,
  configurationBaselines,
  configurationChangeProcess,
  conventionalCommits,
  conwaysLaw,
  couplingAndCohesion,
  dependencyMinimization,
  designCompleteness,
  equivalencePartitioning,
  eslintSelfLearning,
  exceptionHandlingPolicy,
  incidentVsProblemManagement,
  informationHiding,
  internationalizationStrings,
  linterQualityGates,
  maintenanceClassification,
  maintenanceImpactAnalysis,
  mutationTestingAdequacy,
  regressionTestingStrategy,
  requirementsAttributes,
  requirementsChangeControl,
  requirementsCompleteness,
  requirementsElicitation,
  requirementsTraceability,
  rollbackRevertPlanning,
  scopeMatching,
  securityByDesign,
  technicalDebtValuation,
  testCompletionCriteria,
  testFirstProgramming,
  testProcessDocumentation,
  userStorySpecification,
  workspaceTools,
  requirementsPrioritization,
  architecturalSynthesis,
  architecturalEvaluation,
  architecturalTactics,
  designQualityReviews,
  performanceTuning,
  tableDrivenConstruction,
  testLevels,
  experienceBasedTesting,
  operationsMonitoring,
  reverseEngineering,
  maintainabilityCleanCode,
  interfaceControl,
  qualityAssuranceReviews,
  verificationVsValidation,
  privacyDataProtection,
  projectLinking,
  securityVulnerabilityScanning,
  effortEstimation,
  riskManagement,
  softwareLifecycles,
  processMeasurement,
  formalMethods,
  stateBasedModeling,
  professionalEthics,
  intellectualProperty,
  costBenefitAnalysis,
  concurrencyControl,
  databaseNormalization,
  booleanLogic,
  empiricalExperiments
];
