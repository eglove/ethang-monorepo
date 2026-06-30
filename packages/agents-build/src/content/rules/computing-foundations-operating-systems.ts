import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsOperatingSystems = defineRule({
  content: [
    {
      level: 1,
      text: "Computing Foundations: Operating Systems",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "An operating system (OS) is software that manages computer hardware resources and provides common services for execution of application software. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 5, software engineers must possess a deep conceptual understanding of operating systems to design, optimize, and debug software applications. Applications do not execute in isolation; they are constrained by the processor scheduling, virtual memory paging, I/O device drivers, and network protocols managed by the host operating system. A software engineer must analyze these subsystems to make informed design choices, especially for high-throughput, concurrent, or real-time applications.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Operating system Types and Architectures",
      type: "header"
    },
    {
      text: "Operating systems have evolved to address different computing constraints and application scenarios:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Batch Processing Systems**: Execute jobs in sequential, non-interactive batches, optimizing throughput for long-running calculations."
        },
        {
          text: "**Multiprogramming and Time-Sharing Systems**: Allow multiple processes to reside in memory and share the CPU, creating the illusion of concurrency for multiple interactive users."
        },
        {
          text: "**Dual-Mode Operation**: Prevents user-level programs from corrupting the system by separating execution into user mode (unprivileged) and kernel mode (privileged). Privileged instructions (like direct hardware access) can only be executed by the kernel."
        },
        {
          text: "**Microkernel vs. Monolithic Kernel**: Monolithic kernels run all OS services in kernel address space for maximum performance, while microkernels run minimal services in kernel space and move others (file systems, device drivers) to user space, maximizing modularity and reliability."
        },
        {
          text: "**Real-Time Operating Systems (RTOS)**: Guarantee deterministic response times for external stimuli, critical in safety-critical and embedded systems."
        },
        {
          text: "**Distributed and Network Operating Systems**: Network operating systems allow independent computers to share resources over a LAN, while distributed operating systems manage resources across multiple machines, presenting them as a single cohesive environment."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Processor and Process Management",
      type: "header"
    },
    {
      text: "Process management is the OS function that orchestrates process execution, synchronization, and resource allocation:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Processes, Threads, and Address Space**: A process is an executing program instance with its own isolated address space, file descriptors, and security context. A thread is the smallest unit of CPU execution, sharing its parent process's memory space."
        },
        {
          text: "**User vs. Kernel Threads**: User threads are managed by a user-space threading library without kernel intervention, while kernel threads are scheduled directly by the OS."
        },
        {
          text: "**Booting and Process Creation**: Booting loads the OS kernel into memory. Process creation involves system calls (e.g., fork and exec) that clone an existing process and load a new executable image."
        },
        {
          text: "**CPU Scheduling Algorithms**:\n- **First-Come, First-Served (FCFS)**: Non-preemptive scheduling based on arrival order.\n- **Shortest Job First (SJF)**: Prioritizes processes with the shortest CPU burst length, minimizing average wait time but risking starvation.\n- **Shortest Remaining Time First (SRTF)**: A preemptive version of SJF.\n- **Priority Scheduling**: Allocates the CPU based on assigned priority values.\n- **Round Robin (RR)**: Allocates the CPU for a fixed time quantum in a cyclic queue, ensuring fair sharing but increasing context-switching overhead."
        },
        {
          text: "**Synchronization and Locking**: Concurrency requires synchronization to prevent race conditions:\n- **Mutexes and Semaphores**: Mutexes are ownership-based locks. Binary and counting semaphores act as signaling devices to control access to finite shared resources.\n- **Deadlock Characterization**: Occurs when processes are permanently blocked waiting for resources held by each other. The four necessary conditions (Coffman conditions) are mutual exclusion, hold and wait, no preemption, and circular wait. OS strategies include prevention, avoidance (e.g., Banker's algorithm), and detection/recovery."
        },
        {
          text: "**Inter-Process Communication (IPC)**: Enables processes to exchange data via pipes, message queues, shared memory, or sockets."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Memory Management",
      type: "header"
    },
    {
      text: "Memory management coordinates the system's memory hierarchy (registers, cache, RAM, secondary storage):",
      type: "text"
    },
    {
      items: [
        {
          text: "**Physical vs. Virtual Memory**: Virtual memory decouples the program's logical address space from physical RAM, letting programs address more memory than physically exists."
        },
        {
          text: "**Fragmentation**:\n- **Internal Fragmentation**: Wasted space inside allocated memory blocks.\n- **External Fragmentation**: Total free memory is sufficient to satisfy a request, but it is split into non-contiguous blocks."
        },
        {
          text: "**Allocation Models**: Contiguous allocation, dynamic partitioning, paging, and segmentation. Paging divides memory into fixed-size frames, while segmentation divides it into logical units (code, stack, heap). Paged segmentation combines both."
        },
        {
          text: "**Demand Paging and Thrashing**: Demand paging loads pages into memory only when referenced. If the active working set of processes exceeds physical memory, the system spends all its time swapping pages in and out, causing thrashing and severe performance collapse."
        },
        {
          text: "**Page Replacement Strategies**: FIFO, Not-Recently-Used (NRU), Least Recently Used (LRU), Most Recently Used (MRU), Least Frequently Used (LFU), Most Frequently Used (MFU), Second Chance, and Aging."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Device and Information Management",
      type: "header"
    },
    {
      text: "The OS provides standard abstractions to interact with heterogeneous hardware devices:",
      type: "text"
    },
    {
      items: [
        {
          text: "**I/O Access Models**: Memory-mapped I/O shares the address space with RAM, while I/O-mapped I/O uses a dedicated address space. Block devices (e.g., hard disks) transfer data in blocks, whereas character devices (e.g., keyboards) transfer data byte-by-byte."
        },
        {
          text: "**Coordination Mechanisms**: Polled I/O wastes CPU cycles waiting for devices, interrupt-driven I/O uses hardware signals to notify the CPU, and Direct Memory Access (DMA) allows hardware devices to transfer data directly to/from RAM without CPU intervention."
        },
        {
          text: "**Device Drivers**: Software modules that translate generic OS calls into hardware-specific operations, using driver tables to coordinate."
        },
        {
          text: "**File system Structure**: Organizes data on storage devices. Directory structures utilize directed acyclic graphs (DAGs) to support hard and soft links. Operations are audited via access control lists (ACLs) or capability matrices."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Network and Security Management",
      type: "header"
    },
    {
      text: "Managing resources and security across networked or isolated nodes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Clock Synchronization**: Distributed systems require synchronized clocks. Cristian's algorithm uses a central time server, the Berkeley algorithm averages clocks dynamically, and Network Time Protocol (NTP) coordinates times across the internet."
        },
        {
          text: "**Logical Clocks**: Lamport's logical clocks and vector clocks establish a partial or total causal ordering of events without relying on physical time synchronization."
        },
        {
          text: "**Distributed Mutual Exclusion and Election**: Coordination via centralized, ring-based, Ricart-Agrawala, or Maekawa algorithms. Leader elections are resolved via Bully or multicast algorithms."
        },
        {
          text: "**Layered Security**: Operational security, hardware security, access control, and security kernels establish defense in depth."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Was the operating system type (RTOS, time-sharing, distributed, network, or bare-metal) selected based on application concurrency and timing constraints?"
        },
        {
          text: "Does the design isolate user-space application code from kernel space, leveraging dual-mode security?"
        },
        {
          text: "Are system calls for process creation (such as fork or exec) audited to prevent memory leaks and resource exhaustion?"
        },
        {
          text: "Are multi-threaded execution blocks synchronized using appropriate locks (mutexes, counting semaphores) to prevent race conditions?"
        },
        {
          text: "Has the CPU scheduling algorithm (e.g., Round Robin, priority) been evaluated to ensure latency constraints are met under peak loads?"
        },
        {
          text: "Are inter-process communication (IPC) methods selected based on memory safety and data throughput needs?"
        },
        {
          text: "Was a formal deadlock analysis performed, ensuring the Coffman conditions are prevented or handled via detection and recovery?"
        },
        {
          text: "Do memory allocation routines mitigate both internal and external fragmentation via paging or segmentation?"
        },
        {
          text: "Are virtual memory demands monitored to ensure the system does not enter a thrashing state under load?"
        },
        {
          text: "Was the page replacement strategy (such as LRU or aging) selected to align with the application's memory access patterns?"
        },
        {
          text: "Are I/O access mechanisms (polling, interrupt-driven, DMA) chosen to optimize data transfer rates and CPU efficiency?"
        },
        {
          text: "Are hardware interfaces abstracted cleanly behind standard device drivers to maintain system portability?"
        },
        {
          text: "Does the storage architecture leverage appropriate file system structures, DAG directory hierarchies, and hard/soft link rules?"
        },
        {
          text: "Are data access controls implemented at the OS level using access control lists (ACLs) or capability matrices?"
        },
        {
          text: "For distributed operations, are node clocks synchronized using Cristian's, Berkeley's, or NTP protocols?"
        },
        {
          text: "Are event histories and message orders resolved using Lamport logical clocks or vector clocks to preserve causal consistency?"
        },
        {
          text: "Does the distributed architecture implement secure mutual exclusion and election algorithms (such as Bully or Ricart-Agrawala)?"
        },
        {
          text: "Does the system deployment enforce layered security, utilizing hardware protection, passwords, and security kernels?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "operating systems, processor management, memory management, device management, information management, network management, dual-mode operation, CPU scheduling, deadlocks, virtual memory, paging, thrashing, page replacement, DMA, device drivers, clock synchronization, NTP, logical clocks, Lamport, distributed systems",
  filename: "computing-foundations-operating-systems",
  trigger: "model_decision"
});
