# **Technical Architecture Report: Native Windows ARM64 Vibe Coding Command Center with Multi-Model Free API Routing**

The rapid evolution of generative artificial intelligence has fundamentally altered the paradigm of software development. High-velocity engineering methodologies, often referred to as vibe coding, rely on continuous, low-latency loops where semi-autonomous agents analyze workspaces, synthesize modifications, and execute commands directly1. Standard consumer clients, such as the Claude Desktop application, restrict developers to specific API endpoints and commercial subscription boundaries3.  
To bypass these operational limitations, this report presents the systems architecture for a native Windows ARM64 desktop application designed to function as an advanced developer command center. Engineered specifically for the Samsung Galaxy Book Go 5G (Model NP545XLA-KA2VZ), this client integrates a multi-provider key-rotation engine, implements automated workspace modification with granular administrative privileges, and overcomes severe hardware resource constraints to enable continuous, zero-cost development2.

## **Hardware-Specific Compilation and eUFS Optimization**

The target physical hardware—the Samsung Galaxy Book Go 5G (NP545XLA-KA2VZ)—imposes unique constraints that dictate both compile-time configurations and runtime design. At the core of the machine is the Qualcomm Snapdragon 8cx Gen 2 processor, featuring an octa-core architecture divided into four performance cores running at 3.15 GHz and four efficiency cores operating at 1.8 GHz. This processor is paired with an integrated Qualcomm Adreno 680 GPU, a non-upgradeable 8GB LPDDR4X on-board RAM allocation, and either 128GB or 256GB of soldered embedded Universal Flash Storage (eUFS)5.

┌─────────────────────────────────────────────────────────────────┐  
│               Tauri 2.0 Native WebView2 Frontend                │  
└────────────────────────────────┬────────────────────────────────┘  
                                 │ Tauri IPC Bridge  
┌────────────────────────────────▼────────────────────────────────┐  
│                   Rust Desktop Host Core                        │  
│  ┌─────────────────────────┐       ┌─────────────────────────┐  │  
│  │   ConPTY Terminal TTY   │       │   Git-Aware Walker      │  │  
│  │   (win32-arm64 native)  │       │   (jwalk & ignore)      │  │  
│  ├─────────────────────────┤       ├─────────────────────────┤  │  
│  │   Key Rotation Engine   │       │   MCP Client Middleware │  │  
│  │   (Weighted/LRU Pool)   │       │   (rmcp Rust SDK)       │  │  
│  └─────────────────────────┘       └─────────────────────────┘  │  
└────────────────────────────────┬────────────────────────────────┘  
                                 │ Shared Filesystem / OS APIs  
┌────────────────────────────────▼────────────────────────────────┐  
│               Windows 11 Home ARM64 OS Kernel                  │  
│  ┌───────────────────────────────────────────────────────────┐  │  
│  │     Qualcomm Snapdragon 8cx Gen 2 (Octa-Core ARM64)       │  │  
│  ├───────────────────────────────────────────────────────────┤  │  
│  │     Soldered eUFS Storage Layer                           │  │  
│  └───────────────────────────────────────────────────────────┘  │  
└─────────────────────────────────────────────────────────────────┘

Operating a developer environment on this platform requires strict avoidance of the Windows 11 x64 emulation layer5. Emulation inflicts a heavy performance penalty, degrading CPU cache utilization and rapidly exhausting the limited 8GB RAM capacity5.  
To eliminate this overhead, the command center is built on the Tauri 2.0 framework7. This architecture pairs a native Webview2 user interface with a high-performance Rust backend compiled directly for the aarch64-pc-windows-msvc target triple8.  
Setting up the compilation pipeline requires specific host components to compile the Rust binary natively, as summarized below:

| Build Tool Dependency | Native ARM64 Package Specification | System Configuration Role |
| :---- | :---- | :---- |
| **Microsoft C++ Build Tools** | VS 2022 C++ ARM64 build tools (v143 or latest)8 | Compiles the native Rust host codebase into ARM64 machine code8. |
| **Rust Toolchain** | Host Target: aarch64-pc-windows-msvc \[cite: 9, 10\] | Facilitates compile-time type-safety checks and system-level bindings9. |
| **Python Toolchain** | Python Install Manager via MS Store (py install 3-arm64)5 | Eliminates x64 emulation crashes during node-gyp native compiles5. |
| **Node.js Environment** | Long Term Support (LTS) Native Windows ARM649 | Hosts frontend tooling and compiles native package dependencies9. |
| **Terminal Integration** | Native ARM64 node-pty prebuilt binaries12 | Manages native ConPTY process bindings inside Windows 11 ARM6412. |

A major challenge for this hardware is the soldered eUFS storage. Unlike high-throughput NVMe SSDs, eUFS exhibits high random-read and write latency.  
When a standard agent scans a directory to index its codebase, it generates recursive file system lookups. On eUFS, this sequential scanning halts execution, locking up the user interface16.  
To bypass this bottleneck, the command center replaces naive file scanning with an asynchronous, parallelized, Git-aware traversal model using the Rust ignore and jwalk crates16. This implementation reads and parses .gitignore, .ignore, and global git excludes, skipping excluded directories like node\_modules and target folders directly at the directory entry level16.  
This optimization minimizes disk access, bypassing unnecessary file queries. The disk overhead reduction is modeled below:  
![][image1]  
Where ![][image2] represents the complete directory hierarchy, ![][image3] is the set of vertices matching ignore patterns, ![][image4] represents the disk seek latency (which is highly penalizing on eUFS), and ![][image5] represents the byte read duration16. In a standard frontend project where ignored files comprise roughly 90% to 95% of the codebase, this traversal model avoids over 90% of physical disk seeks16. This keeps the interface highly responsive even under heavy parallel execution18.

## **Multi-Model Free API Tier Topology**

To achieve continuous, zero-cost generation throughout intensive development cycles, the application orchestrates and cycles through multiple distinct, non-commercial API endpoints. Each provider enforces its own rate limits, which the client maps to appropriate tasks:

| API Provider | Specific Model ID | Requests per Minute (RPM) | Requests per Day (RPD) | Tokens per Minute (TPM) / Context Window | Task Allocation Target |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Google AI Studio** | gemini-3.5-flash \[cite: 20\] | ![][image6] \[cite: 21\] | ![][image7] \[cite: 20\] | ![][image8] TPM / ![][image8] \[cite: 4, 22\] | Complex workspace indexing and large-file generation20. |
| **Google AI Studio** | gemini-3.1-flash-lite \[cite: 22\] | ![][image9] \[cite: 22\] | ![][image7] \[cite: 22\] | ![][image8] TPM / ![][image8] \[cite: 22\] | Real-time autocomplete, compiler error tracing, and formatting22. |
| **OpenRouter (Free)** | poolside/laguna-xs-2.1:free \[cite: 24\] | ![][image10] \[cite: 24, 25\] | ![][image11] (![][image12] if upgraded)24 | ![][image13] Context24 | Single-file edits and terminal command execution24. |
| **OpenRouter (Free)** | cohere/north-mini-code:free \[cite: 24\] | ![][image10] \[cite: 24, 25\] | ![][image11] (![][image12] if upgraded)24 | ![][image14] Context24 | Unit test generation and automated git commits24. |
| **OpenRouter (Free)** | google/gemma-4-31b-it:free \[cite: 24\] | ![][image10] \[cite: 24, 25\] | ![][image11] (![][image12] if upgraded)24 | ![][image13] Context24 | Architectural planning and structural explanations24. |
| **Groq (Free)** | llama-3.3-70b-spec \[cite: 3, 21\] | ![][image9] \[cite: 3\] | ![][image12] \[cite: 21\] | ![][image15] Tokens per Day (TPD) ceiling3 | High-complexity reasoning and logic verification3. |
| **Groq (Free)** | llama-3.1-8b \[cite: 21\] | ![][image9] \[cite: 21\] | ![][image16] \[cite: 21\] | ![][image17] TPM / ![][image18] Context21 | Low-overhead code classification and syntax parsing3. |
| **Cerebras (Free)** | gpt-oss-120b \[cite: 21\] | ![][image9] \[cite: 21\] | ![][image16] \[cite: 21\] | ![][image8] Tokens per Day (TPD) ceiling21 | Multi-step build tool loops and dependency management3. |
| **GitHub Models** | azure-openai/gpt-5 \[cite: 26\] | ![][image19] \[cite: 26, 27\] | ![][image11] \[cite: 26, 27\] | ![][image20] Input / ![][image21] Output request limit26 | Algorithmic logic and deep bug tracing26. |
| **GitHub Models** | azure-openai/gpt-4o-mini \[cite: 27\] | ![][image6] \[cite: 27\] | ![][image22] \[cite: 27\] | ![][image23] Input / ![][image21] Output request limit28 | Code-debt tracking, documentation, and metadata generation27. |

Managing these free-tier endpoints requires careful handling of platform-specific policies to maintain cost-free operation.  
For Google AI Studio integration, the command center must point to a Google Cloud Platform (GCP) project that has billing strictly disabled29. Enabling billing on a GCP project silently terminates its free-tier status29. Once active, all subsequent calls are billed immediately, even if the total consumption resides below the free limits29. The client must isolate its API keys inside a billing-disabled project container to protect the developer from unexpected charges29.  
On OpenRouter, the standard free tier restricts non-paying accounts to 50 requests per day24. To bypass this limit, the system supports an elevation mechanism: depositing a single $10 credit payment raises the daily limit for free models (those suffixed with :free) to 1,000 requests per day24.  
This cap remains permanently elevated even if the paid balance is subsequently spent on commercial models24. However, the account balance must not drop below zero, as a negative balance triggers HTTP 402 Payment Required errors across all endpoints, including free ones30.  
For GitHub Models, the gateway imposes a strict per-request constraint27. Although models like GPT-4o-mini have large native context windows (such as 128k or 131k tokens), the API gateway limits individual requests to a maximum of 8,000 or 16,000 input tokens to prevent server overload28.  
If a request exceeds this boundary, the gateway returns an HTTP 429 error28. The command center must intercept these constraints, truncating inputs to ensure queries remain within the enforced quotas28.  
Finally, the Mistral Experiment Tier offers a generous 1 billion tokens per month21. Utilizing this tier requires a verified phone number and opting into data training21.  
Because prompts and project files may be used to train Mistral's models, this introduces compliance and privacy considerations23. The command center's UI must explicitly prompt the user to confirm their consent before routing sensitive files to this endpoint23.

## **Intelligent Key Rotation and Rate-Limit Bypass Routing Engine**

To sustain uninterrupted development cycles, the application incorporates an internal API gateway that manages and cycles keys across different accounts and providers6. This routing engine distributes token consumption to prevent single-key rate exhaustion32.  
The engine implements a hybrid routing policy combining weighted distribution, active concurrency tracking, and least recently used (LRU) tracking32:

1. **Weighted Selection**: The router computes a dynamic selection weight (![][image24]) for each key in the pool, based on the key's allocated rate limits33. High-capacity keys are assigned a higher base selection probability33.  
2. **Least-Used Tracking**: The system prioritizes the key with the lowest number of active requests in flight to prevent concurrent exhaustion32.  
3. **LRU Timestamp Tiebreaker**: When multiple keys are eligible, the engine routes the call to the key with the oldest reset window timestamp to maximize the probability of an cleared rate-limit buffer32.

The selection probability (![][image25]) of a key is modeled as follows:  
![][image26]  
Where ![][image24] is the configured key priority weight33, ![][image27] is the active concurrent request count for key ![][image28]32, and ![][image29] represents the total number of non-cooled-down keys in the pool6. This formulation penalizes keys with active connections in flight, encouraging uniform distribution across the pool32.

                 Incoming LLM API Request  
                            │  
                            ▼  
              ┌───────────────────────────┐  
              │   API Gateway Middleware  │  
              └─────────────┬─────────────┘  
                            │  
         ┌──────────────────┴──────────────────┐  
         ▼                                     ▼  
 ┌──────────────┐                       ┌──────────────┐  
 │  Provider A  │                       │  Provider B  │  
 │  Key Pool    │                       │  Key Pool    │  
 └──────┬───────┘                       └──────┬───────┘  
        │                                      │  
        ├─► Key A1 (Active, $C\_1=0$)            ├─► Key B1 (Active, $C\_1=1$)  
        ├─► Key A2 (Active, $C\_2=1$)            └─► Key B2 (429 Cool-down)  
        └─► Key A3 (429 Cool-down)

The gateway parses response headers to track rate limits in real time. When a provider returns an HTTP 429 or 402 code, the engine reads the headers (such as X-RateLimit-Reset or Retry-After) to flag the active key as "Cooled-Down" and schedule its restoration6. The failed query is then rerouted to an available key6.  
By managing key rotation locally on the client's machine, the engine bypasses rate limits without routing traffic through an external SaaS proxy, keeping operations secure and compliant.

## **Autonomous YOLO Execution and Native Windows Host Integration**

For high-velocity agent execution, the application must operate with elevated permissions to run commands and modify folders natively without interactive prompts—often referred to as YOLO mode2. Operating an autonomous agent directly on a host operating system introduces considerable risk, as the system can perform destructive commands (![][image30]) or read sensitive user data under adversarial execution conditions36.  
To balance developer velocity with security, the command center implements a dual-mode execution engine:

### **Direct Native Host Execution (Naked YOLO)**

This mode grants the agent direct access to the Windows 11 host kernel. Process spawning is handled natively through Rust's std::process::Command library, linked to a virtual terminal (Pseudo Console or ConPTY)12. On Windows 11, ConPTY is natively integrated into the OS (build 18362+)38.  
The application utilizes native Windows ARM64 builds of the conpty API to create a terminal instance running powershell.exe12. The agent writes commands directly to the ConPTY input pipe and reads streams from the output pipe, allowing it to execute local compilers, compile binaries, run git operations, and launch local test suites as a background task.

┌──────────────────────────────────────────────────────────┐  
│                 Tauri Desktop Interface                  │  
└────────────────────────────┬─────────────────────────────┘  
                             │ Spawn Process IPC  
┌────────────────────────────▼─────────────────────────────┐  
│                 Tauri Rust ConPTY Bridge                 │  
└────────────────────────────┬─────────────────────────────┘  
                             │ Open Named Pipes  
┌────────────────────────────▼─────────────────────────────┐  
│             Windows ConPTY API (Native ARM64)            │  
└────────────────────────────┬─────────────────────────────┘  
       ┌─────────────────────┴─────────────────────┐  
       ▼ (Direct Host)                             ▼ (Sandboxed)  
┌──────────────┐                            ┌──────────────┐  
│  Powershell  │                            │   Docker/VM  │  
│  Workspace   │                            │   Sandbox    │  
└──────────────┘                            └──────────────┘

This direct native approach is highly efficient for the target hardware. Spawning tools directly under the native ARM64 Windows kernel avoids the memory overhead of virtualization, keeping memory consumption within the system's 8GB RAM boundary5. However, because the agent runs with the developer's full user permissions, it can access sensitive files (such as .ssh keys or local credentials) and run arbitrary shell scripts35. This mode is fast, but leaves the host system vulnerable to unintended actions36.

### **Sandboxed Workspace Isolation (Protected YOLO)**

To limit the blast radius of autonomous commands, the application supports isolated workspaces via lightweight sandboxes (such as Docker Sandboxes or AgentBranch/LimaVM instances)36. In this configuration, the host workspace directory is mounted directly into an isolated Linux container or microVM36.  
The agent receives root execution privileges inside the sandbox, enabling it to install packages (npm install, pip install), download external binaries, and run test suites35. The host system remains completely isolated36. Once execution completes, modifications written to the mounted directory are saved to the host, where they can be reviewed as a standard git diff37.

┌─────────────────────────────────────────────────────────────────┐  
│                    Sandbox Audit Event Schema                   │  
├─────────────────────────────────────────────────────────────────┤  
│ \- Timestamp     : Unix Epoch Milliseconds                       │  
│ \- Actor         : Active Routing Model ID                       │  
│ \- Target File   : Canonical Workspace Path                      │  
│ \- Command Stream: Terminal Invoke String                        │  
│ \- Standard Out  : Raw Captured stdout Bytes                      │  
│ \- Standard Err  : Raw Captured stderr Bytes                      │  
└─────────────────────────────────────────────────────────────────┘

To provide full visibility, both modes feed process output into a dedicated audit panel in the UI37. This panel records:

* The exact terminal commands executed by the agent.  
* The current working directory (![][image31]) and environment variables used.  
* File read/write/delete events, mapped in order of execution.  
* Real-time standard output and error output (![][image32] and ![][image33]).

## **Core Developer Agent Features and Tool Integrations**

To deliver an optimized development environment on ARM64 hardware, the application implements specialized features directly into its Rust core to maximize processing speed, minimize disk overhead, and provide structured visual feedback.

### **Model Context Protocol (MCP) Client Middleware**

The application integrates a Model Context Protocol (MCP) client into its Rust backend using the rmcp SDK39. The Tauri host acts as an orchestrator, launching local stdio-based or HTTP-based MCP servers as background child processes39.  
When the user selects a model, the client queries active MCP servers, collects their tool definitions, and appends them to the system prompt39. Tool calls from the model are intercepted, executed against the corresponding local MCP server, and the resulting payload is returned to the model's context stream39.

### **Optimized Workspace Tools**

To minimize context window usage and file system seek latency, the application implements optimized versions of core workspace tools:

                       Workspace Root  
                              │  
             ┌────────────────┴────────────────┐  
             ▼ (Traverse)                      ▼ (Query)  
    ┌─────────────────┐               ┌─────────────────┐  
    │   list\_dir      │               │   grep\_search   │  
    └────────┬────────┘               └────────┬────────┘  
             │ File Stream                     │ Match Stream  
             ▼                                 ▼  
┌──────────────────────────────────────────────────────────┐  
│             Token-Aware Chunking Engine                  │  
├──────────────────────────────────────────────────────────┤  
│ \- view\_file (Targeted context window lines)              │  
│ \- replace\_file\_content (Precise search-and-replace block) │  
└──────────────────────────────────────────────────────────┘

* list\_dir: Recursively lists directories by leveraging the optimized Git-aware walker, returning a tree structure to minimize directory parsing overhead42.  
* grep\_search: Executes an optimized regex-pattern search across the directory tree, using the globset and ignore crates to skip binary files and ignored paths42.  
* view\_file: Reads files into memory using the optimized native file system plugin42. If the target file is excessively large, the tool enforces line-range limits (e.g., lines 100–300) to conserve the model's context window.  
* replace\_file\_content: Avoids re-writing entire files by executing search-and-replace blocks, minimizing write operations on the slower eUFS storage layer42.

### **High-Performance Visual Live-Diff System**

Before writing generated code to disk, the client calculates the delta using imara-diff44. This library uses the Myers linear-space and Histogram algorithms, yielding rapid performance even on complex modifications44.  
The backend processes the changes, creates a patch unified chunk via diffy-imara46, and streams the delta to the frontend, where the developer can review changes before committing them1.  
A comparison of the command center's features against the standard Claude Desktop experience is outlined below:

| Feature Dimension | Claude Desktop Application | Prototyped Command Center (ARM64 Windows) |
| :---- | :---- | :---- |
| **Model Compatibility** | Restricts execution to Anthropic Claude models3. | Routes requests dynamically across Google, Groq, Cerebras, OpenRouter, and GitHub Models21. |
| **Bypass Mechanisms** | Lacks built-in key rotation or rate-limit mitigation3. | Automatically cycles keys and manages cool-downs locally to bypass API rate limits6. |
| **Compilation Architecture** | Runs inside an x64 emulation wrapper on ARM645. | Compiled natively for the aarch64-pc-windows-msvc target triple8. |
| **Filesystem Optimization** | Performs sequential scans, creating lag on slow eUFS16. | Uses parallel, Git-aware traversal to scan codebases efficiently16. |
| **Terminal Integration** | Basic terminal execution12. | Houses a native ARM64 Windows ConPTY terminal instance with direct Named Pipes12. |
| **Workspace Sandboxing** | Runs natively on the host filesystem with standard rules35. | Toggles between Naked YOLO and isolated containers with shared volume mounts36. |
| **Workspace Tooling** | Basic view/write tools42. | Token-bounded view limits and precise block search-and-replace tools42. |
| **Diff Visualizations** | Basic text-based unified diff outputs1. | Collapsible, colored live diffs rendered in real time using native imara-diff1. |

## **July 2026 One-Shot Engineering Prompt for Claude**

The following developer prompt is designed for execution in a frontier model to generate the complete codebase for this native Windows ARM64 Vibe Coding Command Center in a single execution.  
You are an expert Systems Architect specializing in Rust, Tauri 2.0, and high-performance desktop development on ARM64 Windows. Generate a complete, ready-to-compile, and fully functional source code repository for a native Windows ARM64 desktop application named "VibeCode Command Center".  
Target Hardware Profile:

* CPU: Qualcomm Snapdragon 8cx Gen 2 (ARM64)  
* RAM: 8GB LPDDR4X (Strict memory limits)  
* Storage: eUFS (Slow random access, requires highly optimized I/O)  
* OS: Windows 11 Home ARM64

Architectural Requirements & File Structure: Generate code for the following directory layout:

1. src-tauri/Cargo.toml  
* Target Tauri 2.0 and native aarch64 dependencies.  
* Include: tokio (full async features), serde/serde\_json, ignore (for Git-aware workspace scanning), jwalk (for parallel traversing), rayon, imara-diff (for high-speed diffing and patching), and tauri-plugin-shell.  
* Set compilation optimization parameters for optimal release speeds and small binary footprint on ARM64: \[profile.release\] codegen-units \= 1 lto \= "fat" panic \= "abort"  
2. src-tauri/src/lib.rs  
* Register standard Tauri plugins (shell, fs, path).  
* Set up system state structs: WorkspaceState (current open directory path), KeyPoolState (thread-safe hashmap holding API keys and cool-down timestamps), and ActiveTerminalState (mapping conpty pipes).  
* Expose the following Tauri invoke commands:  
  * open\_workspace(path: String): Validates and sets active workspace.  
  * scan\_workspace(): Returns a fast file tree list of the current workspace. Use the ignore crate to parse .gitignore, skipping folders like node\_modules and target. Use rayon to avoid blocking the main UI thread.  
  * execute\_agent\_action(action: AgentAction): Standard tool executor. Implements tools: view\_file (reads lines with maximum window constraints), write\_file (optimized file overwrite), replace\_content (precise block substitution to protect eUFS write cycles), grep\_search (high-speed regex matching across workspace).  
  * execute\_terminal\_command(command: String): Launches an autonomous Windows ConPTY process running powershell.exe on the target host. Handles raw shell execution when YOLO mode is set to Native Host, piping input and streaming stdout/stderr back via Tauri emitter events.  
  * get\_valid\_api\_key(provider: String): Implements the rotation engine. Selects a key using Weighted Round-Robin based on active concurrency load, falling back to Least Recently Used (LRU) tracking, filtering out any keys currently in a 429/402 cool-down state.  
  * set\_key\_cooldown(provider: String, key\_index: usize, cooldown\_seconds: u64): Puts a key on cool-down upon receiving an API rate limit error.  
  * generate\_diff(file\_path: String, new\_content: String): Compares a modified workspace file against its original content. Uses imara-diff with the Histogram algorithm to generate unified patch data for visual display.  
3. src-tauri/tauri.conf.json  
* Configure a native Tauri v2 desktop window.  
* Set up strict capabilities in the capabilities directory. Enable shell:allow-execute for system commands, and fs:default for reading/writing local files inside the workspace directory. Ensure the bundle target is set to build native ARM64 outputs.  
4. src/App.svelte (or src/App.tsx)  
* Build a dual-pane engineering workspace.  
* Left Pane: Real-time vibe coding terminal output, live shell execution log, and file tree.  
* Right Pane: Model & Provider Management and Code Editor / Live-Diff Viewer.  
* Features to include in Settings:  
  * Toggle between YOLO execution modes: "Native Host Powershell (Naked YOLO)" and "Docker Sandbox (Isolated YOLO)".  
  * Multi-Key Input Panel: Allows developers to input multiple free-tier API keys for Google AI Studio, OpenRouter, Groq, Cerebras, and GitHub Models, setting custom priority weights for each key.  
  * Active Rate Limit Tracker: Renders live health statuses of every key in the pool (e.g., Active, Cooled-Down, Reset Time remaining).  
  * Visual Live-Diff overlay: Displays inline word-level colored diff highlighting changes proposed by the AI before writing to disk, utilizing the Tauri-generated imara-diff patches.

Ensure all Rust source files utilize standard robust error handling via thiserror or anyhow, are fully typed, do not use speculative placeholders, and write performance-critical logic directly for Windows ARM64 platforms.

#### **Works cited**

1. semantic-diff \- crates.io: Rust Package Registry, [https://crates.io/crates/semantic-diff](https://crates.io/crates/semantic-diff)  
2. Agent in YOLO Mode \- FAIRLYZ Knowledge Base, [https://fairlyz.lifetimeomics.com/2026/03/16/agent-in-yolo-mode/](https://fairlyz.lifetimeomics.com/2026/03/16/agent-in-yolo-mode/)  
3. Every free LLM provider, ranked by how fast the free tier actually runs out. \- Reddit, [https://www.reddit.com/r/better\_claw/comments/1ue95bf/every\_free\_llm\_provider\_ranked\_by\_how\_fast\_the/](https://www.reddit.com/r/better_claw/comments/1ue95bf/every_free_llm_provider_ranked_by_how_fast_the/)  
4. Gemini API Free Tier Complete Guide: Rate Limits, Upgrade Path & Cost-Saving Strategies (2026), [https://www.aifreeapi.com/en/posts/gemini-api-free-tier-complete-guide](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-complete-guide)  
5. Tinkering with Node.js Core on ARM64 Windows | Joyee Cheung's Blog \- GitHub Pages, [https://joyeecheung.github.io/blog/2026/01/31/tinkering-with-nodejs-core-on-arm64-windows/](https://joyeecheung.github.io/blog/2026/01/31/tinkering-with-nodejs-core-on-arm64-windows/)  
6. 5 Tools for Rate Limiting LLM APIs at Scale \- Maxim AI, [https://www.getmaxim.ai/articles/5-tools-for-rate-limiting-llm-apis-at-scale/](https://www.getmaxim.ai/articles/5-tools-for-rate-limiting-llm-apis-at-scale/)  
7. Tauri 2.0 | Tauri, [https://v2.tauri.app/](https://v2.tauri.app/)  
8. Windows Installer \- Tauri, [https://v2.tauri.app/distribute/windows-installer/](https://v2.tauri.app/distribute/windows-installer/)  
9. Prerequisites \- Tauri, [https://v2.tauri.app/start/prerequisites/](https://v2.tauri.app/start/prerequisites/)  
10. Windows Installer | Tauri v1, [https://tauri.app/v1/guides/building/windows](https://tauri.app/v1/guides/building/windows)  
11. Making desktop apps with revved-up potential: Rust \+ Tauri \+ sidecar \- Evil Martians, [https://evilmartians.com/chronicles/making-desktop-apps-with-revved-up-potential-rust-tauri-sidecar](https://evilmartians.com/chronicles/making-desktop-apps-with-revved-up-potential-rust-tauri-sidecar)  
12. microsoft/node-pty: Fork pseudoterminals in Node.JS \- GitHub, [https://github.com/microsoft/node-PTY](https://github.com/microsoft/node-PTY)  
13. GitHub \- Tauri, [https://v2.tauri.app/distribute/pipelines/github/](https://v2.tauri.app/distribute/pipelines/github/)  
14. @lydell/node-pty \- npm, [https://www.npmjs.com/package/@lydell/node-pty](https://www.npmjs.com/package/@lydell/node-pty)  
15. RMUX: native terminal multiplexer in Rust (Linux/macOS/Windows) with a programmable SDK \- Reddit, [https://www.reddit.com/r/rust/comments/1tipknk/rmux\_native\_terminal\_multiplexer\_in\_rust/](https://www.reddit.com/r/rust/comments/1tipknk/rmux_native_terminal_multiplexer_in_rust/)  
16. bigfiles \- crates.io: Rust Package Registry, [https://crates.io/crates/bigfiles](https://crates.io/crates/bigfiles)  
17. gravityfile\_scan \- Rust \- Docs.rs, [https://docs.rs/gravityfile-scan](https://docs.rs/gravityfile-scan)  
18. gravityfile-scan — Rust filesystem library // Lib.rs, [https://lib.rs/crates/gravityfile-scan](https://lib.rs/crates/gravityfile-scan)  
19. Feedback on crate for parallel recursive directory walk \- help \- Rust Users Forum, [https://users.rust-lang.org/t/feedback-on-crate-for-parallel-recursive-directory-walk/25001](https://users.rust-lang.org/t/feedback-on-crate-for-parallel-recursive-directory-walk/25001)  
20. Gemini API Pricing May 2026: 3.5 Flash, 3.1 Pro, 2.5 Lite \- Metacto, [https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration](https://www.metacto.com/blogs/the-true-cost-of-google-gemini-a-guide-to-api-pricing-and-integration)  
21. cheahjs/free-llm-api-resources \- GitHub, [https://github.com/cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)  
22. Gemini API Pricing: Free Tier \+ Caching $0.50/M Read (May 2026\) | FindSkill.ai — Learn AI for Your Job, [https://findskill.ai/blog/gemini-api-pricing-guide/](https://findskill.ai/blog/gemini-api-pricing-guide/)  
23. Free LLM APIs Compared: Rate Limits, Models, and Real Costs (2026) \- OpenRouter, [https://openrouter.ai/blog/tutorials/free-llm-apis-compared/](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)  
24. OpenRouter Free Models 2026: API Key, Limits & Rotation Tips, [https://buldrr.com/openrouter-free-api-keys-free-models-simple-guide/](https://buldrr.com/openrouter-free-api-keys-free-models-simple-guide/)  
25. OpenRouter API Key Free: limits, free routes, paid access, and BYOK \- Data Studios, [https://www.datastudios.org/post/openrouter-api-key-free-limits-free-routes-paid-access-and-byok](https://www.datastudios.org/post/openrouter-api-key-free-limits-free-routes-paid-access-and-byok)  
26. gpt-5 (GitHub Models): Free Limits \+ How to Use \- AY Automate, [https://www.ayautomate.com/free-models/github-models-openai-gpt-5](https://www.ayautomate.com/free-models/github-models-openai-gpt-5)  
27. Prototyping with AI models \- GitHub Docs, [https://docs.github.com/github-models/prototyping-with-ai-models](https://docs.github.com/github-models/prototyping-with-ai-models)  
28. Rate Limits and File Uploads in GitHub Models · community · Discussion \#149698, [https://github.com/orgs/community/discussions/149698](https://github.com/orgs/community/discussions/149698)  
29. Gemini API Free Tier Limits 2026: the Billing Trap That Deletes Them | UsageBox, [https://usagebox.com/articles/gemini-api-billing-free-tier-confusion](https://usagebox.com/articles/gemini-api-billing-free-tier-confusion)  
30. API Rate Limits \- Manage Model Usage and Quotas \- OpenRouter, [https://openrouter.ai/docs/api/reference/limits](https://openrouter.ai/docs/api/reference/limits)  
31. OpenRouter FAQ, [https://openrouter.ai/docs/faq](https://openrouter.ai/docs/faq)  
32. Feature Request: Multi API-Keys Load Balancing for LLM Providers · Issue \#445 \- GitHub, [https://github.com/AsyncFuncAI/deepwiki-open/issues/445](https://github.com/AsyncFuncAI/deepwiki-open/issues/445)  
33. Intelligent API Key Management and Load Balancing: A Complete Guide to Building Resilient AI Applications using Bifrost \- DEV Community, [https://dev.to/kuldeep\_paul/intelligent-api-key-management-and-load-balancing-a-complete-guide-to-building-resilient-ai-195b](https://dev.to/kuldeep_paul/intelligent-api-key-management-and-load-balancing-a-complete-guide-to-building-resilient-ai-195b)  
34. How do you handle multiple LLM API keys during testing? : r/vibecoding \- Reddit, [https://www.reddit.com/r/vibecoding/comments/1qdindr/how\_do\_you\_handle\_multiple\_llm\_api\_keys\_during/](https://www.reddit.com/r/vibecoding/comments/1qdindr/how_do_you_handle_multiple_llm_api_keys_during/)  
35. Run Claude Code in YOLO Mode Safely with Kernel-Level Isolation \- Edera, [https://edera.dev/stories/yolo-mode-for-ai-agents-without-the-yolo-running-claude-code-with-kernel-isolation](https://edera.dev/stories/yolo-mode-for-ai-agents-without-the-yolo-running-claude-code-with-kernel-isolation)  
36. Docker Sandboxes: Run Agents in YOLO Mode, Safely, [https://www.docker.com/blog/docker-sandboxes-run-agents-in-yolo-mode-safely/](https://www.docker.com/blog/docker-sandboxes-run-agents-in-yolo-mode-safely/)  
37. How are you safely running coding agents in YOLO mode? I built a VM-based approach, [https://www.reddit.com/r/ClaudeAI/comments/1suk0u4/how\_are\_you\_safely\_running\_coding\_agents\_in\_yolo/](https://www.reddit.com/r/ClaudeAI/comments/1suk0u4/how_are_you_safely_running_coding_agents_in_yolo/)  
38. Installation and setup \- Warp Docs, [https://docs.warp.dev/getting-started/quickstart/installation-and-setup/](https://docs.warp.dev/getting-started/quickstart/installation-and-setup/)  
39. GitHub \- modelcontextprotocol/rust-sdk: The official Rust SDK for the Model Context Protocol, [https://github.com/modelcontextprotocol/rust-sdk](https://github.com/modelcontextprotocol/rust-sdk)  
40. agenterra\_rmcp \- Rust \- Docs.rs, [https://docs.rs/agenterra-rmcp](https://docs.rs/agenterra-rmcp)  
41. MCP Client Examples \- modelcontextprotocol/rust-sdk \- GitHub, [https://github.com/modelcontextprotocol/rust-sdk/blob/main/examples/clients/README.md](https://github.com/modelcontextprotocol/rust-sdk/blob/main/examples/clients/README.md)  
42. A Developer's Guide to Agent Hooks in Antigravity CLI | by Kanshi Tanaike | Google Cloud, [https://medium.com/google-cloud/a-developers-guide-to-agent-hooks-in-antigravity-cli-4c1440febd11](https://medium.com/google-cloud/a-developers-guide-to-agent-hooks-in-antigravity-cli-4c1440febd11)  
43. File System \- Tauri, [https://v2.tauri.app/plugin/file-system/](https://v2.tauri.app/plugin/file-system/)  
44. Announcing imara-diff, a reliably performant diffing library for rust \- Reddit, [https://www.reddit.com/r/rust/comments/ydi7xu/announcing\_imaradiff\_a\_reliably\_performant/](https://www.reddit.com/r/rust/comments/ydi7xu/announcing_imaradiff_a_reliably_performant/)  
45. pascalkuthe/imara-diff: Reliably performant diffing \- GitHub, [https://github.com/pascalkuthe/imara-diff](https://github.com/pascalkuthe/imara-diff)  
46. imara\_diff \- Rust \- Docs.rs, [https://docs.rs/imara-diff](https://docs.rs/imara-diff)  
47. diffy\_imara \- Rust \- Docs.rs, [https://docs.rs/diffy-imara](https://docs.rs/diffy-imara)  
48. branchdiff — Rust utility // Lib.rs, [https://lib.rs/crates/branchdiff](https://lib.rs/crates/branchdiff)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABRCAYAAABv7vp/AAAEtUlEQVR4Xu3ZW47jNhAF0NlXNpD9byiJJiBAFKpISqbUtuccQGjzssSH+4NE969fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAu/jn5PNu3nFN/M/vBgA2Wr2MrdQ8Ka4nXi7js1M2XjZPbO8S9xafJ8R5YvuQZQDABU8e8jv1a457iPuJ7Vdl48U1tGy3OOasfZc4T2wfsgwAeMEnH65x7bP2O1pdY1+XXRJ3u3t8AOCEJw7/XWbrnPW/Iht79N1VebRa17vyzhnZvrKsyfIsAwBe8CmH62yds/6R0YXkUPWdzaPVut6VdyrZvrNsJKvNMgDgRU8esFfnGr036ls1GqPqu5LPnpGVmrPieNUcWXbI8iwDAF6084CNB368jFRzxbqoyg+jvlWjMUZ9mdX61bpm9P1cFcer5siyQ5ZnGQDwglcO13a492Nk7VWj2qovzhezrK//2VT5YZSN+mZW65psr4dqv6P67HNrV1nMD6sZAPCC3YdrPNjPjD+qrfrifE2f9xeOLMvavVE26ptZrWuq+j7v9xH31lSfWzvL+p+91QwAuFE89LMDPbrSvzLuqn6cOGZ1+YjtJ+yas9pv/E6zvWdryDIA4GGrB3Ksyw78TLworFipX6m5y+rcq3XfINtrlgEAN5lduq72Va6887TZGmff2SeZ7aPaa5YBwJQD5D7t0L7yHV95BwD4Ui4G78nvBQD47epff3iG3w0A8DUXtv5fj9UDAPCRnrjI7JjDpQsA+GN90iXorrX+9d/zt8fzww8AlO66BN1htNb478/sAQD4ONklps9mn0fvx59NlfeqvioHAPhK/V+e4tPXZOKlK3t/5d1svpj1qvxOcW+z508y2++s/9N8234A+BL9ARUPq9huWn61/1BdfrLsCdV6opWaXeJcbY3V81PumDvuLXt2G40Z+2L7kGUAwGarB+5q3U5xztje7ez4Z+rP1Db9O1fen7ljTADgJu96cMcLy93rPDv+mfoztYe437Pvr7hjTADgJvFy8FNGaxj17TD6Dqq+LKucqT2crb+imqPa7yHLswwAuME7HLqjNYz6dqguKS3L+s44+/7Z+itGc8y+j16WAQA3qQ7pp4zmHvWtGu1v1HcY9UVtrNEzslJzRRwztntVX5ZnGQBwk58+eEfzj/pWjS5CV/tWnXl/x3yZOGZs96q+LM8yAOAGVw7dlXdiTWz3qr7qAtPy1hfbfdZ/jjV9X6bqy7LK2dpYn6091sV2n1V9laovy7MMANhsx4FbjVHlK+JlI47VZ7EuPrEmsyvPrNTGNcd3+nZWk2W9mMd2U+WHrC/LAIAfEA/leFGorNa9IrukjLKYN7vyzJnayup3WfXFPLabKgcA3tjsAO8vQvFC1D7PxmhW6w5xvtjus/5zVhfN1l3ld8nWXLX7PMt68f2Y9bI8ywCAjVYO2+qgX3Xl3Svv7JJddDJV/slm+419WQYAvJF4UMd2U+UAANyk/wsUAABvyL/BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAP86/f1DFCGXkNTcAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAAUUlEQVR4Xu3QMQoAIAwDQP//aaWCIqFpVMSpBw6apoOlpKE6B6m8o8EutUDl4UCUTdFQlE3sg7w3CofxLmEB79JaOC6bUboqG/aR254sSOmvBkThH+FzSCAsAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAZCAYAAADnstS2AAAALklEQVR4XmNgGB7gPw6MFxBUgAyIVky0QhCgjWKifA8Dg0Ax0QpBgCTFo2AQAADzzhbqJtqHZgAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAbCAYAAAD77kbeAAAAh0lEQVR4Xu3S4QqAIAwEYN//pYv9GKzrtloo/fA+EPKaOqMxRDZzNMdy7CCWmSyfDg+pvgjLpmOHZA2ZLF+uauo32zVV/a+l9oImNfVWu6mnBeyfiFmWRzFj72+qAjyQPbO5wXpWcxFvhANhjvXVcCybwjfMNmeZy9Z8grdlz2xusnpWKyLiTgXUaJgEBAK5AAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAaCAYAAAA0R0VGAAAAjklEQVR4Xu2RUQrAIAxDvf+lN/wQQpbWFapu0AcyGkOTYWtFcY4reLahApXWsfRlqDCrhNKWwoHe8yltGSrMKtax9G145Y5T5YBQVsi8m8+W85503LHnja6Y3T+YGdUya8av5ZmCf8CHYZ393j1r6fBinpGhs4fnNNRiNaOP56GlgiG8XOmqIOLtK4riN9xDfHaKRv4oHQAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAVCAYAAABLy77vAAAAY0lEQVR4Xu2PQQrAMAgE/f+nWwgqrRldKPSWAQ+ZXYWYHf7g8uneKV4SePbGfhs48kCgCipPVFHliSpGLr83hrYfaPtt0FAPJygHPh2iJXILlA4tkVugdGhpcyHqVGpOnQNwA8k6O8XoQsxXAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAArElEQVR4Xu3SMQ7FMAgD0N7/0v+LIVIwBoM6dOFtMU7D0OdZa33uh8GQ3b+/gefbmWXzo+zRcKD8+AXn2R2WObIgdO6z5VhmWObIgtC5P1mOZY4sCOd+tpTJZizHcyALAj7Kvoedg+V4DmRBwPvZEpgZluM5kIWhbAnMDMvxHMjCULYEZobleA5koZA92MlMN3NUoZqzRd5khmWOKlRz9ijLDGbd3lpv7T818QdhcGmXEGYaugAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAAWCAYAAACBtcG5AAABKUlEQVR4Xu2Q0WrEMAwE8/8/3aIHHWI7a+/loKTFAwVrPKekua7D4XA4HG7ypeIGtaP/Vtzpdu2KdE/a/eCtGNDfuxdQl3aFa1dQT3t0LtKOZYh7yF1XOEfe4Xr1OjfqdX6BMsQtVZd2BbnCecI9r4g+yhV2KEPcUvU6N+R1bqh1rNp5t+vmGTuUIW6pep0b8jo31DpW7bzbdfOMHcoQt1S9zg15nRtqHat23u26ecYOZYhbql7nhrzODbWOVTvvdt08Y4cyxC1Vr3NDXueGWseqnXe7bp6xQxnilqpLu4Jc4TzhnldEH+UKO5SD1T0t/cQVzqnXeUJ9oV7nRr3OL1AO3r13D1KXdgW15CZ0R7/RuUi7P82/+4d+k/PxPuDxH++pL/jU9zoQ30799QvWNM50AAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAVCAYAAABLy77vAAAAaklEQVR4Xu2OQQ6AMAgE+f+nNZhAtstS7L2TeGAYVLPLKQ88O7Ydyjayuls69QWeA3alY8HziVtQgXKOch+7g84X0cVOt1MuUUfKOcol6kg5J50KwqHnOSgvmo5GNwYAu9LhX5Ul8be7AC+nFVaqvWNLyAAAAABJRU5ErkJggg==>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAVCAYAAABLy77vAAAAaElEQVR4Xu2OQQ7AIAgE+f+n29BUI+OKeHcSDs4uRLPLKc8wGWlvlMuSzVnoMVw5hy701Ff5LrltIXGOch21pJyjXEctKeco97EKjg5J+VM+xCILzBuTo1DvrWuCQ+hCj8vZIafSuYAXNEJUrNLMaqcAAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAVCAYAAABLy77vAAAAaElEQVR4Xu2MQQoAIQwD+/9P71Kwkm0SVNijAx6cJI24nPCM5/5IZTLH0JaCM+qtDhQ9p00vKGikXC8oaDSQh1w5cRkdQuEGzlvUSLlEuYkaKZdMpwq7Lvnl0MctC0B31CuBz7HbuwAvMf5Srs/hWqkAAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAAp0lEQVR4Xu3SsQ7CQAwD0P7/Txd5iMQ5rpPrIbHkSQx2DenAdY0x/u7m4gX8Rnycn+xkuYG//3SIu+4uKQeGOnrSgeoW5cDoHu3uQHWLcmC4F/nuOQfVc07KgaEOAvecg+o5J+XAUAeBe85B9ZyTcmCog8A956B6zkk5MNRB4J5zUD3npBwY6iBw192B6hbVwD1XL3LSgeoW1WD3efdFursxTs1/ascH+QRyjs7sCXsAAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAVCAYAAAAeql2xAAAA+0lEQVR4Xu2PMQ7DMAwD8/9Pt9DgQL2SNt0lBZIDPIg+KvFxPDw83IlXOzO659zESUl37Xhy2Cmu3CJxHKrLufjJcyVmBTPlcS6Ul6A6ahfnYukNoYecB8w4F6qrsgTV4S7OA+acv4ONTKGctEtcZ/qgRuqdKGlkPAk7bsd1+r7Z7tQ7UVKaKVKPuE76oNSbXqo7lXVW9ytcN31Q6vmLQxdHxrxw+Q6unz4o8hiq2WUuZ7aL6/RcfWsQeQw5F8zcsiTjrFAOv8l5wJzzR8hDmM08dToqI+pe9TgXS48/5350sHJ471yVKbjDdejMvMv5i5+4gls+/JaPvpQ3ACP6Bv2tkLAAAAAASUVORK5CYII=>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAVCAYAAAAeql2xAAAA/ElEQVR4Xu2PQQrDQAwD8/9Pt/jgsJ1KjloKKSQDOUgem+y23dzcXInH8jk4m/z1nnMS0jufeDJMizx+5LmcovaYi688t8Su6F7NVjhPdhRqR91iLg499RjmRnUJv9zjvzE37JnfC9MVqiOJk+JujQ9aSL0dJ3Xv5kX3iXuE21tvTvdTb8dJ7JgLtau6BLeTPij15qFA+cyF8hLcTvqg1PMDgzrGXLSnZhPOTx8UeSxVTjvSnppNOH/tp7uRx1LlpFMoj1mhHN5ibtgzv5T8VtKuYKc81RE1V3vMxaHXgvoI58op6CjP9YR33A6dyTudv/iJM7jkwy/56FN5ApEq8w3U0xpKAAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAVCAYAAAAeql2xAAAA/UlEQVR4Xu2P0QrDMAwD/f8/veGyQHpImbY9ZNAe9MHyyTRVNzc3V+PBQNDO+Byzs/IS0lufeKfhXaHhnvOAOecU9U+cm1+8AxlOcG8PgdQjqqNucW5S78Auyh9SGVFegurwFucBc84n7KJ8kRnngctXuE76oNTzi/JF5spp6CU4f761upt6flG+yFw5Db0E56cPSj2/KF9krpyGXoLz0welnl+ULzJXTkMvwfnpg1LPL8oXmXEeuHyF68y5+68m9fyidNFlJPWIcniL84A55xN28YL75bEJ5amMqL3qcW4ib0j8FN84ynM54R3XobPytvMXP7GDSz78ko/eyhO8Rdsl0UXTMQAAAABJRU5ErkJggg==>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAVCAYAAADmSqZGAAAAyklEQVR4Xu2QUQrDMAxDe/9LbyQsJX2VZXe0DEYe+MOSLJpu22KxeJoXhYSr+QjX07x5Ik5+5YhczUe4HuVxb6jcTmiAb36CIutRuspzP2DNiexjqmQ9Smee+wlrfhiZtCyh0lPR3X3HmiAtK+J6nF75KR1rgrSsiOtx+i2PopeWBfDG9Th9PSpiHEdThXecGe6DWVd3B6wJ0rIirkfpzHM/YU3gyiJdcbVH5bl3RpCjYEZluSt4r3oa9FWm4bxbeLT8V/zloxZ38gYg+6dZcSimNQAAAABJRU5ErkJggg==>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAArklEQVR4Xu2SQQrDMAwE8/9Pt1ig4g67sRwfctFAIDteyTnkupqmeZ3P9DyluuOoR8FchTNuD12194MHzBXUpSduoJwt7+L20FV7A+X+FuS7LC5wc/TMifLMgfpI5gpuhp45UZ45cEW6FW6GnjlRnjlwRboVboaeOVGeOXBF5e9wfXrmRHnmwBWVv8P16aq9gXIBD3aWJmrmxA2UCzjAnCg3w/PqnmqvaU7pf2qHL84vlGwO09xpAAAAAElFTkSuQmCC>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAAqUlEQVR4Xu2SOw6EQAxDuf+lQYMEyjqOk8wWNHkSBf7EFBzHMAyfcprnXyo3qns0x0pMq6K6bjzQFkzrhYuoLttj2iLSnYHvXVSX3Wbagmk3WAiDRVQft6yGumSrFKBusI2tbVtqFQlZH/32rg22y4Ssu7P3+ixYPRJR6dn72daPHwWzI4puT205TwURpjGyHPruowxOj8JVjaFyuIfvlsdTmWHoMP9RhwvBrHONqmJS7AAAAABJRU5ErkJggg==>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAVCAYAAABLy77vAAAAUUlEQVR4Xu3MQQrAIAxEUe9/aQtxKmH8Kd24ywM3PzFjtFtmeofPYeI75X45EJ/74Q2j0CdqAaNUn6hxlD60YJSrh6gFjInPj0Nv8Ef+7DTzABNFPMTbyMfCAAAAAElFTkSuQmCC>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAAsklEQVR4Xu2SMQ4CMQwE8/9PH4qFUW5ubRxS0Hgkih12TQrGaJrmr1zL54TqnaOeGin3DW4eP/SGrtoztsoJ6s6JmyhncMBcIdrQVXsT5QweCYsJvOHQMzvKM9/wQVpKiLb0zI7yzDfWB6fFgGhHz+woz/xBHQzLAdGGntlRntlQ8pdHR316Zkd5ZkPKoQ9kRH26am+inJZDe+Uc9ZATN1Fuq6zcCr+v3q72muaU/k/t8AJS0Ix0JDRBTwAAAABJRU5ErkJggg==>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAApUlEQVR4Xu2SQQrDMAwE8/9Pp8igQsa7sYJ7aEADPuxYK3zwcTRN8zecFA+Ibp47fjJ3e1mAPbeLrjo3sfNg1dtxgXITrrzC9eiqc4FyX/LSLVzhevTMifLMF1714MrCFa5Hz5wozzygVMUKrkfPnCjPPKBUxQquR8+cKM88yEF3qrh5uupcoNyEWxg4H6jejguUm3DlwPmE924XXXWuaXbpP/WED1wvina9Qco7AAAAAElFTkSuQmCC>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAVCAYAAAC33pUlAAAAhklEQVR4Xu2OQQqAMAwE/f+nlZYG0u00iTfBDnjI7rh6XYc/cI9nd3usW/ptIXgv8jXXu4OhI/uIob3eHQwdWd+gn9G7g6Ej6xv0MSSTrI8Go24ik3SIfHW2lCQHDVOGlCQHDVOGRBKNVDMkkmjkTbaA4WA3ollDs+m2l/RRtCfHqHqHj/IArTdapmNst0cAAAAASUVORK5CYII=>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAVCAYAAADmSqZGAAAAyklEQVR4Xu2P4QqEMAyD9/4vfUflKjVLuioT8dgH+9Gkiba1xWJxNx8UCLYT31WqHdXvdX4l5MSdagbBDM4O68fZYHs70viBflqWgBnVozTUcT6Qmq33ca6gfgo1Q2lRx7kjM4fhIqqnqhnTj8J3FpVjOs5O3GW5A5nJwkwboTJMx9lZR2UmC7uGeobaZzrOzquOQphmRF317aRm6/1hIYFlmGYo7ZGjmBZB/0wP28V5wxfxMao7Iyo9Bu6p3cybwq3lT/GXRy1m8gU3ybRMAGFgCQAAAABJRU5ErkJggg==>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAe0lEQVR4Xu2QSwrAMAhEc/9LtytLOjiOjYRQ8EEX0fkkHaP5C5fzVXchTKiC2JzCDFGRN5MwEyvCcxrPaLNjRZ42DZoxGM/LoBmD59eVwOCZL0Vq/4R5QjZfhoVFlzDU/gUTqhDbKZ0kG5DRlMlepsz8+7ZiL9pe1DSaG87iUq4IZ/xyAAAAAElFTkSuQmCC>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAaCAYAAAC3g3x9AAAAYElEQVR4Xu2RSQoAIAwD/f+nlYJCcYlprQfBAU+dRIspfW6QyWMChdBsyS60mw8g2bU2ks1lAgqEFbpWFXTQXaI5Cs8ILWTXYz1KbHPo9R8A5Qrj0LCX0oSWCeEv/LxEAdsaOsbNHmXUAAAAAElFTkSuQmCC>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABVCAYAAAD0f7hpAAADmklEQVR4Xu3ZW66cMAwA0LuD7n9lXU6r+YiUWs6LgZlQzpFQhe04Ge4HFv35AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoPanugAA2JSBDQD4r+w+2Bw5n4ENALhE/V95ZdgYxa6S9Y/3V2jtUcfjM2mdNcYAAE6RDRqt2FVa+8XYmVqDV9HLZVbrAQCmZYNGjMX8UVmfLFb0ci0ra+LvjHq5WukzWw8AsCQOGtnwccYgEnu2YrVermVlzRX7AwCcrh5a6n/PHlaynlnsXSv9rtgfAOB02dCSDXGzWvWtfVpiLt4XpW/vahnlAQC2kA02WWxWa03WL96fYaVndiYAgC3FoaU3yPRyPdm6LPYSY626zGzdy6hvLwcA8FFxMLlikMl6ZrGo5Ed1xWzdy2j/Xg4AYGtHB5mj61acuceZvQAAPmb1i1ftyJqXlT1namaMvr4BADcQX+Ze8HPu8ozuck4AoCEbzrIYAABfkg1nWQwAgC+Jw1m8byl1vavnl+vRFwCwYDRkZbEzxH1dz7l+/wAAS14vUAAANtYb2MoXkUz8apJdAAC8aTRUjfI7uMMZn8rgDgBvmvka1orvJJ7/Dmd+En8PALhYHIZ2U85Wn3Pn8z6RvwcA/CdmXurZ8Bi/rMX8HfTOXH5T/J3fkO1bny8760u8BwBuKnvRZ0Y1o/xINnTMxs4W+39iz6K1Ryvec2QNALCp2Rd7qbtqeIk9s33i/VGtPqvxkdV1q/Ut5dmd1Q8A2MAOL/Z4hisHjqxvb79WfGR13Wo9APAgvWHlU7L961iWPyrrlcXetdqzV9/LAQAP8e2BIBvOstgZYq+rBtbVnr36Xg4AeJCrBpcZvSGtdaZW/GUlF+9HWvXl+fWunl6+lwMA+IhsoIn3Z4l9432tlxtZXdur7+UAgIdYHQhm67NBLJPVZbGilxvJ1q3Esnhmtq7o1fdyAMADXD0MzPTParJYbZRvydaVQay+Wnq52kpdvKIsBgDwj3pgaA0VLSu1K472PbqumF0/WwcA0DQ7UGR1WaxlpXZ33/gt39gTALiR1te07ItbvOr8bo6e6ei6o+KzBACYsjJAZAPcu87uN+sbewIAHGJwAQDYmGENAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID9/QV2Iy5O3cOecgAAAABJRU5ErkJggg==>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAaCAYAAABYQRdDAAAAY0lEQVR4Xu2PgQoAEAxE/f9PE3Wya3HKlPJqyXYeUvrcIg/Ffaw8WzI7cFwIlExHfYWSaajCiprbkkpAGCI9yo6Uc7zvqFIlY1iJvZnXM8ykXh89b2aAmOsqIReG/CRE+nmZAgX8Ms66GEgkAAAAAElFTkSuQmCC>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAdCAYAAABmH3YuAAAAMklEQVR4XmNgGALgPxRjAJwSNAI47YMJYihA5mBIIgO8EuRLYmOj6MKqG6YAq+QowAYAU2MY6Aa+N70AAAAASUVORK5CYII=>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAAV0lEQVR4Xu2QQQoAIQwD/f+nXbyIG8YaRMFDBzxohrRYSrJDlaNoTk7HkhzsiS7Xi+htCZXp3WK7SCX6dHUQksYiypGZSJtNiaRjRY1V/psWyVGWJO/wAdUuMs6Q8HDfAAAAAElFTkSuQmCC>

[image30]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEoAAAAaCAYAAAAQXsqGAAAAyElEQVR4Xu2UCwrDMAxDe/9Lb2zg4WlyI0OTUKYHpY0if+qSHocxxpi78IC7IbyGky9T4OGIeFAC8nHD81mdVdQrL9NWgP2M+kDPmfdNbGYTCzpLyHT0zEZ9D0Tx/CTNz7hmesB0XM+E9RrPoz4UzxeKuUqKWuVjhFe9rqaVU22CeVgs01bQrdnuUw1gHoxl61V0a2GvQ9QA5kEt58K92XTrqe/9oWVOVIVCZ3sz6dbr+v+SHR/ylnhQA2I4HtKAXf9PY4wxO3kCEHaMdGByKv8AAAAASUVORK5CYII=>

[image31]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAaCAYAAADi4p8jAAAAz0lEQVR4Xu2P0QrDMAwD+/8/vTFoRqtZOrfsYTAfBJro5DTbNgzDL/I4LDo/nn0rO6KOW22o4DLXo59w5wrNcNkHJLrcXZIeWJ053IwXKTvRkZzjLnEP1H2i6ivooLDjnKq/9inrUPUVdFAAqr57oHqE9iuis0IrNNC+fuv+CtpX8P9j2ERn6PfaX71H51agg0KD9IiUEZ1/QweFneSsGZXjzjtQl/I3JKZs4Zz0+AR1KD+RZHeuOC/NTqReyiyrpKuLc+/MoTUMwzAMw7/zBHTetUuLqPDPAAAAAElFTkSuQmCC>

[image32]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAaCAYAAADi4p8jAAAA0ElEQVR4Xu2R4QrCYAhF9/4vXfjDcGdXN+Nj0PJANI9XXbRtwzA8lRc+P0P3Ze/6gctudBd189+y7E5n0Z3/3rI7nUVLDxe07ng4DkSn+hFmVI797BbJctXMDrXgKsyzdjJHz9pQzsj8Ab4gUc7hS7J2MhfzalY5I/MSHiKVZy9zCmZZZ87IfEk2pJyh8qwN5Yw4r3YZyhmZ36GWqjo6Pp/V8TuissxFd5aVMMiaruqxpo9wruMMepX54GEORa70vM/a6dxR+whzwzAMwzD8C2+iabFPkNK7FgAAAABJRU5ErkJggg==>

[image33]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAaCAYAAADi4p8jAAAAuUlEQVR4Xu2U0QqEMAwE/f+f9lDIEcZtmr5dvR0QzWbSVgSPwxjzVk5c27B62L94wa1YOfB2X+9i5cA/+YLqx5Az1c/QUV7VZ095zJUjUYt0oc866GScVXWVD5nJKgvUZpWfyQeO+2itUR51SQyMxCpnr8p4EZUput6D1Y2Vz/pCZUStpeh6N0pWdc74PKvzndAdeZmud0OZNbOqx5o5qWYrut6XGKgGO73osw5m+6hM0fWMMcYY81Y+ntyhX196ccIAAAAASUVORK5CYII=>