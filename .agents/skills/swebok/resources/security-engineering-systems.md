# Security Engineering for Software Systems: Requirements, Design, Patterns, and Secure Construction

## 1. Domain Theory and Conceptual Foundations
Security engineering for software systems requires a disciplined approach to incorporating security properties into all aspects of a system's lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4), this involves defining security requirements, designing security structures, applying proven security patterns, and constructing software in a way that prevents vulnerability introduction. Software systems must be built to resist attacks and fail securely under adversarial conditions.

### 1.1 Security Requirements Engineering: Elicitation, Specification, and Prioritization
Security requirements engineering is the process of defining the security boundary and constraints of a software system. It includes elicitation, specification, and prioritization of requirements.
Key aspects of security requirements engineering include:
- **Threat Identification via Misuse and Abuse Cases**: Unlike functional use cases that describe how a system is supposed to work for a legitimate user, misuse and abuse cases describe how threat actors might exploit or abuse the system. Developers analyze these scenarios to anticipate attack vectors and define defensive constraints.
- **Threat Actors and Security Risk Assessments**: Requirements must address different types of threat actors (e.g., external hackers, malicious insiders, automated scripts, state-sponsored groups) and their capabilities. Security risk assessments evaluate the likelihood and impact of threat exploitation to guide resource allocation.
- **Specification and Prioritization Methods**: Security requirements are specified using formal security models, regulatory requirements, or natural language constraints. Because security controls can impact usability and performance, security requirements must be prioritized based on risk levels.
- **Revisiting Requirements during Maintenance**: Security requirements are not static. Every product revision, feature addition, or third-party dependency update requires security requirements to be revisited and updated.
- **Traceability**: Security requirements must be traceable throughout the development process—from requirements specifications to design decisions, test cases, and code implementation.
- **Security Requirements Specialists**: High-integrity systems benefit from engaging specialized security requirements engineers who can translate organizational security policies and compliance frameworks into precise software constraints.

### 1.2 Security Design Principles: Attack Tolerance, Access Control, and Cryptography
Security design concerns how to prevent unauthorized disclosure, creation, modification, deletion, or denial of access to system resources. It also addresses how to tolerate security attacks or violations when they occur.
Key security design principles include:
- **Attack Tolerance and Resiliency**: Designing the system to limit damage, continue service in a degraded state, and speed repair and recovery. The software must fail securely (e.g., releasing resources without exposing sensitive data or authentication bypasses).
- **Access Control**: A fundamental concept of security design. Access control mechanisms determine which entities can access specific resources under what conditions (e.g., role-based access control, attribute-based access control, or discretionary access control).
- **Cryptographic Controls and Key Management**: Most security controls rely on cryptographic algorithms. Designing secure systems requires carefully selecting cryptographic algorithms (such as AES, RSA, or ECC) and establishing secure processes for generating, distributing, storing, rotating, and destroying cryptographic keys. Hardcoding keys or using weak entropy sources are critical design failures.
- **Threat Modeling**: Illustrating how a system is being attacked to specify a security design for mitigation. Threat modeling (e.g., using frameworks like STRIDE—Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) clarifies security considerations and maps out specific steps for implementation.

### 1.3 Security Patterns as Reusable Architectural Solutions
A security pattern describes a recurring security problem that arises in a specific context and presents a well-proven generic solution. Security patterns help software designers apply security concepts consistently. Examples include:
- **Single Sign-On (SSO)**: Centralizing authentication to reduce credentials exposure.
- **Intercepting Validator**: Validating input and request parameters before processing.
- **Secure Logger**: Protecting log entries from tampering, disclosure, and log injection attacks.
- **Role-Based Access Control (RBAC) Pattern**: Standardizing access checks across complex software modules.
- **Secure State Machine**: Ensuring that state transitions within the application follow secure pathways and cannot be bypassed by race conditions.

### 1.4 Secure Software Construction: Implementation Practices and CERT Top 10 Guidelines
Software construction security concerns writing programming code to address security considerations. It has two main aspects: coding so the code itself is secure (avoiding code-level bugs like buffer overflows, race conditions, or format string vulnerabilities) and coding security features into the software.
Key recommended construction practices include:
- **Privilege Separation**: Structuring the process so that sections requiring extra privileges are isolated in separate, minimal modules. These modules should be as small as possible and perform only the tasks requiring those privileges.
- **Assumption Validation**: Ensuring all program assumptions (e.g., array bounds, input types, buffer sizes) are explicitly validated in the code. If validation is impossible, these assumptions must be documented for installers and maintainers so they know the assumptions attackers will try to invalidate.
- **Memory Isolation**: Ensuring the program does not share objects in memory with other programs unless explicitly secured.
- **Error Status Checking**: Checking every function's error status. The program must not recover from an error unless neither the error's cause nor its effects affect security. If a secure recovery is impossible, the program must restore the software's state to what it was before the process began and terminate securely.

Organizations must adopt construction security standards. The Computer Emergency Response Team (CERT) publishes top 10 software security practices:
1. **Validate Input**: Sanitize and validate all input from untrusted sources.
2. **Heed Compiler Warnings**: Compile code with high warning levels and resolve all warnings.
3. **Architect and Design for Security Policies**: Ensure the software architecture supports policy enforcement.
4. **Keep It Simple**: Keep designs simple to make verification and auditing easier.
5. **Default Deny**: Restrict access by default and grant permissions explicitly.
6. **Adhere to the Principle of Least Privilege**: Run code with the minimum set of privileges necessary.
7. **Sanitize Data Sent to Other Software**: Prevent command injection attacks on database and operating systems.
8. **Practice Defense in Depth**: Implement multiple layers of security controls.
9. **Use Effective Quality Assurance Techniques**: Conduct fuzz testing, static analysis, and manual code reviews.
10. **Adopt a Software Construction Security Standard**: Adhere to an established secure coding standard.

## 2. Compliance Checklist
- [ ] Are misuse and abuse cases drafted during the requirements phase to model threat actor behaviors?
- [ ] Have the capabilities and motivations of potential threat actors been identified and documented?
- [ ] Do security requirements explicitly address risks identified in the system security risk assessment?
- [ ] Are security requirements prioritized based on the criticality of the assets and potential impact?
- [ ] Is there a traceability matrix mapping each security requirement to specific design components, code files, and test cases?
- [ ] Are security requirements reviewed and updated during software maintenance and product updates?
- [ ] Does the system design incorporate mechanisms to tolerate attacks, limit damage, and continue service?
- [ ] Are access control controls implemented to prevent unauthorized disclosure, creation, modification, or deletion of resources?
- [ ] Are secure cryptographic algorithms selected and configured according to industry standards?
- [ ] Has a secure cryptographic key management lifecycle (creation, distribution, rotation, destruction) been implemented?
- [ ] Has threat modeling (such as STRIDE analysis) been conducted to map out system attack vectors and mitigations?
- [ ] Are proven security patterns (such as Intercepting Validator or SSO) used to resolve recurring security design challenges?
- [ ] Is the application structured to separate privileges, placing high-privilege operations in small, isolated modules?
- [ ] Are all program assumptions validated at runtime or documented explicitly for maintainers?
- [ ] Does the program avoid sharing memory objects with other applications unless protected by access controls?
- [ ] Are error statuses checked for all function calls, ensuring the system fails and recovers securely?
- [ ] Is all untrusted input validated and sanitized before being processed by the system?
- [ ] Is compiler warning output set to high severity, and are all warnings resolved before code is integrated?
- [ ] Does the system default to denying access, requiring explicit authorization for all operations?
- [ ] Is data sent to external software and systems sanitized to prevent injection attacks?
- [ ] Are security-focused QA techniques, such as fuzz testing and static analysis, integrated into the build pipeline?
- [ ] Are specialists engaged to verify that security requirements are correctly translated into code constraints?
- [ ] Does the application check for potential race conditions during state transitions in secure workflows?
- [ ] Are credentials, secrets, and API keys stored in environment variables rather than hardcoded in the codebase?