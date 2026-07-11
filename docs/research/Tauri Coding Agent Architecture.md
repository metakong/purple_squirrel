# **Production-Ready Implementation Blueprint: High-Efficiency, Zero-Cost Local Coding Agent GUI via Tauri 2.0 for Windows 11 Home ARM64 Snapdragon Laptops**

## **WebView2 Windows ARM64 Memory Optimization and System Architecture**

Building a highly responsive coding agent GUI on a Snapdragon-powered Windows 11 Home ARM64 laptop constrained by a strict ![][image1] RAM ceiling requires a radical departure from traditional desktop application paradigms1. While native Rust execution paths in Tauri 2.0 consume as little as ![][image2] of memory, launching the interface instantiates a Microsoft Edge WebView2 rendering container based on the Chromium architecture3. Under default configurations, this container initializes a complex tree of helper processes, GPU utilities, and V8 engine instances that easily balloon to ![][image3] to ![][image4] for a simple window, with the potential to exceed ![][image5] during heavy unoptimized operations1.  
This overhead is highly problematic on system architectures with unified memory designs, such as the Snapdragon ARM64 SoC6. Within these platforms, the CPU and integrated GPU share a single physical pool of ![][image1] of RAM6. When heavy background tasks compete with the frontend interface for memory, the system experiences aggressive page faulting, forcing the operating system to swap memory pages to disk, causing severe latency and system lag2.  
To eliminate this bottleneck, the application implements a strict "Thin Client, Heavy Cloud" architectural pattern2. All complex parsing, file system event tracking, AST generation, and payload building are offloaded to optimized, native Rust targets compiled explicitly for the aarch64-pc-windows-msvc triplet7. The WebView2 component is restricted to functioning as a stateless, lightweight rendering layer9.  
The most critical factor in mitigating unmanaged memory growth inside the WebView2 container is the elimination of push-based IPC communication9. When a Tauri application pushes data to the frontend by executing stringified scripts via standard Eval or ExecJS calls, the browser engine allocates unmanaged un-tracked string buffers to transmit the serialized payload9. This design creates immediate unmanaged memory bloat, as the native host application cannot verify when these transient strings are garbage-collected by the V8 runtime9. Under rapid streaming or large file notifications, these orphaned allocations stack up, putting immense pressure on the IPC buffer and causing the rendering window to crash once the webview’s unmanaged memory limit of ![][image6] is breached9.  
The solution lies in implementing a strict pull-based frontend architecture9. The frontend UI must poll the backend using distinct, type-safe Tauri command boundaries or establish highly bounded, chunk-based event channels that handle data strictly within designated frame buffers7. Additionally, configuring platform-specific browser switches via the WEBVIEW2\_ADDITIONAL\_BROWSER\_ARGUMENTS environment variable forces the Edge engine to prune unneeded services, lock unmanaged heap allocations, and execute aggressive V8 garbage collection cycles2.

### **WebView2 Bootstrap Configuration**

By setting system-level environment variables during the application's initialization sequence, the system modifies the instantiation behavior of the Chromium runtime2. This configuration forces Edge to disable unnecessary sub-components, optimize unmanaged heap lifecycles, and prioritize a minimal memory footprint over browser-level caching2.

Rust  
// src-tauri/src/main.rs  
use std::env;

fn main() {  
    // Configure ARM64-specific unmanaged memory limits before building the window  
    optimize\_webview2\_environment();  
    tauri\_app\_lib::run();  
}

fn optimize\_webview2\_environment() {  
    \#\[cfg(target\_os \= "windows")\]  
    {  
        // Assemble Chromium switches to minimize memory allocation  
        let edge\_arguments \= concat\!(  
            "--js-flags=--scavenger\_max\_new\_space\_capacity\_mb=8 ", // Constraints V8 scavenger GC memory allocation  
            "--disable-features=msWebOOUI,msEdgeExtensionService,msFeed ", // Strips non-essential Edge UI bloat  
            "--disable-gpu-program-cache ", // Prevents unmanaged shader memory allocation  
            "--disable-background-networking ", // Blocks telemetry and pre-fetching  
            "--disable-renderer-backgrounding ", // Prevents inactive process memory leaking  
            "--disable-web-security ", // Enables local file proxy operations  
            "--enable-low-end-device-mode ", // Forces aggressive tab discarding  
            "--renderer-process-limit=1" // Restricts render processes to a single worker pool  
        );  
        env::set\_var("WEBVIEW2\_ADDITIONAL\_BROWSER\_ARGUMENTS", edge\_arguments);  
    }  
}

Passing \--js-flags=--scavenger\_max\_new\_space\_capacity\_mb=8 enforces highly aggressive minor garbage collection sweeps in the V8 heap, preventing unmanaged memory expansion11.

### **Target Platform Configuration (tauri.conf.json)**

To target Windows ARM64 explicitly, optimize the Tauri runtime, and restrict capabilities to preserve memory, the configuration file must be tailored as follows7:

JSON  
{  
  "productName": "VibeCommand",  
  "version": "1.0.0",  
  "identifier": "com.vibecommand.app",  
  "build": {  
    "beforeDevCommand": "npm run dev",  
    "beforeBuildCommand": "npm run build",  
    "frontendDist": "../dist"  
  },  
  "app": {  
    "windows": \[  
      {  
        "title": "Vibe Command Center",  
        "width": 800,  
        "height": 600,  
        "resizable": true,  
        "fullscreen": false  
      }  
    \],  
    "security": {  
      "csp": "default-src 'self'; connect-src 'self' https://openrouter.ai https://api.moonshot.ai https://generativelanguage.googleapis.com https://api.mistral.ai;"  
    }  
  },  
  "bundle": {  
    "active": true,  
    "targets": \["nsis"\],  
    "windows": {  
      "nsis": {  
        "oneClick": true,  
        "perMachine": false,  
        "allowElevation": false,  
        "allowToChangeInstallationDirectory": false  
      }  
    }  
  }  
}

## **The Mid-2026 Open-Weight Coding Model Matrix**

To maximize token-generation efficiency under zero-cost developer tier loops, the command center routes developer prompts across a highly structured, open-weight model matrix14. Flagship orchestrators handle complex planning and multi-file code structural reasoning17. Sub-agents are queried for inline autocompletes, continuous parsing, and quick single-file modifications17.  
The following matrix documents the top models available in mid-202617:

| \# | Model Identifier | Tier | Host API Provider | Endpoint URL Target | Native Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | deepseek-v4-pro | Flagship Orchestrator | DeepSeek Direct | https://api.deepseek.com/chat/completions \[cite: 25\] | ![][image7] \[cite: 17, 26\] |
| 2 | deepseek-v4-flash | Fast Sub-Agent | DeepSeek Direct | https://api.deepseek.com/chat/completions \[cite: 23, 25\] | ![][image7] \[cite: 17, 23\] |
| 3 | kimi-k2.7-code | Flagship Orchestrator | Moonshot Platform | https://api.moonshot.ai/v1/chat/completions \[cite: 27, 28\] | ![][image8] \[cite: 27, 29\] |
| 4 | kimi-k2.7-code-highspeed | Fast Sub-Agent | Moonshot Platform | https://api.moonshot.ai/v1/chat/completions \[cite: 18, 27\] | ![][image8] \[cite: 18, 27\] |
| 5 | kimi-k2.6 | Flagship Orchestrator | Moonshot Platform | https://api.moonshot.ai/v1/chat/completions \[cite: 18\] | ![][image8] \[cite: 18, 30\] |
| 6 | kimi-k2.5 | Flagship Orchestrator | Moonshot Platform | https://api.moonshot.ai/v1/chat/completions \[cite: 18\] | ![][image8] \[cite: 18\] |
| 7 | qwen/qwen3-coder | Flagship Orchestrator | OpenRouter Free | https://openrouter.ai/api/v1/chat/completions \[cite: 31\] | ![][image9] \[cite: 31\] |
| 8 | qwen/qwen3-coder-next | Flagship Orchestrator | Hugging Face Local | http://localhost:8000/v1/chat/completions \[cite: 32, 33\] | ![][image10] \[cite: 32, 33\] |
| 9 | mistral-small-latest | Flagship Orchestrator | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 34, 35\] | ![][image8] \[cite: 20, 36\] |
| 10 | mistral-medium-3-5 | Flagship Orchestrator | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 34, 35\] | ![][image8] \[cite: 37\] |
| 11 | devstral-2-123b | Flagship Orchestrator | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 22, 38\] | ![][image8] \[cite: 38\] |
| 12 | devstral-small-2507 | Fast Sub-Agent | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 39\] | ![][image9] \[cite: 40\] |
| 13 | gemini-3-flash | Fast Sub-Agent | Google AI Studio | https://generativelanguage.googleapis.com \[cite: 41, 42\] | ![][image7] \[cite: 43, 44\] |
| 14 | gemini-3.1-pro-preview | Flagship Orchestrator | Google AI Studio | https://generativelanguage.googleapis.com \[cite: 41, 42\] | ![][image11] \[cite: 44\] |
| 15 | gemini-3.1-flash-lite | Fast Sub-Agent | Google AI Studio | https://generativelanguage.googleapis.com \[cite: 41, 42\] | ![][image7] \[cite: 45\] |
| 16 | codestral-2508 | Fast Sub-Agent | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 37\] | ![][image9] \[cite: 37\] |
| 17 | ministral-3-14b | Fast Sub-Agent | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 37\] | ![][image9] \[cite: 37\] |
| 18 | ministral-3-8b | Fast Sub-Agent | Mistral Platform | https://api.mistral.ai/v1/chat/completions \[cite: 37\] | ![][image9] \[cite: 37\] |
| 19 | kimi-dev-72b | Flagship Orchestrator | OpenRouter | https://openrouter.ai/api/v1/chat/completions \[cite: 46\] | ![][image9] \[cite: 46\] |
| 20 | moonlight-16b-instruct | Fast Sub-Agent | OpenRouter | https://openrouter.ai/api/v1/chat/completions \[cite: 46\] | ![][image9] \[cite: 46\] |

### **Free-Tier Provider API Payload Formats**

To successfully call these models through their respective free tiers without hitting schema validation errors, the payload must conform to the target platform's specifications18.

#### **1\. Google AI Studio — gemini-3-flash**

Enabling reasoning on Gemini 3 requires passing thinkingLevel within the generationConfig block41. The system rejects legacy thinkingBudget properties if targeting Gemini 3 models, returning a 400 Bad Request44.

JSON  
{  
  "contents": \[  
    {  
      "role": "user",  
      "parts": \[  
        {  
          "text": "Refactor the file-watcher service in Rust to use non-blocking async events."  
        }  
      \]  
    }  
  \],  
  "generationConfig": {  
    "thinkingConfig": {  
      "thinkingLevel": "HIGH"  
    },  
    "temperature": 1.0,  
    "maxOutputTokens": 16384  
  }  
}

#### **2\. DeepSeek API — deepseek-v4-pro (Reasoning Enabled)**

DeepSeek requires passing the thinking toggle within extra\_body when calling through standard OpenAI SDK wrappers, or as a direct request parameter25. Setting standard penalty or temperature parameters when reasoning is enabled has no operational effect, but does not trigger an error47.

JSON  
{  
  "model": "deepseek-v4-pro",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Verify correct alignment of the memory layout in our ARM64 structs."  
    }  
  \],  
  "thinking": {  
    "type": "enabled"  
  },  
  "reasoning\_effort": "high",  
  "stream": true  
}

#### **3\. platform.kimi.ai — kimi-k2.7-code**

The Kimi coding model enforces a strict payload policy: temperature must be exactly 1.0, and top\_p must be exactly 0.9527. Passing other values returns a fatal error27. Reasoning cannot be disabled27.

JSON  
{  
  "model": "kimi-k2.7-code",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Rewrite the atomic-write function to support parallel file descriptor flushes."  
    }  
  \],  
  "max\_tokens": 16000,  
  "temperature": 1.0,  
  "top\_p": 0.95,  
  "stream": true  
}

#### **4\. Mistral API — mistral-small-latest (Mistral Small 4\)**

Mistral manages reasoning configuration through a top-level reasoning\_effort string parameter, yielding structured JSON chunk outputs when activated20.

JSON  
{  
  "model": "mistral-small-latest",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Analyze these diagnostic logs and pinpoint the memory corruption origin."  
    }  
  \],  
  "reasoning\_effort": "high",  
  "temperature": 0.7,  
  "stream": false  
}

### **Multi-Turn Context Conservation Requirements**

A common point of failure in complex agentic integrations is the handling of model reasoning states across successive conversation iterations18. Under standard execution flows, the API returns two distinct fields: reasoning\_content (the internal thought-tracing trace) and content (the final output response)18.  
For DeepSeek V4 models, a strict contextual contract exists. If the assistant does not execute a tool call during a turn, the generated reasoning\_content must not be included in subsequent history arrays; passing it back will return a 400 Bad Request47. However, if the assistant did execute a tool call, the generated reasoning\_content must be appended to the message array for all subsequent turns47. Failing to structure the conversation object to reflect these conditions will immediately break the agent loop50.  
For Kimi models, the "Preserved Thinking" mechanism is managed differently. In Kimi K2.6, passing historical reasoning is controlled by setting thinking.keep to "all"18. On the latest Kimi K2.7 Code model, "Preserved Thinking" is locked to an always-active state18. The local application must retain the exact reasoning\_content field returned in all preceding assistant messages18:

JSON  
\[  
  {  
    "role": "user",  
    "content": "Locate the file manipulation block in our Tauri backend."  
  },  
  {  
    "role": "assistant",  
    "reasoning\_content": "The system needs to identify where file-handling logic is written. Scanning src-tauri/src/main.rs...",  
    "content": "The file handling logic is defined inside the command boundary in \`src-tauri/src/file\_ops.rs\`."  
  },  
  {  
    "role": "user",  
    "content": "Optimize that specific file manipulation block."  
  }  
\]

Under OpenRouter, these tracking requirements are abstracted into a single, structured array named reasoning\_details or represented as inline reasoning keys on the assistant object, preventing context degradation during multi-turn cycles51.

## **Tauri 2.0 Native File System Interaction and Asynchronous Patching**

To circumvent unmanaged JavaScript heap allocation spikes on Windows ARM64 during extensive file operations, the application offloads all directory traversing, filter matching, and file-writing actions to native Rust commands2. The architecture leverages the ignore crate to parse .gitignore and .taurignore files natively, preventing the tokenization of heavy build artifacts (target/, node\_modules/, .git/)54.  
File writing implements an atomic commit pattern using atomic-write-file59. Instead of writing directly to the source file, which risks corruption during thermal throttling or system interruption, the update is piped to a randomized temporary file inside the target directory and subsequently renamed via a single, atomic POSIX/Windows-compatible OS syscall59.  
Unified diff patching is executed natively via diffy, resolving code blocks returned from cloud endpoints and mapping them line-by-line using Myers' algorithm63.

### **Native File System Controller Implementation**

Rust  
// src-tauri/src/file\_ops.rs  
use std::fs;  
use std::path::{Path, PathBuf};  
use ignore::WalkBuilder;  
use atomic\_write\_file::AtomicWriteFile;  
use std::io::Write;  
use diffy::{Patch, apply};

\#\[derive(serde::Serialize, serde::Deserialize)\]  
pub struct FileEntry {  
    pub name: String,  
    pub path: String,  
    pub is\_dir: bool,  
}

\#\[derive(serde::Serialize, serde::Deserialize)\]  
pub struct PatchPayload {  
    pub file\_path: String,  
    pub diff\_content: String,  
}

/// Recursively scans target directories while natively matching .gitignore and .taurignore files.  
\#\[tauri::command\]  
pub async fn recursive\_scan(root\_path: String) \-\> Result\<Vec\<FileEntry\>, String\> {  
    let root \= PathBuf::from(\&root\_path);  
    if \!root.exists() {  
        return Err("Target workspace directory does not exist.".to\_string());  
    }

    let mut entries \= Vec::new();  
    // Initialize parallel-optimized directory walker ignoring hidden paths by default  
    let walker \= WalkBuilder::new(\&root)  
        .hidden(true)  
        .git\_ignore(true)  
        .parents(true)  
        .build();

    for result in walker {  
        match result {  
            Ok(entry) \=\> {  
                let path \= entry.path();  
                // Exclude the root directory itself from output metadata  
                if path \== root {  
                    continue;  
                }  
                  
                let relative\_path \= path  
                    .strip\_prefix(\&root)  
                    .unwrap\_or(path)  
                    .to\_string\_lossy()  
                    .to\_string();

                entries.push(FileEntry {  
                    name: path.file\_name().map(|n| n.to\_string\_lossy().to\_string()).unwrap\_or\_default(),  
                    path: relative\_path,  
                    is\_dir: path.is\_dir(),  
                });  
            }  
            Err(e) \=\> return Err(format\!("Directory traversal failed: {}", e)),  
        }  
    }  
      
    Ok(entries)  
}

/// Performs multi-file atomic write operations to guard against source file corruption.  
\#\[tauri::command\]  
pub async fn write\_file\_atomically(target\_path: String, content: String) \-\> Result\<(), String\> {  
    let path \= PathBuf::from(\&target\_path);  
      
    // Ensure parent directories are physically present  
    if let Some(parent) \= path.parent() {  
        if \!parent.exists() {  
            fs::create\_dir\_all(parent).map\_err(|e| e.to\_string())?;  
        }  
    }

    // Initialize transactional file handle in target directory  
    let mut file \= AtomicWriteFile::options()  
        .open(\&path)  
        .map\_err(|e| format\!("Failed to initialize atomic tempfile: {}", e))?;

    file.write\_all(content.as\_bytes())  
        .map\_err(|e| format\!("Atomic buffer write failed: {}", e))?;

    // Commit tempfile to stable storage via atomic rename syscall  
    file.commit()  
        .map\_err(|e| format\!("Failed to commit atomic transaction: {}", e))?;

    Ok(())  
}

/// Line-by-line parsing of Unified Diffs using Myers' Algorithm.  
\#\[tauri::command\]  
pub async fn apply\_unified\_patch(payload: PatchPayload) \-\> Result\<String, String\> {  
    let file\_path \= PathBuf::from(\&payload.file\_path);  
    if \!file\_path.exists() {  
        return Err(format\!("Patch target file not found: {:?}", file\_path));  
    }

    let original\_content \= fs::read\_to\_string(\&file\_path)  
        .map\_err(|e| format\!("Failed to read original target file: {}", e))?;

    // Parse unified diff envelope returned from the cloud model  
    let parsed\_patch \= Patch::from\_str(\&payload.diff\_content)  
        .map\_err(|e| format\!("Malformed unified diff formatting: {}", e))?;

    // Generate patched string output  
    let patched\_content \= apply(\&original\_content, \&parsed\_patch)  
        .map\_err(|e| format\!("Failed to apply patch hunks to target: {}", e))?;

    // Direct write patched contents back to source atomically  
    write\_file\_atomically(payload.file\_path, patched\_content.clone()).await?;

    Ok(patched\_content)  
}

### **Unified Diff Analysis and Execution Cycle**

The parsing pipeline mimics the code patch execution systems found in contemporary developer engines38. When the cloud-based LLM returns a markdown block containing changes, the frontend uses string search bounds to locate the code block, avoiding the execution of heavy regex engines in the browser runtime7. It then passes the block to the native apply\_unified\_patch function63.  
The Myers' algorithm implementation in the backend analyzes the block, matching anchors up and down from the targets to apply changes even if local file offsets have shifted63. Because the temporary file writing handles unmanaged buffers natively inside the operating system, the layout prevents visual lockups in WebView2, maintaining interface responsiveness2.

## **Context Compression and Zero-RAM Project Indexing**

Running heavy local neural databases or hosting vector embedders like Ollama requires continuous CPU allocation, which degrades performance on Snapdragon processors1. Instead of computing mathematical representations, the system compiles a lightweight, structural outline of the target codebase65.  
This outline contains file structures, function definitions, classes, and properties, stripping out helper loops, assignments, and logic bodies65. This process compresses raw codebases into structural summaries, minimizing token overhead when calling massive remote model windows43. This structural parsing is written directly in the native compiled layer, bypassing V8 memory boundaries and keeping RAM usage near zero5.  
This structural representation is coupled with a strict context engineering schema66. Identity rules, styling choices, and project guidelines are declared inside a standard CLAUDE.md profile at the root of the workspace directory67. This profile is loaded during the initial conversation turn, using prefix-matching caching on endpoints like Gemini to keep the context active in the cloud27. The model caches stable prompt headers, cutting down input costs and latency on successive turns27.

Original Class (150 Tokens)                  Compressed Outline (20 Tokens)  
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐  
│class ProjectAnalyzer {               │     │class ProjectAnalyzer {               │  
│  constructor(dir: string) {          │ ───\>│  constructor(dir: string);           │  
│    this.dir \= dir;                   │     │  analyzePaths(filter: string\[\]): fn; │  
│  }                                   │     │}                                     │  
│  analyzePaths(f: string\[\]) {         │     └──────────────────────────────────────┘  
│    // Strip 50 lines of complex loop │  
│  }                                   │  
│}                                     │  
└──────────────────────────────────────┘

The context compression efficiency is represented by the following relationship:  
![][image12]  
Maintaining a ![][image13] guarantees an ![][image14] reduction in required context window allocations65.

### **Code Signature Profiler Implementation**

Rust  
// src-tauri/src/compressor.rs  
use std::fs::File;  
use std::io::{BufRead, BufReader};  
use std::path::Path;

\#\[derive(serde::Serialize)\]  
pub struct LineOutline {  
    pub line\_number: usize,  
    pub content: String,  
}

/// Scans source files to extract structural signatures, discarding function bodies.  
pub fn generate\_structural\_map(file\_path: \&Path) \-\> Result\<Vec\<LineOutline\>, std::io::Error\> {  
    let file \= File::open(file\_path)?;  
    let reader \= BufReader::new(file);  
    let mut map \= Vec::new();

    for (index, line\_result) in reader.lines().enumerate() {  
        let line \= line\_result?;  
        let trimmed \= line.trim();  
        let line\_num \= index \+ 1;

        // Perform lightweight signature isolation across standard programming paradigms  
        if trimmed.starts\_with("fn ")   
            || trimmed.starts\_with("pub fn ")  
            || trimmed.starts\_with("struct ")  
            || trimmed.starts\_with("pub struct ")  
            || trimmed.starts\_with("class ")  
            || trimmed.starts\_with("interface ")  
            || trimmed.starts\_with("pub trait ")  
            || (trimmed.starts\_with("export const ") && trimmed.contains("=\>"))  
        {  
            map.push(LineOutline {  
                line\_number: line\_num,  
                content: trimmed.to\_string(),  
            });  
        }  
    }  
      
    Ok(map)  
}

The resulting structural footprints across typical code bases are compared in the following table65:

| Codebase / Target File | Original Line Count | Compressed Line Count | Uncompressed Tokens | Compressed Outline Tokens | Effective Compression Ratio (Cratio​) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| file\_ops.rs (Backend Rust) | ![][image15] lines | ![][image16] lines | ![][image17] | ![][image18] | ![][image19] |
| App.tsx (Vite Frontend Core) | ![][image20] lines | ![][image21] lines | ![][image22] | ![][image23] | ![][image24] |
| parser\_daemon.go (Go Service) | ![][image25] lines | ![][image26] lines | ![][image27] | ![][image28] | ![][image29] |
| main.py (Orchestration Script) | ![][image30] lines | ![][image31] lines | ![][image32] | ![][image33] | ![][image34] |

## **Resilient Automatic Failover and Rate-Limit Pooling**

Free API endpoints enforce tight usage thresholds14. Operating continuously within these limits requires an automatic, client-side rotation system16.

                       API Key Rotation Workflow  
                       
                        ┌──────────────────┐  
                        │   User Prompt    │  
                        └────────┬─────────┘  
                                 │  
                                 ▼  
                     ┌───────────────────────┐  
                     │ Select Active Key     │◄────────────────┐  
                     │  from Available Pool  │                 │  
                     └───────────┬───────────┘                 │  
                                 │                             │  
                                 ▼                             │  
                     ┌───────────────────────┐                 │  
                     │  Dispatch API Request │                 │  
                     └───────────┬───────────┘                 │  
                                 │                             │  
                        ┌────────┴────────┐                    │  
                        │                 │                    │  
                        ▼ (HTTP 200\)      ▼ (HTTP 429 / 503\)   │  
                  ┌───────────┐     ┌───────────┐              │  
                  │  Stream   │     │ Mark Key  │              │  
                  │  Output   │     │ Exhausted │              │  
                  └───────────┘     └─────┬─────┘              │  
                                          │                    │  
                                          ▼                    │  
                                    ┌───────────┐              │  
                                    │ Rotate to │──────────────┘  
                                    │ Next Key  │  
                                    └───────────┘

The rotation layer manages a pool of developer API keys locally70. If a remote call returns an HTTP 429 Too Many Requests or 503 Service Unavailable status code, the client intercepts the failure, extracts the Retry-After header value, marks the failing key as temporarily unavailable, and immediately retries the request using the next available key16.  
If the entire key pool is exhausted, the model routing layer degrades the session16. It drops the prompt from a flagship model (like DeepSeek Pro) to a fast, lighter fallback (like Mistral Small 4\) to ensure generation continues uninterrupted16.  
When streaming data over SSE (Server-Sent Events), the client parses individual lines incrementally73. If a rate limit error is triggered during an active stream, the rotator catches the error before displaying it to the user, swaps the configuration, and restarts the stream70.  
The rotator also handles corrupted payloads74. Some platform providers return malformed JSON envelopes on 429 errors during SSE transmissions (such as stray commas in Google's error response)74. If passed directly to standard JSON parsers, this formatting anomaly crashes the stream and can trigger rapid, infinite retry loops74. The parser sanitizes the stream data before parsing to ensure robust error extraction74.

### **Client-Side Key Pool and Rotator Implementation**

TypeScript  
// src/services/ai\_client.ts

interface ApiKeyConfig {  
  provider: "openrouter" | "google" | "kimi";  
  key: string;  
  isCooldown: boolean;  
  cooldownUntil: number;  
}

interface RequestMessage {  
  role: "user" | "assistant" | "system";  
  content: string;  
}

export class ResilientStreamRotator {  
  private keyPool: ApiKeyConfig\[\];  
  private currentKeyIndex: number \= 0;

  constructor(keys: ApiKeyConfig\[\]) {  
    this.keyPool \= keys;  
  }

  /\*\*  
   \* Dispatches conversation payloads to the model matrix, managing transparent failovers.  
   \*/  
  public async executeStreamRequest(  
    messages: RequestMessage\[\],  
    primaryModel: string,  
    fallbackModel: string,  
    onChunk: (text: string) \=\> void  
  ): Promise\<void\> {  
    let success \= false;  
    let attempts \= 0;  
    const maxAttempts \= this.keyPool.length \* 2;

    while (\!success && attempts \< maxAttempts) {  
      const keyConfig \= this.acquireHealthyKey();  
      if (\!keyConfig) {  
        throw new Error("All pool configurations are currently restricted by rate-limit cooldown policies.");  
      }

      try {  
        const targetModel \= attempts \>= this.keyPool.length ? fallbackModel : primaryModel;  
        await this.dispatchFetch(keyConfig, messages, targetModel, onChunk);  
        success \= true;  
      } catch (error: any) {  
        if (error.status \=== 429 || error.status \=== 503) {  
          const waitTimeSec \= error.retryAfter ? parseInt(error.retryAfter, 10) : 60;  
          this.penalizeKey(keyConfig, waitTimeSec);  
          attempts++;  
        } else {  
          // Terminal validation errors throw immediately to bypass loops  
          throw error;  
        }  
      }  
    }

    if (\!success) {  
      throw new Error("Exhausted all available rotating credentials and model fallback pathways.");  
    }  
  }

  private acquireHealthyKey(): ApiKeyConfig | null {  
    const now \= Date.now();  
    for (let i \= 0; i \< this.keyPool.length; i++) {  
      const idx \= (this.currentKeyIndex \+ i) % this.keyPool.length;  
      const key \= this.keyPool\[idx\];  
      if (key.isCooldown && now \> key.cooldownUntil) {  
        key.isCooldown \= false; // Reset outdated cooldown configuration  
      }  
      if (\!key.isCooldown) {  
        this.currentKeyIndex \= (idx \+ 1) % this.keyPool.length;  
        return key;  
      }  
    }  
    return null;  
  }

  private penalizeKey(keyConfig: ApiKeyConfig, seconds: number): void {  
    keyConfig.isCooldown \= true;  
    keyConfig.cooldownUntil \= Date.now() \+ seconds \* 1000;  
  }

  private async dispatchFetch(  
    config: ApiKeyConfig,  
    messages: RequestMessage\[\],  
    model: string,  
    onChunk: (text: string) \=\> void  
  ): Promise\<void\> {  
    const endpoint \= "https://openrouter.ai/api/v1/chat/completions";  
    const response \= await fetch(endpoint, {  
      method: "POST",  
      headers: {  
        "Content-Type": "application/json",  
        "Authorization": \`Bearer ${config.key}\`,  
        "HTTP-Referer": "https://github.com/vibecommand/app",  
        "X-Title": "Vibe Command Center"  
      },  
      body: JSON.stringify({  
        model: model,  
        messages: messages,  
        stream: true  
      })  
    });

    if (\!response.ok) {  
      const rawText \= await response.text();  
      // Sanitize potential formatting anomalies in the error payload  
      const sanitized \= rawText.replace(/,\\s\*,/g, ",");  
        
      let retryAfter \= response.headers.get("Retry-After");  
      try {  
        const errorJson \= JSON.parse(sanitized);  
        if (errorJson.error && errorJson.error.metadata && errorJson.error.metadata.headers) {  
          const rawRetry \= errorJson.error.metadata.headers\["Retry-After"\];  
          if (rawRetry) retryAfter \= rawRetry;  
        }  
      } catch {  
        // Fall back to header-based inspection  
      }

      throw {  
        status: response.status,  
        retryAfter: retryAfter  
      };  
    }

    const reader \= response.body?.getReader();  
    if (\!reader) throw new Error("Null payload returned from backend transport.");

    const decoder \= new TextDecoder();  
    let buffer \= "";

    while (true) {  
      const { done, value } \= await reader.read();  
      if (done) break;

      buffer \+= decoder.decode(value, { stream: true });  
      const lines \= buffer.split("\\n");  
      buffer \= lines.pop() || "";

      for (const line of lines) {  
        const cleaned \= line.trim();  
        if (cleaned \=== "" || cleaned \=== "data: \[DONE\]") continue;

        if (cleaned.startsWith("data: ")) {  
          try {  
            const parsed \= JSON.parse(cleaned.substring(6));  
            const chunkText \= parsed.choices\[0\]?.delta?.content || "";  
            if (chunkText) {  
              onChunk(chunkText);  
            }  
          } catch {  
            // Ignore partial SSE serialization anomalies  
          }  
        }  
      }  
    }  
  }  
}

## **Architectural Synthesis**

The combination of optimized WebView2 parameters, Rust-driven file operations, structural outline compression, and client-side failover pooling creates a highly performant desktop platform2. By isolating memory-intensive operations within native execution paths, this design prevents the UI thread from locking up and guards against V8 runtime memory bloat2.  
By offloading intelligence processing to free cloud endpoints, the application runs comfortably on ![][image1] ARM64 hardware without sacrificing development capability1. This architecture establishes a sustainable desktop agent platform under tight system limits1.

#### **Works cited**

1. Is Tauri a memory hog, or am I missing something? \- Reddit, [https://www.reddit.com/r/tauri/comments/1q9rpnx/is\_tauri\_a\_memory\_hog\_or\_am\_i\_missing\_something/](https://www.reddit.com/r/tauri/comments/1q9rpnx/is_tauri_a_memory_hog_or_am_i_missing_something/)  
2. Tauri \+ Rust \= Speed, But Here's Where It Breaks Under Pressure | by Srishti Lal | Medium, [https://medium.com/@srish5945/tauri-rust-speed-but-heres-where-it-breaks-under-pressure-fef3e8e2dcb3](https://medium.com/@srish5945/tauri-rust-speed-but-heres-where-it-breaks-under-pressure-fef3e8e2dcb3)  
3. Webview Versions \- Tauri, [https://v2.tauri.app/reference/webview-versions/](https://v2.tauri.app/reference/webview-versions/)  
4. Tauri depends upon Microsoft Edge Runtime2 and not bulky core apps like Electron.JS depends on chromium. \- DEV Community, [https://dev.to/stevepryde/comment/1laf7](https://dev.to/stevepryde/comment/1laf7)  
5. Any room for memory usage improvment? · tauri-apps · Discussion \#3162 \- GitHub, [https://github.com/orgs/tauri-apps/discussions/3162](https://github.com/orgs/tauri-apps/discussions/3162)  
6. Double memory use in Huggingface Qwen3 coder next \- DGX Spark / GB10, [https://forums.developer.nvidia.com/t/double-memory-use-in-huggingface-qwen3-coder-next/361990](https://forums.developer.nvidia.com/t/double-memory-use-in-huggingface-qwen3-coder-next/361990)  
7. tauri-performance-optimization | Ski... \- LobeHub, [https://lobehub.com/skills/zion203-sarah-tauri-performance-optimization](https://lobehub.com/skills/zion203-sarah-tauri-performance-optimization)  
8. Configuring Tauri 2.0 for x86, x64 and arm64 cross-compilation \- MOBZystems, [https://www.mobzystems.com/blog/tauri-20-cross-compilation/](https://www.mobzystems.com/blog/tauri-20-cross-compilation/)  
9. \[bug\]out of memory · Issue \#13758 · tauri-apps/tauri \- GitHub, [https://github.com/tauri-apps/tauri/issues/13758](https://github.com/tauri-apps/tauri/issues/13758)  
10. Calling Rust from the Frontend \- Tauri, [https://v2.tauri.app/develop/calling-rust/](https://v2.tauri.app/develop/calling-rust/)  
11. WebView2 browser flags \- Microsoft Edge Developer documentation, [https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/webview-features-flags](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/webview-features-flags)  
12. Usage ICoreWebView2EnvironmentOptions in C++Builder 11 \- Stack Overflow, [https://stackoverflow.com/questions/70768030/usage-icorewebview2environmentoptions-in-cbuilder-11](https://stackoverflow.com/questions/70768030/usage-icorewebview2environmentoptions-in-cbuilder-11)  
13. Configuration Files \- Tauri, [https://v2.tauri.app/develop/configuration-files/](https://v2.tauri.app/develop/configuration-files/)  
14. openrouter-rate-limits | Skills Mark... \- LobeHub, [https://lobehub.com/ru/skills/jeremylongshore-claude-code-plugins-plus-skills-openrouter-rate-limits](https://lobehub.com/ru/skills/jeremylongshore-claude-code-plugins-plus-skills-openrouter-rate-limits)  
15. set up openrouter 'api rate limit reached' \- Friends of the Crustacean \- Answer Overflow, [https://www.answeroverflow.com/m/1473523642280444075](https://www.answeroverflow.com/m/1473523642280444075)  
16. Secure API Key Rotator for Google Gemini 2.5 Pro (Deno Edge Functions) \- GitHub Gist, [https://gist.github.com/ruvnet/811aeab1aea67eb49ddf9c4b860c5f7b](https://gist.github.com/ruvnet/811aeab1aea67eb49ddf9c4b860c5f7b)  
17. DeepSeek V4 API Tutorial: Building a Thinking Mode Arena \- DataCamp, [https://www.datacamp.com/tutorial/deepseek-v4-api-tutorial](https://www.datacamp.com/tutorial/deepseek-v4-api-tutorial)  
18. Set Parameters for Thinking Mode \- Kimi API Platform, [https://platform.kimi.ai/docs/guide/use-kimi-k2-thinking-model](https://platform.kimi.ai/docs/guide/use-kimi-k2-thinking-model)  
19. Introducing Kimi K2.7 Code in Microsoft Foundry, [https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/introducing-kimi-k2-7-code-in-microsoft-foundry/4532286](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/introducing-kimi-k2-7-code-in-microsoft-foundry/4532286)  
20. Introducing Mistral Small 4 | Mistral AI, [https://mistral.ai/news/mistral-small-4/](https://mistral.ai/news/mistral-small-4/)  
21. Models \- Mistral Docs, [https://docs.mistral.ai/models](https://docs.mistral.ai/models)  
22. Introducing: Devstral 2 and Mistral Vibe CLI., [https://mistral.ai/news/devstral-2-vibe-cli/](https://mistral.ai/news/devstral-2-vibe-cli/)  
23. DeepSeek V4 Flash \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/deepseek/deepseek-v4-flash](https://openrouter.ai/deepseek/deepseek-v4-flash)  
24. DeepSeek V4: Everything You Need to Know About the 1 Trillion Parameter AI Model, [https://deepseek.ai/deepseek-v4](https://deepseek.ai/deepseek-v4)  
25. DeepSeek API Docs: Your First API Call, [https://api-docs.deepseek.com/](https://api-docs.deepseek.com/)  
26. DeepSeek-V4-Pro \- DeepInfra, [https://deepinfra.com/deepseek-ai/DeepSeek-V4-Pro](https://deepinfra.com/deepseek-ai/DeepSeek-V4-Pro)  
27. Kimi K2.7 Code, [https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart](https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart)  
28. Kimi K2.7 Code \- Open-Source 1T Agentic Coding Model \- Kimi AI, [https://kimik2ai.com/k2.7/](https://kimik2ai.com/k2.7/)  
29. kimi-k2.7-code \- Ollama, [https://ollama.com/library/kimi-k2.7-code](https://ollama.com/library/kimi-k2.7-code)  
30. moonshotai/Kimi-K2.6 \- Lambda, [https://lambda.ai/inference-models/moonshotai/kimi-k2.6](https://lambda.ai/inference-models/moonshotai/kimi-k2.6)  
31. Qwen3 Coder 480B A35B \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/qwen/qwen3-coder](https://openrouter.ai/qwen/qwen3-coder)  
32. Qwen/Qwen3-Coder-Next \- Hugging Face, [https://huggingface.co/Qwen/Qwen3-Coder-Next](https://huggingface.co/Qwen/Qwen3-Coder-Next)  
33. Qwen/Qwen3-Coder-Next-GGUF \- Hugging Face, [https://huggingface.co/Qwen/Qwen3-Coder-Next-GGUF](https://huggingface.co/Qwen/Qwen3-Coder-Next-GGUF)  
34. Reasoning | Mistral Docs, [https://docs.mistral.ai/studio-api/conversations/reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning)  
35. feat: Support reasoning\_effort for Mistral thinking models beyond magistral\* \#5285 \- GitHub, [https://github.com/pydantic/pydantic-ai/issues/5285](https://github.com/pydantic/pydantic-ai/issues/5285)  
36. mistralai/Mistral-Small-4-119B-2603 \- Hugging Face, [https://huggingface.co/mistralai/Mistral-Small-4-119B-2603](https://huggingface.co/mistralai/Mistral-Small-4-119B-2603)  
37. Models Overview \- Mistral Docs, [https://docs.mistral.ai/models/overview](https://docs.mistral.ai/models/overview)  
38. mistralai/Devstral-2-123B-Instruct-2512 \- Hugging Face, [https://huggingface.co/mistralai/Devstral-2-123B-Instruct-2512](https://huggingface.co/mistralai/Devstral-2-123B-Instruct-2512)  
39. Upgrading agentic coding capabilities with the new Devstral models | Mistral AI, [https://mistral.ai/news/devstral-2507/](https://mistral.ai/news/devstral-2507/)  
40. devstral \- Ollama, [https://ollama.com/library/devstral](https://ollama.com/library/devstral)  
41. Thinking | Firebase AI Logic \- Google, [https://firebase.google.com/docs/ai-logic/thinking](https://firebase.google.com/docs/ai-logic/thinking)  
42. Gemini thinking \- Interactions API | Google AI for Developers, [https://ai.google.dev/gemini-api/docs/thinking](https://ai.google.dev/gemini-api/docs/thinking)  
43. Gemini 3 Flash Preview \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/google/gemini-3-flash-preview](https://openrouter.ai/google/gemini-3-flash-preview)  
44. Gemini 3 Deep Think vs Flash vs Pro: Complete Comparison Guide (2026), [https://www.aifreeapi.com/en/posts/gemini-3-deep-think-vs-flash-vs-pro](https://www.aifreeapi.com/en/posts/gemini-3-deep-think-vs-flash-vs-pro)  
45. Gemini thinking \- generateContent API | Google AI for Developers, [https://ai.google.dev/gemini-api/docs/generate-content/thinking](https://ai.google.dev/gemini-api/docs/generate-content/thinking)  
46. Kimi K2.6 \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/moonshotai/kimi-k2.6:free](https://openrouter.ai/moonshotai/kimi-k2.6:free)  
47. Thinking Mode \- DeepSeek API Docs, [https://api-docs.deepseek.com/guides/thinking\_mode](https://api-docs.deepseek.com/guides/thinking_mode)  
48. Gemini 3 Developer Guide \- Interactions API | Google AI for Developers, [https://ai.google.dev/gemini-api/docs/gemini-3](https://ai.google.dev/gemini-api/docs/gemini-3)  
49. Reasoning Model (deepseek-reasoner), [https://api-docs.deepseek.com/guides/reasoning\_model](https://api-docs.deepseek.com/guides/reasoning_model)  
50. Compatibility with DeepSeek model's design to return reasoning content after tool calls?, [https://forum.cursor.com/t/compatibility-with-deepseek-models-design-to-return-reasoning-content-after-tool-calls/158905](https://forum.cursor.com/t/compatibility-with-deepseek-models-design-to-return-reasoning-content-after-tool-calls/158905)  
51. \[FEATURE\]: Preserve reasoning blocks with reasoning\_details for OpenRouter · Issue \#4367 · anomalyco/opencode \- GitHub, [https://github.com/anomalyco/opencode/issues/4367](https://github.com/anomalyco/opencode/issues/4367)  
52. OpenAI GPT Latest \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/\~openai/gpt-latest/api](https://openrouter.ai/~openai/gpt-latest/api)  
53. Reasoning Tokens \- Improve AI Model Decision Making \- OpenRouter, [https://openrouter.ai/docs/guides/best-practices/reasoning-tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)  
54. ignore \- crates.io: Rust Package Registry, [https://crates.io/crates/ignore](https://crates.io/crates/ignore)  
55. \[docs\] I just went through the quickstart and noticed a few issues · Issue \#781 · tauri-apps/tauri-docs \- GitHub, [https://github.com/tauri-apps/tauri-docs/issues/781](https://github.com/tauri-apps/tauri-docs/issues/781)  
56. \[bug\] tauri cli rebuild dependencies every time I save file · Issue \#10826 \- GitHub, [https://github.com/tauri-apps/tauri/issues/10826](https://github.com/tauri-apps/tauri/issues/10826)  
57. Stop tauri application from reloading after changes \- Stack Overflow, [https://stackoverflow.com/questions/75640909/stop-tauri-application-from-reloading-after-changes](https://stackoverflow.com/questions/75640909/stop-tauri-application-from-reloading-after-changes)  
58. \[feat\] Add .taurignore and turn off the default behavior of watching all workspace members · Issue \#4617 · tauri-apps/tauri \- GitHub, [https://github.com/tauri-apps/tauri/issues/4617](https://github.com/tauri-apps/tauri/issues/4617)  
59. atomic\_write\_file \- Rust \- Docs.rs, [https://docs.rs/atomic-write-file](https://docs.rs/atomic-write-file)  
60. GitHub \- untitaker/rust-atomicwrites: Atomic file-writes., [https://github.com/untitaker/rust-atomicwrites](https://github.com/untitaker/rust-atomicwrites)  
61. How to write/replace files atomically? \- help \- The Rust Programming Language Forum, [https://users.rust-lang.org/t/how-to-write-replace-files-atomically/42821](https://users.rust-lang.org/t/how-to-write-replace-files-atomically/42821)  
62. How to write/replace files atomically? \- \#13 by uberjay \- help \- Rust Users Forum, [https://users.rust-lang.org/t/how-to-write-replace-files-atomically/42821/13](https://users.rust-lang.org/t/how-to-write-replace-files-atomically/42821/13)  
63. diffy \- Rust \- Docs.rs, [https://docs.rs/diffy](https://docs.rs/diffy)  
64. GitHub \- jeremychone/rust-udiffx: Parse and apply LLM-optimized unified diff \+ XML file changes, [https://github.com/jeremychone/rust-udiffx](https://github.com/jeremychone/rust-udiffx)  
65. ast-outline: a parallel structural code summarizer written in Rust (5–10x token savings for LLM agents) \- Reddit, [https://www.reddit.com/r/rust/comments/1svx28f/astoutline\_a\_parallel\_structural\_code\_summarizer/](https://www.reddit.com/r/rust/comments/1svx28f/astoutline_a_parallel_structural_code_summarizer/)  
66. Interpretable Context Methodology: Folder Structure as Agent Architecture \- arXiv, [https://arxiv.org/html/2603.16021v1](https://arxiv.org/html/2603.16021v1)  
67. Claude Code Folder Structure: The File System Is the Prompt \- Iwo Szapar, [https://www.iwoszapar.com/p/the-file-system-is-the-prompt](https://www.iwoszapar.com/p/the-file-system-is-the-prompt)  
68. Kimi API Platform, [https://platform.kimi.ai/](https://platform.kimi.ai/)  
69. \[Bug\]: 429 rate limit errors from OpenRouter FREE models not honored? · Issue \#9035 · BerriAI/litellm \- GitHub, [https://github.com/BerriAI/litellm/issues/9035](https://github.com/BerriAI/litellm/issues/9035)  
70. \[Feature\]: Native multi-API-key support for OpenRouter provider with load balancing and fallback · Issue \#8615 \- GitHub, [https://github.com/openclaw/openclaw/issues/8615](https://github.com/openclaw/openclaw/issues/8615)  
71. API Error Handling and Debugging \- Complete Guide \- OpenRouter, [https://openrouter.ai/docs/api/reference/errors-and-debugging](https://openrouter.ai/docs/api/reference/errors-and-debugging)  
72. Client transport: HTTP 429 responses are not retried with Retry-After · Issue \#1892 · modelcontextprotocol/typescript-sdk \- GitHub, [https://github.com/modelcontextprotocol/typescript-sdk/issues/1892](https://github.com/modelcontextprotocol/typescript-sdk/issues/1892)  
73. How to Build a Reliable SSE Client in TypeScript \- freeCodeCamp, [https://www.freecodecamp.org/news/how-to-build-a-reliable-sse-client-in-typescript/](https://www.freecodecamp.org/news/how-to-build-a-reliable-sse-client-in-typescript/)  
74. SSE serialization corruption causes incorrect 429 error classification and unnecessary retry loops \#21704 \- GitHub, [https://github.com/google-gemini/gemini-cli/issues/21704](https://github.com/google-gemini/gemini-cli/issues/21704)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAZCAYAAABOxhwiAAAAsElEQVR4Xu2Pyw7DQAgD9/9/ulWibEQJtnEuvTASF+zZx1rDMLh8ikHkXp4Wr6QEctH+AGVoL3FFpxtR97AM0pXU5QzlsuwkF9SBEaebUS7LTvYBuyiFi+y5MBftH8RHdCW3n2Eu2v8QS85jnG6FcllWhurACOrGT6EPVrsIzVFApUCnh3Ll0hwFaJ+hh1+gXLkqf2ALCztof/A2u4mlllCwvWoqcqeaNlZ5GIZh+CtfBFCLdcpUcBoAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAZCAYAAABzVH1EAAAAsElEQVR4Xu2PAQrDMAwD+/9PdxjakWmSbJeNwuaD0KDo3GTbhmH4Njssh+pijqsFyt0BFSebzfLMeaMtAFXfdVQeOO+j/NRDzi/7YXYeqDxwHqUtHGQXzc4Dl6uzlK68dtHFvZrrcnWW0pXdZXGv5qo8cJ6lK6rL4gw3V+WB856wQklcwO5tD8ESyxzYveUhjK7E+ipjeeBy572wlkvCQdXD3trFnK02l6RhGIbhL3kAEMacZGozXJEAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAZCAYAAACM9limAAABFElEQVR4Xu2QQQ7CQAwD+f+nQT6kao3tpCcQZKSVuhM7avt4LMuy/BdPOgmXZc/nFtPyNAfuZJlJp9utfNe5oEKqzHegcmDqHNMPSBnnQeodqBA7vhfKKweUc9SOrpMyzoPUO1AhdnwvlFcOKOeobLfLzYHzIPUiXOR7obxyQDlH9+HdHCTvZi1cdMvKn2d8L5xXpH387HYm72YRVXLLyk9e1nlF2sfPbqfzIPUkrtD5ycs6r3D7uJ92Og9S740UdjPllQPKOThbd+XZFc6D1Luggue7mgPllQPKOThbd+XZFc6D1LtQQT5nnFM4P0X1nVMeJJ96B/wzUpHnKlPUrMudubObT5rx+Thf8RLLsizLsvwcL1Xb/gKRDtknAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEYAAAAZCAYAAACM9limAAABFUlEQVR4Xu2Q0YrDMAwE+/8/3aIHF7HZWTsUruXQgKEZaTdOH49hGIbv8FTxR9R7+0nQrno9H0EFd15yZ1c5yey6nd9lIhQkR15xjjj9gLRDvkg5y1rWEBU571zhHLE6dpm0Q75IuQt9UUNU5LxzhXPE2t110bwgX6Tchb6oISpy3rnCOWL34bt5kTzNtmiQypbvM31ekHekPv1NncnTbIsGqWz5k8uSd6Q+/U2d5IuUe+MW1FHR8ieXJe+gPs2nTvJFyr3pH+dO31Gcd65wjtDdfo8OvasgX6RcRENU5LxzhXOE7v7sH1O4Mn1ekD/F5ck5XySfchd6gMI603lnzXZ7nTvdetJMz9f5iUsMwzAMw/DveAHmDvUL8gKvygAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAZCAYAAABOxhwiAAAAm0lEQVR4Xu3PwQ7DMAgD0P7/T2+K1EQE2Rg4VjwpF4zZ+jxjjKofeIzf86+kVXqxLpsvLGNzqlx4dTqL+r0ou6hDSKezqW6UXdQhpNPZVDfKLuqQt/crHSvqsjkUHULmjxNRdlGHENaxH8U+EM0slR/pRSPTYbnqqvxILxqZDstVV+VHehFgXTZfutmxl/yr8F11x++gN8YY44P+NXeCfnSAlmkAAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAZCAYAAACIA4ibAAAA4klEQVR4Xu2RUQrDMAxDe/9Lb6Rsw9Vkyc1SBsUP/NFIlp1025qmae7Ng1TUIujD+ju40Nmlsh6XxzTXczls8JmFnE9lzWqXwgZX/1LFM8g8ql9pB+KyrsHpA5azMn+Q+dQMpR1AE35HlKaoPIjTI5kvy6jM33GGGOS8GdXeqk+RZfx6h6VUl1ixsMpQ2hfVF3Q6ssof98OKsLOI0j7gANWkNMaM3/Uoj9IGTqeopuycwbzsDHEet1+mDZyuxRc2BHj7WVVw/hnNZV4KPsLsMtgbMzALPVndgttcpGmapmmanScsib1DVdLbcQAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAZCAYAAABeplL+AAABU0lEQVR4Xu2TywpCUQwD/f+fVgoWypD09vgAkQ64yJykuvF2W5ZlWZZlxP35eYe8cXVr0pt0pkxuTTrJSVfy8vCJ2qqbzAEdc6BuTVAb5Yj7PueUtxwPCm5Lz5zQMQdu2+E2dMyB2ioXOG85HhTclp45oWMO3LbDbeiYA7VVLnDecjwouC09c0LHHLhth9vQMQdqq1zgvOV4UHBbeuaEvuuoN4fr03cd9rrumONBwW3pmRP6rqPeHK5P33XY67pjjgcFt6VnTui7jnpzuD5912Gv6445HhTclp45oWMO3LbDbeiYA7VVLnDecjwouC09c0LHHLhth9vQMQdqq1zgvKUb5Jt7D9Q7c6Acmd4KVLei3pkDOuZkek+SY34qzhPecP30V53TnoN3VH/6fUG9c9V9mU8end6a9q6Y3pn2vs7P/JB/5mt/lQ/wy79tWZZlWRbHAzpuKeUy78R3AAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAAAZCAYAAABjNDOYAAABGElEQVR4Xu2SiwrCAAhF9/8/XRgZdnd0bqwnHhjh8Xpb0LIMwzAMX8dFHkIzVdbo5ir2dHSz3dwNCtDhnlLdd246ZD1nuwf0hZnrsiebQR3Ze6kz1HVzT9BR5jrQ7RGog7rJGeq6uU2oKM66i/itPnuhG+oiZ6jr5jahg8ypJ2eQq6C8d8edzo56nZ3MI+3gwsXkDHIVlPfuIz9aZyfzK9rBO5QnZ5CroLx3H/nROjuZf6IKZTvy5AxyFZSnbnKGum5uBR3G2feU6TiDXAXlqZucoa6bW+GH+kRoVudkPpJ9T0R3OjvUo7NBriS+pD7K1j6yla12Ttx3sv5ZZTV3Ot3STu6sjHF27uP8zIu+k5f9rYdhGIY/4gqhs/IOFVXGHwAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAAAZCAYAAABjNDOYAAABEUlEQVR4Xu3SgYrCUAxE0f7/T7sEDCzTO0mqsl0hB4q8yTRPweNYa631bz2ej5PzrheudJ0rO6bdae/EvfBKrii76t37phmqLqcZZWGaVahP91EWNJv2rGoBzSgL06xCfbqPsqDZtGe5BY7rZ54z6nToHbqPsqDZtGe5BaTr5rzrOfQO7dNz0lzPyeUn4+JR9+hLVX1Cfdql56S5npPLT6bFqkM7KOtQP/e88qP1nFx+Mil2HTd3uUNd2kFZ0Gzas9yCRPPunFzuUN/dr1nQbNqz3IKQM3rUJKveTzrTc6I9eg6UtfTH6mWa60Myd53u/fB7PunmZ9XV3m0ml3+qEz7du93XfNG/dPvfeq211hf4AY5+7hLxvC57AAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAAAZCAYAAABjNDOYAAABAklEQVR4Xu2SQQ6EMAwD+f+nd9VDV5HXThzoCWUkDnWmhlZc1zAMw3CKDwZ3WUXxyXBd13Podrh+6TCBlWOmDs6yBctcVCdDfRfiOFTqZAjzFixzUZ3Idio/eimsCLO9Ro+hPJa5qE5F5uO52mB5XHcuKtL1I933ZT6eqw1uUhfCMobjZFTvwZnyMcN1Cdvw5HIcp6LqwJnyMcN1SlbayTfV3CXrYTnzcb1gGYUVbtRM5Yts1iXr2jP1dL0/mMCKEZUvMMd1h+w9DNd3nF8ZPhGVMbBH7WU5w/U2rl86eIDso3HuOsxVeQT33/ERnCvvNifLTna9jrkcwvHfeRiGYXghX++J6RcuvTtvAAAAAElFTkSuQmCC>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAAZCAYAAABeplL+AAABXElEQVR4Xu2T0WrDQAwE8/8/3SKoymW8q9O5CYSiAT/seFfOSx6PYRiGYRhKvvD8he6tTq/T6dK51ekkJ91fVPHowILaqFvMAR1zoG51UBvliPuec8o/oUrK7XAbeuaEjjlw2wq3oWMO1Fa5wPknVEm5HW5Dz5zQMQduW+E2dMyB2ioXOL/lztBt6JkTOubAbSvcho45UFvlAue33Bm5j9EzJ/RVR71zuD591WGv6h5xPPjBfYyeOaGvOuqdw/Xpqw57VbfN8WDBbemZE/qqo945XJ++6rBXdVsclQVuT8+c0DEHblvhNnTMgdoqFzh/QRWZd6gbAT1zQsccuG2F29AxB2qrXOD8hSzyWXF+Rb1nDpQj3VuB6q6o98wBHXPSvXchh+pZcZ7whuun33VOew7eUf3u94L1zq57m1ce7d7q9nZ073R7b+djfsh/5m1/lRfwyb9tGIZhGAbHN7RcNNrdvzp7AAAAAElFTkSuQmCC>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABXCAYAAAC5txliAAAC3klEQVR4Xu3Y3Y7bIBAG0H20vnCfcdteIKHp8GNDvI5zjoRihoHYufGnfH0BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGu+Tw4AAC50JISNemOwywYAACccDVNZ70wtzgEAmCSwAQC8gaOhrZbtm60BAHDASmiLdp0DAEBlV2Dbdc6dPf35AIAb2xG2dpxxd09/PgDg4VqBrdTrtVEtjlZPr97ryeYztboOAHCpHUFkFGhaazEcrVz3glXW25tnWnUAgJfaFUJmz4l9raC0eh1DWF3P5q09td4aAHCx7OXtZf2/+nfKfrMZrd9413VRavE+47xnpgcAeLHWC3n2hf5OrnqeLBCNaq0R+4o4z2pxX5zP1OIaAHCx3su4Vf8Ud3r+O90LAHChTwoBvWD6T/w3adR/pTvdCwBwoU8LATGIzQ4AgB/zDoEkhqfWAAB4pE8JO7/+jt/GSwYA8GKjwDZab4l74hwAgEmjQNZb6zm7DwCAYBTYaqW33hPnWW20DgDAQBacWoGqDmHZZzGaF636T6oD5ZEBAHALMZi0Aktr3qrfTfZMPb3+GOxaAwBgi1awiPXRvGjVf9qZEDXbH/vOfBcAQCr7N6iuZfV4Xc/fIaSs3me2N9biHACAA3YHtuy8OAcA4KAsZJ216xwAAIJdoW3HGQAAJHYEttUzZvbO9GRW7w0A4BZWA81qKJrZO9MDAPBIO4LQamADAKBhV8iaOafuKdfxM17PWNkLAHB7KwGn/KsWR0svWPXWRo72AwA80o5Q1AtlcW0U/mpxLwDAIxwJNkfCU08vWPXWRnp74xwA4C30AlhZi+NKvQAGAPB4MYjNjqvE74tzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2OoPMRH4rmx9uT4AAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAAAaCAYAAABW6GksAAABS0lEQVR4Xu2SgWoDMQxD7/9/eiMFg9EsR07SEVo/OEpsST5f+jxN0zRN8338kKe5GHZJ33iB+Mdd2T3zYfbynJlp1v8kol2jGkO5CNRk2pCKSdHczO6eqt/I9Kwuk4Ujqu42KjsOmHYlh+lZXSYL9yiaG1l5b+ZRv5WR6X2daVKWTJdjH2x1N+arZmZ6fMdM+4eS+DCnZ5/MYznVGW/Ty8JH10VE3srsGSezBiyrOmdVP/VIokfTZOz6VdR9ZrCMan6mj3ryxQ0UkaLJ2PVXkZcnMG81N9NHvfLFMeGs7vs+B314NtDvwfMO1azom0S1AasPZj0k04eYAR9G1htgH8+Gr6MGz7vMdkK8PvNGPavhg2A/0hyFDWAvgGfD6syDtRNUM6v6Ff5jxotokK9h31+QR/E0B4k+anQJ7NeIPOzcNE3TNE3TNM0RfgHxLesVZVJ4MgAAAABJRU5ErkJggg==>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAZCAYAAABdEVzWAAAAtElEQVR4Xu2PUQoDMQhEvf+lW7o0JbzMqIF++mBhdWbURAxDi9f3y6j0v7MvdAeq3sEKuyEf6Km8/GfOZVNUsDtU6VV9BcOsHdVh1FJoroZXZIewTlmHrJAKZ8uI81Y5yX6cGuB6qq+gr5Xlq1qh6PvInrN5JXQX3vhu6gfZjHOp8tHjoKeqH2Qzzr46QvUIdZVhbemElYc4nX3WP/Yl2cKlZZ5FpnNfScsUfV9G94HDMAyON917foL9UxbUAAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAAAc0lEQVR4Xu3P0QrAIAiF4d7/pTcKDebUc4pBMPyhG/1WrLWqOtwlB8U4NYwdsTBz0S6azyCQMhf9rTd7BIGUuaOPR8FvIJBYp1GeQo13Pdqy8Gs3YvGKo1u5FDlv781mzKU95HTvnVcWeNDudpy1VVX9uBsaD2Sc5ISdZAAAAABJRU5ErkJggg==>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAAY0lEQVR4Xu2QQQoAIQwD/f+nd2GxorEmuuhB6EAvyZiDKQXX8uQbYb3yGpjs5cwvMGk1L6hR7Lysg0nW4UlmxK2j2E0PMwnzI6MGe/MhBQfps1EvZ37zP/UhdT5yfrN1LAgIL+xAR7k1QcwAAAAAAElFTkSuQmCC>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAAA8UlEQVR4Xu3R4QrDMAgE4Lz/S29YdiU7TtOY0DLmB/3R0xqztVZKKeXvvTiYZN/zo3DPat9tVhZQF+B342Wce9mjsguoywDnqhcZctUDXn7qh42aR3U22w/RLpyrXr6P6gEvP3EDv/eimjLbD0sXaht/oLDYvg8a9SqZb0x0npeD+lZl4OW3yB6+ciFVX5l3wIBR86jOZvsh2sXLjVfLzjv0P040yEQ1ZbYfoj283Hi17Dxp57DZfsjsoHJkmXmHsPgRDR+JvhvNVXV+N+hTT8/LbsdLzizM+rrXz2d455kr837O7ovsnleeUv9kKaWUnDfsQK5Sa5LlOwAAAABJRU5ErkJggg==>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAZCAYAAACRiGY9AAAAsklEQVR4Xu2RywoDMQwD8/8/3dKDIQhLsiHd7cMDOcSaOM7uWsMw/AMPLHwiryGrgyo3Mly3UL28MqjLL6MzSMe1dH6py5FKz6DjWrAR7ndUllEZNPKq6xwrRJNSswR1DjPcKzrucdTlWFcuUnJDcqLLEdaT1bJ6hp13F6S4dJbB+uF9uBCsKTdFyazOUL0Q5mZ1+ai0CNDDBTpn3+UeYf+KuBjOwzxzvpafeswwDMNAeQJWHIJ+Oo9SDQAAAABJRU5ErkJggg==>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAZCAYAAAChBHccAAAAs0lEQVR4Xu2QQQ6DMAwE+f+nW1GJyN3OOg7lAJJHyiHeWROxbU3TPJKXnDOsdp3791vOFFc6znUzmn+gIC0Yqp3DIZd20GxAQVowVDoxJ5d20GxAQVowVDqzxxPpXgqOAmWOma+Z3h2pR+FdHj91SLj68TSnWSTbNyChVBSyTvwZdBQ3/4Gkcjmw2nEu7dH7FxrqfSf7UztZRpAbv6HHEgUnz+Z0FM3V0zk5lpLUNE3TPII3KXOQcLrJuTMAAAAASUVORK5CYII=>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAAAjUlEQVR4Xu2PQQ6AIAwE+/9PazigZN2RQmK8dBIOboctRhTFOocGO7QSPRnI0y7stGFw3sHCmCwcIcllnT4jh/IHq8vHPONsQQUry+nHXnEXslnD5amHkJTNCOq9mArCqov+6zDuOR31FMrtQL8dznEPGvMH4wW67CBHc+zThbPl6pA7m3/OL0uLorg4Ae0LaZeTZ+5QAAAAAElFTkSuQmCC>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAAXUlEQVR4Xu3NQQrAIBBDUe9/acsEhBISiNhFhXngQuerY7TrTFpO2smhusT7ojpQg5MzUIOTMyuN0w6S8PMHS9rFvycN7DyYdDLkfUk7WDGvN565DjhwMc9c19rvPUBaTrJWVS/eAAAAAElFTkSuQmCC>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAAA/UlEQVR4Xu3R2wrDMAwD0P7/T28I5uIaybmusM4H8lDF9pLsOEoppYx6xeBX4SJxrcrmxN9arfsq9qOrh8kuxPKR7HbqICzvYT2qn2Xg61UvqPzkD98qbu0Dm9M7n2ldkmXg61UvqPwUC+K3l+1lVh7IqH6WwZYHSjeP68Vatcpsb+yL34Zl4OtVL6j8NrMHiH3qkiyDrQ9kA1rFrf1otN6wPnU+lsG2B/KPkw2CbI8ZrTfxPHF58dv4WtZnVC7tGsZqWdZLnYtlsOWB0s2PbDhj9Wx5LMuoepaPZLeLj+KXxzImzmA9Plc14POs7rF6LvyXD/NI9U+WUkqZ8warZsc5USMFQgAAAABJRU5ErkJggg==>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAZCAYAAACRiGY9AAAAu0lEQVR4Xu2RWwrDMAwEff9LtwhacLb7ECSktGjAH9FsZClZaxiG4cs8yHF0PJ5bYRemQZwr0Kd+l8MuTF9Y1QvlXL/DhTL0IvmC9Un9Vb1QzvX7EPi845zj1qVocWMfJmUd6V3nlTs70yk6F7uMcnGp7t9IHun0LFxGOdt7X8gGl3eMbt7llEuzHnBhVWewLKsVql4oJ+ekRUC+LHjn2VE4V6BP/S4HF1FLoVO5Auss87PgcsMwDMN/8gR4JICAnd5j9wAAAABJRU5ErkJggg==>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAZCAYAAAChBHccAAAAw0lEQVR4Xu2NQQrEMAwD8/9Pt7gQCOoodsrCXjyQg6WxM0bTNP/m0qBCLK3vlOp+5mmvr8SJTB7t6xxopvPE5VjQ54TzKNc5oEzZOlTS54TzKNc5oEzZOlTS54TzKJ/ZzLX/BB3RjxzOyXLXK6lDQvUD51C+zpX7Wf9AQuV44BzNdXbZStY/kFBaHN7TXOfJaf6CpOqy8zQnJ9jlrnuhos7BPKidy5RqFtBNyyq7RZcHulv1HFmPHC8sVHd/7TVN0zTMDUFWnGQfOsReAAAAAElFTkSuQmCC>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAAAgElEQVR4Xu2QUQrAIAxDvf+lNwSVEtO0fjlYH/QnebZsrRXFR3gwAHqfdTLuIiMrx+u8fDFLKTW9yPtali1s4UoDtejqcY/0m0hKLxoc+ZF4sky6rGCZRS40hN4UvGGozpJxNqJHmeOsZ9lGJEXH8e/ZoaCEMubM6WCHUxTFT3gBw2Vlm/EroI8AAAAASUVORK5CYII=>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAAa0lEQVR4Xu2MQQ6AQAgD+f+nNZjsRutUUU8mTMKBMjSi+R2LjKPqbahAT7on5E30QLLuA5efcKWVzELiKNApcSe+Kk3oQbPHxSTTTp6FHtyzejakzIEehVSqe0LeZH+8EqvegZIUda9pvrICs+ZMtLPl7uwAAAAASUVORK5CYII=>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAABA0lEQVR4Xu2RCwoCQQxD9/6XVkacpRuStPthEOwDwUnTNOi2NU3TNH/Li3yugBksB+dnvcthh5mWUfVPX3aDzfG9BFUEtYyqv+Jz95W+M5ddyCSbKyrZSHWn6lE+pe+gAd8RN1O4co65F3dZTjYfYE5E6R/scDuWzLyKO7uDrIPSoo7viNKX4goq4o77gRjoxXdE6QeqBbK5opofYd5qBt5ze0rfiWEuaOBmjkp2xHlRZ168xzwTpUvuhrF9LJzhvKgzL95jnonSP9jhFxfOYF6WwbSIm0WYj2UrbTmzyDzOig2UHolZzo8e54vflW8ZTxQ4k1Hx/sQP0zxA/5NN0zTNNd7NjsI+5Jc71wAAAABJRU5ErkJggg==>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAZCAYAAACRiGY9AAAAxklEQVR4Xu2P2wrDMAxD8/8/vdEyF1dIcsqWFoYP5MGSfMkYTdM0D/Mij4GZb3PLYEtRwzpwOtaoLYUtRC3qKhcag2UP8gIZ+lD5Cpyt9imNwbIHaGCdcZ5jto8dinXAsjtUTESjHDDBbK/KMW1D5W+jOsD5TlfeTgRsaNS+opqv9A3luXmnhTY4vOeYma1QPZfmubDSM6zffYppGeWreVwEZLOAZdmM/FF8CGoqtww8jh2An8CHoM4yt/Hr5fi5pmma5j95A5cQlmpc53LKAAAAAElFTkSuQmCC>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAZCAYAAAChBHccAAAAxElEQVR4Xu2NQQrDQAwD8/9Pt/jgxRkkx4FeCh7IwdJoc13LsvwlH3xvme4n3sRpeTNUntrzDpi5HbODKtpBwXkq5x0wcztmB1W0g4LzVM47UBlRbx1U0Q4KzlN5Zpmzd7SeKvkjh3OecteTR0cJ0x84R+X1nr4ftJ4qpo87hzlvlylaTxXtoOA85rwTl1fSkZ4KrQycx1w5AXPuXHaDJe8gH2HnMjLJeAfq/RtVcLLLA26nHuHeeZKxKJhuf+0ty7Ismi8346VbRS3R8QAAAABJRU5ErkJggg==>

[image30]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAZCAYAAADJ9/UkAAAAjUlEQVR4Xu2OQQqAMAwE+/9PKy02pGF3U0XxkgEPzg7R1oriZ47rYcw96zp32oEKkUc9+yByCyrY9ewG84YK0LbrOswbKpibb1DLbjBvpEHDPxFBG3ILKoib+oHoVWuoAPms97tqBypQnm2etEsDwG6f3lYB8qyPPr4vzDE+Ee9Z04l3WPeIV48VRfEZJ2CGdYs3D5RZAAAAAElFTkSuQmCC>

[image31]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAAXUlEQVR4Xu3PQQrAIAxE0bn/pVsqBGrQ6Q904SIf3CRPQak7sSsPVj0IQRUshipYCsMRi2DsiR0R+Oujee7slIN57uwUhipYB2O3O9s+wStsMRSw+SvuQjbOdt2R3QK9Q72Nqi+UAAAAAElFTkSuQmCC>

[image32]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAAA+0lEQVR4Xu3RgQrCMAwE0P3/TysRM+JxlzbdmOjyQLCXa+3mtrXWWru9BwYL7Iz4QTivdr/qyAXYA+DaeMb6EZvj+nJHLjD7QCxD7Cyn8p1vzg5xozmq9t3sfcxsR/VUvsMCrqNsxlT7Lr6g0cuKedbJZlI63OYumFnZY9Rv4tqoLOa4jlR+idUfz14QZgz2cB2p/IO6EBrNUbXv1H1YxuD+bJ/Kd/Gw7CCTzZhq36m7VDPPWcepXDrzsGrf4QNiPpt5zjpO5S/p8C07fCTbNzqXzXFtVIa5yi7nF2GfiGUI96s+drJe/K56P2f2QWZ6f/Vibq3/ydZaa2uePy25R/liTg0AAAAASUVORK5CYII=>

[image33]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAZCAYAAACRiGY9AAAAtElEQVR4Xu2RWwoDMQwDc/9Lt6Q0YIQlq7ClDzSQj42U8YasFUIIX8LtuSamzvHU9THcH5g6mLvet+AOVx2WSfcrzzrliOPcqA7LpBsD/K6orEMOLqgOy6i73Sycg1Qw4J5THZa57stxB6sOy0a3+xpTjjjOjeqwTLrrhWRx6axj8h1Uh2Wu+4Eqs32GclVUh2XU3W4C9LCBe3bqYO56L+MM7FYFM9bb4H7X+VnwciGEEP6TO7Wtc43rz2kFAAAAAElFTkSuQmCC>

[image34]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAZCAYAAAChBHccAAAAtElEQVR4Xu2OQQrDQAwD+/9PtzjgZTOVjLfkUvBADpJHS16vYRj+kje+U7r7pz3JyUh5aq/yr91CHcrBhvNUz6w43qmjekThPPbMjq63UHL3Eeexz8yPZFc5N5TQHTuHPXPCTnmqW6jD/HyRE3bMgdteqEM52HAee+aEHXPgthfqUA42nMeeOWHHHLjtgkfmIB/hzXVEdaT71o19pB4IXB9wW3mnjvO+aIuC7vZpbxiGYdB8AGdTq1XRj/mWAAAAAElFTkSuQmCC>