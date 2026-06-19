import { defineRule } from "../../define.ts";

export const computingFoundationsDatabaseManagement = defineRule({
  content: `# Computing Foundations: Database Management

## 1. Domain Theory and Conceptual Foundations
A database is an organized collection of related data, structured for efficient storage, retrieval, and modification by one or more applications. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 6, database management is a cornerstone of computing foundations. Software engineers must understand both the physical and logical aspects of data representation to design system architectures that maintain integrity, availability, and consistency under varying load conditions. Selecting, designing, and optimizing databases requires evaluating data schemas, consistency models, normal forms, and transaction recovery mechanisms.

### 1.1 Database Types and Classification
Modern systems leverage various database models to align with data structures and query patterns:
- **Relational Databases (RDBMS)**: Organize data into tables (relations) consisting of rows and columns. They enforce strict relational algebra rules and maintain explicit links between tables using primary and foreign keys.
- **NoSQL Databases**: Designed for high write throughput, horizontal scaling, and flexible data schemas:
  - **Columnar Databases**: Store data tables by column rather than by row, optimizing read operations for analytical queries.
  - **Key-Value Databases**: Store simple key-value pairs, providing fast lookup times.
  - **Document Databases**: Store semi-structured data (such as JSON) in documents, allowing nested structures.
  - **Graph Databases**: Represent data as nodes, edges, and properties, optimizing traversal queries (such as social networks or recommendation engines).
  - **Time-Series Databases**: Optimized for handling time-stamped data sequences, useful for IoT telemetry and logging.
  - **Hierarchical and Network Databases**: Older models organizing data into tree or graph structures with parent-child relationships.

### 1.2 Database Schemas and Keys
A database schema defines the logical structure, relationships, and integrity constraints of the data:
- **Physical vs. Logical Schema**: The physical schema defines how data is stored on disk files, indices, and allocation units. The logical schema defines tables, fields, constraints, and views, abstracting the physical layout from applications.
- **Key Types**:
  - **Primary Key**: Uniquely identifies each row in a table.
  - **Foreign Key**: Establishes a link to a primary key in another table, enforcing referential integrity.
  - **Candidate Key**: A minimal set of attributes that can uniquely identify a row.
  - **Composite Key**: A primary key composed of multiple columns.
  - **Surrogate Key**: An artificially generated unique identifier (e.g., auto-incrementing integer or UUID) with no business meaning.
- **Star, Snowflake, and Fact Constellation Schemas**: Used in analytical data warehousing. A star schema has central fact tables connected to simple dimension tables. A snowflake schema normalizes dimension tables into sub-dimensions. A fact constellation contains multiple fact tables sharing dimension tables.
- **Schema Parameters**: Schema design is influenced by overlap preservation, extended overlap preservation, normalization, and minimality to optimize data layouts.

### 1.3 Data Models and Storage Models
Data storage and retrieval require balancing consistency and availability trade-offs:
- **ACID Model**: Emphasized in relational databases:
  - **Atomicity**: Guarantees that all operations within a transaction succeed or all fail.
  - **Consistency**: Ensures the database transitions only from one valid state to another, satisfying all constraints.
  - **Isolation**: Prevents concurrent transactions from interfering with each other, ensuring serializable behavior.
  - **Durability**: Guarantees that committed transactions survive system crashes.
- **BASE Model**: Emphasized in NoSQL databases, prioritizing availability over immediate consistency:
  - **Basically Available**: The system remains operational despite partition failures.
  - **Soft State**: The system state can drift and change over time without user interaction.
  - **Eventual Consistency**: Data will eventually become consistent across all replicas once updates cease.
- **Physical Storage Models**:
  - **Direct Access Storage (DAS)**: Dedicated storage devices directly attached to the processing server.
  - **Network Attached Storage (NAS)**: File-level storage accessed over a local network.
  - **Storage Area Network (SAN)**: Dedicated block-level storage network providing high-speed access to storage pools.

### 1.4 Database Management Systems (DBMS) Architecture
A DBMS is software providing tools for data maintenance, security, and retrieval:
- **Database Engine**: The core component managing data storage, indexing, and retrieval on disk.
- **Database Manager**: Administrative tools for backing up, cloning, patching, and maintaining database baselines.
- **Runtime Database Manager (RDM)**: Verifies user privileges, manages concurrent accesses, and enforces data integrity constraints at runtime.
- **Query Processor**: Parses, compiles, optimizes, and executes user database queries, converting logical requests into physical disk read/write plans.
- **Database Languages**: Includes Data Definition Language (DDL) for defining schemas, Data Manipulation Language (DML) for inserting/updating/deleting data, Transaction Control Language (TCL) for commits and rollbacks, Data Control Language (DCL) for managing permissions, and Database Access Language (DAL).

### 1.5 Database Normalization and SQL
Data layout optimization minimizes redundancy and prevents update anomalies:
- **Normalization Phases**:
  1. **First Normal Form (1NF)**: Eliminates duplicate columns and groups, ensuring each table cell contains a single atomic value and each row is unique.
  2. **Second Normal Form (2NF)**: Satisfies 1NF and removes partial dependencies (non-key columns must depend on the entire primary key, not a subset).
  3. **Third Normal Form (3NF)**: Satisfies 2NF and removes transitive dependencies (non-key columns must not depend on other non-key columns).
  4. **Boyce-Codd Normal Form (BCNF / 3.5NF)**: For any dependency X -> Y, X must be a superkey.
  5. **Higher Normal Forms (4NF, 5NF, 6NF/DKNF)**: Eliminate multi-valued and join dependencies. Domain-Key Normal Form (DKNF) is the ultimate design where all constraints are logical consequences of domain constraints and key constraints.
- **De-normalization**: Relational queries involving multiple normalized tables require expensive join operations. In read-heavy scenarios, de-normalization is applied to strategically introduce redundancy, improving query times at the cost of update complexity.
- **Structured Query Language (SQL)**: A standardized language (ANSI/ISO SQL) composed of clauses, expressions, and queries. Engineers must choose between static/embedded SQL (compiled at build time for security and speed) and dynamic SQL (generated at runtime). Simple and complex database views abstract physical tables to enforce access controls.

### 1.6 Data Warehousing, Mining, Backup, and Recovery
Ensuring long-term data durability, safety, and business value:
- **Data Warehousing**: Extracts transactional data from multiple sources into a central warehouse (Enterprise Data Warehouse, Operational Data Store, or Data Mart) to support analytical queries.
- **Data Mining**: Applies pattern recognition algorithms (clustering, classification, association) to discover historical trends.
- **Backup and Recovery**: Protects data against hardware failures and corruption. Transactions are secured via commits at specific checkpoints, utilizing shadow paging, deferred updates, or immediate updates to support transaction rollbacks.
- **Backup Types**: Full backups copy the entire database, differential backups copy changes since the last full backup, and transaction log backups save the sequential record of database transactions.

## 2. Compliance Checklist
- [ ] Was the database model (relational, NoSQL, columnar, document, or graph) selected based on the structural nature of the data and expected query patterns?
- [ ] Are logical schema definitions decoupled from physical database layouts to ensure independent physical maintenance?
- [ ] Did the schema design define appropriate keys (primary, foreign, candidate, composite, surrogate) to maintain referential integrity?
- [ ] Is the database schema normalized to 3NF or BCNF to prevent update anomalies and redundant storage?
- [ ] If de-normalization was implemented for query performance, was the trade-off documented and synchronization risks mitigated?
- [ ] Was the consistency model (ACID for strict transaction safety vs. BASE for high scaling and availability) selected to align with application objectives?
- [ ] Are physical storage architectures (DAS, NAS, SAN) configured to meet the application's I/O throughput and durability requirements?
- [ ] Do database query operations isolate schema definition (DDL) from data modification (DML) and permissions (DCL)?
- [ ] Is the Runtime Database Manager (RDM) configured to verify authentication, enforce access privileges, and manage concurrent access?
- [ ] Did the team analyze database query execution plans to optimize indices and prevent table-scanning performance issues?
- [ ] Is static SQL preferred for predictable queries to prevent injection vulnerabilities, or is dynamic SQL parameterized?
- [ ] Are database views (simple or complex) utilized to abstract underlying physical tables and restrict access?
- [ ] If analytical processing is required, is a data warehouse (EDW, ODS, or Data Mart) decoupled from the main transactional engine?
- [ ] Are data mining routines (clustering, classification) executed on separate analytical databases to prevent performance degradation on transactional engines?
- [ ] Does the transaction recovery manager implement commit checkpoints, shadow paging, or deferred updates to support reliable transaction rollbacks?
- [ ] Is a periodic database backup policy (combining full, differential, and transaction log backups) implemented and tested?
- [ ] Were physical schema parameters (e.g., page sizes, fill factors, indexing parameters) tuned to optimize disk write times?
- [ ] Does the schema definition enforce domain constraints and check constraints to prevent corrupt data entry at the engine level?`,
  description:
    "database management, schema, relational databases, RDBMS, NoSQL, columnar, key-value, document, graph databases, ACID, BASE, storage models, NAS, SAN, normalization, 3NF, BCNF, SQL, data warehousing, data mining, database backup, database recovery, transactions",
  filename: "computing-foundations-database-management",
  trigger: "model_decision"
});
