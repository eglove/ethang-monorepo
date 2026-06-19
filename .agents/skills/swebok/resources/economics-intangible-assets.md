# Software Engineering Economics: Identifying and Characterizing Intangible Assets

## 1. Domain Theory and Conceptual Foundations

### 1.1 The Concept of Intangible Assets in Software Organizations

In software engineering economics, an organization's value is not solely represented by physical property or capital. The intangible side of an organization represents the valuable knowledge residing within its structures, culture, processes, and members. According to the Software Engineering Body of Knowledge (SWEBOK v4) Chapter 15, these assets must be explicitly identified, characterized, and integrated into engineering decisions. If software engineers fail to recognize and evaluate these assets, they run a high risk of developing a software solution that does not fit the target environment, leading to project failure. Explicit consideration of these assets minimizes mismatches and aligns the software product with the operational realities of the business.

### 1.2 Tacit vs. Explicit Knowledge and the Iceberg Phenomenon

Intangible assets are conceptually divided into tacit (or implicit) knowledge and explicit knowledge. Tacit knowledge refers to the personal, context-specific knowledge residing in the minds of employees, such as their expertise in executing informal processes and managing undocumented procedures. Explicit knowledge refers to institutional knowledge recorded in various organizational resources, such as templates, written policies, manuals, standards, plans, checklists, lessons learned, and training materials. SWEBOK v4 uses the iceberg metaphor to describe these assets, where the vast majority of an organization's valuable knowledge remains hidden "underwater" as tacit knowledge. The role of the engineer is to uncover and leverage this hidden knowledge to design software systems that support the organization's business goals.

### 1.3 The Strategic Intangible Process Assets Characterization (SIPAC) Methodology

The Strategic Intangible Process Assets Characterization (SIPAC) methodology is a structured approach used by software engineers to elicit, characterize, and assess an organization's intangible assets. By following SIPAC, engineers can systematically evaluate how process assets and organizational knowledge influence and are influenced by proposed digital transformation solutions. SIPAC replaces ad-hoc, intuitive decision-making with a quantitative and qualitative framework. The method guides the engineer through identifying business goals, linking assets to those goals, mapping supporting software products, defining normalized indicators, calculating quality and impact values, and integrating the results into a multi-attribute decision-making model.

### 1.4 Identifying Processes and Defining Business Goals

The first phase of the SIPAC methodology involves understanding the organization's business processes and defining its high-level business goals. If the organization has well-documented processes, the engineer should use them; otherwise, a deliberate survey (such as interviews and workshops) must be conducted. Business goals serve as the ultimate criteria for evaluating value. Generic business goals typically include: maintaining growth and continuity, meeting financial objectives (such as profitability, return on investment, and cash flow), meeting responsibility to employees (such as job security and working conditions), meeting responsibility to society (such as regulatory compliance), and managing market position.

### 1.5 Taxonomy and Selection of Generic Intangible Assets (GIAs)

Once business goals are established, the next step is to comprehensively identify the intangible assets linked with those goals. Software engineers can utilize taxonomies of process assets to structure this identification. A practical approach involves focusing iteratively on the 11 Generic Intangible Assets (GIAs) defined in literature, which represent the potential components of any business affected by a digital transformation. By focusing on each GIA, the engineer selects the asset type to consider and elicits the specific intangible assets associated with it. Along with identification, the engineer must assign a qualitative relative importance value to each asset. This importance is measured on a scale from 1 (lowest importance) to 5 (highest importance) based on how critical the asset is to achieving the identified business goals. The highest-rated assets represent the most valuable targets for software support.

### 1.6 Identifying Software Products and Value Mapping

To transition from characterization to implementation, the software engineer must identify the software products that can support the identified intangible assets. This step forms the core of the digital transformation proposal. SWEBOK v4 outlines three main strategies for product identification: using Osterwalder's value proposition design methodology to generate a value map with stakeholders' emerging needs; listing known software products and mapping them directly to the identified intangible assets; or iteratively working with individual intangible assets to identify supporting software products. A single software product can support multiple intangible assets, and a single intangible asset may require support from multiple software products.

### 1.7 Defining and Measuring Quality and Impact Indicators

To quantitatively characterize intangible assets, engineers must define and measure standardized, normalized indicators. Indicators are divided into two categories:

1. Quality indicators: These assess the intrinsic characteristics or features of the specific intangible asset, such as its completeness, accuracy, accessibility, and currency.
1. Impact indicators: These assess how much the specific intangible asset contributes to the execution of business processes or the achievement of business goals.
To ensure mathematical validity, all indicators must be normalized and standardized (typically onto a common scale such as [0, 1] or [-1, 1]) so that they can be aggregated and compared without scaling bias.

### 1.8 Quantitative Assessment: Quality Valuation (Qval)

The quality valuation (Qval) provides a quantitative measure of the health of an intangible asset based solely on its quality indicators. Given a set of $q$ normalized quality indicators $Xi$ for a specific intangible asset $n$, Qval is calculated as the arithmetic mean of these normalized quality indicators. Mathematically, Qval represents the average quality score of the asset. If Qval is low, it indicates that the asset is poorly documented, outdated, or difficult to access, representing a high risk of failure if automated without pre-digitization refinement.

### 1.9 Quantitative Assessment: Impact Valuation (Ival)

The impact valuation (Ival) measures the contribution of the intangible asset to business goals and processes based solely on its impact indicators. Given a set of $p$ normalized impact indicators $Zi$ for a specific intangible asset $n$, Ival is calculated as the arithmetic mean of these normalized impact indicators. Ival represents the average impact score. A high Ival indicates that the asset is a significant lever for achieving organizational goals, while a low Ival suggests that the asset has little bearing on the organization's strategic success.

### 1.10 Linear Value Calculation (KAval) and Quadrant Characterization

The linear value of an intangible asset characterization (KAval) is calculated by combining Qval and Ival. Assuming that quality and impact are equally weighted, KAval is calculated using the algebraic mean of the standardized and normalized indicators, mapping the asset's health onto a scale of [-1, 1]. A KAval of 0 represents an asset exactly on target, a value of 1 represents an asset 100% over target, and a value of -1 represents an asset 100% under target.
Using Qval, Ival, and defined organizational thresholds, assets are classified into states within three characterization cases:

* Case 1: Specific intangible assets with both impact and quality indicators, categorized as Warning (low quality, low impact), Replaceable (high quality, low impact), Evolving (low quality, high impact), or Stable (high quality, high impact).
* Case 2: Specific intangible assets with only quality indicators, categorized as Acceptable Quality or Unacceptable Quality.
* Case 3: Specific intangible assets with only impact indicators, categorized as Acceptable Impact or Unacceptable Impact.

### 1.11 Business Model Mappings and Multi-Attribute Decision-Making

The final phase of intangible asset management is integrating these characterization values with the client's business model and making the final investment decision. Mappings show organizational leadership how proposed software products interact with specific business components and goals. Since choosing software products involves multiple criteria (impact on goals, characterization state, competitor dynamics, business model impact, implementation cost, implementation time, and product complexity), the software engineer must treat this as a multiple-attribute decision. This approach prevents the organization from making high-risk decisions, such as automating processes that are low value or in poor health, and ensures that the final software proposal delivers genuine business value.

## 2. Compliance Checklist

* Were the high-level business goals of the client organization clearly defined and documented before eliciting intangible assets?
* Has a deliberate survey of business processes been conducted if well-documented processes are not readily available?
* Are tacit and explicit knowledge assets of the client organization explicitly distinguished and identified during requirements elicitation?
* Have the specific intangible assets been mapped to the 11 Generic Intangible Assets (GIAs) to ensure comprehensive domain coverage?
* Was a qualitative relative importance score on a scale of 1 to 5 assigned to each identified specific intangible asset?
* Are the software products proposed for digital transformation explicitly mapped to the specific intangible assets they support?
* Were the quality and impact indicators for each intangible asset formally defined, standardized, and normalized?
* Is Qval calculated as the arithmetic mean of the normalized quality indicators to assess the asset's structural health?
* Is Ival calculated as the arithmetic mean of the normalized impact indicators to assess the asset's business value?
* Was the linear valuation KAval computed on a standardized scale of -1 to 1 to represent the general state of each asset?
* Are intangible assets with both quality and impact indicators classified into the correct Case 1 quadrants (Warning, Replaceable, Evolving, Stable)?
* Were explicit organizational quality and impact thresholds established for determining the acceptability of each asset?
* Has a value proposition map been generated with stakeholders to identify emerging needs and align software products with assets?
* Are the characterized intangible assets visually linked to the components of the client's business model?
* Does the final software proposal document the risks of automating processes supported by assets in a "Warning" state?
* Was the decision to select specific software products treated as a multiple-attribute decision incorporating cost, time, complexity, and asset impact?
* Have all stakeholders reviewed the business model canvas enriched with the intangible asset status prior to project initiation?
