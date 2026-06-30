import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsNetworks = defineRule({
  content: [
    {
      level: 1,
      text: "Computer Networks and Communications",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Computer networks and communications represent the backbone of modern software systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 7, software engineers must possess a structured understanding of networking principles. In the current computing era, software systems are rarely isolated; they function as distributed, grid, or cloud-based applications where communication between heterogeneous nodes is a critical requirement. Networking is a primary design constraint that affects the scalability, reliability, security, and performance of any software system.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Types of Computer Networks",
      type: "header"
    },
    {
      text: "Computer networks are categorized based on their geographic scope, transmission medium, and ownership:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Personal Area Network (PAN)**: A network organized around an individual, typically within 10 meters, using Bluetooth or Zigbee."
        },
        {
          text: "**Local Area Network (LAN)**: Interconnects computers within a limited area like an office or home, relying on Ethernet or Wi-Fi."
        },
        {
          text: "**Wireless Local Area Network (WLAN)**: A LAN utilizing wireless distribution methods."
        },
        {
          text: "**Campus Area Network (CAN)**: Interconnects multiple LANs within a specific area, such as a university campus."
        },
        {
          text: "**Metropolitan Area Network (MAN)**: Covers a larger geographic area than a CAN, typically spanning an entire city or town."
        },
        {
          text: "**Wide Area Network (WAN)**: Spans a large physical distance, connecting systems across countries, with the Internet being the prime example."
        },
        {
          text: "**Storage Area Network (SAN)**: A dedicated network providing block-level data storage access, isolating storage traffic from LAN traffic."
        },
        {
          text: "**system-Area Network (SAN)**: A high-performance, connection-oriented network linking computers in a cluster configuration."
        },
        {
          text: "**Enterprise Private Network (EPN)**: A private network set up to securely connect company offices and resources across multiple locations."
        },
        {
          text: "**Virtual Private Network (VPN)**: Establishes an encrypted overlay connection over public networks, protecting data from sniffing."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Layered Architectures of Networks",
      type: "header"
    },
    {
      text: "To manage the complexity of communication systems, networks adopt a layered architecture. Each layer is responsible for distinct communication functions, exposing services to the adjacent higher layer while hiding lower-layer details. Under this model:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Service**: The set of actions that a layer provides to the layer directly above it."
        },
        {
          text: "**Protocol**: A set of rules and formats that peer entities use to exchange information."
        },
        {
          text: "**Interface**: The boundary between adjacent layers defining how data is passed between them.\nLayering ensures modularity, allowing engineers to update one layer's technology without affecting higher-level applications."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Open Systems Interconnection (OSI) Reference Model",
      type: "header"
    },
    {
      text: "Developed by the ISO, the OSI reference model partitions network communications into seven logical layers:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Physical Layer (Layer 1)**: Transmits raw bit streams over a physical medium, defining electrical and mechanical specifications."
        },
        {
          text: "**Data Link Layer (Layer 2)**: Packages raw bits into frames, managing MAC addressing and error detection over a single link."
        },
        {
          text: "**Network Layer (Layer 3)**: Manages logical addressing (IP) and routing, determining the path packets take across networks."
        },
        {
          text: "**Transport Layer (Layer 4)**: Handles end-to-end communication flow, segmenting data, and ensuring reliable data transfer and flow control."
        },
        {
          text: "**Session Layer (Layer 5)**: Manages sessions between applications, providing synchronization points and dialogue control."
        },
        {
          text: "**Presentation Layer (Layer 6)**: Translates, encrypts, and compresses data, formatting the syntax and semantics for the application layer."
        },
        {
          text: "**Application Layer (Layer 7)**: Provides network services directly to user applications, serving as the interface for network-aware software."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.4 Encapsulation and Decapsulation",
      type: "header"
    },
    {
      text: "As data moves down the sender's stack, each layer treats the payload from the upper layer as data and adds its own header containing control information. This is encapsulation. The resulting data packet at each layer is a Protocol Data Unit (PDU). At the physical layer, the PDU is transmitted as bits. Upon arrival at the receiving system, the process is reversed: each layer strips off its corresponding header, validates the control information, and passes the remaining payload up the stack. This is decapsulation.\nIn resource-constrained environments (like sensor networks), strict layering can introduce unacceptable overhead. Engineers may employ cross-layer optimization, where layers share state to improve performance, though this increases system coupling.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Application Layer Protocols",
      type: "header"
    },
    {
      text: "The application layer contains protocols that software applications use to interact with the network. These are divided into:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Common Application Service Element (CASE)**: General-purpose services used across various applications."
        },
        {
          text: "**Specific Application Service Element (SASE)**: Protocols serving specific user needs, such as File Transfer Protocol (FTP, TFTP, NFS), e-mail protocols (SMTP), networking support (DNS), network management (SNMP, DHCP), remote login (Telnet, secure shell), and print services (LPD)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Design Techniques for Reliable and Efficient Networks",
      type: "header"
    },
    {
      text: "Designing resilient and high-performing networks requires combining software and hardware tactics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Segmentation**: Using subnets and Virtual LANs (VLANs) to isolate broadcast domains, improving security and performance."
        },
        {
          text: "**Firewalls and DMZs**: Deploying firewalls to filter traffic and creating Demilitarized Zones (DMZs) to isolate public-facing servers."
        },
        {
          text: "**Spanning Tree Protocol (STP)**: Preventing loops in redundant network topologies by dynamically disabling redundant paths."
        },
        {
          text: "**Link Aggregation**: Grouping multiple physical network interfaces into a single logical channel (NIC bonding) to increase bandwidth."
        },
        {
          text: "**Quality of Service (QoS)**: Prioritizing latency-sensitive traffic (like real-time voice) over standard data traffic."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 The Internet Protocol (IP) Suite",
      type: "header"
    },
    {
      text: "The TCP/IP model is the foundation of the Internet. It consolidates the OSI model into: Application, Transport, Internet, and Network Access. Key transport protocols include TCP (connection-oriented, reliable) and UDP (connectionless, low-overhead).",
      type: "text"
    },
    {
      items: [
        {
          text: "**Addressing**: IPv4 uses 32-bit addresses, causing address exhaustion. IPv6 uses 128-bit addresses, offering an inexhaustible address space."
        },
        {
          text: "**Translation**: NAT and PAT allow multiple private IP addresses to share a single public IP."
        },
        {
          text: "**Transition**: Moving from IPv4 to IPv6 involves dual-stack routing, tunneling, and translation (NAT64)."
        },
        {
          text: "**Mobile IP**: Enables mobile devices to roam across networks without changing their IP address, maintaining continuous sessions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Wireless and Mobile Networks",
      type: "header"
    },
    {
      text: "Wireless communications eliminate physical cables. They operate across:",
      type: "text"
    },
    {
      items: [
        {
          text: "**WPAN**: Small-range communication (e.g., Bluetooth)."
        },
        {
          text: "**WLAN**: Wireless LANs (e.g., Wi-Fi, IEEE 802.11)."
        },
        {
          text: "**WWAN**: Wireless WANs, including cellular networks.\nCellular networks divide geographical regions into cells, each served by a base station transceiver. Adjacent cells use different frequency bands to prevent interference, organized in geometric reuse patterns (typically hexagons). Multiple access technologies share the media:"
        },
        {
          text: "**FDMA**: Assigns distinct frequency channels to users."
        },
        {
          text: "**TDMA**: Divides a single frequency channel into time slots."
        },
        {
          text: "**CDMA**: Uses mathematical codes to separate multiple transmissions on the same frequency."
        },
        {
          text: "**SDMA**: Uses directional antennas to reuse spatial channels.\nCellular networks have evolved from 1G (analog voice) to 5G (ultra-low latency, and massive device concurrency)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.9 Security and Vulnerabilities",
      type: "header"
    },
    {
      text: "Wireless networks are highly vulnerable to intrusion, requiring strict countermeasures:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Attacks**: Common risks include piggybacking, wardriving, evil twin attacks, wireless sniffing, SMiShing, WEP/WPA attacks, bluejacking/bluesnarfing, and RF jamming."
        },
        {
          text: "**Mitigations**: Strong encryption standards (WPA3), changing default device credentials immediately, disabling SSID broadcasting, deploying VPNs, utilizing multi-factor authentication, enforcing zero-trust access, and applying security patches to gateways regularly."
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
          text: "**Network Typology Selection**: Has the network architecture been selected based on geographic or storage requirements (LAN, WAN, SAN, CAN, VPN)?"
        },
        {
          text: "**Protocol Boundary Definition**: Are the service, protocol, and interface definitions documented for each communication boundary?"
        },
        {
          text: "**OSI Layer Mapping**: Has the software application's communication path been mapped across the seven layers of the OSI model?"
        },
        {
          text: "**PDU Encapsulation Validation**: Have encapsulation and decapsulation boundaries been checked to ensure headers do not introduce excessive payload overhead?"
        },
        {
          text: "**Cross-Layer Optimization Rationale**: If cross-layer optimization is used, is there a documented engineering justification and coupling analysis?"
        },
        {
          text: "**Application Protocol Security**: Are standard application layer protocols (FTP, SMTP, Telnet) replaced by secure alternatives (SFTP, SMTP over TLS, SSH)?"
        },
        {
          text: "**Network Segmentation and VLANs**: Has the network been partitioned into subnets or VLANs to reduce broadcast domains and secure traffic?"
        },
        {
          text: "**DMZ Isolation**: Are public-facing nodes separated from internal databases and services via a Demilitarized Zone?"
        },
        {
          text: "**STP Loop Prevention**: If redundant physical switches are present, is Spanning Tree Protocol (STP) enabled and configured?"
        },
        {
          text: "**Link Aggregation and Failover**: Are critical network interfaces aggregated (NIC bonding) to support failover and prevent single points of failure?"
        },
        {
          text: "**QoS Implementation**: Is packet prioritization (QoS) configured for real-time and latency-sensitive traffic streams?"
        },
        {
          text: "**Transport Protocol Selection**: Has the choice between TCP (reliable, connection-oriented) and UDP (unreliable, connectionless) been evaluated for each service?"
        },
        {
          text: "**IPv6 Compatibility**: Has the system been tested to ensure compatibility with IPv6 addressing and routing?"
        },
        {
          text: "**NAT/PAT Translation Integrity**: Are NAT and PAT mechanisms configured to prevent port collision and secure internal IP structures?"
        },
        {
          text: "**IPv6 Transition Tactics**: If transitioning from IPv4, are dual-stack, tunneling, or NAT64 mechanisms documented and monitored?"
        },
        {
          text: "**Cellular & Wireless Frequency Check**: Does the wireless design account for cell frequency reuse and co-channel interference?"
        },
        {
          text: "**Wireless Access Hardening**: Are WPA3 encryption, SSID hiding, and custom administration passwords enforced on all wireless access points?"
        },
        {
          text: "**Mobile IP Handling**: If mobile roaming is required, does the application handle handoffs and packet delivery without losing session state?"
        },
        {
          text: "**Intrusion Countermeasures**: Are mitigations active for wardriving, evil twin, bluejacking, and RF jamming vulnerabilities?"
        },
        {
          text: "**Gateway Patching Lifecycle**: Is there an automated update and patching lifecycle established for all switches, routers, and gateway controllers?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "computer networks, layered architectures, OSI model, TCP/IP, wireless networks, network security, internet protocols, network design",
  filename: "computing-foundations-networks",
  trigger: "model_decision"
});
