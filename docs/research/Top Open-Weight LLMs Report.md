# **Comprehensive Evaluation of the Leading 40 Open-Weight Language Models: Empirical Benchmarks, Architecture, and Free-Tier Inference Access**

The global landscape of artificial intelligence in mid-2026 exhibits an unprecedented convergence between closed-source proprietary systems and open-weight architectures1. Standardized empirical benchmarks demonstrate that the historically wide capability gap between proprietary cloud offerings and downloadable weights has collapsed to a marginal competitive threshold1. Organizations across diverse sectors are actively migrating core workloads from expensive commercial API endpoints to high-performance open models1. This transition is driven by the rapid maturation of highly optimized inference pipelines, localized deployment capabilities, and the expansion of highly generous free-tier API services across major hosting platforms5.  
A central driver of this architectural parity is the widespread adoption of sparse Mixture-of-Experts (MoE) designs8. Unlike traditional dense models that compute every mathematical parameter for each sequential token, sparse MoE systems selectively route token-level workloads through a designated fraction of active sub-networks8. This structural innovation reduces operational latency and memory bandwidth demands during inference while preserving the deep knowledge base acquired during massive pretraining phases9.  
Concurrently, geopolitical forces, such as localized export control directives, have accelerated the demand for sovereign AI setups1. Organizations increasingly opt for permissive Apache 2.0 or MIT licenses to prevent third-party vendor dependency and ensure compliance with strict regional data sovereignty policies4. To support this rapid developer migration, cloud-based inference aggregators and hardware developers have established extensive free-tier access programs13. These permanent free tiers allow developers to build, validate, and scale automated agents without upfront credit-card commitments5.

## **Technical Specifications and Benchmark Evaluations**

The following multi-dimensional matrix catalog compiles the top 40 open-weight models current as of July 10, 20263. This selection is ranked according to composite scores on independent leadership platforms—including the Artificial Analysis Intelligence Index v4.1, LMSYS Chatbot Arena, SWE-bench Verified, and GPQA Diamond—and is limited to models generally available on the free API tier of major online inference providers3.

| Rank | Model Identifier | Parameter Scale (Total / Active) | Native Context Limit | License Type | Primary Benchmark Metrics | Leading Free-Tier API Access Channels |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | GLM-5.2 (max) | 753B / 40B17 | 1,000,00017 | MIT17 | AA Index: 5117; SWE-bench Pro: 62.1%18; GPQA: 91.2%19 | OpenRouter, DeepInfra, Decart20 |
| 2 | DeepSeek V4 Pro (max) | 1.6T / 49B22 | 1,000,00022 | MIT24 | AA Index: 4425; GPQA: 90.1%26; SWE Verified: 80.6%26 | DeepSeek API, NovitaAI, Together, SiliconFlow22 |
| 3 | NVIDIA Nemotron 3 Ultra | 550B / 55B27 | 1,000,00027 | OpenMDW29 | AA Index: 3828; GPQA: 87.0%27; RULER: 94.7%27 | NVIDIA NIM, OpenRouter28 |
| 4 | MiniMax M3 | MoE (Variable)1 | 1,000,0005 | Proprietary API32 | AA Index: 441; GPQA Diamond: 93.0%19; Toolathlon: 47.2%26 | OpenRouter, SambaNova31 |
| 5 | Kimi K2.6 | MoE (Variable)29 | 256,00016 | MIT32 | AA Index: 4325; GPQA Diamond: 90.5%26; MMLU-Pro: 87.1%26 | OpenRouter, SambaNova, AIMLAPI31 |
| 6 | MiMo-V2.5-Pro | Dense (Variable)25 | 128,000 (Est.) | MIT32 | AA Index: 4225 | Xiaomi AI Studio, OpenRouter25 |
| 7 | DeepSeek V4 Flash (max) | 284B / 13B1 | 1,000,0001 | MIT1 | AA Index: 401; GPQA: 88.1% (max)26; SWE Verified: 79.0%1 | OpenRouter, Together, Fireworks1 |
| 8 | Qwen 3 235B-A22B | 235B / 22B37 | 128,00037 | Apache 2.08 | MMLU: 82.8%37; AIME 2024: 85.7%8; BFCL v3: 70.8%38 | Alibaba Cloud, SambaNova, OpenRouter31 |
| 9 | Qwen3.5 397B A17B | 397B / 17B25 | 128,000 (Est.) | Apache 2.032 | AA Index: 2325; SWE Verified: 76.2%36; Terminal Bench: 52.5%36 | Alibaba Cloud, OpenRouter, Scaleway31 |
| 10 | DeepSeek R1 | 671B / 37B24 | 128,00040 | MIT38 | MMLU-Pro: 84.0%12; GPQA Diamond: 71.5%41; AIME 2025: 74.0%41 | DeepSeek API, SambaNova, OpenRouter5 |
| 11 | DeepSeek V3 | 671B / 37B24 | 128,00042 | MIT24 | MMLU: 87.1%38; HumanEval: 82.6%38; GPQA Diamond: 59.1%41 | SambaNova, OpenRouter31 |
| 12 | Mistral Large 3 | 675B / 41B38 | 128,00040 | Apache 2.012 | HumanEval: 92.0%12; Multilingual MMLU: 85.5%38 | Mistral Studio, SambaNova, OpenRouter31 |
| 13 | GLM-5 | 744B (MoE)12 | 200,000 (Est.) | MIT12 | Arena Elo: 145412; SWE-bench Verified: 77.8%12 | Zhipu AI, OpenRouter32 |
| 14 | Kimi K2.5 | 1T / 32B12 | 256,000 (Est.) | MIT12 | Arena Elo: 143812; SWE-bench Verified: 76.8%12; AIME: 96.1%12 | Moonshot AI, OpenRouter32 |
| 15 | Llama 4 Maverick | 400B / 17B10 | 1,000,00043 | Llama 4 Comm45 | AA Index: 1445; MMLU Pro: 80.5%43; GPQA: 69.8%43 | Groq, SambaNova, OpenRouter7 |
| 16 | gpt-oss-120b | 117B / 5.1B46 | 131,00047 | Apache 2.047 | AA Index: 2447; GPQA: 80.9% (tools)50; AIME 2025: 97.9%48 | Cerebras, Groq, OpenRouter, SambaNova5 |
| 17 | NVIDIA Nemotron 3 Super | 120B / 12B31 | 1,000,00027 | OpenMDW53 | AA Index: 2553; Openness Score: 8353 | OpenRouter, NVIDIA NIM31 |
| 18 | Qwen3.5 122B A10B | 125B / 10B53 | 128,000 (Est.) | Apache 2.053 | AA Index: 3253 | Alibaba Cloud Model Studio53 |
| 19 | Command A | 111B (Dense)54 | 256,00054 | CC-BY-NC-4.055 | AA Index: 22.554; Coding Index: 27.854; Agent Index: 9.254 | Cohere Platform, OpenRouter54 |
| 20 | Command A+ (05-2026) | 218B / 25B57 | 128,00057 | Apache 2.057 | 2x speedup vs previous Command A models58 | Cohere Platform, SambaNova33 |
| 21 | Laguna M.1 | 225B / 23B36 | 262,14436 | Apache 2.036 | SWE Verified: 74.6%36; SWE Pro: 49.2%36; Term Bench: 45.8%36 | Poolside API, OpenRouter31 |
| 22 | Llama 4 Scout | 109B / 17B9 | 10,000,0009 | Llama 4 Comm63 | AA Index: 1063; GPQA: 57.2%43; MMLU Pro: 74.3%43 | Groq, Cerebras, OpenRouter, Together7 |
| 23 | Mistral Medium 3.5 | 128B (Dense)53 | 128,000 (Est.) | Apache 2.0 | AA Index: 2125 | Mistral Studio, GitHub Models25 |
| 24 | Mistral Small 4 | 119B (Dense)53 | 128,000 (Est.) | Apache 2.053 | AA Index: 2053 | OpenRouter, Mistral Studio31 |
| 25 | Devstral 2 | 125B (Dense)36 | 128,000 (Est.) | Apache 2.053 | AA Index: 1953; SWE Verified: 72.2%36; Terminal Bench: 32.6%36 | OpenRouter, Mistral Studio31 |
| 26 | HyperNova 60B 2605 | 59B (Dense)53 | 128,000 (Est.) | Apache 2.053 | AA Index: 1853 | OpenRouter53 |
| 27 | Llama 3.3 70B | 70B (Dense)38 | 128,00040 | Llama 3.3 Comm38 | MMLU: 86.0%38; HumanEval: 88.4%38 | Groq, Cerebras, OpenRouter, Together5 |
| 28 | K2 Think V2 | 70B (Dense)53 | 128,000 (Est.) | MIT53 | AA Index: 1553 | Moonshot AI25 |
| 29 | LongCat Flash Lite | 69B (Dense)53 | 128,000 (Est.) | Apache 2.053 | AA Index: 1753 | OpenRouter53 |
| 30 | Gemma 4 31B IT | 30.7B (Dense)64 | 256,00064 | Apache 2.066 | AA Index: 1525; GPQA Diamond: 84.3%64; MMLU Pro: 85.2%64 | Google AI Studio, OpenRouter, NVIDIA NIM5 |
| 31 | Gemma 4 26B A4B IT | 25.2B / 3.8B65 | 256,00065 | Gemma License65 | MMLU Pro: 82.6%64; GPQA: 82.3%64; LCB v6: 77.1%64 | Google AI Studio, OpenRouter31 |
| 32 | North Mini Code | 30B / 3B68 | 256,00068 | Apache 2.068 | Coding Index: 33.469; SWE Verified: 80.2% (pass@10)69 | Cohere Platform, OpenRouter52 |
| 33 | gpt-oss-20b | 21B / 3.6B46 | 131,00072 | Apache 2.048 | MMLU: 85.3%46; GPQA: 74.2% (tools)50; AIME: 98.7%48 | Groq, OpenRouter, SambaNova33 |
| 34 | Qwen3.6 27B | 27B (Dense)73 | 128,00040 | Apache 2.038 | GPQA Diamond: 84.0%73; MMLU-Pro: 84.0%73 | Alibaba Cloud, OpenRouter31 |
| 35 | Qwen3.5 27B | 27B (Dense)73 | 128,00040 | Apache 2.073 | Leading Small-Class Baseline73 | Alibaba Cloud, OpenRouter31 |
| 36 | Qwen3.6 35B A3B | 35B / 3B73 | 128,00040 | Apache 2.073 | GPQA Diamond: 84.0%73; Terminal Bench: 45.0%73 | Alibaba Cloud, OpenRouter31 |
| 37 | Qwen3.5 35B A3B | 35B / 3B73 | 128,00040 | Apache 2.073 | GPQA Diamond: 82.0%73 | Alibaba Cloud, OpenRouter31 |
| 38 | Gemma 3 27B IT | 27B (Dense)38 | 128,00040 | Gemma License38 | HumanEval: 87.8%38; MMLU-Pro: 67.6%64; MMMU Pro: 49.7%64 | Google AI Studio, OpenRouter6 |
| 39 | Phi-4 Reasoning | 14B (Dense)38 | 128,00040 | MIT38 | MMLU-Pro: 77.3%40; HumanEval+: 75.4%40 | GitHub Models5 |
| 40 | Phi-4 14B | 14B (Dense)38 | 128,00040 | MIT38 | MMLU Pro: 77.3%40; GPQA Diamond: 22.1%40; AIME: 52.6%40 | GitHub Models, OpenRouter5 |

## **Detailed Model-by-Model Capabilities Analysis**

Evaluating these open-weight networks requires examining structural configurations, attention patterns, hardware requirements, and reasoning processes65. The following sections cover the qualitative and quantitative capabilities of each of the top 40 models25.

### **Frontier Deliberation and Logic Systems**

The frontier class includes the largest open-weight Mixture-of-Experts (MoE) architectures, which compete directly with leading proprietary systems on graduate-level logical tasks1.  
**GLM-5.2 (max)** is the top-performing open-weight model on the Artificial Analysis v4.1 Index, featuring 753 billion total parameters and activating 40 billion parameters per token17. The primary architectural strength of GLM-5.2 is IndexShare, which reuses a single routing indexer across every four sparse attention layers18. This optimization reduces per-token FLOPs by 2.9 times under massive one-million-token context windows, resolving standard KV-cache memory barriers18. It scores 62.1% on SWE-bench Pro and 81.0 on Terminal-Bench 2.118. However, the model is highly verbose, generating an average of 140 million tokens during evaluation cycles, and has a massive local memory footprint17.  
**DeepSeek V4 Pro (max)** leverages a 1.6-trillion-parameter MoE layout with 49 billion active parameters per token, establishing excellent price-to-performance value22. Utilizing Engram Conditional Memory, it decouples static semantic data from dynamic attention logic, achieving 97% accuracy on long-context retrieval tasks42. It scores 90.1% on GPQA Diamond and 80.6% on SWE-bench Verified26. The model's primary weakness is a tendency to ignore nested format constraints in highly complex prompts24. Additionally, its thinking mode introduces severe latency overheads, resulting in a time-to-first-answer token of 128.46 seconds on standard endpoints22.  
**NVIDIA Nemotron 3 Ultra** features a hybrid Mamba-2 \+ Transformer MoE architecture with 550 billion total parameters and 55 billion active parameters per token27. This design yields exceptional output throughput, generating up to 169 tokens per second under NVFP4 hardware precision on GB200 architectures29. It scores 87.0% on GPQA and 94.7% on RULER context evaluations27. The primary weakness is the highly complex software environment required for deployment27. This configuration demands NeMo runtimes and specific vLLM configurations to coordinate reasoning traces alongside standard tool-calling APIs27.  
**MiniMax M3** is a specialized multimodal MoE architecture optimized for processing visual data alongside massive text documents1. It supports a one-million-token context window, making it ideal for scanning long video sequences and multi-page technical diagrams1. MiniMax M3 achieves performance parity with closed frontier systems on real-world agentic benchmarks like GDPval-AA1. However, its mathematical logic capabilities are below average, lagging behind GLM-5.2 and Qwen 3 235B on standardized math challenges1.  
**Kimi K2.6** is a one-trillion-parameter MoE architecture that activates 32 billion parameters per token29. It delivers strong logical capabilities, scoring 90.5% on GPQA Diamond and 87.1% on MMLU-Pro26. The model represents a competitive alternative to western proprietary endpoints on reasoning-heavy workloads4. However, the model’s reasoning trace exhibits high latency, and its generation speed is constrained when running on standard commercial cloud platforms29.  
**Qwen 3 235B-A22B** is Alibaba Cloud’s flagship MoE model, combining 235 billion total parameters with 22 billion active parameters per token37. The model features a hybrid thinking mode, allowing developers to programmatically toggle between rapid responses and detailed chain-of-thought calculation traces8. It scores 85.7% on AIME 2024 and 70.8% on BFCL v3 tool use38. Its primary weaknesses are high latency in thinking mode and significant performance degradation when inputs exceed the 100K token boundary37.  
**Qwen3.5 397B A17B** provides a fully open-weight, Apache 2.0 licensed MoE system for highly complex general reasoning tasks25. It achieves strong scores on SWE-bench Verified (76.2%) and Terminal-Bench (52.5%)36. The model's primary limitation is its extreme hardware footprint, which requires approximately 376 gigabytes of VRAM in four-bit quantization, demanding multi-node GPU clusters for stable enterprise deployment77.  
**DeepSeek R1** is a specialized reasoning MoE model utilizing 671 billion parameters38. It excels at multi-step mathematical calculations and logical coding loops, scoring 74.0% on AIME 2025 and 84.0% on MMLU-Pro12. The model leverages a self-correcting reinforcement learning trace that identifies and corrects its own calculation errors before completing execution5. However, the long chain-of-thought sequences generate high token volume and introduce significant operational latency5.  
**DeepSeek V3** is a 671-billion parameter general-purpose MoE that activates 37 billion parameters per token24. It offers an outstanding speed-to-intelligence ratio, making it highly effective for standard classification and content parsing24. Its main weakness is a more limited context window of 128K tokens42. It also lacks the advanced context-retrieval mechanisms introduced in the V4 generation42.  
**Mistral Large 3** is a 675-billion parameter MoE model under an Apache 2.0 license, optimized for multilingual business operations and structured corporate document parsing12. It scores 92.0% on HumanEval and 85.5% on multilingual MMLU12. Its primary weakness is a lower success rate on complex repository-level coding tasks, where it trails specialized deliberation systems like GLM-5.2 and DeepSeek V418.  
**GLM-5** represents a highly capable, MIT-licensed 744-billion parameter MoE model, achieving a top-tier LMSYS Arena Elo of 1454 and 77.8% on SWE-bench Verified12. The model provides an excellent open-source alternative for complex, enterprise-level agent operations4. However, it has been largely superseded by GLM-5.2, which offers a significantly larger context window and dual-mode thinking configurations18.  
**Kimi K2.5** is a one-trillion-parameter MoE model that activates 32 billion parameters per token under an MIT license12. It delivers strong performance on standardized Python coding benchmarks, scoring 99.0% on HumanEval and 76.8% on SWE-bench Verified32. The model’s main weakness is a lack of native visual grounding capability, which limits its effectiveness on multimodal document parsing1.  
**Llama 4 Maverick** is a 400-billion parameter MoE model that activates 17 billion parameters per token, featuring early-fusion multimodality that natively processes text and images10. It scores 80.5% on MMLU Pro and 69.8% on GPQA Diamond, delivering rapid execution speeds of up to 121 tokens per second43. Its primary weakness is its massive BF16 storage footprint (\~400 gigabytes), which requires high interconnect bandwidth (900 gigabytes per second bidirectional NVLink) to prevent expert routing latencies58.

### **Intermediate Code and Agentic Specialists**

The intermediate class (40B to 150B parameters) represents highly optimized networks tailored for software engineering, terminal tool calling, and RAG execution5.  
**gpt-oss-120b** is OpenAI’s first open-weights model, utilizing a 117-billion parameter MoE architecture with 5.1 billion active parameters46. It delivers strong logical accuracy, scoring 97.9% on AIME 2025 and 80.9% on GPQA Diamond using integrated tool calling50. The model supports three reasoning efforts (low, medium, high), enabling custom latency-versus-quality configurations46. However, the model performs poorly on general instruction-following evaluations, ranking 104th on BenchLM’s index due to alignment regressions outside of scientific tasks81.  
**NVIDIA Nemotron 3 Super** is a 120-billion parameter MoE model that activates 12 billion parameters per token31. It combines Transformer and Mamba-2 layers to support high-throughput text generation across a massive one-million-token context window27. The model is highly effective for RAG and continuous agentic logging28. Its primary weakness is its complex integration, which requires specialized CUDA libraries and custom tensor-parallel settings50.  
**Qwen3.5 122B A10B** is a 125-billion parameter MoE model that activates 10 billion parameters per token53. It ranks as one of the most intelligent systems in the medium parameter class, offering an excellent balance of speed and logical reasoning53. The model's main weakness is its native context limit, which is restricted to 128K tokens53. This restriction limits its suitability for processing extremely long codebases or document collections without external retrieval systems6.  
**Command A** is Cohere’s 111-billion parameter dense model, designed specifically for retrieval-augmented generation (RAG) and tool use54. It features native citation generation, providing explicit grounding spans that directly link claims to source documents56. Its primary weakness is a highly restrictive CC-BY-NC-4.0 license, which limits the model to non-commercial research use55. It also requires a high minimum computational allocation of two data-center GPUs to serve locally55.  
**Command A+ (05-2026)** addresses its predecessor's limitations by upgrading to a 218-billion parameter MoE layout (25 billion active) under a fully permissive Apache 2.0 license57. The model supports a selective W4A4 quantization scheme, compressing the MoE layers to 4-bit precision while keeping the attention pathways and KV cache at full precision57. This allows the model to run on just two H100 GPUs with a two-fold speedup and no measurable logical degradation58. Its main weakness is a relatively restricted context length compared to other MoE architectures57.  
**Laguna M.1** is Poolside’s flagship 225-billion parameter MoE model, designed for long-horizon agentic software engineering36. It features 70 transformer layers (67 sparse MoE layers and 256 experts), scoring 74.6% on SWE-bench Verified and 49.2% on SWE-bench Pro36. The model natively executes interleaved thinking and tool commands in sandboxed environments36. Its main weakness is a narrow general-knowledge baseline, making it unsuitable for tasks outside of code generation and software development61.  
**Llama 4 Scout** is a 109-billion parameter MoE model that activates 17 billion parameters per token, featuring an industry-leading ten-million-token context window9. It maintains perfect retrieval across its entire context depth, enabling repository-scale codebase ingestion10. However, the model trades logical reasoning depth for context length, scoring only 57.2% on GPQA Diamond and 32.8% on LiveCodeBench43. It also relies on the geographically restricted Llama 4 Community License44.  
**Mistral Medium 3.5** represents a traditional 128-billion parameter dense model, offering solid baseline capabilities across classic classification and language comprehension tasks25. It is highly accessible via GitHub Models5. Its primary weakness is a highly restricted context window compared to modern MoE architectures5. It also suffers from higher computational latency due to its dense design, which requires loading all parameters for every processed token9.  
**Mistral Small 4** is an alternative 119-billion parameter dense model under an Apache 2.0 license, optimized for low-latency general-purpose workloads53. The model provides an exceptionally stable deployment baseline for standard text-processing tasks53. Its main weakness is a lower reasoning ceiling compared to MoE models of similar size, which limits its suitability for complex, multi-step engineering agent pipelines9.  
**Devstral 2** is a 125-billion parameter dense model optimized for software engineering and terminal execution36. It scores 72.2% on SWE-bench Verified, delivering strong coding capabilities on a single workstation node36. Its primary weaknesses are high memory overhead during inference and a lower score on Terminal-Bench 2.1 (32.6%) compared to sparse Mixture-of-Experts alternatives of similar size18.  
**HyperNova 60B 2605** is a 59-billion parameter dense model under an Apache 2.0 license, offering strong performance on standard language comprehension benchmarks53. The model's primary weakness is its limited reasoning capacity, making it unsuitable for complex multi-step planning tasks53. It also struggles with long-context retrieval, exhibiting significant performance degradation past its initial context block53.  
**Llama 3.3 70B** is a highly popular and widely deployed 70-billion parameter dense model38. It is highly effective for general-purpose text comprehension, multilingual translation, and structured data extraction38. The model's primary weakness is a lack of native long-context optimization, with a limit of 128K tokens40. It also lacks visual grounding capabilities, leaving it unable to parse charts, diagrams, or user interfaces43.  
**K2 Think V2** is a 70-billion parameter dense model from Moonshot AI, optimized for detailed logical analysis and step-by-step mathematical reasoning25. It delivers solid performance on standardized scientific and logic tests53. The model’s main weakness is its slow generation speed53. This latency limits its suitability for highly interactive developer workflows or real-time conversation agents53.  
**LongCat Flash Lite** is a 69-billion parameter dense model under an Apache 2.0 license, optimized for long-document text processing53. It is highly effective for standard business summarization and document translation53. Its primary weakness is a lower reasoning capacity, which often results in logical contradictions or formatting errors when performing multi-step planning53.

### **Compact Edge, Vision, and Prototyping Systems**

The compact class (less than 40B parameters) includes highly efficient networks designed to run on consumer hardware or edge devices25.  
**Gemma 4 31B IT** is a 30.7-billion parameter dense multimodal model that handles text, image, and video inputs64. Built from the same research base as Gemini 3, it scores 85.2% on MMLU Pro and 89.2% on AIME 202664. The model excels at UI understanding, outputting structured bounding boxes for detected layout elements66. Its main weakness is a slower generation speed due to its dense architecture, which activates all 30.7 billion parameters for each processed token65.  
**Gemma 4 26B A4B IT** is a 25.2-billion parameter MoE model that activates 3.8 billion parameters per token65. It uses 128 experts with sliding window attention to deliver fast generation speeds65. It scores 82.6% on MMLU Pro and 82.3% on GPQA64. The model's primary weakness is a high sensitivity to quantization, with significant performance regressions in coding benchmarks when compressed below 8-bit precision82.  
**North Mini Code** is Cohere’s 30-billion parameter MoE coding specialist, activating only 3 billion parameters per token68. Trained using a cascaded SFT and RLVR pipeline, it achieves a score of 33.4 on the Artificial Analysis Coding Index69. It is optimized across multiple agent harnesses for tool use and command execution69. However, the model has a very weak general knowledge base, scoring only 9.9% on Humanity's Last Exam and 1.7% on GDPval-AA68.  
**gpt-oss-20b** is a compact 21-billion parameter MoE model from OpenAI, activating 3.6 billion parameters per token46. It delivers logical reasoning performance on par with proprietary systems like o3-mini on standard benchmarks46. The model runs efficiently on local edge devices with only 16 gigabytes of RAM46. Its main weaknesses are high verbosity and a heavily English-centric pretraining corpus46.  
**Qwen3.6 27B** is a highly capable 27-billion parameter dense model, delivering strong logical and coding performance38. It scores 84.0% on GPQA Diamond and 84.0% on MMLU-Pro73. The model is highly effective for local developer setups38. Its primary weakness is a high self-hosting VRAM footprint compared to MoE alternatives, requiring a premium consumer GPU like the RTX 4090 to run unquantized77.  
**Qwen3.5 27B** represents the predecessor 27-billion parameter dense model73. It provides a highly stable and reliable baseline for standard text classification, and its dense architecture makes it exceptionally easy to fine-tune on custom datasets6. The model's main weakness is a lower reasoning ceiling compared to Qwen 3.6, resulting in more frequent errors on complex coding tasks73.  
**Qwen3.6 35B A3B** is a 35-billion parameter MoE model that activates only 3 billion parameters per token73. It delivers exceptionally fast execution speeds, matching the throughput of a small 3B dense model77. It scores 84.0% on GPQA Diamond and 45.0% on Terminal Bench73. Its primary weakness is a high memory footprint relative to its active compute, requiring approximately 16.8 gigabytes of VRAM at Q4 precision77.  
**Qwen3.5 35B A3B** is a predecessor 35-billion parameter MoE model73. The model offers excellent memory-to-compute efficiency for standard text operations77. Its primary weakness is a rapid degradation of reasoning capability when processing prompts near its context boundary73. It also struggles to adhere to complex nested formatting constraints in highly structured prompts73.  
**Gemma 3 27B IT** is a 27-billion parameter dense model, optimized for single-GPU deployment38. It scores 87.8% on HumanEval, delivering solid baseline coding performance on consumer-grade hardware38. Its primary weaknesses are a lower MMLU-Pro score (67.6%) and a smaller context window of 128K tokens compared to the Gemma 4 generation40.  
**Phi-4 Reasoning (14B)** is a compact 14-billion parameter dense model from Microsoft, under a permissive MIT license38. It features specialized reasoning architectures that allow it to solve complex logic tasks on low-power workstation cards or mobile devices38. Its primary weakness is a limited pretraining corpus, which often results in hallucinations when processing niche general-knowledge queries38.  
**Phi-4 14B (Dense)** is a standard 14-billion parameter general-purpose dense model38. It achieves strong scores on logical reasoning benchmarks, including 77.3% on MMLU Pro and 75.4% on HumanEval+40. Its main weakness is a relatively small context window of 128K tokens, which restricts its effectiveness on large-scale document parsing tasks6.  
**GLM-4.7-Flash** is a highly efficient 355-billion parameter MoE model that activates 32 billion parameters per token under an MIT license12. The model delivers fast, responsive generation speeds and is widely available on free-tier APIs33. Its main weakness is its legacy architecture, which trails newer entries like GLM-5.2 in long-context retrieval and logical reasoning18.  
**Step-3.5-Flash** is a 30-billion parameter dense model from Stepfun, featuring exceptional mathematical capabilities32. It scores 99.8% on AIME 2025 and 81.1% on HumanEval32. Its primary weakness is a weak instruction-following capability on general knowledge tasks, which often leads to formatting errors when executing non-mathematical prompts32.

## **Analysis of Cloud Providers and Free API Quotas**

Hosting open-weight models at zero cost is made possible by a highly competitive cloud infrastructure landscape7. Developers can choose from several permanent free tiers, each offering different rate limits and data-handling policies5.

| Provider | Access Model | Requests Per Minute (RPM) | Daily Request Limit | Key Hosted Models | Privacy & Training Policy |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Google AI Studio** | Permanent Free Tier6 | 5 – 155 | 20 – 1,5005 | Gemini Flash, Pro, Gemma 4, Gemma 35 | Opt-in for EU/UK/EEA; opt-out elsewhere5 |
| **OpenRouter** | Permanent Free Tier5 | 205 | 50 (1,000 with $10 top-up)5 | 20+ models (GLM-5.2, DeepSeek, Llama 4\)5 | No user data training5 |
| **Groq** | Permanent Free Tier6 | 305 | 1,0005 | Llama 4 Scout, Maverick, Llama 3.35 | No user data training5 |
| **Mistral Studio** | Permanent Free Tier5 | Variable5 | \~1B tokens per month5 | Codestral, Mistral Small/Large5 | Data training required on Experiment tier5 |
| **Cerebras** | Permanent Free Tier5 | 305 | \~1M tokens per day5 | Llama 4 Scout, Qwen3 235B, GPT-OSS-120B5 | No user data training5 |
| **GitHub Models** | Permanent Free Tier5 | 155 | 150 – 1,0005 | GPT-4o, Claude 3.5, Llama, Phi5 | No user data training5 |
| **Cohere** | Trial Tier5 | 205 | 1,000 requests per month5 | Command A, Command A+, Command R5 | Non-commercial evaluation only5 |
| **SambaNova** | Trial Tier5 | Variable5 | $5 signup credit5 | Llama 3.1 405B, Qwen3 235B5 | No user data training5 |

### **The Reality of Free-Tier Limitations**

There is no truly unlimited free LLM API online in 202614. Every mainstream provider enforces strict rate limits across requests per minute (RPM), requests per day (RPD), or tokens per minute (TPM)14.  
On models like Llama 3.3 70B and Llama 4 Scout, the primary constraint is often tokens-per-minute (TPM) rather than requests-per-minute51. For example, Groq's small-model free tier is capped at 6,000 TPM51. This ceiling can be reached in just one or two long prompts, leading to immediate rate-limit blocks (HTTP 429\)14.  
Additionally, on-demand compute allocations can be highly volatile51. This volatility is illustrated by Cerebras, where the available model list has fluctuated without notice due to high demand and specialized hardware sharding51. True unlimited usage requires hosting open weights yourself on paid GPU infrastructure or running models locally via tools like Ollama or vLLM6.

### **Commercial Pricing Comparison for Frontier Weights**

For developers migrating from free prototyping tiers to paid production pipelines, the economics of open-weight hosting vary widely across aggregators and direct API endpoints6.

| Model Identifier | Input Cost (per 1M) | Output Cost (per 1M) | Cached Input Cost (per 1M) | Leading Production Hosts |
| :---- | :---- | :---- | :---- | :---- |
| **GLM-5.2 (max)** | $0.95 – $1.4017 | $3.00 – $4.4017 | $0.14 – $0.2620 | DeepInfra, Decart, Z.ai20 |
| **DeepSeek V4 Pro** | $0.435 – $1.7423 | $0.87 – $3.4823 | $0.0036 – $0.14523 | DeepSeek API, Together, NovitaAI22 |
| **NVIDIA Nemotron 3 Ultra** | $0.423 – $0.681 | $2.61 – $2.671 | $0.09 – $0.2529 | NVIDIA NIM, OpenRouter1 |
| **Command A** | $2.5054 | $10.0054 | $0.50 (Est.) | Cohere Platform, Azure54 |
| **Llama 4 Maverick** | $0.30 – $0.4984 | $0.85 – $1.5045 | $0.10 – $0.2745 | Together, Groq, SambaNova7 |

## **Strategic System Design for Production Engineering**

Moving a project from a free-tier proof of concept to a reliable production system requires a resilient, multi-provider infrastructure design6.

                             \[User API Request\]  
                                     │  
                                     ▼  
                        \[Multi-Provider Gateway\]  
                                     │  
                     ┌───────────────┼───────────────┐  
                     │ (Success)     │ (HTTP 429\)    │ (Heavy Code)  
                     ▼               ▼               ▼  
             \[Google AI Studio\]   \[Groq\]      \[Mistral Studio\]  
             (1.5K Req/Day)       (30 RPM)    (1B Tokens/Month)  
                     │               │               │  
                     └───────────────┼───────────────┘  
                                     ▼  
                          \[Aggregator / Failover\]  
                                     │  
                                     ▼  
                              \[Cerebras / NIM\]  
                            (1M Tokens/Day Max)

### **Deconstructing Tasks via Routing Ladders**

Production systems should use a task-routing ladder to balance cost, latency, and logical quality85. Smaller, faster, and free-tier models (such as North Mini Code or Gemma 4 26B) are assigned to handle routine, low-stakes operations like support ticket routing, classification, or initial draft generation85. The extracted metrics and structured outputs are then passed to premium, high-capacity models only when high-stakes decisions require advanced reasoning85.  
For example, a customer support workflow can use an initial extraction and routing step on a fast, free-tier model85. If the user query is classified as a simple support request, a compact edge model can generate a quick response85. If the query requires complex technical troubleshooting, the system escalates the task, routing the prompt to a premium reasoning engine85.

### **Mitigating Rate Limits with Failover Gateways**

To protect user-facing applications from rate-limit blocks (HTTP 429), developers should deploy a multi-provider gateway strategy14. This gateway acts as an intermediary layer, dynamically routing incoming requests across multiple free and paid endpoints14.

1. **Establish a Primary Provider:** Google AI Studio (using Gemini Flash) is typically configured as the primary endpoint due to its generous 1,500 daily request allowance14. Groq is designated as the primary low-latency endpoint for highly interactive, conversational sequences14.  
2. **Configure Graceful Failover:** When an API request encounters an HTTP 429 error, the gateway interceptor immediately catches the code and redirects the payload to a secondary provider (such as Cerebras, OpenRouter, or Mistral Studio)14.  
3. **Execute Active Client-Side Optimization:** Gateways cache repeated system prompts and static context aggressively using localized database layers, ensuring the same prompt context is not re-sent across endpoints6. They also integrate exponential retry-with-backoff algorithms, absorbing transient network errors and rate-limit resets without exposing disruptions to the user14.

### **Local Execution as a Sovereign Fallback**

For organizations with strict privacy requirements under regulations like GDPR or HIPAA, local offline execution is the most secure deployment path4. Using tools like Ollama, Unsloth, or vLLM, development teams can run highly optimized quants of top models (such as Llama 4 Scout or Gemma 3 27B) directly on internal workstations or single-GPU servers with zero outbound data-sharing risks6.  
Sovereign local deployment eliminates API dependency, recurring token costs, and fourth-party supply chain risks9. It also allows complete customization through full-parameter fine-tuning or specialized LoRA adapters, optimizing the model for proprietary internal datasets4. While local hosting requires upfront hardware investments, the long-term operational savings and absolute data privacy make it a highly strategic option for enterprise applications9.

#### **Works cited**

1. The Open Weight Models that Matter: June 2026 — OpenRouter Blog, [https://openrouter.ai/blog/insights/the-open-weight-models-that-matter-june-2026/](https://openrouter.ai/blog/insights/the-open-weight-models-that-matter-june-2026/)  
2. LLM Model Ranking 2026: How to Choose the Best AI for Your Business \- Paweł Kijko, [https://klewer.pl/en/llm-model-ranking/](https://klewer.pl/en/llm-model-ranking/)  
3. LMArena Leaderboard 2026: Live AI Rankings (Who's \#1 Now) | Local AI Master, [https://localaimaster.com/blog/lmarena-chatbot-arena-leaderboard](https://localaimaster.com/blog/lmarena-chatbot-arena-leaderboard)  
4. Best LLM Leaderboard 2026 | Comprehensive Guide \- Dextra Labs, [https://dextralabs.com/blog/best-llm-leaderboard/](https://dextralabs.com/blog/best-llm-leaderboard/)  
5. Free LLM APIs Compared: Rate Limits, Models, and Real Costs (2026) \- OpenRouter, [https://openrouter.ai/blog/tutorials/free-llm-apis-compared/](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)  
6. Every AI API with a Free Tier in 2026: The Developer's Cheat Sheet \- Grizzly Peak Software, [https://www.grizzlypeaksoftware.com/articles/p/every-ai-api-with-a-free-tier-in-2026-the-developers-cheat-sheet-jl33ach0](https://www.grizzlypeaksoftware.com/articles/p/every-ai-api-with-a-free-tier-in-2026-the-developers-cheat-sheet-jl33ach0)  
7. AI Inference Providers 2026: Free Tier Deep-Dive for CTOs and Data Teams \- Vadzim Belski, [https://belski.me/blog/ai\_inference\_providers\_2026\_free\_tier\_deep\_dive/](https://belski.me/blog/ai_inference_providers_2026_free_tier_deep_dive/)  
8. Qwen 3 vs. Deepseek r1: Complete comparison \- Composio, [https://composio.dev/content/qwen-3-vs-deepseek-r1-complete-comparison](https://composio.dev/content/qwen-3-vs-deepseek-r1-complete-comparison)  
9. Meta Llama 4: The Complete Open-Source AI Model Guide 2026, [https://explainx.ai/blog/meta-llama-4-open-source-models-guide-2026](https://explainx.ai/blog/meta-llama-4-open-source-models-guide-2026)  
10. Llama 4: Models, Architecture, Benchmarks & More | by Jatin Garg | Medium, [https://medium.com/@jatingargiitk/llama-4-models-architecture-benchmarks-more-4f297d6dc0fb](https://medium.com/@jatingargiitk/llama-4-models-architecture-benchmarks-more-4f297d6dc0fb)  
11. Cohere North Mini Code Benchmarked: Top-Tier Open-Source AI Coding That Stays On Your Network \- Petronella Technology Group, [https://petronellatech.com/blog/cohere-north-mini-code-benchmarked-top-tier-open-source-ai-coding-that-stays-on-your-network/](https://petronellatech.com/blog/cohere-north-mini-code-benchmarked-top-tier-open-source-ai-coding-that-stays-on-your-network/)  
12. Top 10 Open-Weight LLMs in 2026 (Ranked by Arena Elo) \- Tech Jacks Solutions, [https://techjacksolutions.com/ai-tools/rankings/top-open-weight-llms/](https://techjacksolutions.com/ai-tools/rankings/top-open-weight-llms/)  
13. [https://openrouter.ai/blog/tutorials/free-llm-apis-compared/\#:\~:text=Permanent%20free%20tiers%20(OpenRouter%2C%20Google,if%20you%20have%20the%20hardware.](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/#:~:text=Permanent%20free%20tiers%20\(OpenRouter%2C%20Google,if%20you%20have%20the%20hardware.)  
14. Free LLM APIs in 2026: Real Free Tiers, Rate Limits & the "Unlimited" Myth | SpeedMVPs, [https://speedmvps.com/blog/free-llm-api-2026](https://speedmvps.com/blog/free-llm-api-2026)  
15. Artificial Analysis Intelligence Index v4.1: a shift toward agentic workloads, [https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-1](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-1)  
16. AI Model Leaderboard July 2026 — LMSys Arena, LLM, Image & Coding Rankings | Swfte, [https://www.swfte.com/ai/leaderboard](https://www.swfte.com/ai/leaderboard)  
17. GLM-5.2 (max) \- Intelligence, Performance & Price Analysis, [https://artificialanalysis.ai/models/glm-5-2](https://artificialanalysis.ai/models/glm-5-2)  
18. GLM-5.2: Features, Setup, Benchmarks, and Model Switching Guide | DataCamp, [https://www.datacamp.com/blog/glm-5-2](https://www.datacamp.com/blog/glm-5-2)  
19. GLM-5.2: Built for Long-Horizon Tasks \- Z.ai, [https://z.ai/blog/glm-5.2](https://z.ai/blog/glm-5.2)  
20. GLM-5.2 Pricing, Benchmarks, and Cost Comparison \- DeepInfra, [https://deepinfra.com/blog/glm-5-2-pricing-benchmarks-cost-comparison](https://deepinfra.com/blog/glm-5-2-pricing-benchmarks-cost-comparison)  
21. GLM 5.2 \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/z-ai/glm-5.2](https://openrouter.ai/z-ai/glm-5.2)  
22. DeepSeek V4 Pro (Max) API Benchmarks: Latency, Throughput & Cost Analysis \- DeepInfra, [https://deepinfra.com/blog/deepseek-v4-pro-max-api-benchmarks-latency-throughput-cost](https://deepinfra.com/blog/deepseek-v4-pro-max-api-benchmarks-latency-throughput-cost)  
23. DeepSeek V4 Pro \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/deepseek/deepseek-v4-pro](https://openrouter.ai/deepseek/deepseek-v4-pro)  
24. DeepSeek V4: The Open-Source Model That Rivals Closed Frontier Models | MindStudio, [https://www.mindstudio.ai/blog/deepseek-v4-open-source-frontier-model-review](https://www.mindstudio.ai/blog/deepseek-v4-open-source-frontier-model-review)  
25. Comparison of Open Source AI Models across Intelligence, Performance, Price, Context Window, and more | Artificial Analysis, [https://artificialanalysis.ai/models/open-source](https://artificialanalysis.ai/models/open-source)  
26. deepseek-ai/DeepSeek-V4-Pro \- Hugging Face, [https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)  
27. NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4, [https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard)  
28. Nemotron 3 Ultra (free) \- API Pricing & Benchmarks | OpenRouter, [https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free)  
29. Nemotron 3 Ultra 550B A55B (Reasoning) Intelligence, Performance & Price Analysis, [https://artificialanalysis.ai/models/nvidia-nemotron-3-ultra-550b-a55b](https://artificialanalysis.ai/models/nvidia-nemotron-3-ultra-550b-a55b)  
30. Nemotron 3 Ultra: Open, Efficient Mixture-of-Experts Hybrid Mamba-Transformer Model for Agentic Reasoning \- Research at NVIDIA, [https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Ultra-Technical-Report.pdf](https://research.nvidia.com/labs/nemotron/files/NVIDIA-Nemotron-3-Ultra-Technical-Report.pdf)  
31. OpenRouter Free Models: All 27 Listed (Jul 2026\) \- CostGoat, [https://costgoat.com/pricing/openrouter-free-models](https://costgoat.com/pricing/openrouter-free-models)  
32. Best LLMs in 2026: Rankings and Benchmark Comparison | Onyx AI, [https://onyx.app/insights/best-llms-2026](https://onyx.app/insights/best-llms-2026)  
33. Free LLM APIs \- Scouts by Yutori, [https://scouts.yutori.com/693978a1-0bd0-4163-b5d6-b58ec23e2f93](https://scouts.yutori.com/693978a1-0bd0-4163-b5d6-b58ec23e2f93)  
34. Best LLM API Providers in 2026: We Reviewed 8 Options \- Fireworks AI, [https://fireworks.ai/blog/best-llm-api-providers](https://fireworks.ai/blog/best-llm-api-providers)  
35. Best AI API's 2026 For Free | AIMLAPI.com, [https://aimlapi.com/best-ai-apis-for-free](https://aimlapi.com/best-ai-apis-for-free)  
36. poolside/Laguna-M.1 \- Hugging Face, [https://huggingface.co/poolside/Laguna-M.1](https://huggingface.co/poolside/Laguna-M.1)  
37. Qwen 3 235B A22B API \- AIMLAPI.com, [https://aimlapi.com/models/qwen-3-235b-a22b-api](https://aimlapi.com/models/qwen-3-235b-a22b-api)  
38. Best Open-Source LLMs: July 2026 Leaderboard \- TECHSY, [https://techsy.io/en/blog/best-open-source-llms-2026](https://techsy.io/en/blog/best-open-source-llms-2026)  
39. Qwen 3 235B A22B Instruct 2507 vs DeepSeek V4 Pro — Price, Context & Specs Compared, [https://metatext.io/compare/venice-qwen3-235b-a22b-instruct-2507-vs-venice-deepseek-v4-pro](https://metatext.io/compare/venice-qwen3-235b-a22b-instruct-2507-vs-venice-deepseek-v4-pro)  
40. AI Model Leaderboard (Live, 2026): Local \+ Frontier Ranked, [https://localaimaster.com/tools/ai-model-leaderboard](https://localaimaster.com/tools/ai-model-leaderboard)  
41. Best Open Source LLMs (July 2026\) \- Thunder Compute, [https://www.thundercompute.com/blog/best-open-source-llms](https://www.thundercompute.com/blog/best-open-source-llms)  
42. DeepSeek V4: Everything You Need to Know About the 1 Trillion Parameter AI Model, [https://deepseek.ai/deepseek-v4](https://deepseek.ai/deepseek-v4)  
43. llama-4-maverick-17b-128e-instruct Model by Meta | NVIDIA NIM, [https://build.nvidia.com/meta/llama-4-maverick-17b-128e-instruct/modelcard](https://build.nvidia.com/meta/llama-4-maverick-17b-128e-instruct/modelcard)  
44. Llama 4 Maverick: Specifications and GPU VRAM Requirements \- ApX Machine Learning, [https://apxml.com/models/llama-4-maverick](https://apxml.com/models/llama-4-maverick)  
45. Llama 4 Maverick \- Intelligence, Performance & Price Analysis, [https://artificialanalysis.ai/models/llama-4-maverick](https://artificialanalysis.ai/models/llama-4-maverick)  
46. Introducing gpt-oss \- OpenAI, [https://openai.com/index/introducing-gpt-oss/](https://openai.com/index/introducing-gpt-oss/)  
47. gpt-oss-120b (high) \- Intelligence, Performance & Price Analysis, [https://artificialanalysis.ai/models/gpt-oss-120b](https://artificialanalysis.ai/models/gpt-oss-120b)  
48. Open models by OpenAI, [https://openai.com/open-models/](https://openai.com/open-models/)  
49. gpt-oss-120b (free) \- API Pricing & Benchmarks | OpenRouter, [https://openrouter.ai/openai/gpt-oss-120b:free](https://openrouter.ai/openai/gpt-oss-120b:free)  
50. gpt-oss-120b Model by OpenAI \- Nvidia NIM, [https://build.nvidia.com/openai/gpt-oss-120b/modelcard](https://build.nvidia.com/openai/gpt-oss-120b/modelcard)  
51. Free LLM API Tiers in 2026: What Groq, Cerebras, Mistral, Gemini and Cohere Actually Give You | Ian L. Paterson, [https://ianlpaterson.com/blog/free-llm-api-2026/](https://ianlpaterson.com/blog/free-llm-api-2026/)  
52. OpenRouter Free Models 2026: API Key, Limits & Rotation Tips, [https://buldrr.com/openrouter-free-api-keys-free-models-simple-guide/](https://buldrr.com/openrouter-free-api-keys-free-models-simple-guide/)  
53. Comparisons of Medium Open Source AI Models (40B-150B) \- Artificial Analysis, [https://artificialanalysis.ai/models/open-source/medium](https://artificialanalysis.ai/models/open-source/medium)  
54. Cohere: Command A \- API Pricing & Benchmarks \- OpenRouter, [https://openrouter.ai/cohere/command-a-03-2025](https://openrouter.ai/cohere/command-a-03-2025)  
55. Command A (03-2025) – 256k context, open weights | LLM Reference, [https://www.llmreference.com/model/cohere-command-a-03-2025](https://www.llmreference.com/model/cohere-command-a-03-2025)  
56. Introducing Command A: Max performance, minimal compute | Cohere Blog, [https://cohere.com/blog/command-a](https://cohere.com/blog/command-a)  
57. CohereLabs/command-a-plus-05-2026-w4a4 \- Hugging Face, [https://huggingface.co/CohereLabs/command-a-plus-05-2026-w4a4](https://huggingface.co/CohereLabs/command-a-plus-05-2026-w4a4)  
58. Cohere Command A+: the first fully Apache 2.0 enterprise | explainx.ai Blog, [https://explainx.ai/blog/cohere-command-a-plus-open-source-apache-2-0-2026](https://explainx.ai/blog/cohere-command-a-plus-open-source-apache-2-0-2026)  
59. \[2605.27605\] Laguna M.1/XS.2 Technical Report \- arXiv, [https://arxiv.org/abs/2605.27605](https://arxiv.org/abs/2605.27605)  
60. poolside/Laguna-M.1 · Hugging Face \- 225B-A23B : r/LocalLLaMA \- Reddit, [https://www.reddit.com/r/LocalLLaMA/comments/1u9b2i3/poolsidelagunam1\_hugging\_face\_225ba23b/](https://www.reddit.com/r/LocalLLaMA/comments/1u9b2i3/poolsidelagunam1_hugging_face_225ba23b/)  
61. Laguna M.1 Benchmarks, Pricing & Speed — July 2026 | BenchLM.ai, [https://benchlm.ai/models/laguna-m-1](https://benchlm.ai/models/laguna-m-1)  
62. Llama 4 Scout: Specifications and GPU VRAM Requirements \- ApX Machine Learning, [https://apxml.com/models/llama-4-scout](https://apxml.com/models/llama-4-scout)  
63. Llama 4 Scout \- Intelligence, Performance & Price Analysis, [https://artificialanalysis.ai/models/llama-4-scout](https://artificialanalysis.ai/models/llama-4-scout)  
64. gemma-4-31b-it Model by Google \- Nvidia NIM, [https://build.nvidia.com/google/gemma-4-31b-it/modelcard](https://build.nvidia.com/google/gemma-4-31b-it/modelcard)  
65. google/gemma-4-31B-it \- Hugging Face, [https://huggingface.co/google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it)  
66. Gemma 4 31B Vision Benchmarks, Latency & Cost \- Roboflow Playground, [https://playground.roboflow.com/models/google/gemma-4-31b](https://playground.roboflow.com/models/google/gemma-4-31b)  
67. Gemma 4 31B (free) \- API Pricing & Benchmarks | OpenRouter, [https://openrouter.ai/google/gemma-4-31b-it:free](https://openrouter.ai/google/gemma-4-31b-it:free)  
68. North Mini Code (free) \- API Pricing & Benchmarks | OpenRouter, [https://openrouter.ai/cohere/north-mini-code:free](https://openrouter.ai/cohere/north-mini-code:free)  
69. Introducing North Mini Code: Cohere's First Model For Developers \- Hugging Face, [https://huggingface.co/blog/CohereLabs/introducing-north-mini-code](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)  
70. north-mini-code-1.0 \- Ollama, [https://ollama.com/library/north-mini-code-1.0](https://ollama.com/library/north-mini-code-1.0)  
71. gpt-oss-120b and gpt-oss-20b are two open-weight language models by OpenAI \- GitHub, [https://github.com/openai/gpt-oss](https://github.com/openai/gpt-oss)  
72. gpt-oss \- LM Studio, [https://lmstudio.ai/models/gpt-oss](https://lmstudio.ai/models/gpt-oss)  
73. Comparisons of Small Open Source AI Models (4B-40B) \- Artificial Analysis, [https://artificialanalysis.ai/models/open-source/small](https://artificialanalysis.ai/models/open-source/small)  
74. Fastest LLM Inference Platform Comparison: Groq vs Cerebras vs SambaNova vs GMI Cloud, [https://www.gmicloud.ai/ja/blog/fastest-llm-platform-compare](https://www.gmicloud.ai/ja/blog/fastest-llm-platform-compare)  
75. GLM-5.2 \- How to Run Locally | Unsloth Documentation, [https://unsloth.ai/docs/models/glm-5.2](https://unsloth.ai/docs/models/glm-5.2)  
76. Deploy NVIDIA Nemotron 3 Ultra on GPU Cloud: Self-Host the 550B Reasoning Model (2026) | Spheron Blog, [https://www.spheron.network/blog/deploy-nemotron-3-ultra-gpu-cloud/](https://www.spheron.network/blog/deploy-nemotron-3-ultra-gpu-cloud/)  
77. Qwen 3 GPU Requirements — Original Family (0.6B–235B) VRAM Guide (2026), [https://willitrunai.com/blog/qwen-3-gpu-requirements](https://willitrunai.com/blog/qwen-3-gpu-requirements)  
78. DeepSeek V4 Pro: Specs, Benchmarks & Pricing (2026) \- Eigent AI, [https://www.eigent.ai/blog/deepseek-v4-pro](https://www.eigent.ai/blog/deepseek-v4-pro)  
79. Llama 4 Maverick Benchmarks, Pricing & Speed — July 2026 | BenchLM.ai, [https://benchlm.ai/models/llama-4-maverick](https://benchlm.ai/models/llama-4-maverick)  
80. openai/gpt-oss-120b \- Hugging Face, [https://huggingface.co/openai/gpt-oss-120b](https://huggingface.co/openai/gpt-oss-120b)  
81. GPT-OSS 120B Benchmarks, Pricing & Speed — July 2026 | BenchLM.ai, [https://benchlm.ai/models/gpt-oss-120b](https://benchlm.ai/models/gpt-oss-120b)  
82. Gemma 4 31B QAT Q4 vs standard Q4 — Top1 KLD benchmark results have me confused. Someone please explain or poke holes in this. : r/LocalLLaMA \- Reddit, [https://www.reddit.com/r/LocalLLaMA/comments/1tyxu55/gemma\_4\_31b\_qat\_q4\_vs\_standard\_q4\_top1\_kld/](https://www.reddit.com/r/LocalLLaMA/comments/1tyxu55/gemma_4_31b_qat_q4_vs_standard_q4_top1_kld/)  
83. Every free LLM provider, ranked by how fast the free tier actually runs out. \- Reddit, [https://www.reddit.com/r/better\_claw/comments/1ue95bf/every\_free\_llm\_provider\_ranked\_by\_how\_fast\_the/](https://www.reddit.com/r/better_claw/comments/1ue95bf/every_free_llm_provider_ranked_by_how_fast_the/)  
84. Unmatched Performance and Efficiency | Llama 4 \- Meta for Developers, [https://developer.meta.com/ai/models/llama-4/](https://developer.meta.com/ai/models/llama-4/)  
85. Best Free Models on OpenRouter 2026: 29 Free LL \- TeamDay.ai, [https://www.teamday.ai/blog/best-free-ai-models-openrouter-2026](https://www.teamday.ai/blog/best-free-ai-models-openrouter-2026)