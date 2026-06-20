import { architectureDescription } from "../../rules/architecture-description.ts";
import { architectureEvaluation } from "../../rules/architecture-evaluation.ts";
import { architectureFundamentals } from "../../rules/architecture-fundamentals.ts";
import { architectureProcess } from "../../rules/architecture-process.ts";
import { computingFoundationsAiMl } from "../../rules/computing-foundations-ai-ml.ts";
import { computingFoundationsArchitecture } from "../../rules/computing-foundations-architecture.ts";
import { computingFoundationsBasicConcepts } from "../../rules/computing-foundations-basic-concepts.ts";
import { computingFoundationsDataStructuresAlgorithms } from "../../rules/computing-foundations-data-structures-algorithms.ts";
import { computingFoundationsDatabaseManagement } from "../../rules/computing-foundations-database-management.ts";
import { computingFoundationsHumanFactors } from "../../rules/computing-foundations-human-factors.ts";
import { computingFoundationsNetworks } from "../../rules/computing-foundations-networks.ts";
import { computingFoundationsOperatingSystems } from "../../rules/computing-foundations-operating-systems.ts";
import { computingFoundationsProgrammingFundamentals } from "../../rules/computing-foundations-programming-fundamentals.ts";
import { configAuditing } from "../../rules/config-auditing.ts";
import { configChangeControl } from "../../rules/config-change-control.ts";
import { configIdentification } from "../../rules/config-identification.ts";
import { configManagementProcess } from "../../rules/config-management-process.ts";
import { configReleaseManagement } from "../../rules/config-release-management.ts";
import { configStatusAccounting } from "../../rules/config-status-accounting.ts";
import { constructionFundamentals } from "../../rules/construction-fundamentals.ts";
import { constructionManagement } from "../../rules/construction-management.ts";
import { constructionPracticalConsiderations } from "../../rules/construction-practical-considerations.ts";
import { constructionTechnologies } from "../../rules/construction-technologies.ts";
import { constructionTools } from "../../rules/construction-tools.ts";
import { designFundamentals } from "../../rules/design-fundamentals.ts";
import { designProcesses } from "../../rules/design-processes.ts";
import { designQualities } from "../../rules/design-qualities.ts";
import { designQualityAnalysisEvaluation } from "../../rules/design-quality-analysis-evaluation.ts";
import { designRecording } from "../../rules/design-recording.ts";
import { designStrategiesMethods } from "../../rules/design-strategies-methods.ts";
import { economicsDecisionMaking } from "../../rules/economics-decision-making.ts";
import { economicsEstimation } from "../../rules/economics-estimation.ts";
import { economicsForProfit } from "../../rules/economics-for-profit.ts";
import { economicsFundamentals } from "../../rules/economics-fundamentals.ts";
import { economicsIntangibleAssets } from "../../rules/economics-intangible-assets.ts";
import { economicsMultipleAttribute } from "../../rules/economics-multiple-attribute.ts";
import { economicsNonprofit } from "../../rules/economics-nonprofit.ts";
import { economicsPracticalConsiderations } from "../../rules/economics-practical-considerations.ts";
import { economicsPresentEconomy } from "../../rules/economics-present-economy.ts";
import { engineeringFoundationsAbstractionEncapsulation } from "../../rules/engineering-foundations-abstraction-encapsulation.ts";
import { engineeringFoundationsDesign } from "../../rules/engineering-foundations-design.ts";
import { engineeringFoundationsEmpiricalMethods } from "../../rules/engineering-foundations-empirical-methods.ts";
import { engineeringFoundationsFundamentals } from "../../rules/engineering-foundations-fundamentals.ts";
import { engineeringFoundationsMeasurement } from "../../rules/engineering-foundations-measurement.ts";
import { engineeringFoundationsModelingSimulation } from "../../rules/engineering-foundations-modeling-simulation.ts";
import { engineeringFoundationsRootCauseAnalysis } from "../../rules/engineering-foundations-root-cause-analysis.ts";
import { engineeringFoundationsStandards } from "../../rules/engineering-foundations-standards.ts";
import { engineeringFoundationsStatisticalAnalysis } from "../../rules/engineering-foundations-statistical-analysis.ts";
import { engineeringManagementClosure } from "../../rules/engineering-management-closure.ts";
import { engineeringManagementExecution } from "../../rules/engineering-management-execution.ts";
import { engineeringManagementInitiationScope } from "../../rules/engineering-management-initiation-scope.ts";
import { engineeringManagementMeasurement } from "../../rules/engineering-management-measurement.ts";
import { engineeringManagementPlanning } from "../../rules/engineering-management-planning.ts";
import { engineeringManagementReviewEvaluation } from "../../rules/engineering-management-review-evaluation.ts";
import { engineeringOperationsControl } from "../../rules/engineering-operations-control.ts";
import { engineeringOperationsDelivery } from "../../rules/engineering-operations-delivery.ts";
import { engineeringOperationsFundamentals } from "../../rules/engineering-operations-fundamentals.ts";
import { engineeringOperationsPlanning } from "../../rules/engineering-operations-planning.ts";
import { engineeringOperationsPracticalConsiderations } from "../../rules/engineering-operations-practical-considerations.ts";
import { engineeringOperationsTools } from "../../rules/engineering-operations-tools.ts";
import { engineeringProcessAssessmentImprovement } from "../../rules/engineering-process-assessment-improvement.ts";
import { engineeringProcessFundamentals } from "../../rules/engineering-process-fundamentals.ts";
import { engineeringProcessLifecycles } from "../../rules/engineering-process-lifecycles.ts";
import { maintenanceFundamentals } from "../../rules/maintenance-fundamentals.ts";
import { maintenanceKeyIssues } from "../../rules/maintenance-key-issues.ts";
import { maintenanceProcesses } from "../../rules/maintenance-processes.ts";
import { maintenanceTechniques } from "../../rules/maintenance-techniques.ts";
import { maintenanceTools } from "../../rules/maintenance-tools.ts";
import { mathematicalFoundationsBasicsOfCounting } from "../../rules/mathematical-foundations-basics-of-counting.ts";
import { mathematicalFoundationsDiscreteProbability } from "../../rules/mathematical-foundations-discrete-probability.ts";
import { mathematicalFoundationsFiniteStateMachines } from "../../rules/mathematical-foundations-finite-state-machines.ts";
import { mathematicalFoundationsFundamentals } from "../../rules/mathematical-foundations-fundamentals.ts";
import { mathematicalFoundationsGrammars } from "../../rules/mathematical-foundations-grammars.ts";
import { mathematicalFoundationsGraphsTrees } from "../../rules/mathematical-foundations-graphs-trees.ts";
import { mathematicalFoundationsNumberTheory } from "../../rules/mathematical-foundations-number-theory.ts";
import { mathematicalFoundationsProofTechniques } from "../../rules/mathematical-foundations-proof-techniques.ts";
import { mathematicalFoundationsSetsRelationsFunctions } from "../../rules/mathematical-foundations-sets-relations-functions.ts";
import { modelsMethodsAnalysis } from "../../rules/models-methods-analysis.ts";
import { modelsMethodsMethods } from "../../rules/models-methods-methods.ts";
import { modelsMethodsModeling } from "../../rules/models-methods-modeling.ts";
import { modelsMethodsTypes } from "../../rules/models-methods-types.ts";
import { professionalPracticeCommunication } from "../../rules/professional-practice-communication.ts";
import { professionalPracticeProfessionalism } from "../../rules/professional-practice-professionalism.ts";
import { professionalPracticePsychology } from "../../rules/professional-practice-psychology.ts";
import { qualityAssuranceProcess } from "../../rules/quality-assurance-process.ts";
import { qualityFundamentals } from "../../rules/quality-fundamentals.ts";
import { qualityManagementProcess } from "../../rules/quality-management-process.ts";
import { qualityTools } from "../../rules/quality-tools.ts";
import { requirementsAnalysis } from "../../rules/requirements-analysis.ts";
import { requirementsElicitation } from "../../rules/requirements-elicitation.ts";
import { requirementsFundamentals } from "../../rules/requirements-fundamentals.ts";
import { requirementsManagementActivities } from "../../rules/requirements-management-activities.ts";
import { requirementsPracticalConsiderations } from "../../rules/requirements-practical-considerations.ts";
import { requirementsSpecification } from "../../rules/requirements-specification.ts";
import { requirementsTools } from "../../rules/requirements-tools.ts";
import { requirementsValidation } from "../../rules/requirements-validation.ts";
import { securityDomainSpecific } from "../../rules/security-domain-specific.ts";
import { securityEngineeringProcesses } from "../../rules/security-engineering-processes.ts";
import { securityEngineeringSystems } from "../../rules/security-engineering-systems.ts";
import { securityFundamentals } from "../../rules/security-fundamentals.ts";
import { securityManagementOrganization } from "../../rules/security-management-organization.ts";
import { securityTools } from "../../rules/security-tools.ts";
import { testingDevelopmentProcesses } from "../../rules/testing-development-processes.ts";
import { testingEmergingTechnologies } from "../../rules/testing-emerging-technologies.ts";
import { testingFundamentals } from "../../rules/testing-fundamentals.ts";
import { testingLevels } from "../../rules/testing-levels.ts";
import { testingMeasures } from "../../rules/testing-measures.ts";
import { testingProcess } from "../../rules/testing-process.ts";
import { testingTechniques } from "../../rules/testing-techniques.ts";
import { testingTools } from "../../rules/testing-tools.ts";

export const swebokResources = [
  {
    content: architectureDescription.content,
    filename: "architecture-description.md"
  },
  {
    content: architectureEvaluation.content,
    filename: "architecture-evaluation.md"
  },
  {
    content: architectureFundamentals.content,
    filename: "architecture-fundamentals.md"
  },
  {
    content: architectureProcess.content,
    filename: "architecture-process.md"
  },
  {
    content: computingFoundationsAiMl.content,
    filename: "computing-foundations-ai-ml.md"
  },
  {
    content: computingFoundationsArchitecture.content,
    filename: "computing-foundations-architecture.md"
  },
  {
    content: computingFoundationsBasicConcepts.content,
    filename: "computing-foundations-basic-concepts.md"
  },
  {
    content: computingFoundationsDataStructuresAlgorithms.content,
    filename: "computing-foundations-data-structures-algorithms.md"
  },
  {
    content: computingFoundationsDatabaseManagement.content,
    filename: "computing-foundations-database-management.md"
  },
  {
    content: computingFoundationsHumanFactors.content,
    filename: "computing-foundations-human-factors.md"
  },
  {
    content: computingFoundationsNetworks.content,
    filename: "computing-foundations-networks.md"
  },
  {
    content: computingFoundationsOperatingSystems.content,
    filename: "computing-foundations-operating-systems.md"
  },
  {
    content: computingFoundationsProgrammingFundamentals.content,
    filename: "computing-foundations-programming-fundamentals.md"
  },
  {
    content: configAuditing.content,
    filename: "configuration-auditing.md"
  },
  {
    content: configChangeControl.content,
    filename: "configuration-change-control.md"
  },
  {
    content: configIdentification.content,
    filename: "configuration-identification.md"
  },
  {
    content: configManagementProcess.content,
    filename: "configuration-management-process.md"
  },
  {
    content: configReleaseManagement.content,
    filename: "configuration-release-management.md"
  },
  {
    content: configStatusAccounting.content,
    filename: "configuration-status-accounting.md"
  },
  {
    content: constructionFundamentals.content,
    filename: "construction-fundamentals.md"
  },
  {
    content: constructionManagement.content,
    filename: "construction-management.md"
  },
  {
    content: constructionPracticalConsiderations.content,
    filename: "construction-practical-considerations.md"
  },
  {
    content: constructionTechnologies.content,
    filename: "construction-technologies.md"
  },
  { content: constructionTools.content, filename: "construction-tools.md" },
  { content: designFundamentals.content, filename: "design-fundamentals.md" },
  { content: designProcesses.content, filename: "design-processes.md" },
  { content: designQualities.content, filename: "design-qualities.md" },
  {
    content: designQualityAnalysisEvaluation.content,
    filename: "design-quality-analysis-evaluation.md"
  },
  { content: designRecording.content, filename: "design-recording.md" },
  {
    content: designStrategiesMethods.content,
    filename: "design-strategies-methods.md"
  },
  {
    content: economicsDecisionMaking.content,
    filename: "economics-decision-making.md"
  },
  {
    content: economicsEstimation.content,
    filename: "economics-estimation.md"
  },
  {
    content: economicsForProfit.content,
    filename: "economics-for-profit.md"
  },
  {
    content: economicsFundamentals.content,
    filename: "economics-fundamentals.md"
  },
  {
    content: economicsIntangibleAssets.content,
    filename: "economics-intangible-assets.md"
  },
  {
    content: economicsMultipleAttribute.content,
    filename: "economics-multiple-attribute.md"
  },
  { content: economicsNonprofit.content, filename: "economics-nonprofit.md" },
  {
    content: economicsPracticalConsiderations.content,
    filename: "economics-practical-considerations.md"
  },
  {
    content: economicsPresentEconomy.content,
    filename: "economics-present-economy.md"
  },
  {
    content: engineeringFoundationsAbstractionEncapsulation.content,
    filename: "engineering-foundations-abstraction-encapsulation.md"
  },
  {
    content: engineeringFoundationsDesign.content,
    filename: "engineering-foundations-design.md"
  },
  {
    content: engineeringFoundationsEmpiricalMethods.content,
    filename: "engineering-foundations-empirical-methods.md"
  },
  {
    content: engineeringFoundationsFundamentals.content,
    filename: "engineering-foundations-fundamentals.md"
  },
  {
    content: engineeringFoundationsMeasurement.content,
    filename: "engineering-foundations-measurement.md"
  },
  {
    content: engineeringFoundationsModelingSimulation.content,
    filename: "engineering-foundations-modeling-simulation.md"
  },
  {
    content: engineeringFoundationsRootCauseAnalysis.content,
    filename: "engineering-foundations-root-cause-analysis.md"
  },
  {
    content: engineeringFoundationsStandards.content,
    filename: "engineering-foundations-standards.md"
  },
  {
    content: engineeringFoundationsStatisticalAnalysis.content,
    filename: "engineering-foundations-statistical-analysis.md"
  },
  {
    content: engineeringManagementClosure.content,
    filename: "engineering-management-closure.md"
  },
  {
    content: engineeringManagementExecution.content,
    filename: "engineering-management-execution.md"
  },
  {
    content: engineeringManagementInitiationScope.content,
    filename: "engineering-management-initiation-scope.md"
  },
  {
    content: engineeringManagementMeasurement.content,
    filename: "engineering-management-measurement.md"
  },
  {
    content: engineeringManagementPlanning.content,
    filename: "engineering-management-planning.md"
  },
  {
    content: engineeringManagementReviewEvaluation.content,
    filename: "engineering-management-review-evaluation.md"
  },
  {
    content: engineeringOperationsControl.content,
    filename: "engineering-operations-control.md"
  },
  {
    content: engineeringOperationsDelivery.content,
    filename: "engineering-operations-delivery.md"
  },
  {
    content: engineeringOperationsFundamentals.content,
    filename: "engineering-operations-fundamentals.md"
  },
  {
    content: engineeringOperationsPlanning.content,
    filename: "engineering-operations-planning.md"
  },
  {
    content: engineeringOperationsPracticalConsiderations.content,
    filename: "engineering-operations-practical-considerations.md"
  },
  {
    content: engineeringOperationsTools.content,
    filename: "engineering-operations-tools.md"
  },
  {
    content: engineeringProcessAssessmentImprovement.content,
    filename: "engineering-process-assessment-improvement.md"
  },
  {
    content: engineeringProcessFundamentals.content,
    filename: "engineering-process-fundamentals.md"
  },
  {
    content: engineeringProcessLifecycles.content,
    filename: "engineering-process-lifecycles.md"
  },
  {
    content: maintenanceFundamentals.content,
    filename: "maintenance-fundamentals.md"
  },
  {
    content: maintenanceKeyIssues.content,
    filename: "maintenance-key-issues.md"
  },
  {
    content: maintenanceProcesses.content,
    filename: "maintenance-processes.md"
  },
  {
    content: maintenanceTechniques.content,
    filename: "maintenance-techniques.md"
  },
  { content: maintenanceTools.content, filename: "maintenance-tools.md" },
  {
    content: mathematicalFoundationsBasicsOfCounting.content,
    filename: "mathematical-foundations-basics-of-counting.md"
  },
  {
    content: mathematicalFoundationsDiscreteProbability.content,
    filename: "mathematical-foundations-discrete-probability.md"
  },
  {
    content: mathematicalFoundationsFiniteStateMachines.content,
    filename: "mathematical-foundations-finite-state-machines.md"
  },
  {
    content: mathematicalFoundationsFundamentals.content,
    filename: "mathematical-foundations-fundamentals.md"
  },
  {
    content: mathematicalFoundationsGrammars.content,
    filename: "mathematical-foundations-grammars.md"
  },
  {
    content: mathematicalFoundationsGraphsTrees.content,
    filename: "mathematical-foundations-graphs-trees.md"
  },
  {
    content: mathematicalFoundationsNumberTheory.content,
    filename: "mathematical-foundations-number-theory.md"
  },
  {
    content: mathematicalFoundationsProofTechniques.content,
    filename: "mathematical-foundations-proof-techniques.md"
  },
  {
    content: mathematicalFoundationsSetsRelationsFunctions.content,
    filename: "mathematical-foundations-sets-relations-functions.md"
  },
  {
    content: modelsMethodsAnalysis.content,
    filename: "models-methods-analysis.md"
  },
  {
    content: modelsMethodsMethods.content,
    filename: "models-methods-methods.md"
  },
  {
    content: modelsMethodsModeling.content,
    filename: "models-methods-modeling.md"
  },
  {
    content: modelsMethodsTypes.content,
    filename: "models-methods-types.md"
  },
  {
    content: professionalPracticeCommunication.content,
    filename: "professional-practice-communication.md"
  },
  {
    content: professionalPracticeProfessionalism.content,
    filename: "professional-practice-professionalism.md"
  },
  {
    content: professionalPracticePsychology.content,
    filename: "professional-practice-psychology.md"
  },
  {
    content: qualityAssuranceProcess.content,
    filename: "quality-assurance-process.md"
  },
  {
    content: qualityFundamentals.content,
    filename: "quality-fundamentals.md"
  },
  {
    content: qualityManagementProcess.content,
    filename: "quality-management-process.md"
  },
  { content: qualityTools.content, filename: "quality-tools.md" },
  {
    content: requirementsAnalysis.content,
    filename: "requirements-analysis.md"
  },
  {
    content: requirementsElicitation.content,
    filename: "requirements-elicitation.md"
  },
  {
    content: requirementsFundamentals.content,
    filename: "requirements-fundamentals.md"
  },
  {
    content: requirementsManagementActivities.content,
    filename: "requirements-management-activities.md"
  },
  {
    content: requirementsPracticalConsiderations.content,
    filename: "requirements-practical-considerations.md"
  },
  {
    content: requirementsSpecification.content,
    filename: "requirements-specification.md"
  },
  { content: requirementsTools.content, filename: "requirements-tools.md" },
  {
    content: requirementsValidation.content,
    filename: "requirements-validation.md"
  },
  {
    content: securityDomainSpecific.content,
    filename: "security-domain-specific.md"
  },
  {
    content: securityEngineeringProcesses.content,
    filename: "security-engineering-processes.md"
  },
  {
    content: securityEngineeringSystems.content,
    filename: "security-engineering-systems.md"
  },
  {
    content: securityFundamentals.content,
    filename: "security-fundamentals.md"
  },
  {
    content: securityManagementOrganization.content,
    filename: "security-management-organization.md"
  },
  { content: securityTools.content, filename: "security-tools.md" },
  {
    content: testingDevelopmentProcesses.content,
    filename: "testing-development-processes.md"
  },
  {
    content: testingEmergingTechnologies.content,
    filename: "testing-emerging-technologies.md"
  },
  {
    content: testingFundamentals.content,
    filename: "testing-fundamentals.md"
  },
  { content: testingLevels.content, filename: "testing-levels.md" },
  { content: testingMeasures.content, filename: "testing-measures.md" },
  { content: testingProcess.content, filename: "testing-process.md" },
  { content: testingTechniques.content, filename: "testing-techniques.md" },
  { content: testingTools.content, filename: "testing-tools.md" }
];
