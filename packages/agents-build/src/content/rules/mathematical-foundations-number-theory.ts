import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsNumberTheory = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations - Number Theory",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Number theory is a fundamental branch of pure mathematics that focuses on the properties and relationships of numbers, specifically whole numbers, integers, and rational numbers. In software engineering, as highlighted in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, Section 7, number theory provides the mathematical foundations for cryptography, error-detecting codes, hashing algorithms, and computer arithmetic. Understanding the core concepts of number theory is essential for designing secure, efficient, and numerically correct systems.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Number Systems and Types of Numbers",
      type: "header"
    },
    {
      text: "Number systems are classified into distinct categories, each serving unique analytical and computational purposes. Software engineers must understand these classifications to choose appropriate data types and prevent domain-related errors.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Natural Numbers**: Indicated by the mathematical symbol N, this set represents the positive counting numbers. In the historical SWEBOK context, natural numbers start at 1 and continue sequentially. However, in modern set-theoretic frameworks (such as von Neumann ordinals), the number 0 is often included. This dual definition requires engineers to be explicit about the lower bound of natural number domains in specifications."
        },
        {
          text: "**Whole Numbers**: This set expands the natural numbers by explicitly including the number 0. There are no negative or fractional elements in this set."
        },
        {
          text: "**Integers**: Represented by the symbol Z, this set encompasses all whole numbers and their negative counterparts. Integers are closed under addition, subtraction, and multiplication, making them the primary representation for discrete counters in digital computers."
        },
        {
          text: "**Rational Numbers**: Denoted by the symbol Q, rational numbers can be expressed as a ratio of two integers, a/b, where b is not zero. They are characterized by decimal representations that either terminate or repeat in a periodic pattern."
        },
        {
          text: "**Irrational Numbers**: These numbers cannot be expressed as a ratio of two integers. Their decimal representations are non-terminating and non-repeating. Classic examples include the square root of two and mathematical constants like pi."
        },
        {
          text: "**Real Numbers**: Represented by the symbol R, this set contains all rational and irrational numbers, forming the continuous real line used in calculus and physics engine modeling."
        },
        {
          text: "**Imaginary Numbers**: Built upon the imaginary unit i, defined as the square root of negative one. Any real number multiple of i represents an imaginary number."
        },
        {
          text: "**Complex Numbers**: Indicated by the symbol C, a complex number is a combination of a real part and an imaginary part, written in the form a + bi. Every real number is a complex number where the imaginary part is zero, and every imaginary number is a complex number where the real part is zero."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Divisibility and the Division Algorithm",
      type: "header"
    },
    {
      text: 'Divisibility forms the bedrock of elementary number theory. For two integers a and b, where a is non-zero, the expression "a divides b" (written as a|b) means that there exists an integer c such that b equals a times c. Under this definition, a is a factor or divisor of b, and b is a multiple of a. An integer is classified as even if and only if it is divisible by two.',
      type: "text"
    },
    {
      text: "The Division Algorithm guarantees that for any integer dividend a and positive integer divisor d, there exist unique integers q (the quotient) and r (the remainder) such that:\na = d * q + r, where 0 is less than or equal to r, and r is strictly less than d.",
      type: "text"
    },
    {
      text: "In computational systems, the modulo operation represents the remainder r. The remainder can be calculated using the floor function as:\n(a mod d) = a - d * floor(a / d)",
      type: "text"
    },
    {
      text: "This definition ensures that the remainder is always non-negative. However, because different programming languages implement the modulo and division operators differently for negative inputs, software engineers must carefully verify the mathematical consistency of remainder logic across diverse runtimes.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Modular Arithmetic and Congruence",
      type: "header"
    },
    {
      text: "Let m be a positive integer. Two integers a and b are congruent modulo m (written as a is congruent to b modulo m) if and only if m divides their difference, a - b. Alternatively, they are congruent if and only if the remainder of their difference divided by m is zero.",
      type: "text"
    },
    {
      text: "Congruence behaves as an equivalence relation, satisfying the properties of reflexivity, symmetry, and transitivity. Furthermore, it is compatible with integer addition and multiplication:\nIf a is congruent to b modulo m, and c is congruent to d modulo m, then:",
      type: "text"
    },
    {
      items: [
        {
          text: "(a + c) is congruent to (b + d) modulo m."
        },
        {
          text: "(a * c) is congruent to (b * d) modulo m."
        }
      ],
      type: "numberedList"
    },
    {
      text: "These algebraic properties enable modular arithmetic, which is used in software engineering for cyclic buffer indexing, hashing functions, checksum calculations, and digital signatures.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Prime and Composite Numbers",
      type: "header"
    },
    {
      text: "An integer p greater than one is prime if and only if its only positive divisors are 1 and p itself. An integer greater than one that is not prime is classified as a composite number. Composite numbers can be expressed as the product of two or more positive integers greater than one.",
      type: "text"
    },
    {
      text: "The Fundamental Theorem of Arithmetic states that every integer greater than one is either prime or can be represented uniquely as a product of prime numbers, up to the order of the factors. This unique factorization property is critical for cryptography and security schemes.",
      type: "text"
    },
    {
      text: "Prime numbers serve as the foundation of modern public-key cryptography. Cryptographic systems utilize the difficulty of factoring the product of two large, randomly selected prime numbers. While multiplying these primes is computationally cheap, reversing the operation to find the original prime factors is computationally infeasible for classical computers, ensuring data confidentiality and integrity.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Greatest Common Divisor and Coprimality",
      type: "header"
    },
    {
      text: "The greatest common divisor of two integers a and b, not both zero, is the largest integer d that divides both a and b. This is written as gcd(a, b). ",
      type: "text"
    },
    {
      text: "Two integers are coprime or relatively prime if and only if their greatest common divisor is one. A set of integers is pairwise coprime if every pair of integers selected from the set is relatively prime.",
      type: "text"
    },
    {
      text: "The Euclidean Algorithm is an efficient method for computing the greatest common divisor of two integers. It operates on the principle that the GCD of two integers also divides their difference. Iterative division is applied until the remainder becomes zero, at which point the last non-zero remainder represents the greatest common divisor. Bezout's Identity states that for any non-zero integers a and b, there exist integers s and t such that:\ns * a + t * b = gcd(a, b)",
      type: "text"
    },
    {
      text: "This identity is essential for calculating modular multiplicative inverses, which are required during key generation in public-key cryptography.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Number System Mapping**: Have the variables representing discrete entities been restricted to natural numbers or integers, rather than floating-point real numbers, to avoid precision errors?"
        },
        {
          text: "**Zero Inclusivity Definition**: Has the project specification defined whether the number zero is included in the domain of natural numbers to prevent off-by-one errors?"
        },
        {
          text: "**Negative Dividend Remainder Handling**: Does the implementation of the modulo operation explicitly handle negative dividends to ensure the remainder remains non-negative?"
        },
        {
          text: "**Division-by-Zero Protection**: Are there input validation checks in place to prevent the divisor from being zero in all division and modulo computations?"
        },
        {
          text: "**Congruence Equivalence Verification**: When using modular arithmetic for cyclic buffers, does the indexing logic correctly wrap around at the boundary without causing out-of-bounds errors?"
        },
        {
          text: "**Prime Generation Entropy**: Are the prime numbers used in cryptographic key generation sourced from a cryptographically secure pseudorandom number generator with high entropy?"
        },
        {
          text: "**Factorization Hardness Assumptions**: Have the lengths of the prime factors been audited to ensure they meet current industry standards for security against factorization attacks?"
        },
        {
          text: "**Euclidean Algorithm Bounds**: Does the GCD calculation utility incorporate limits on execution depth or time to prevent CPU resource exhaustion during malicious inputs?"
        },
        {
          text: "**Modular Inverse Existence**: Before calculating a modular multiplicative inverse, does the system verify that the target integer and the modulo are coprime?"
        },
        {
          text: "**Overflow Prevention in Modular Arithmetic**: Are intermediate multiplication steps in modular equations protected against integer overflow (e.g., by using arbitrary-precision arithmetic or larger integer types)?"
        },
        {
          text: "**Hashing Prime Selection**: Are the hash table sizes and prime multipliers selected to minimize collisions based on distribution characteristics?"
        },
        {
          text: "**Linear Congruential Generator Auditing**: If LCGs are used for non-security simulations, have the multiplier and increment constants been verified to yield a maximal period?"
        },
        {
          text: "**Rational Fraction Reduction**: When representing fractions using rational number structures, does the library automatically reduce them to their lowest terms using the greatest common divisor?"
        },
        {
          text: "**Real-to-Integer Rounding Strategy**: Is the rounding strategy (floor, ceiling, truncation) documented when converting real number outputs to integer values?"
        },
        {
          text: "**Coprimality Verification for Cyclic Sequences**: When generating pseudo-random sequences or array strides, are the stride size and the array length coprime to ensure complete traversal?"
        },
        {
          text: "**Complex Number Part Handling**: When interacting with libraries that return complex values, does the application safely handle or isolate the imaginary component?"
        },
        {
          text: "**Key Factorization Safety Audit**: Does the public-key infrastructure regularly review the product of the keys to verify that no public primes are shared across separate key pairs?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "number theory, prime numbers, divisibility, congruence, greatest common divisor",
  filename: "mathematical-foundations-number-theory",
  trigger: "model_decision"
});
