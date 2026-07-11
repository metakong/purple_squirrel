# **Architectural Specification for AI-Native Repositories: The Sovereign Agent Repository Standard**

## **The Universal Template**

The transition from human-centric code repositories to environments designed for collaborative human-agent development requires a fundamental restructuring of source-tree layouts1. Historically, repository structures were optimized to fit human cognitive limits, relying on nested directory structures, implicit configuration inheritance, and loose textual descriptions1. For autonomous agents, these configurations introduce high exploratory overhead2. Runtimes such as the Linux Foundation's Agentic AI Foundation (AAIF) Goose agent, Claude Code, and OpenAI Codex consume critical context tokens performing iterative directory traversals, inferring build commands, and resolving conflicting style guides3.  
To maximize agent performance and minimize token execution waste, repositories must adopt a standardized layout that separates human-readable documentation from machine-parsable configuration1. This architecture optimizes the token utility ratio (![][image1]), defined as:  
![][image2]  
where ![][image3] represents the utility value of successful tool execution, ![][image4] is the context token-consumption cost, and ![][image5] is the latency-based execution friction3. The layout limits the agent's exploratory overhead by placing machine-parsable directives directly at standard entry points, enabling the agent to skip exploratory directory searches and act directly on code targets2.

### **Context File Taxonomy & Structural Purpose**

The repository standard enforces the use of four distinct architectural files placed at specific nodes within the file tree6. These files govern different operational phases of agent interaction, ensuring that prompt contexts are limited to relevant details2.

| Context File | Location | Machine Parsing Target | Operational Domain | Update Trigger |
| :---- | :---- | :---- | :---- | :---- |
| AGENTS.md \[cite: 6, 9\] | Repository Root | Host Agent Boot Loader2 | General execution commands, testing harnesses, linter constraints, and structural boundaries3. | Modification of tooling, build steps, or global contribution boundaries2. |
| CLAUDE.md \[cite: 3, 7\] | Repository Root | Anthropic Claude Code Client3 | Local environment context, high-level design rationales, and tool-specific hooks7. | Strategic architectural shifts or workspace environmental updates7. |
| FIRST\_PRINCIPLES.md \[cite: 8, 12\] | .agent/ Core Directory | Reasoning Model Pre-flight Engine13 | Fundamental physical, mathematical, and logical invariants of the application layer12. | Core design pattern migrations or changes to domain-invariant models8. |
| SKILL.md \[cite: 3, 15\] | .agent/skills/\[skill-name\]/ | Discovery and Skill-Selection Engine15 | Encapsulated, task-specific workflow instructions, parameters, and executable orchestration scripts16. | Integration of new automated capabilities or changes to specialized execution flows16. |

### **Rationale for Directory Separation**

A major source of agent execution failure is the intermingling of unstructured human documentation with strict system instructions1. The Standard resolves this by isolating /docs from /governance18. The /docs folder is allocated exclusively for human consumption, containing conceptual overviews, design histories, and API documentations1. This prevents agents from loading large, non-operational prose files into their active context window, which can cause model confusion and increase token costs2.  
Conversely, the /governance directory contains strict, machine-enforceable rules, such as AGENTS.policy.json and Open Policy Agent (OPA) templates18. These files define the precise conditions under which an agent can make changes, compile code, or call external APIs18.  
The .agent/ directory functions as an isolated system partition for machine-native metadata, containing FIRST\_PRINCIPLES.md and custom agent skills3. The main AGENTS.md file in the repository root serves as the global entry point, providing the runtime with a high-level map of directory structures, build environments, and file-access boundaries3.  
This standard scales to large monorepos using a hierarchical nesting model1. Subdirectories (such as packages/api/ and packages/database/) contain localized AGENTS.md files9. Runtimes operating inside these directories resolve conflicts by giving precedence to the nearest file in the directory tree1. This limits the active token context window and enforces local policies over global defaults1.  
To maintain a single source of truth across diverse development tools, client-specific configuration files like CLAUDE.md must be configured as thin redirect adapters using imports (e.g., @AGENTS.md), pointing back to the root AGENTS.md file3. This setup prevents instruction drift across different toolsets3.

## **The "5-Year Forward" View: Unsupervised Contribution**

The standard code layout must remain resilient as development workflows transition from "Agent-as-Co-pilot" (where human developers drive the execution loop) to "Agent-as-Autonomous-Contributor" (where decentralized agent networks operate with zero human intervention)13. This evolution requires robust repository mechanisms to manage machine-to-machine coordination, enforce security parameters, and persist execution states across disconnected systems20.

### **Agent-to-Agent (A2A) Interoperability**

Autonomous repository contributions require secure communication between specialized, modular agents26. Under the Linux Foundation’s Agent-to-Agent (A2A) protocol, repositories expose their capabilities via a standardized Agent Card stored at .well-known/agent.json29. This JSON schema defines the agent's identity, supported communication models, available skills, and authorization constraints25.  
By publishing these cards, an inbound SRE agent can discover, negotiate, and delegate a security audit to an internal Security Agent within the same repository environment25. This interaction occurs via A2A gateways—such as AgentGateway—which manage the transport layers (HTTP, JSON-RPC, or gRPC) and handle secure, asynchronous push notifications for long-running workflows24.  
The standard A2A data model structures these interactions into clear, trackable entities23:

* **Task**: Represents a unit of work with an assigned ID and state tracking (submitted, working, input-required, completed, failed)30.  
* **Message**: A communication exchange containing multiple structured content pieces (such as prompts or status updates)30.  
* **Part**: The underlying content of a message, classified by data type (e.g., TextPart, FilePart, or structured DataPart)30.  
* **Artifact**: The final output payload of a task, containing the generated code changes, review metrics, or compiled packages30.

### **Policy-as-Code for Agents**

To prevent security failures and unauthorized environment modifications, agent capabilities must be governed by dynamic runtime constraints18. Traditional operating system-level file permissions cannot distinguish between a benign dependency update and a malicious code injection22. Repositories must enforce Policy-as-Code at the agent identity layer, defining three distinct tiers of execution authority20:

* **Tier 1 (Autonomous)**: Operations the agent may execute without confirmation, such as formatting code, running local unit tests, and reading non-sensitive source files20.  
* **Tier 2 (Conditional)**: Actions requiring a human gate or external cryptographic verification, such as modifying infrastructure configurations, updating root package lockfiles, and invoking remote web APIs20.  
* **Tier 3 (Blocked)**: Prohibited operations, including direct commits to production branches, modification of the .well-known/ or /governance directories, and clear-text extraction of environment secrets18.

These policies are declared statically in /governance/AGENTS.policy.json and evaluated at runtime by proxy data planes like AgentGateway18. Using the Common Expression Language (CEL), these gateways intercept and validate every filesystem call, command execution, and remote tool access request before forwarding it to the target backend24. The gate probability ![][image6] is calculated as:  
![][image7]  
where ![][image8] is the proposed action, ![][image9] is the current system state, and ![][image10] is the constitutional parameter vector defined in the repository policy configuration13.

┌─────────────────┐     File Operation / Command     ┌──────────────────────┐  
│  AI Coding Unit │ ───────────────────────────────\> │  agent-guard.sh (CI) │  
└─────────────────┘                                  └──────────────────────┘  
         │                                                      │  
         │ (gRPC / JSON-RPC Tools)                              │ OPA Static Check  
         ▼                                                      ▼  
┌──────────────────┐      CEL Evaluation Phase       ┌──────────────────────┐  
│  AgentGateway    │ ───────────────────────────────\> │  AGENTS.policy.json  │  
└──────────────────┘  \[Allow / Deny / Human Gate\]    └──────────────────────┘

### **Modular State Management**

The transition to highly collaborative, multi-agent pipelines requires state engines that can resume operations after crashes, network drops, or human approval delays39. Legacy session-locked execution flows, which store conversational and operational states in-memory, do not scale across decentralized systems41. To resolve this, state management is decoupled from the execution runtime using two primary models40:

| Architectural Metric | LangGraph (Epoch-Based) | Mastra (Signal-Based) |
| :---- | :---- | :---- |
| **Persistence Mechanism** | Node-level serialized state checkpointers (e.g., SQLite, Postgres)40. | Thread-scoped persistent memory stores (e.g., LibSQL database)47. |
| **State Transition Logic** | Explicit execution graphs with defined transitions40. | Async signal delivery to thread-scoped state lanes45. |
| **Recovery Model** | Restores state from the last completed node checkpoint40. | Resumes execution context when thread signal updates are received41. |
| **Latency Overhead** | Higher, due to sequential database write operations at each node40. | Lower, utilizing in-memory caching and thread-scoped signal processing42. |

## **Novel Architectural Integration**

To coordinate multi-agent systems and provide comprehensive system visibility, the Standard introduces two novel patterns: the Standardized Agentic Heartbeat Protocol (HEARTBEAT.json) and the Standardized OpenTelemetry-Agent Traceability (OT-AT) Log Format.

### **Standardized Agentic Heartbeat Protocol**

Multi-agent collaboration within a single repository environment requires a mechanism to prevent file modification conflicts, coordinate parallel subtasks, and track the overall health of active sessions28. The HEARTBEAT.json file is a machine-parsable execution lock and coordination ledger placed dynamically inside the repository root during active agent sessions47.

JSON  
{  
  "$schema": "https://aaif.io/schemas/v1/heartbeat.schema.json",  
  "sessionId": "hbt-90210-2026-07-28",  
  "orchestrator": "io.github.aaif-goose.core-cli",  
  "timestamp": "2026-07-28T15:04:05Z",  
  "status": "converging",  
  "activeAgents": \[  
    {  
      "agentId": "api-writer-01",  
      "role": "contributor",  
      "pid": 48122,  
      "stateLane": "packages/api/src/routes/auth.ts",  
      "exclusiveLocks": \[  
        "packages/api/src/routes/auth.ts"  
      \],  
      "lastActive": "2026-07-28T15:03:59Z"  
    },  
    {  
      "agentId": "test-runner-02",  
      "role": "validator",  
      "pid": 48125,  
      "stateLane": "packages/api/tests/auth.test.ts",  
      "exclusiveLocks": \[\],  
      "lastActive": "2026-07-28T15:04:02Z"  
    }  
  \],  
  "taskQueue": {  
    "pending": \[  
      {  
        "taskId": "task-refactor-jwt",  
        "assignedTo": "api-writer-01",  
        "dependencies": \[\]  
      }  
    \],  
    "completed": \[  
      {  
        "taskId": "task-lint-schema",  
        "completedBy": "test-runner-02"  
      }  
    \]  
  },  
  "conformanceEnvelope": {  
    "strictBoundaries": true,  
    "allowedToolcalls": \[  
      "read",  
      "edit",  
      "shell"  
    \]  
  }  
}

This heartbeat file enables real-time synchronization48. By reading HEARTBEAT.json before any write operation, independent runtimes avoid file-system race conditions and partition code refactoring tasks effectively18.

### **Standardized OpenTelemetry-Agent Traceability**

Traditional application monitoring lacks the vocabulary required to trace agentic decisions, prompt evaluations, and tool calls5. The OT-AT Log Format extends the OpenTelemetry GenAI (v1.41.0) and MCP (v1.39.0) semantic conventions to trace agent completions, prompt versions, token counts, and cost metrics5.

JSON  
{  
  "resource": {  
    "attributes": {  
      "service.name": "repo-agentic-pipeline",  
      "service.version": "1.42.0",  
      "telemetry.sdk.language": "rust"  
    }  
  },  
  "scopeSpans": \[  
    {  
      "scope": {  
        "name": "otel.mcp.client",  
        "version": "1.39.0"  
      },  
      "spans": \[  
        {  
          "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",  
          "spanId": "00f067aa0ba902b7",  
          "parentSpanId": "5fb397be34d23b0f",  
          "name": "execute\_tool.db\_migration",  
          "kind": "SPAN\_KIND\_CLIENT",  
          "startTimeUnixNano": 1782659045000000000,  
          "endTimeUnixNano": 1782659046200000000,  
          "attributes": \[  
            { "key": "gen\_ai.operation.name", "value": { "stringValue": "execute\_tool" } },  
            { "key": "gen\_ai.agent.name", "value": { "stringValue": "db\_migrator" } },  
            { "key": "mcp.server.name", "value": { "stringValue": "postgres-mcp-server" } },  
            { "key": "mcp.tool.name", "value": { "stringValue": "run\_migration" } },  
            { "key": "mcp.tool.arguments", "value": { "stringValue": "{\\"file\\": \\"001\_auth.sql\\"}" } },  
            { "key": "gen\_ai.usage.input\_tokens", "value": { "intValue": 1420 } },  
            { "key": "gen\_ai.usage.output\_tokens", "value": { "intValue": 280 } },  
            { "key": "gen\_ai.client.token.cost", "value": { "doubleValue": 0.0034 } },  
            { "key": "agent.evaluation.groundedness", "value": { "doubleValue": 0.98 } },  
            { "key": "agent.evaluation.faithfulness", "value": { "doubleValue": 1.0 } },  
            { "key": "agent.tool.success\_rate", "value": { "doubleValue": 1.0 } }  
          \],  
          "status": {  
            "code": "STATUS\_CODE\_OK"  
          }  
        }  
      \]  
    }  
  \]  
}

This trace standard maps the relationship between agent decisions and technical execution metrics5. Collecting evaluating attributes (groundedness, faithfulness, and success\_rate) alongside standard telemetry enables platform engineers to quickly identify and fix runaway loops or failing tool calls5.  
This telemetry model structures distributed traces to reveal the exact lineage of every execution loop5:

User Intent  
  │  
  └── \[invoke\_agent\] ──\> (Agent Controller)  
         │  
         ├── \[chat.evaluate\] ──\> (Inference Server)  
         │  
         └── \[execute\_tool\] ──\> (Local/Remote MCP Server) \[cite: 51\]  
                │  
                └── \[db\_migration\] ──\> (Postgres Target Server)

## **Operational Constraints & Constitutional Rules**

To control execution unpredictability and align autonomous contributions with repository standards, repositories must enforce specific "Constitutional" rules13. These rules prevent "agent-drift"—the decay of agent alignment over multi-turn cycles when an agent prioritizes quick task completion over the project's long-term architecture13.

### **Mitigating Agent-Drift: Case-Based Reasoning vs. Probabilistic Guessing**

Agent-drift occurs when runtimes rely on probabilistic guesses to infer build pipelines and code styles3. When given vague instructions (e.g., "follow clean code standards"), agents default to average patterns found in their pre-training data, introducing conflicting patterns into the repository3.  
To eliminate this behavioral variance, repositories must implement Case-Based Reasoning (CBR) patterns35. Under a CBR pattern, agents do not guess how to structure an implementation; instead, they retrieve explicit, verified patterns directly from the repository's configuration artifacts (AGENTS.md and FIRST\_PRINCIPLES.md) and apply them deterministically3.

### **Global Constitutional Rules: Root AGENTS.md**

The global AGENTS.md file must be authored by the human engineering team, kept under 300 lines to preserve the context budget, and structured with clear, imperative instructions2. It must define instructions across six mandatory domains3:

#### **Build & Test Commands**

Commands must be declared with explicit, exact flags2. General references are prohibited2.

## **Build & Test Commands**

* Build: pnpm dlx turbo run build \--filter=@repo/api  
* Test: pnpm run test:unit \--run \--project=api  
* Lint: pnpm run lint \--fix  
* Type-Check: pnpm run type-check

#### **Code Style Conventions**

Coding rules must be demonstrated using code examples10. Complex written instructions should be avoided10.

## **Code Style Conventions**

* Let errors propagate. Do not wrap individual database calls in try/catch.  
* TypeScript Naming: Use strict camelCase for variables and PascalCase for types.  
* Example Pattern:typescript // CORRECT async function getUser(id: string): Promise { const user \= await db.users.findById(id); return user; }

\#\#\#\# Git Workflow

Prerequisites for commits and pull requests must be explicitly declared.

\#\# Git Workflow  
\- Always branch from \`main\`. Prefix branches with \`feat/\`, \`fix/\`, or \`chore/\`.  
\- Commit messages must follow Conventional Commits (e.g., \`feat: integrate billing endpoint\`).  
\- Run \`pnpm run pre-commit\` before pushing.

\#\#\#\# Boundaries

Directories and patterns that the agent is strictly prohibited from modifying must be clearly defined \[cite: 2, 3, 10\].

\#\# Boundaries  
\- NEVER modify or delete files under \`.github/workflows/\` or \`infra/production/\`.  
\- DO NOT manually edit \`pnpm-lock.yaml\`. Use \`pnpm install\` for dependency updates.  
\- NEVER alter \`.env\` or inject hardcoded credentials.

\#\#\#\# Skeptical Memory Directive

To prevent failures from incorrect code references, the agent must verify files on-disk before acting \[cite: 49\].

\#\# Skeptical Memory  
\- Never assume a file exists or matches a specific structure.  
\- Always use \`ls\`, \`ripgrep\`, or \`cat\` to inspect files before editing \[cite: 49\].

\#\#\#\# Execution Failure Directive

To prevent infinite execution loops, agents must fail fast when stuck \[cite: 49\].

\#\# Execution Failure Loop Control  
\- If a compilation or test run fails with the same error more than 3 consecutive times, abort the operation \[cite: 49\].  
\- Export the error log to \`/governance/errors.log\` and await human intervention.

\#\#\# Domain-Invariant Constraints: \`.agent/FIRST\_PRINCIPLES.md\`

While \`AGENTS.md\` governs development tools, environments, and workflows, \`FIRST\_PRINCIPLES.md\` controls the core conceptual rules of the application \[cite: 8, 12, 54\]. This file defines the permanent mathematical, architectural, and logical rules that cannot be bypassed, regardless of tooling updates \[cite: 12\]. It structure includes:

\#\#\#\# Core Domain Invariants

\#\# Domain Invariants  
\- Thread-Safety: The API must run as a stateless, horizontally scalable process.  
\- Clock Invariant: Never use local machine system time (\`new Date()\`). Use the unified clock provider (\`src/core/clock.ts\`) to ensure test consistency.  
\- Multi-Tenancy Boundary: Every query must filter explicitly on the tenant isolation ID.

\#\#\#\# Architectural Decompositions

\#\# Architectural Decomposition (STCI Model)  
\- State: Persistence must occur through isolated database transaction handlers \[cite: 14\].  
\- Time: Asynchronous operations must use deterministic, event-driven queues with retry limits \[cite: 14\].  
\- Coordination: Distributed locks must utilize Redis with a maximum ttl of 5000ms \[cite: 14\].  
\- Interface: Public API endpoints must enforce strict input contract validation using Zod \[cite: 14, 55\].

\---

\#\# Standardization & Framework Harmonization

To maximize runtime compatibility across development environments, this repository standard aligns strictly with the official specifications of the Linux Foundation’s Agentic AI Foundation (AAIF) while incorporating key architectural innovations from tertiary ecosystems \[cite: 4, 56\].

\#\#\# The Stateless Model Context Protocol (RC 2026-07-28)

The Model Context Protocol (MCP) underwent its most significant transition in July 2026, shifting to a stateless model at the protocol layer to improve performance and horizontal scalability \[cite: 43, 57\]. This stateless paradigm relies on several Specification Enhancement Proposals (SEPs) to remove connection overhead and enhance system reliability \[cite: 43, 57\]:

\*   \*\*Removal of Sticky Handshakes (SEP-2575 & SEP-2567)\*\*: The legacy \`initialize\` handshake and \`Mcp-Session-Id\` header are removed \[cite: 43, 57\]. Capabilities are now queried dynamically via \`/discover\` \[cite: 43, 58\]. Session and version information are passed within the \`\_meta\` field of each individual request, allowing load balancers to route requests to any available server instance without maintaining state \[cite: 43, 57, 59\].  
\*   \*\*Routable Transport Headers (SEP-2243)\*\*: Every HTTP request must carry explicit headers defining the action, such as \`Mcp-Method: tools/call\` and \`Mcp-Name: get\_weather\` \[cite: 57, 60\]. This allows API gateways to route, validate, and rate-limit calls at the transport layer without reading the underlying request body \[cite: 43, 57\].  
\*   \*\*Multi-Round Trip Requests (SEP-2322)\*\*: Long-running tool calls that require human approvals or additional parameters no longer block the connection \[cite: 43, 57\]. Instead of holding streams open, servers return an \`InputRequiredResult\` \[cite: 43, 57\]. The client collects the missing information and retries the stateless call \[cite: 43, 57\].  
\*   \*\*Trace Propagation (SEP-414)\*\*: W3C Trace Context propagation is integrated natively into the protocol metadata (\`\_meta\`), enabling seamless distributed tracing across hosts, clients, and backends \[cite: 43\].

\#\#\# Resolving Capability Gaps via Tertiary Innovations

While the official AAIF specifications define standard communication and connectivity layers, they lack complete runtimes for advanced orchestration, secure local execution, and priority event handling \[cite: 56, 61\]. Repositories use specialized open-source frameworks to bridge these operational gaps \[cite: 39, 62\]:

\#\#\#\# Persistent Execution Environments (Mastra Workspaces)

The Goose local sandbox runs commands in a basic shell environment \[cite: 49, 63\]. To provide a more robust execution space, developers integrate Mastra Workspaces, which pair a \`LocalFilesystem\` with a secure, sandboxed command runner \[cite: 64\]. This setup ensures that file access and command execution are restricted to the repository workspace path \[cite: 64, 65\].

\#\#\#\# Event-Driven Triggers & Prioritization (Mastra Signals)

The stateless nature of MCP limits an agent's ability to react to sudden external issues, such as database crashes or CI build failures \[cite: 43, 47\]. Repositories integrate Mastra’s Signal and Notification Inbox systems to handle these events. External webhooks map events into structured notifications with assigned priorities \[cite: 41, 47\]. The delivery policy then decides the immediate execution impact: urgent events wake the agent and trigger automated fixes, while low-priority notifications are saved in an inbox for later review.

\#\#\#\# Cyclic Logic & Verification Guards (LangGraph)

Simple tool-calling loops can enter repetitive execution states when encountering complex bugs \[cite: 40, 49\]. Incorporating LangGraph nodes into validation workflows enforces cyclic verification loops. These loops force agents to analyze failures, update their context state, and run tests iteratively until the implementation passes all linter and test suite assertions \[cite: 6, 40, 46\].

\#\#\# Unified Multi-Agent Architectural Stack Matrix

The standardization standard coordinates these technologies into a single integrated architecture, with each component mapped to its specific operational layer \[cite: 24, 39, 40, 43\].

| Architectural Layer | Goose/AAIF Standard | AgentGateway Proxy | Mastra Framework | LangGraph Engine |  
| :--- | :--- | :--- | :--- | :--- |  
| \*\*Connectivity & Tools\*\* | Core MCP Client runtime for local tool discovery \[cite: 4, 48\]. | Aggregates and federates multiple MCP tool servers behind one endpoint \[cite: 24, 66\]. | Authors custom MCP servers using Standard Schema validation \[cite: 39, 57\]. | Executes custom tools decorated via standard langchain components \[cite: 67\]. |  
| \*\*Interoperability (A2A)\*\* | Implements Agent Client Protocol (ACP) server modes \[cite: 48\]. | Routes, secures, and audits multi-framework A2A requests \[cite: 24\]. | Provides native platform endpoints for agent integrations \[cite: 39, 68\]. | Integrates LangGraph agents as nodes inside parent orchestration graphs \[cite: 44, 46\]. |  
| \*\*Observability\*\* | Exports trace events to OTLP endpoints \[cite: 69\]. | Records logs, metrics, and trace spans per tool call \[cite: 24, 56\]. | Redacts sensitive data before exporting metrics and traces \[cite: 39, 40\]. | Integrates with LangSmith for deep, graphical run visualisations \[cite: 40, 70\]. |  
| \*\*Access Control (RBAC)\*\* | Manages basic tool level confirm options \[cite: 48, 69\]. | Enforces fine-grained CEL policies based on user JWT claims \[cite: 24, 38\]. | Restricts agent permissions via WorkOS AuthKit RBAC rules \[cite: 71\]. | Suspends execution paths using human-in-the-loop interrupts. |

\---

\#\# Complete Canonical Directory Tree

This visual layout defines the standardized directory and configuration tree for high-performance, agentic-native repositories \[cite: 10, 72, 73\].

. ├── .agent/ \# Machine-Native Environment Partition3 │ ├── skills/ \# Encapsulated Skill Packs3 │ │ └── api-generator/ \# Modular Skill Package15 │ │ ├── SKILL.md \# Skill Instructions & Metadata Frontmatter15 │ │ └── generate-route.sh \# Executable workflow orchestration script15 │ ├── FIRST\_PRINCIPLES.md \# Conceptual Domain Invariants & Logic Constraints8 │ └── HEARTBEAT.json \# Dynamic session lock and active task queue48 ├── .github/ │ └── workflows/ \# Continuous Integration Pipelines6 │ └── ci.yml \# Automated build validation and policy testing6 ├── docs/ \# Human-Centric Technical Documentation1 │ └── architecture.md \# System overview and architectural diagrams1 ├── governance/ \# Operational Security Controls & Policies18 │ ├── AGENTS.policy.json \# Programmatic file write and command execution rules18 │ └── opa/ \# Open Policy Agent Policies20 │ └── filesystem.rego \# Strict authorization boundaries for changes20 ├── packages/ \# Monorepo Workspace Packages1 │ ├── api/ \# Backend API Service (Express/TypeScript)18 │ │ ├── src/ │ │ │ └── routes/ │ │ │ └── auth.ts \# Target Authentication Routes65 │ │ ├── tests/ │ │ │ └── auth.test.ts \# Local Unit Tests6 │ │ ├── AGENTS.md \# Nested boundary instructions (takes local priority)1 │ │ └── package.json \# Local package configuration73 │ └── database/ \# Database Migration & Schema Definitions10 │ ├── migrations/ \# Automated DB Schema Migrations10 │ │ └── 001\_auth.sql \# Generated SQL Script10 │ └── AGENTS.md \# Nested Database Access Rules1 ├── .env.example \# Template for environment variables71 ├── .goosehints \# Project-specific hints overriding Goose defaults76 ├── agentgateway.yaml \# Standalone config for routing, tools, and A2A gateway24 ├── AGENTS.md \# Universal Agent Guide (root level entry point)3 ├── CLAUDE.md \# Claude Code environment context and hooks3 ├── langgraph.json \# Deployment configuration for StateGraph routing44 └── pnpm-workspace.yaml \# Monorepo packages layout configuration3

\---

\#\# Architectural Rationale for Directory Placement

The structural nodes within this visual layout are placed systematically to ensure high parsing speed and clear separation of execution concerns:

\*   \*\*\`.agent/\`\*\*: Serves as the system partition for autonomous execution and reasoning guides. By keeping machine instructions isolated from human document paths, it ensures clean token parsing.  
\*   \*\*\`.agent/skills/\`\*\*: Houses self-contained agentic capabilities following the progressive disclosure standard. The parent runtime reads only the YAML frontmatter of \`SKILL.md\` during startup, loading the complete workflow instructions and local scripts into active memory only when a user task explicitly triggers the skill.  
\*   \*\*\`.agent/FIRST\_PRINCIPLES.md\`\*\*: Declares the permanent architectural rules of the codebase. It functions as a pre-flight reasoning check, forcing models to verify physical, logical, or mathematical facts before generating code \[cite: 12, 13, 14\].  
\*   \*\*\`.agent/HEARTBEAT.json\`\*\*: Acts as a dynamic synchronization ledger. It prevents file conflicts, coordinates parallel subtasks, and tracks the health of active agent loops in the workspace \[cite: 28, 49\].  
\*   \*\*\`docs/\`\*\*: Reserved exclusively for high-level human documentation. Keeping this directory separated prevents agents from loading descriptive, conversational text into their active memory, saving token budget.  
\*   \*\*\`governance/\`\*\*: Contains strict, programmatic policies (such as \`AGENTS.policy.json\` and Rego rules) evaluated at compile or gateway runtimes. This separates written instructions from enforceable security boundaries.  
\*   \*\*\`packages/\`\*\*: Standard monorepo workspaces containing modular, isolated packages.  
\*   \*\*\`packages/api/AGENTS.md\`\*\*: A localized instructions file that overrides the root \`AGENTS.md\` rules. When an agent enters the \`/packages/api\` workspace, the local linter paths and build targets take priority, preventing policy conflicts \[cite: 1, 18, 19\].  
\*   \*\*\`.goosehints\`\*\*: Configures the local AAIF Goose agent, defining path overrides and behavior rules specific to the workspace.  
\*   \*\*\`agentgateway.yaml\`\*\*: Configures the localized AgentGateway instance to manage API authentication, route LLM traffic, federate MCP servers, and handle secure A2A discovery.  
\*   \*\*\`AGENTS.md\`\*\*: The universal root guide for AI agents \[cite: 3, 6\]. It defines build pipelines, testing suites, code formatting rules, and strict file boundaries.  
\*   \*\*\`CLAUDE.md\`\*\*: Dedicated adapter file parsed by Anthropic Claude Code, optimizing the development workspace using tool-specific imports and local development commands.  
\*   \*\*\`langgraph.json\`\*\*: Orchestrates state graphs, defining the transition nodes, subgraphs, dependencies, and environment variables used by LangGraph \[cite: 44, 46\].

#### **Works cited**

1. AGENTS.md, [https://agents.md/](https://agents.md/)  
2. The Agent-Native Repo: Why AGENTS.MD is the New Standard | Harness Blog, [https://www.harness.io/blog/the-agent-native-repo-why-agents-md-is-the-new-standard](https://www.harness.io/blog/the-agent-native-repo-why-agents-md-is-the-new-standard)  
3. AGENTS.md Spec (2026): Recommended Sections \+ AGENTS.md vs CLAUDE.md vs .cursorrules \- MorphLLM, [https://www.morphllm.com/agents-md-guide](https://www.morphllm.com/agents-md-guide)  
4. GitHub \- aaif-goose/goose: an open source, extensible AI agent that goes beyond code suggestions \- install, execute, edit, and test with any LLM, [https://github.com/aaif-goose/goose](https://github.com/aaif-goose/goose)  
5. Which Telemetry Signals Matter Most for OpenTelemetry Agents | Fiddler AI Blog, [https://www.fiddler.ai/blog/opentelemetry-agent-telemetry-signals](https://www.fiddler.ai/blog/opentelemetry-agent-telemetry-signals)  
6. AGENTS.md — a simple, open format for guiding coding agents \- GitHub, [https://github.com/agentsmd/agents.md](https://github.com/agentsmd/agents.md)  
7. Constitution vs AGENTS.md, copilot-instructions.md, CLAUDE.md, etc \#2476 \- GitHub, [https://github.com/github/spec-kit/discussions/2476](https://github.com/github/spec-kit/discussions/2476)  
8. genie\_sim/source/AGENTS.md at main \- GitHub, [https://github.com/AgibotTech/genie\_sim/blob/main/source/AGENTS.md](https://github.com/AgibotTech/genie_sim/blob/main/source/AGENTS.md)  
9. Agents.md best practices \- GitHub Gist, [https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e](https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e)  
10. Lesson 16: AGENTS.md \- giving agents project context \- Addy Osmani, [https://addyosmani.com/agents/15-agents-md/](https://addyosmani.com/agents/15-agents-md/)  
11. AGENTS.md Best Practices: Template and Guide (2026) \- BetterClaw, [https://www.betterclaw.io/blog/agents-md-best-practices](https://www.betterclaw.io/blog/agents-md-best-practices)  
12. ShowenV2/FIRST\_PRINCIPLES.md at d4ef14e7948c65719e46233adba5f287bd7e50b8 \- Pulsareon \- AI 消费电子与嵌入式软硬件, [http://git.pulsareon.com/pulsareon/ShowenV2/src/commit/d4ef14e7948c65719e46233adba5f287bd7e50b8/FIRST\_PRINCIPLES.md?display=source](http://git.pulsareon.com/pulsareon/ShowenV2/src/commit/d4ef14e7948c65719e46233adba5f287bd7e50b8/FIRST_PRINCIPLES.md?display=source)  
13. A Multi-Layered Framework for Behavioral Governance of Non-Deterministic AI Agents \- Technical Disclosure Commons, [https://www.tdcommons.org/cgi/viewcontent.cgi?article=10901\&context=dpubs\_series](https://www.tdcommons.org/cgi/viewcontent.cgi?article=10901&context=dpubs_series)  
14. GitHub \- SNL-UCSB/literature-survey-skill: A Claude Code skill that takes PhD students from a pile of papers to a synthesized understanding of what the field knows, what it doesn't, and where to push next. Intent → Triage → Deepen → Synthesize., [https://github.com/SNL-UCSB/literature-survey-skill](https://github.com/SNL-UCSB/literature-survey-skill)  
15. Agent Skills | Microsoft Learn, [https://learn.microsoft.com/en-us/agent-framework/agents/skills](https://learn.microsoft.com/en-us/agent-framework/agents/skills)  
16. Skill Registry overview | Gemini Enterprise Agent Platform | Google Cloud Documentation, [https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/skill-registry](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/skill-registry)  
17. The SKILL.md Pattern: How to Write AI Agent Skills That Actually Work | by Bibek Poudel, [https://bibek-poudel.medium.com/the-skill-md-pattern-how-to-write-ai-agent-skills-that-actually-work-72a3169dd7ee](https://bibek-poudel.medium.com/the-skill-md-pattern-how-to-write-ai-agent-skills-that-actually-work-72a3169dd7ee)  
18. Governing AI Agents in Codebases Like a Linter \- DEV Community, [https://dev.to/serifcolakel/governing-ai-agents-in-codebases-like-a-linter-2g6o](https://dev.to/serifcolakel/governing-ai-agents-in-codebases-like-a-linter-2g6o)  
19. Governing AI Agents in Codebases Like a Linter | by Serif Colakel | Jun, 2026 \- Medium, [https://medium.com/@serifcolakel/governing-ai-agents-in-codebases-like-a-linter-62d23b239d39](https://medium.com/@serifcolakel/governing-ai-agents-in-codebases-like-a-linter-62d23b239d39)  
20. AI agent governance: A framework for engineering leaders \- CodeRabbit, [https://www.coderabbit.ai/guides/ai-agent-governance](https://www.coderabbit.ai/guides/ai-agent-governance)  
21. agent-spec/AGENTS.md at main · oracle/agent-spec \- GitHub, [https://github.com/oracle/agent-spec/blob/main/AGENTS.md](https://github.com/oracle/agent-spec/blob/main/AGENTS.md)  
22. Is anyone actually enforcing AI governance, or just writing policies? \- Reddit, [https://www.reddit.com/r/AI\_Agents/comments/1t70lnk/is\_anyone\_actually\_enforcing\_ai\_governance\_or/](https://www.reddit.com/r/AI_Agents/comments/1t70lnk/is_anyone_actually_enforcing_ai_governance_or/)  
23. A2A protocol: Architecture and technical specification \- Tyk.io, [https://tyk.io/learning-center/a2a-protocol-architecture-and-technical-specification/](https://tyk.io/learning-center/a2a-protocol-architecture-and-technical-specification/)  
24. agentgateway/agentgateway: Next Generation Agentic Proxy for AI Agents and MCP servers \- GitHub, [https://github.com/agentgateway/agentgateway](https://github.com/agentgateway/agentgateway)  
25. What Is Agent2Agent Protocol (A2A)? \- Solo.io, [https://www.solo.io/topics/ai-infrastructure/what-is-a2a](https://www.solo.io/topics/ai-infrastructure/what-is-a2a)  
26. How AI Agents Communicate: Understanding the A2A Protocol for Kubernetes \- Tigera.io, [https://www.tigera.io/blog/how-ai-agents-communicate-understanding-the-a2a-protocol-for-kubernetes/](https://www.tigera.io/blog/how-ai-agents-communicate-understanding-the-a2a-protocol-for-kubernetes/)  
27. Agent-to-Agent (A2A) and agentgateway For A Custom Agent Integration, [https://www.cloudnativedeepdive.com/agent-to-agent-a2a-and-agentgateway-for-a-custom-agent-integration/](https://www.cloudnativedeepdive.com/agent-to-agent-a2a-and-agentgateway-for-a-custom-agent-integration/)  
28. Agent Systems: Architectures, Patterns, and Production Builds \- Mastra, [https://mastra.ai/articles/agent-systems](https://mastra.ai/articles/agent-systems)  
29. Add your AI agent's Agent Card | Google Cloud Marketplace Partners, [https://docs.cloud.google.com/marketplace/docs/partners/ai-agents/agent-card](https://docs.cloud.google.com/marketplace/docs/partners/ai-agents/agent-card)  
30. What is A2A protocol (Agent2Agent)? \- IBM, [https://www.ibm.com/think/topics/agent2agent-protocol](https://www.ibm.com/think/topics/agent2agent-protocol)  
31. Getting Started with Agent2Agent (A2A) Protocol: A Purchasing Concierge and Remote Seller Agent Interactions on Cloud Run and Agent Engine | Google Codelabs, [https://codelabs.developers.google.com/intro-a2a-purchasing-concierge](https://codelabs.developers.google.com/intro-a2a-purchasing-concierge)  
32. JSON schemas | Agent Registry \- Google Cloud Documentation, [https://docs.cloud.google.com/agent-registry/json-schemas](https://docs.cloud.google.com/agent-registry/json-schemas)  
33. Agent2Agent (A2A) – awesome A2A agents, tools, servers & clients, all in one place. \- GitHub, [https://github.com/ai-boost/awesome-a2a](https://github.com/ai-boost/awesome-a2a)  
34. A2A/docs/specification.md at main · a2aproject/A2A \- GitHub, [https://github.com/a2aproject/A2A/blob/main/docs/specification.md](https://github.com/a2aproject/A2A/blob/main/docs/specification.md)  
35. Your AI Agents Have No Laws. I Built the Answer. | by Nick Homyk | Medium, [https://medium.com/@nickhomyk/your-ai-agents-have-no-laws-i-built-the-answer-cd80ef7a705e](https://medium.com/@nickhomyk/your-ai-agents-have-no-laws-i-built-the-answer-cd80ef7a705e)  
36. Tools \- Model Context Protocol, [https://modelcontextprotocol.io/specification/2025-11-25/server/tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)  
37. Agentgateway v1.0: A Rust-based Kubernetes Gateway API implementation built for AI workloads \- Reddit, [https://www.reddit.com/r/kubernetes/comments/1rxecjv/agentgateway\_v10\_a\_rustbased\_kubernetes\_gateway/](https://www.reddit.com/r/kubernetes/comments/1rxecjv/agentgateway_v10_a_rustbased_kubernetes_gateway/)  
38. CEL expressions \- Agentgateway, [https://agentgateway-agentgateway.mintlify.app/concepts/cel-expressions](https://agentgateway-agentgateway.mintlify.app/concepts/cel-expressions)  
39. Mastra is the modern TypeScript framework for AI-powered applications and agents. \- GitHub, [https://github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra)  
40. LangGraph vs CrewAI vs Mastra (2026): Orchestration Compared \- We The Flywheel, [https://wetheflywheel.com/en/comparisons/langgraph-vs-crewai-vs-mastra/](https://wetheflywheel.com/en/comparisons/langgraph-vs-crewai-vs-mastra/)  
41. Mastra Blog: AI Agents, Workflows, and TypeScript Engineering, [https://mastra.ai/blog](https://mastra.ai/blog)  
42. Unified Config · aaif-goose goose · Discussion \#1286 \- GitHub, [https://github.com/aaif-goose/goose/discussions/1286](https://github.com/aaif-goose/goose/discussions/1286)  
43. The 2026-07-28 MCP Specification Release Candidate | Model Context Protocol Blog, [https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)  
44. Application structure \- Docs by LangChain, [https://docs.langchain.com/langsmith/application-structure](https://docs.langchain.com/langsmith/application-structure)  
45. Signals | Agents | Mastra Docs, [https://mastra.ai/docs/agents/signals](https://mastra.ai/docs/agents/signals)  
46. LangGraph Basics: Part 6 — Subgraphs & Human-in-the-Loop, [https://shafiqulai.github.io/blogs/blog\_13.html](https://shafiqulai.github.io/blogs/blog_13.html)  
47. Your Mastra Agent Now Has an Inbox With Priority Notifications, [https://mastra.ai/blog/introducing-notification-inbox](https://mastra.ai/blog/introducing-notification-inbox)  
48. goose | Your open source AI agent, [https://goose-docs.ai/](https://goose-docs.ai/)  
49. goosehints \- anyone teach Goose from Claude leak? or Karpathy Skills? \#8524 \- GitHub, [https://github.com/aaif-goose/goose/discussions/8524](https://github.com/aaif-goose/goose/discussions/8524)  
50. AI Agent Observability: a Complete Guide for Production Teams \- Mastra, [https://mastra.ai/articles/ai-agent-observability](https://mastra.ai/articles/ai-agent-observability)  
51. How OpenTelemetry Traces LLM Calls, Agent Reasoning, and MCP Tools | Greptime, [https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)  
52. Inside the LLM Call: GenAI Observability with OpenTelemetry, [https://opentelemetry.io/blog/2026/genai-observability/](https://opentelemetry.io/blog/2026/genai-observability/)  
53. OpenTelemetry for LLM tracing: a guide to instrumenting agents and routing spans anywhere \- Articles \- Braintrust, [https://www.braintrust.dev/articles/opentelemetry-llm-tracing-guide](https://www.braintrust.dev/articles/opentelemetry-llm-tracing-guide)  
54. Guide: Building a docs manager \- Mastra, [https://mastra.ai/guides/guide/docs-manager](https://mastra.ai/guides/guide/docs-manager)  
55. mastra-ai/template-agent-builder \- GitHub, [https://github.com/mastra-ai/template-agent-builder](https://github.com/mastra-ai/template-agent-builder)  
56. Project structure | Getting Started | Mastra Docs, [https://mastra.ai/docs/getting-started/project-structure](https://mastra.ai/docs/getting-started/project-structure)  
57. Agent Skills \- Claude Platform Docs, [https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)  
58. Quickstart: Publish an MCP Server to the MCP Registry \- Model Context Protocol, [https://modelcontextprotocol.io/registry/quickstart](https://modelcontextprotocol.io/registry/quickstart)  
59. Configuration \- Goose Documentation, [https://block-goose.mintlify.app/configuration](https://block-goose.mintlify.app/configuration)  
60. goose/.goosehints at main \- GitHub, [https://github.com/aaif-goose/goose/blob/main/.goosehints](https://github.com/aaif-goose/goose/blob/main/.goosehints)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAaCAYAAAAjZdWPAAAAp0lEQVR4Xu2OQQoDMQwD9/+fbunBIMRom5R2uwcNBGJZtnUcpZRSyo94vHm3ZIJRSNL+jgaigKTdCgro9VUs3U2BXbuC5btkVG3+Zz5/1CNN9yUdIZMvo7/XZz2t9R55XEPcRIOjkZ7+9LQ3f4VuLOGD6T+1h1Kd8NBpLs0jPpiWTp3wHu2kfR+H9jot054HeOG6e72vnmV2Bsi3M/81dg4mb9JLKcYTEZWWathgVlIAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABLCAYAAADNo9uCAAACkklEQVR4Xu3ZUW7qMBAFULbddXZB74kPS+5oHMYmCQHOkSLsyTg27c8Vud0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD28W/iAgDgBWbCWNYXQ13fk9UAAFhQDVVbPaN7ozoAAJOqoW0kW5vVAABYJLABALyJlZC1sqbi2RAJAPCRVkLSbP+MI58NAPC2ZkJSJeC1nr4vzrdqAAB0ZgNSFrLuYi2GtTjOanEMAMCiGKri/K4PZlkgy2pxDADw1arBqNoXjUKYwAYAsKNnw1MMYvF5sRbnAABfqRKIWnCq9AIAbIrBQsgAALiYUVB7RWjrw+PoAgD4Wp8Qhn5dp18/NwDgJT4hvAEAfJQY0EavSZvsFWU/j68xs34AACbEINUHr/4z1rL7bZ7VAADYQQxiMXzFkNb3ZH2j+ZEqe8Xzbonfr7oOAOAQWRh5FFYqtTg/UjWMPerJ7mc1AIBT9YGkBZ8Y2LJAlPVk47NU9xr1Zd8RAODyYoi5eqBZPd/qOgCAS2ih7R1Czeo5V9ZcWf8/W/2bAAAcZiWgzPaPrOy9p1fvDwBQshJatvr7e1t9TaWnov91bHQBALyllSBTWZMFpThvtajvOyt0xWdX9st6shoAwOmyQFKtRbEnzu+y2p62QlarV3sAAHb1TMBoAaYSZOK4168fPXO0di/Zfo/OkfUcfU4A4MtUwkWlZ8tofQw+2Wcvq50lnis7y9Y9AIAl1WBR7Ru5r4/hrK/186y+NT7aaN/RuMlqAABTWqCoXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBf/wERNaDbDmfL+AAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAaCAYAAADbhS54AAAAkklEQVR4Xu2QSw6AMAhEvf+lNSxIcBxKf6gLXmIMvBZGj6Mo3uF0HkvLpdOzNPIpRMFaLpUKNkIUSoh8ClGwlkvlq2DR3vAAOqxXcGeNhhJYbxZ31mgwPY99YcZhfYNdEFhPYH3s2XrEPbBf5AVV0LHzWnvO+m3gUG+5vpnDGVtgQ3HBrFuC/QVB+72O9Yqi+B0XlZtqlqAlmroAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAaCAYAAAAe97TpAAAAtUlEQVR4Xu2UUQrDMAxDe/9Lb/TDYN4U21m2JQM/CDSSHDul9LqapqnwcKuiH0c2ZOQdQzZk5m+nMmAls43sMzIqmW1UL3Esf/PXifjFBb7+olYOn6lb6ZNSPZyZap0xm58ma0DP8qxTmsGarI5Z+i9EgUgfeTf0okE4vH/mPsQ3iRoa9JlVPjM37BfVqPolfAM2U5oa0usKeqPc2/AShJrPjjz1zP3HUU2oUc8y3KvVNE1zOE9aqI5yef6VcwAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAaCAYAAADfcP5FAAAAcElEQVR4Xu3SQQrAIAxEUe9/6XYlTD8TrQjiYh4ETBo0SluLiIjSM4mjeOjxARSHiZnrXssN5H7w1VyNvn1UTaxprgMo1zNaW24gvY2GcjlD61v+bMIe5l1VX8ZNeDhrzKv1ln47HWCUa41cb0Qc8QLwS1WrEwnRGgAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAaCAYAAAAKYioIAAABFklEQVR4Xu2Q0QpDMQhD+/8/veGDICHRtttuhfVA2UzU5naMy+XSlBcKDfhKJltSHYbSO/Fxxp0HUHonsu+aolqAHtad2c468yjoY92Z7azswyPoVf3d2M5bDaKn+l1XB0Gf9RjY432oqR1KL1GD6jKmOcpDne1mcwbqXqNuMM1QekoMyQIjmV95Wa3APq9RN5hmKD1ldaj6+MxTVHPxKF3NG5knWR3KQlRe/K/6KtRctlPpkuWBUQfIvPh/pk/Vap7pTCtZHhj5RcpDHWvX4q+jatQNpTGd4s3xrKD6cWe2n/msF/uwFw+i9J+gLno0xCSP5lEPoPRTHMnDLjwSJOFYlnixP0qXxzma4+jlCV1zXS6XP+UNx5XhHxZbzCcAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABYCAYAAABI4au3AAADR0lEQVR4Xu3dy27bMBAF0Pz/T7fwggBxMZRGrh6Oew5gOBxeirKy4CBN0J8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+2p8s/NQ1AAAeks3Za5w1AAAeMhqzbNByDADAQ7Jhy3cAAB5WNWiaNQCADzH/rtr87nfYAAAAAAAAAAAAAAAAAAA+UfcvQefcXhYAgJN1mrBOBgDgMXc2KnfuNXSasU4GAOA0+c978ytVtavdvefqs886mbT1XK90935d474+9f4A4CPlwZnjl6p2tbubnM5+ncxMs7a2d4978wDw36gOxScajJU776PzuTuZ2ZHst8tn13k2nQwAfL3qQMxaju90597ZUFQ6mdmR7LfLZ9d5Np0MAHy9PBDzUB21lLU8iMd4L7eqdYx9tl5HdNZ0MrMj2bNUe861o59heGfNLL83net1MgDw1fLwXB2OVT1rW+tnc2Z8XdWe0PkMnczsSPYs1Z75jKvMnnfXDWfcAwD8d7qHZpXJWl4rx7MxV+VXa+7Q2b+TGbq5LUf2G6p89ayPmr9HuT7HlbwHAKChe2hWuazNh3jOvVRzq1qO75J7VzqZoZs7W7Vv9Uyr3BH/uh4AaOgeuFUua1VDMH+d73u11fhKr7329utkhvxc+cq5Ss7N462vU15jluOVKjf2zfus7N3fqg4AvOmug/SufV5WTcOskxkyN4+rJifzw6hX81tzXdXaqrZSZavaylZ2aw4ACHlw5vgK2dBcrbNfNzO/D/N4XCdrldX1Zltze6q1VW2lyla1la3s1hwAsKFqNq5w9fVT5zP9S2Z+bvP81nhrbq6lqrZSZavaSveeVsb6XJNjAKDhzgP0zr2GqmlInczKu+vedfd+Z/vt9w8AXKDTjHUylbHunbUrZ18PAOBjzc1Uvo5kAAAAAAAAAAAAAAAAAAB4QucvPv1lKADAL6BhAwB4wJGfnHVzAAA8RMMGAPCw/J8M8qdvGjYAgAdkU7ZSNXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3Ocv/VmJhTrjLdUAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAaCAYAAABRqrc5AAAATklEQVR4Xu3O0QoAEBBEUf//0+RBcRvWRrzsKWlolpRC+ChjubDEvIUlZpMqqLMlVWA2cYjK6nzAyz7PdqkV+SpLzG5qqNvxgOrKT8JLBfAALNR3+RN+AAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAbCAYAAACjkdXHAAAAWUlEQVR4Xu2Q4QoAEAyE9/4vTWTF3C0kf+wrZeduhkgQvCaRPaWYdKHaBZm2wktGRj+qNzbSBljY1hUoyqzbusJuUc0+ZfDag8nQQNoSx8HCtfB2I+8vviEDnewxz9LoJ+YAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAaCAYAAABRqrc5AAAAZklEQVR4Xu2QQQoAIQwD+/9Puwgr7JZJrJ48OCDYmLTYiEuFJu7bbDXJoV5nzUIB0iwUIE2izEpHhplOGQqQZqEAaZZsXm7QyYFcD+yuvg9oiL+uPHrCi3srMRtQpvSdGXapl1N5AAeXN8lfSascAAAAAElFTkSuQmCC>