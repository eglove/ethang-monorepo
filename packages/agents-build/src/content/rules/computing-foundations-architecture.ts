import { defineRule } from "../../define.ts";

export const computingFoundationsArchitecture = defineRule({
  content: `# Computing Foundations - Computer Architecture and Organization

## 1. Domain Theory and Conceptual Foundations

Computer architecture and computer organization are the twin pillars of hardware design and systems engineering. As defined in SWEBOK v4 Chapter 16, computer architecture describes the system components designed for specific purposes (what the system does and its logical interface), whereas computer organization explains how these units within the system connect and interact to achieve those purposes (how the architecture is implemented). For a software engineer, understanding the interplay between architecture and organization is essential for optimization, debugging, and systems integration.

### 1.1 Buses and Communication Pathways
At the core of any computing system is the communication infrastructure that links the central processing unit (CPU), memory, and input/output (I/O) devices. These components are connected via physical signal lines called buses. Systems typically employ three primary categories of buses:
1. **Address Bus**: Used by the CPU to specify a particular physical memory location or a specific I/O port for reading or writing.
2. **Data Bus**: Serves as the bi-directional pathway for transferring data bits to and from the specified memory location or I/O device.
3. **Control Bus**: Carries synchronization and control signals from the CPU to external components (including read/write controls, device enables, interrupts, status lines, and reset signals).

Buses are classified across multiple dimensions, including first-generation (shared synchronous buses), second-generation (decoupled, high-speed buses), and third-generation (point-to-point packetized interconnects). Software engineers must understand variations such as internal vs. external buses, serial vs. parallel transmission, and simplex, half-duplex, or full-duplex communication models. Additionally, specialized industrial buses, such as the Mil-Std-1553B bus (serial command/response multiplex data bus) and Wishbone buses (for system-on-a-chip integrations), are utilized in safety-critical and embedded designs.

### 1.2 Types of Computer Architectures
Historically, different design philosophies have arisen to handle instructions and data. Software engineers must distinguish between the following architectural models:
- **Von Neumann Architecture**: John von Neumann designed a computer architecture consisting of five essential components: the Arithmetic Logic Unit (ALU), memory, input devices, output devices, and a control unit. A key characteristic is that program instructions and data share the same physical memory space and access bus, leading to the "Von Neumann bottleneck" where instruction fetching and data operations cannot occur simultaneously.
- **Harvard Architecture**: Provides physically separate memory blocks and buses for code (instructions) and data. This separation allows the CPU to fetch an instruction and read/write data at the same time. The modified Harvard architecture compromises by providing a single physical memory block but partitioning it into distinct code and data sections. Data sections are read/write, while code sections are read-only, protecting code from runtime corruption while enabling simultaneous I/O.
- **Instruction Set Architecture (ISA)**: The ISA is the abstract model of a CPU that defines the registers, data types, instructions, memory addressing schemes, and I/O handling models. The two primary types of ISAs are:
  - *Reduced Instruction Set Computer (RISC)*: Focuses on simple, single-task instructions of fixed size that execute in a single clock cycle. RISC architectures require more instructions to perform complex tasks, but their simplicity makes compiler design easier, reduces hardware complexity, and optimizes general-purpose execution.
  - *Complex Instruction Set Computer (CISC)*: Provides powerful, variable-length instructions capable of executing multiple tasks (e.g., loading, calculating, and storing) in a single instruction. CISC requires fewer instructions per program but consumes more clock cycles per instruction, and is typically optimized for specialized tasks like digital signal processing or graphics.
- **Flynn's Taxonomy**: Michael J. Flynn proposed a classification system for concurrent computer architectures based on the number of concurrent instruction and data streams:
  - *Single Instruction, Single Data Stream (SISD)*: Standard sequential computer.
  - *Single Instruction, Multiple Data Stream (SIMD)*: A single instruction executes on multiple data streams in parallel (commonly used in vector processors and graphics processing units).
  - *Multiple Instruction, Single Data Stream (MISD)*: Multiple instructions operate on the same data stream (rare, occasionally used for fault-tolerant systems).
  - *Multiple Instruction, Multiple Data Stream (MIMD)*: Multiple processors execute different instructions on different data streams (the foundation of modern multi-core systems).
  Wait, variants also include Single Program Multiple Data (SPMD) and Multiple Program Multiple Data (MPMD) models.
- **System Architecture**: Refers to the high-level design of hardware, software, modules, interfaces, and data pathways. Typical models include integrated system architecture (tightly coupled single-box designs), distributed architecture (networked boxes sharing computing and storage), pooled architecture (resources allocated on demand), and converged architecture (merging distributed and pooled models for maximum scalability).

### 1.3 Microarchitecture and Internal Components
Microarchitecture represents the physical implementation of an ISA. Software engineers must optimize code for the underlying microarchitectural components:
1. **Arithmetic Logic Unit (ALU) and CPU**: The ALU performs arithmetic and logical computations on high-speed internal registers. High-end CPUs also incorporate Floating-Point Units (FPUs) to handle decimal mathematics, and utilize pipeline processing (overlapping instruction execution phases) and multi-core/multi-threading architectures to maximize throughput.
2. **Memory Unit**: Memory units are structured hierarchically to balance speed and cost. Primary memory types include Read-Only Memory (ROM) and Random Access Memory (RAM). Software engineers must understand the trade-offs between static RAM (SRAM, fast, expensive, used for caches), dynamic RAM (DRAM, high density, requires refresh cycles), synchronous DRAM (SDRAM), Double Data Rate SDRAM (DDR SDRAM), Rambus DRAM (RDRAM), and Cache DRAM (CDRAM).
3. **Input/Output Devices**: Devices interface with the system using either memory-mapped I/O (where I/O devices share the physical memory address space) or I/O-mapped I/O (using dedicated processor instructions). Device drivers act as the operating system translation layer between application software and device hardware.
4. **Control Unit**: Coordinates and synchronizes all hardware operations by interpreting instructions and directing data movement. Control units are implemented as either hardwired logic circuits (fast, rigid) or microprogrammable control stores (flexible, easier to update, using single-level or two-level control stores).

## 2. Compliance Checklist

- [ ] **Architecture vs. Organization Distinction**: Has the system design clearly separated the architectural specifications (what the system does) from the organizational implementation details (how components are connected)?
- [ ] **Bus Selection and Timing Analysis**: Have the address, data, and control buses been selected and analyzed for timing, width, and throughput constraints?
- [ ] **Bus Topology Conformance**: Has the design chosen the correct bus topology (simplex, half-duplex, full-duplex, serial, parallel, Wishbone, or specialized industrial standards) for the target environment?
- [ ] **Memory Space Partitioning**: Has the system's memory model been evaluated to prevent Von Neumann bottlenecks or to enforce Harvard code/data separation constraints?
- [ ] **Code Space Protection**: In modified Harvard designs, are the code sections marked as read-only to prevent runtime instruction corruption?
- [ ] **ISA Model Selection**: Has the choice between RISC and CISC design philosophies been justified based on compile-time efficiency, execution speed, and instruction size constraints?
- [ ] **Concurrency Stream Classification**: Has the system's parallel processing model been classified according to Flynn's Taxonomy (SISD, SIMD, MISD, MIMD) to ensure compatibility with compiler and runtime capabilities?
- [ ] **Multi-Stream Programming Alignment**: Are the software's execution loops explicitly designed to align with the hardware's data stream model (e.g., SPMD or MPMD)?
- [ ] **System Architecture Selection**: Has the system deployment model (integrated, distributed, pooled, or converged) been selected based on scalability, latency, and fault-tolerance needs?
- [ ] **Microarchitecture Optimization**: Have CPU performance features, such as pipelines, FPUs, and multi-threading execution paths, been taken into account to avoid instruction stalls?
- [ ] **Memory Hierarchy Mapping**: Has the memory hierarchy (caches, SRAM, DRAM, DDR versions) been mapped to ensure latency-critical data resides in high-speed tiers?
- [ ] **I/O Mapping Paradigm**: Is the system's I/O access model (memory-mapped vs. I/O-mapped) documented and supported by the target operating system?
- [ ] **Device Driver Compatibility**: Have the device driver interfaces been verified against the target operating system's kernel model and security boundaries?
- [ ] **Control Unit Design Verification**: If designing embedded hardware, has the choice between hardwired and microprogrammable control units been justified for speed vs. flexibility?
- [ ] **Resource Contingency Planning**: Have hardware resource contingencies (memory capacity, bus bandwidth, processing overhead) been built into the system design limits?
- [ ] **SWEBOK Hardware Alignment**: Does the software engineering process align with the computer organization and architecture standards defined in SWEBOK v4?`,
  description:
    "computing foundations, computer architecture, computer organization, instruction set architecture, RISC, CISC, Flynn taxonomy, SIMD, MIMD, memory units, ALU, control unit, buses",
  filename: "computing-foundations-architecture",
  trigger: "model_decision"
});
