# **The July 11, 2026 Developer Integration Directory: Model-by-Model Specifications for Leading Free-Tier LLM APIs**

The landscape of open-weight large language models has undergone a paradigm shift toward architectural efficiency.1 The reliance on monolithic, dense networks has been superseded by sparse Mixture-of-Experts architectures, hybrid attention mechanisms, and native hardware-accelerated quantizations.3 As organizations migrate core developer workloads away from proprietary commercial APIs, standardizing on open-weight models has become an industry baseline.6 This transition is heavily supported by major hosting platforms that offer generous free API tiers as strategic funnels for developer acquisition and ecosystem lock-in.6  
The primary engineering challenges in utilizing these APIs on a zero-cost tier center on managing strict token and request limits, navigating frequent model deprecation schedules, and configuring parameters to control intermediate reasoning steps.8 This directory provides the exact integration specifications, endpoint configurations, and technical mechanics required to prompt and orchestrate all forty open-weight models from the standard index across every leading free-tier access channel as of July 11, 2026\.

## **Contextualizing the Modern Open-Weight Paradigm**

Serving frontier-grade intelligence within free API tiers is made economically viable by two core structural innovations.3 The first is the refinement of Mixture-of-Experts architectures, where routing layers activate only a fraction of total parameters per token.1 Consequently, a model such as GLM-5.2 possesses 753 billion total parameters but consumes the inference FLOPs of a 40-billion-parameter dense model, allowing platforms to host it at a fraction of the cost.3 The second innovation is hardware-native low-precision quantization, specifically FP4 and NVFP4, which leverages the dedicated 4-bit tensor cores of modern accelerator architectures to fit massive model weights into localized GPU pools without significant accuracy degradation.3  
To maintain economic viability under extremely long context windows, providers rely heavily on advanced prefix caching.14 Prompt caching yields deep token cost offsets, often cutting input fees by 50% to 90% when developers repeatedly submit stable instructions or broad project codebases.15 Under active agentic workflows, where conversational history is continuously resent, caching is the principal mechanism preventing rapid exhaustion of free-tier token allowances.18

## **Z.ai GLM and Moonshot AI Kimi Model Families**

The Z.ai and Moonshot AI model families represent some of the most capable long-context reasoning systems available.20 Serving these massive networks requires careful alignment of API keys and provider-specific parameters, particularly concerning selectable reasoning effort levels.5

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **1** | GLM-5.2 (max) | DeepInfra OpenRouter Decart | z-ai/glm-5.2 z-ai/glm-5.2 z-ai/glm-5.2 | https://api.deepinfra.com/v1/openai/chat/completions https://openrouter.ai/api/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 1,048,576 17 |
| **5** | Kimi K2.6 | OpenRouter SambaNova AIMLAPI | moonshotai/kimi-k2.6 kimi-k2.6 moonshotai/kimi-k2.6 | https://openrouter.ai/api/v1/chat/completions https://api.sambanova.ai/v1/chat/completions https://api.aimlapi.com/v1/chat/completions | 262,144 21 |
| **13** | GLM-5 | Zhipu AI OpenRouter | glm-5 z-ai/glm-5 | https://api.z.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 200,000 5 |
| **14** | Kimi K2.5 | Moonshot AI OpenRouter | kimi-k2.5 moonshotai/kimi-k2.5 | https://platform.moonshot.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 262,144 25 |
| **28** | K2 Think V2 | Moonshot AI | kimi-k2-thinking | https://platform.moonshot.ai/v1/chat/completions | 262,144 26 |

### **Advanced Reasoning Controls for GLM-5.2 (max)**

GLM-5.2 (max) is uniquely characterized by its selectable effort levels.5 Developers can toggle between "high" and "max" thinking effort.5 The "max" level allocates additional computing resources to resolve difficult, multi-step engineering tasks, whereas "high" mode halves output token consumption to prioritize speed.5 DeepInfra and OpenRouter support setting this via the standard reasoning\_effort parameter inside the JSON payload.5

JSON  
{  
  "model": "z-ai/glm-5.2",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Perform a complete audit of the repository, identifying architectural bottlenecks."  
    }  
  \],  
  "reasoning\_effort": "max",  
  "temperature": 1.0,  
  "top\_p": 0.95  
}

### **Navigating Kimi API Deprecations and Structural Transitions**

Moonshot AI restructured its first-party developer portal on May 25, 2026, officially discontinuing direct API support for the legacy kimi-k2-thinking (K2 Think V2) and kimi-k2.5 endpoints.27 For first-party integrations, developers must route all requests to the native multimodal kimi-k2.6 system.27 However, OpenRouter continues to provide stable backward-compatible proxies for both legacy versions.25 When making calls to Kimi K2.6, developers can utilize its multi-agent swarm schema to orchestrate up to 300 sub-agents in parallel to execute complex, distributed processing tasks.21

## **DeepSeek and Xiaomi MiMo Model Families**

DeepSeek models remain the cost-performance benchmarks of the open-weight ecosystem.14 Coupled with Xiaomi's massive MiMo-V2.5-Pro, these models leverage hybrid attention mechanisms to sustain high throughput across million-token conversations.4

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **2** | DeepSeek V4 Pro (max) | DeepSeek API Together AI NovitaAI SiliconFlow | deepseek-v4-pro deepseek-ai/DeepSeek-V4-Pro deepseek/deepseek-v4-pro deepseek/deepseek-v4-pro | https://api.deepseek.com/v1/chat/completions https://api.together.xyz/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 1,000,000 4 |
| **6** | MiMo-V2.5-Pro | Xiaomi AI Studio OpenRouter | mimo-v2.5-pro xiaomi/mimo-v2.5-pro | https://mimo.mi.com/docs/summary/model https://openrouter.ai/api/v1/chat/completions | 1,048,576 11 |
| **7** | DeepSeek V4 Flash (max) | Together AI OpenRouter Fireworks AI | deepseek-ai/DeepSeek-V4-Flash deepseek/deepseek-v4-flash deepseek-v4-flash | https://api.together.xyz/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://api.fireworks.ai/inference/v1/chat/completions | 1,000,000 32 |
| **10** | DeepSeek R1 | DeepSeek API SambaNova OpenRouter | deepseek-reasoner deepseek-r1 deepseek/deepseek-r1 | https://api.deepseek.com/v1/chat/completions https://api.sambanova.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 128,000 31 |
| **11** | DeepSeek V3 | SambaNova OpenRouter | DeepSeek-V3.1 deepseek/deepseek-v3 | https://api.sambanova.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 128,000 35 |

### **Implementing Preserved Thinking in DeepSeek Multi-Turn Conversations**

The hybrid attention architecture of the DeepSeek V4 series combines Compressed Sparse Attention with Heavily Compressed Attention, reducing key-value cache size by 90% compared to previous generations.18 However, to maintain logical coherence across multi-turn interactions, developers must manually preserve the internal reasoning traces returned in the API response.4  
When the assistant outputs a response, the thinking process arrives in the reasoning\_content parameter.18 This string must be captured and included in subsequent messages to maintain the model's reasoning context.18 If reasoning is not required for standard, simple turns, it should be explicitly disabled to minimize latency and token consumption.18

JSON  
{  
  "model": "deepseek-ai/DeepSeek-V4-Pro",  
  "messages":,  
  "reasoning": {  
    "enabled": true  
  }  
}

Disabling reasoning on Together AI or DeepSeek API endpoints is completed by passing reasoning={"enabled": false} inside the payload, which forces standard, low-latency completions.18

## **Cohere and Poolside Coding Agent Families**

Cohere and Poolside have tailored their model structures to excel in structured repository-level execution.37 These systems operate with a heavy emphasis on tool integration and agentic loop execution.37

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **19** | Command A | Cohere Platform OpenRouter | command-a cohere/command-a | https://api.cohere.com/v1/chat https://openrouter.ai/api/v1/chat/completions | 256,000 38 |
| **20** | Command A+ (05-2026) | Cohere Platform SambaNova | command-a-plus command-a-plus | https://api.cohere.com/v1/chat https://api.sambanova.ai/v1/chat/completions | 128,000 35 |
| **21** | Laguna M.1 | Poolside API OpenRouter | poolside/laguna-m.1 poolside/laguna-m.1:free | https://api.poolside.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 131,072 42 |
| **32** | North Mini Code | Cohere Platform OpenRouter | north-mini-code cohere/north-mini-code | https://api.cohere.com/v1/chat https://openrouter.ai/api/v1/chat/completions | 256,000 39 |

### **The Specialized Utility of North Mini Code**

Released under the Apache 2.0 license, North Mini Code is a 30-billion-parameter MoE model that activates only 3 billion parameters per forward pass, allowing it to run efficiently on a single local GPU.39 While it achieves a high 33.4 on the independent Coding Index—surpassing models four times its size—its non-coding Agentic Index is limited to 21.7.39 Consequently, developers must avoid using it as a general-purpose assistant, instead deploying it as a dedicated code execution sub-agent orchestrated by a larger system.39

JSON  
{  
  "model": "cohere/north-mini-code",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Generate a localized Python unit test for the custom sigmoid router."  
    }  
  \],  
  "temperature": 0.0,  
  "max\_tokens": 2048  
}

Similarly, Poolside's Laguna M.1 operates as a highly specialized 225-billion-parameter coding model (activating 23 billion parameters).43 Developers must retrieve their free-tier credentials by logging in through the official terminal-based pool CLI client.43 Standard calls through OpenRouter should append the :free suffix to standard payloads to bypass premium billing gates.37

## **Mistral AI and Microsoft Phi Reasoning Families**

Mistral and Microsoft have focused their development on compact, highly optimized reasoning structures.2 Their endpoints utilize flexible toggles to control inference latencies.46

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **12** | Mistral Large 3 | Mistral Studio SambaNova OpenRouter | mistral-large-latest mistralai/mistral-large-3 mistralai/mistral-large-3 | https://api.mistral.ai/v1/chat/completions https://api.sambanova.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 128,000 35 |
| **23** | Mistral Medium 3.5 | Mistral Studio GitHub Models | mistral-medium-3.5 mistral-ai/mistral-medium-3.5 | https://api.mistral.ai/v1/chat/completions https://models.inference.ai.azure.com/chat/completions | 256,000 48 |
| **24** | Mistral Small 4 | OpenRouter Mistral Studio | mistralai/mistral-small-2603 mistral-small-latest | https://openrouter.ai/api/v1/chat/completions https://api.mistral.ai/v1/chat/completions | 262,144 46 |
| **25** | Devstral 2 | OpenRouter Mistral Studio | mistralai/devstral-2 devstral-latest | https://openrouter.ai/api/v1/chat/completions https://api.mistral.ai/v1/chat/completions | 128,000 6 |
| **39** | Phi-4 Reasoning | GitHub Models | microsoft/Phi-4-mini-reasoning | https://models.inference.ai.azure.com/chat/completions | 128,000 45 |
| **40** | Phi-4 14B | GitHub Models | microsoft/Phi-4-14B | https://models.inference.ai.azure.com/chat/completions | 16,000 52 |

### **Consolidating Endpoints with Mistral Small 4**

Mistral Small 4 represents a major step forward in operational consolidation.10 By merging three separate model weights—Instruct, Magistral (Reasoning), and Devstral (Coding)—into a single 119-billion-parameter MoE network (activating 6.5 billion parameters), it eliminates the need for complex, multi-model routing systems.10  
Developers can run a single deployment and control the operational mode on a per-request basis.10 Setting the reasoning\_effort parameter to "none" forces the model to respond immediately without executing intermediate reasoning steps, which reduces latencies and limits token consumption.46 If a complex problem is encountered, setting reasoning\_effort to "high" triggers full logical chains.46

JSON  
{  
  "model": "mistral-small-latest",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Verify the memory consumption bounds of this array transpose operation."  
    }  
  \],  
  "reasoning\_effort": "high",  
  "temperature": 0.7,  
  "top\_p": 0.95  
}

Microsoft's Phi-4 series offers similar flexibilities.45 The lightweight Phi-4-mini-reasoning is served via GitHub Models.45 It supports full native function calling, allowing developers to connect structured visual tools directly to the core small language model.45

## **Google Gemma and Specialized Multimodal Families**

Google's Gemma family utilizes advanced attention architectures to deliver high reasoning accuracy.54 Combined with specialized models from Multiverse and Meituan, these networks support highly granular generation parameters.55

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **30** | Gemma 4 31B IT | Google AI Studio OpenRouter NVIDIA NIM | google/gemma-4-31b-it google/gemma-4-31b-it google/gemma-4-31b-it | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions https://openrouter.ai/api/v1/chat/completions https://integrate.api.nvidia.com/v1/chat/completions | 256,000 54 |
| **31** | Gemma 4 26B A4B IT | Google AI Studio OpenRouter | google/gemma-4-26b-a4b-it google/gemma-4-26b-a4b-it | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions https://openrouter.ai/api/v1/chat/completions | 256,000 57 |
| **26** | HyperNova 60B 2605 | OpenRouter | multiverse/hypernova-60b-2605 | https://openrouter.ai/api/v1/chat/completions | 131,072 6 |
| **29** | LongCat Flash Lite | OpenRouter | meituan/longcat-flash-lite | https://openrouter.ai/api/v1/chat/completions | 131,072 6 |
| **38** | Gemma 3 27B IT | Google AI Studio OpenRouter | gemma-3-27b-it google/gemma-3-27b-it | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions https://openrouter.ai/api/v1/chat/completions | 128,000 6 |

### **Overcoming NVIDIA NIM Playground Limitations on Gemma 4**

Gemma 4 31B IT utilizes a hybrid attention mechanism that interleaves sliding-window and global attention layers, backed by Proportional RoPE to ensure linear scaling across its 256,000-token context window.54 However, when calling Gemma 4 through the hosted NVIDIA NIM playground (integrate.api.nvidia.com), developers have observed a critical system issue: the model's internal thinking mode cannot be fully disabled.58 Even when setting the thinkingBudget parameter to 0, the model generates empty thinking tags that introduce latency and can break real-time streaming integrations.58  
To bypass this issue, developers can use the standard Google AI Studio endpoint, where the thinking budget behaves as expected.15 When calling Gemma 4 26B A4B IT (an MoE architecture activating 3.8 billion parameters), the standard autoregressive format is highly stable under NVFP4 precision.57

JSON  
{  
  "model": "google/gemma-4-31b-it",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Verify the logical consistency of this translation module."  
    }  
  \],  
  "thinkingBudget": 1024,  
  "temperature": 0.4  
}

## **OpenAI GPT-OSS and Meta Llama Families**

The OpenAI GPT-OSS and Meta Llama model families represent the primary systems for high-throughput, latency-bound development tasks.2

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **15** | Llama 4 Maverick | Groq (Deprecated) SambaNova OpenRouter | meta-llama/llama-4-maverick-17b-128e-instruct llama-4-maverick-17b-128e-instruct meta-llama/llama-4-maverick-17b-128e-instruct | https://api.groq.com/openai/v1/chat/completions https://api.sambanova.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 131,072 60 |
| **16** | gpt-oss-120b | Cerebras Groq OpenRouter SambaNova | gpt-oss-120b openai/gpt-oss-120b openai/gpt-oss-120b gpt-oss-120b | https://api.cerebras.ai/v1/chat/completions https://api.groq.com/openai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://api.sambanova.ai/v1/chat/completions | 131,072 62 |
| **17** | NVIDIA Nemotron 3 Super | OpenRouter NVIDIA NIM | nvidia/nemotron-3-super-120b-a12b nvidia/nemotron-3-super-120b-a12b | https://openrouter.ai/api/v1/chat/completions https://integrate.api.nvidia.com/v1/chat/completions | 262,144 64 |
| **22** | Llama 4 Scout | Groq (Pending Deprec.) Cerebras OpenRouter Together AI | meta-llama/llama-4-scout-17b-16e-instruct llama-4-scout meta-llama/llama-4-scout-17b-16e-instruct meta-llama/llama-4-scout-17b-16e-instruct | https://api.groq.com/openai/v1/chat/completions https://api.cerebras.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://api.together.xyz/v1/chat/completions | 131,072 1 |
| **27** | Llama 3.3 70B | Groq (Pending Deprec.) Cerebras OpenRouter Together AI | llama-3.3-70b-versatile llama-3.3-70b meta-llama/llama-3.3-70b-instruct meta-llama/llama-3.3-70b-instruct | https://api.groq.com/openai/v1/chat/completions https://api.cerebras.ai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://api.together.xyz/v1/chat/completions | 131,072 65 |
| **33** | gpt-oss-20b | Groq OpenRouter SambaNova | openai/gpt-oss-20b openai/gpt-oss-20b gpt-oss-20b | https://api.groq.com/openai/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://api.sambanova.ai/v1/chat/completions | 131,072 65 |

### **Preparing for the Meta Llama Deprecations on Groq**

Managing model dependencies on Groq requires careful attention to active deprecation cycles.8 Groq has initiated a systematic migration away from its older dense Meta Llama models to optimize processing efficiency on its Language Processing Units (LPUs).8

* **Llama 4 Maverick** (meta-llama/llama-4-maverick-17b-128e-instruct) was decommissioned on **March 9, 2026**, with all traffic redirected to the newly integrated openai/gpt-oss-120b endpoint.8  
* **Llama 4 Scout** (meta-llama/llama-4-scout-17b-16e-instruct) is scheduled for final shutdown on **July 17, 2026**.8 Developers must update all software configurations to point to openai/gpt-oss-120b or qwen/qwen3.6-27b to avoid system failures.8  
* **Llama 3.3 70B** (llama-3.3-70b-versatile) and **Llama 3.1 8B** (llama-3.1-8b-instant) are scheduled for shutdown on **August 16, 2026**.8 Developers must prepare to transition these workflows to openai/gpt-oss-120b and openai/gpt-oss-20b respectively.8

This rapid deprecation timeline places a significant burden on developers, who must monitor these endpoints closely to prevent active production pipelines from breaking.9

Python  
from openai import OpenAI  
import os

\# Calling gpt-oss-120b via Cerebras Inference Engine to bypass local GPU limitations  
client \= OpenAI(  
    api\_key=os.environ.get("CEREBRAS\_API\_KEY"),  
    base\_url="https://api.cerebras.ai/v1"  
)

completion \= client.chat.completions.create(  
    model="gpt-oss-120b",  
    messages=,  
    extra\_body={  
        "reasoning\_effort": "medium"  
    }  
)

print(completion.choices.message.content)

## **Alibaba Cloud Qwen Dense and Sparse Families**

Alibaba Cloud's Qwen family is served through Model Studio (formerly known as DashScope).71 These models utilize highly structured, region-specific pricing and capability routing.71

| Rank | Model Name | Access Provider | Exact API Model ID | Serverless API Endpoint URL | Context Window |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **8** | Qwen 3 235B-A22B | Alibaba Cloud OpenRouter | qwen3-vl-235b-a22b-thinking qwen/qwen-3-235b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 262,144 73 |
| **9** | Qwen3.5 397B A17B | Alibaba Cloud OpenRouter Scaleway | qwen3.5-397b-a17b qwen/qwen3.5-397b qwen/qwen3.5-397b-a17b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 262,144 75 |
| **18** | Qwen3.5 122B A10B | Alibaba Cloud Model Studio | qwen3.5-122b-a10b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions | 262,144 76 |
| **34** | Qwen3.6 27B | Alibaba Cloud OpenRouter | qwen3.6-27b qwen/qwen3.6-27b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 131,072 8 |
| **35** | Qwen3.5 27B | Alibaba Cloud OpenRouter | qwen3.5-27b qwen/qwen3.5-27b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 131,072 36 |
| **36** | Qwen3.6 35B A3B | Alibaba Cloud OpenRouter | qwen3.6-flash qwen/qwen3.6-35b-a3b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 262,144 36 |
| **37** | Qwen3.5 35B A3B | Alibaba Cloud OpenRouter | qwen3.5-flash qwen/qwen3.5-35b-a3b | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions https://openrouter.ai/api/v1/chat/completions | 262,144 36 |

### **Regional Routing Requirements on Alibaba Model Studio**

When integrating Qwen models, developers must observe regional endpoint constraints.71 The default Singapore region endpoint (International mode) is the only deployment region that offers a free-tier quota for developers based outside mainland China.71 Running workloads through standard Chinese Mainland endpoints is cheaper but lacks free-tier allocations and requires local compliance configurations.71  
Furthermore, Qwen3.6 models natively support the preserve\_thinking configuration option, which retains reasoning context from historical messages during complex, multi-turn agentic coding tasks.36 This parameter should be explicitly set to true to optimize multi-step development workflows.36

JSON  
{  
  "model": "qwen3.6-flash",  
  "messages": \[  
    {  
      "role": "user",  
      "content": "Verify the numerical convergence of this custom linear attention layer."  
    }  
  \],  
  "enable\_thinking": true,  
  "preserve\_thinking": true  
}

## **Conclusions**

Navigating the free-tier LLM API ecosystem as of July 11, 2026, requires a systematic understanding of provider limitations, active deprecation curves, and model-specific parameters.8 Consolidating developer workflows onto modern Mixture-of-Experts architectures such as gpt-oss-120b or mistral-small-latest offers immediate advantages in structural stability, logical processing, and execution speed.8  
However, to prevent production outages, engineering teams must maintain automated fallbacks across multiple providers.9 The upcoming Meta Llama deprecation wave on Groq on July 17 and August 16, 2026, is a prime example of the volatile nature of free-tier endpoints, underscoring the necessity of establishing provider-agnostic, run-time-swappable client integrations.8

#### **Works cited**

1. Llama 4 Inference Fast & Affordable – Now Live on GroqCloud, accessed July 11, 2026, [https://groq.com/blog/llama-4-now-live-on-groq-build-fast-at-the-lowest-cost-without-compromise](https://groq.com/blog/llama-4-now-live-on-groq-build-fast-at-the-lowest-cost-without-compromise)  
2. Introducing gpt-oss \- OpenAI, accessed July 11, 2026, [https://openai.com/index/introducing-gpt-oss/](https://openai.com/index/introducing-gpt-oss/)  
3. Top 6 GLM-5.2 Max API Providers Compared \- DeepInfra, accessed July 11, 2026, [https://deepinfra.com/blog/best-glm-5-2-max-api-providers](https://deepinfra.com/blog/best-glm-5-2-max-api-providers)  
4. DeepSeek V4 Pro \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/deepseek/deepseek-v4-pro](https://openrouter.ai/deepseek/deepseek-v4-pro)  
5. GLM-5.2 Explained: Z.ai's Open-Weights Frontier Model \- TechNow, accessed July 11, 2026, [https://tech-now.io/en/blogs/glm-5-2/](https://tech-now.io/en/blogs/glm-5-2/)  
6. Top Open-Weight LLMs Report.md  
7. Free LLM APIs Compared: Rate Limits, Models, and Real Costs (2026) \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/blog/tutorials/free-llm-apis-compared/](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)  
8. Model Deprecation \- GroqDocs \- Groq Console, accessed July 11, 2026, [https://console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations)  
9. Free LLM API Tiers in 2026: What Groq, Cerebras, Mistral, Gemini and Cohere Actually Give You | Ian L. Paterson, accessed July 11, 2026, [https://ianlpaterson.com/blog/free-llm-api-2026/](https://ianlpaterson.com/blog/free-llm-api-2026/)  
10. One Model to Rule Them All. Mistral just shipped Small 4 — a… | by Saikiran Bavandla | Medium, accessed July 11, 2026, [https://medium.com/@sai1004/one-model-to-rule-them-all-2a79cfcf1405](https://medium.com/@sai1004/one-model-to-rule-them-all-2a79cfcf1405)  
11. Deploy MiMo-V2.5-Pro on GPU Cloud: Xiaomi's 1T MoE Coding Model | Spheron Blog, accessed July 11, 2026, [https://www.spheron.network/blog/deploy-mimo-v2-5-pro-gpu-cloud/](https://www.spheron.network/blog/deploy-mimo-v2-5-pro-gpu-cloud/)  
12. GLM-5.2 (max): API Provider Performance Benchmarking & Price Analysis, accessed July 11, 2026, [https://artificialanalysis.ai/models/glm-5-2/providers](https://artificialanalysis.ai/models/glm-5-2/providers)  
13. Fastest LLM Inference APIs in 2026: TTFT and Throughput Guide \- Inworld AI, accessed July 11, 2026, [https://inworld.ai/resources/fastest-llm-inference-api](https://inworld.ai/resources/fastest-llm-inference-api)  
14. DeepSeek V4 Pro: Specs, Benchmarks & Pricing (2026) \- Eigent AI, accessed July 11, 2026, [https://www.eigent.ai/blog/deepseek-v4-pro](https://www.eigent.ai/blog/deepseek-v4-pro)  
15. Google AI Studio Pricing 2026: Free Tier, API Costs & Plans | No Code MBA, accessed July 11, 2026, [https://www.nocode.mba/articles/google-ai-studio-pricing](https://www.nocode.mba/articles/google-ai-studio-pricing)  
16. Groq Pricing In 2026: Every Model, Tier, And Cost Compared \- CloudZero, accessed July 11, 2026, [https://www.cloudzero.com/blog/groq-pricing/](https://www.cloudzero.com/blog/groq-pricing/)  
17. GLM-5.2 Pricing, Benchmarks, and Cost Comparison \- DeepInfra, accessed July 11, 2026, [https://deepinfra.com/blog/glm-5-2-pricing-benchmarks-cost-comparison](https://deepinfra.com/blog/glm-5-2-pricing-benchmarks-cost-comparison)  
18. DeepSeek V4 Pro quickstart \- Together AI docs, accessed July 11, 2026, [https://docs.together.ai/docs/deepseek-v4-quickstart](https://docs.together.ai/docs/deepseek-v4-quickstart)  
19. Groq API Free Tier Limits in 2026: What You Actually Get \- Grizzly Peak Software, accessed July 11, 2026, [https://www.grizzlypeaksoftware.com/articles/p/groq-api-free-tier-limits-in-2026-what-you-actually-get-uwysd6mb](https://www.grizzlypeaksoftware.com/articles/p/groq-api-free-tier-limits-in-2026-what-you-actually-get-uwysd6mb)  
20. GLM-5.2 \- How to Run Locally | Unsloth Documentation, accessed July 11, 2026, [https://unsloth.ai/docs/models/glm-5.2](https://unsloth.ai/docs/models/glm-5.2)  
21. Kimi K2.6 \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/moonshotai/kimi-k2.6](https://openrouter.ai/moonshotai/kimi-k2.6)  
22. GLM 5.2 \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/z-ai/glm-5.2](https://openrouter.ai/z-ai/glm-5.2)  
23. Managed Inference and Agents API with Kimi K2.5 | Heroku Dev Center, accessed July 11, 2026, [https://devcenter.heroku.com/articles/heroku-inference-api-model-kimi-k2-5](https://devcenter.heroku.com/articles/heroku-inference-api-model-kimi-k2-5)  
24. What is GLM-5.2? Z.ai's open model explained (2026) | eesel AI, accessed July 11, 2026, [https://www.eesel.ai/blog/what-is-glm-5-2](https://www.eesel.ai/blog/what-is-glm-5-2)  
25. Kimi K2.5 \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/moonshotai/kimi-k2.5](https://openrouter.ai/moonshotai/kimi-k2.5)  
26. moonshotai/Kimi-K2.6 \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/moonshotai/Kimi-K2.6](https://huggingface.co/moonshotai/Kimi-K2.6)  
27. Model List \- Kimi API Platform, accessed July 11, 2026, [https://platform.kimi.ai/docs/models](https://platform.kimi.ai/docs/models)  
28. glm-5.2 \- Ollama, accessed July 11, 2026, [https://ollama.com/library/glm-5.2](https://ollama.com/library/glm-5.2)  
29. How do I use Kimi K2.5 via openrouter \- Friends of the Crustacean \- Answer Overflow, accessed July 11, 2026, [https://www.answeroverflow.com/m/1465794993196368104](https://www.answeroverflow.com/m/1465794993196368104)  
30. GitHub \- MoonshotAI/Kimi-K2.5: Moonshot's most powerful model, accessed July 11, 2026, [https://github.com/MoonshotAI/Kimi-K2.5](https://github.com/MoonshotAI/Kimi-K2.5)  
31. Top AI Models for SambaNova in 2026 \- Slashdot, accessed July 11, 2026, [https://slashdot.org/software/ai-models/for-sambanova/](https://slashdot.org/software/ai-models/for-sambanova/)  
32. DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence \- arXiv, accessed July 11, 2026, [https://arxiv.org/html/2606.19348v1](https://arxiv.org/html/2606.19348v1)  
33. Models \- MiMo \- Xiaomi, accessed July 11, 2026, [https://mimo.mi.com/docs/quick-start/summary/model](https://mimo.mi.com/docs/quick-start/summary/model)  
34. deepseek-ai/DeepSeek-V4-Pro \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)  
35. SambaCloud Supported Models \- SambaNova Documentation, accessed July 11, 2026, [https://docs.sambanova.ai/docs/en/models/sambacloud-models](https://docs.sambanova.ai/docs/en/models/sambacloud-models)  
36. Qwen3.6-35B-A3B: Agentic Coding Power, Now Open to All, accessed July 11, 2026, [https://qwen.ai/blog?id=qwen3.6-35b-a3b](https://qwen.ai/blog?id=qwen3.6-35b-a3b)  
37. Laguna M.1 (free) \- API Pricing & Providers \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/poolside/laguna-m.1:free](https://openrouter.ai/poolside/laguna-m.1:free)  
38. Command A \- Cohere Documentation, accessed July 11, 2026, [https://docs.cohere.com/docs/command-a](https://docs.cohere.com/docs/command-a)  
39. Cohere North Mini Code: An Open 30B Agentic Coding Model \- Digital Applied, accessed July 11, 2026, [https://www.digitalapplied.com/blog/cohere-north-mini-code-open-source-30b-coding-model-release](https://www.digitalapplied.com/blog/cohere-north-mini-code-open-source-30b-coding-model-release)  
40. Command A \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/cohere/command-a](https://openrouter.ai/cohere/command-a)  
41. Cohere's Command A+ Model, accessed July 11, 2026, [https://docs.cohere.com/docs/command-a-plus](https://docs.cohere.com/docs/command-a-plus)  
42. Poolside: Laguna M.1 (free) — Free AI on Rewind.ai, accessed July 11, 2026, [https://rewind.ai/apps/poolside-laguna-m-1free/](https://rewind.ai/apps/poolside-laguna-m-1free/)  
43. poolside/Laguna-M.1 \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/poolside/Laguna-M.1](https://huggingface.co/poolside/Laguna-M.1)  
44. poolside/laguna-m.1:free (OpenRouter): Free Limits \+ How to Use \- AY Automate, accessed July 11, 2026, [https://www.ayautomate.com/free-models/openrouter-poolside-laguna-m-1-free](https://www.ayautomate.com/free-models/openrouter-poolside-laguna-m-1-free)  
45. Welcome to the new Phi-4 models \- Microsoft Phi-4-mini & Phi-4-multimodal, accessed July 11, 2026, [https://techcommunity.microsoft.com/blog/educatordeveloperblog/welcome-to-the-new-phi-4-models---microsoft-phi-4-mini--phi-4-multimodal/4386037](https://techcommunity.microsoft.com/blog/educatordeveloperblog/welcome-to-the-new-phi-4-models---microsoft-phi-4-mini--phi-4-multimodal/4386037)  
46. mistral-small-4-119b-2603 Model by Mistral AI | NVIDIA NIM, accessed July 11, 2026, [https://build.nvidia.com/mistralai/mistral-small-4-119b-2603/modelcard](https://build.nvidia.com/mistralai/mistral-small-4-119b-2603/modelcard)  
47. With its latest Phi-4 reasoning model, Microsoft reckons bigger isn't always better, accessed July 11, 2026, [https://thenewstack.io/with-its-latest-phi-4-reasoning-model-microsoft-reckons-bigger-isnt-always-better/](https://thenewstack.io/with-its-latest-phi-4-reasoning-model-microsoft-reckons-bigger-isnt-always-better/)  
48. Models Overview \- Mistral Docs, accessed July 11, 2026, [https://docs.mistral.ai/models/overview](https://docs.mistral.ai/models/overview)  
49. mistralai/Mistral-Medium-3.5-128B \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/mistralai/Mistral-Medium-3.5-128B](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)  
50. Mistral Small 4 \- API Pricing & Benchmarks \- OpenRouter, accessed July 11, 2026, [https://openrouter.ai/mistralai/mistral-small-2603](https://openrouter.ai/mistralai/mistral-small-2603)  
51. microsoft/Phi-4-multimodal-instruct \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/microsoft/Phi-4-multimodal-instruct](https://huggingface.co/microsoft/Phi-4-multimodal-instruct)  
52. phi4:14b \- Ollama, accessed July 11, 2026, [https://ollama.com/library/phi4:14b](https://ollama.com/library/phi4:14b)  
53. GitHub Models, accessed July 11, 2026, [https://github.com/marketplace?type=models](https://github.com/marketplace?type=models)  
54. gemma-4-31b-it Model by Google \- Nvidia NIM, accessed July 11, 2026, [https://build.nvidia.com/google/gemma-4-31b-it/modelcard](https://build.nvidia.com/google/gemma-4-31b-it/modelcard)  
55. mradermacher/Hypernova-60B-2605-GGUF \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/mradermacher/Hypernova-60B-2605-GGUF](https://huggingface.co/mradermacher/Hypernova-60B-2605-GGUF)  
56. Longcat 2 model weights have been published : r/LocalLLaMA \- Reddit, accessed July 11, 2026, [https://www.reddit.com/r/LocalLLaMA/comments/1umo8zu/longcat\_2\_model\_weights\_have\_been\_published/](https://www.reddit.com/r/LocalLLaMA/comments/1umo8zu/longcat_2_model_weights_have_been_published/)  
57. Bringing AI Closer to the Edge and On-Device with Gemma 4 | NVIDIA Technical Blog, accessed July 11, 2026, [https://developer.nvidia.com/blog/bringing-ai-closer-to-the-edge-and-on-device-with-gemma-4/](https://developer.nvidia.com/blog/bringing-ai-closer-to-the-edge-and-on-device-with-gemma-4/)  
58. Request: Add google/gemma-4-26b-a4b-it as hosted API on build.nvidia.com \- Models, accessed July 11, 2026, [https://forums.developer.nvidia.com/t/request-add-google-gemma-4-26b-a4b-it-as-hosted-api-on-build-nvidia-com/373414](https://forums.developer.nvidia.com/t/request-add-google-gemma-4-26b-a4b-it-as-hosted-api-on-build-nvidia-com/373414)  
59. Inference \- Cerebras, accessed July 11, 2026, [https://www.cerebras.ai/infcamp](https://www.cerebras.ai/infcamp)  
60. Compare llama-4-maverick-17b-128e-instruct with Other Models | Bifrost \- Maxim AI, accessed July 11, 2026, [https://www.getmaxim.ai/bifrost/model-library/compare/groq/llama-4-maverick-17b-128e-instruct](https://www.getmaxim.ai/bifrost/model-library/compare/groq/llama-4-maverick-17b-128e-instruct)  
61. Llama 4 Maverick \- GroqDocs, accessed July 11, 2026, [https://console.groq.com/docs/model/meta-llama/llama-4-maverick-17b-128e-instruct](https://console.groq.com/docs/model/meta-llama/llama-4-maverick-17b-128e-instruct)  
62. gpt-oss-120b \- API Pricing & Benchmarks | OpenRouter, accessed July 11, 2026, [https://openrouter.ai/openai/gpt-oss-120b](https://openrouter.ai/openai/gpt-oss-120b)  
63. OpenAI GPT OSS \- Cerebras Inference Docs, accessed July 11, 2026, [https://inference-docs.cerebras.ai/models/openai-oss](https://inference-docs.cerebras.ai/models/openai-oss)  
64. Nemotron 3 Ultra by NVIDIA on Vercel AI Gateway, Specs, Pricing & API, accessed July 11, 2026, [https://vercel.com/ai-gateway/models/nemotron-3-ultra-550b-a55b](https://vercel.com/ai-gateway/models/nemotron-3-ultra-550b-a55b)  
65. Supported Models \- GroqDocs \- Groq Console, accessed July 11, 2026, [https://console.groq.com/docs/models](https://console.groq.com/docs/models)  
66. Cerebras — Models, Pricing & API Coverage \- Portkey, accessed July 11, 2026, [https://portkey.ai/models/cerebras](https://portkey.ai/models/cerebras)  
67. gpt-oss-20b (free) \- API Pricing & Benchmarks | OpenRouter, accessed July 11, 2026, [https://openrouter.ai/openai/gpt-oss-20b:free](https://openrouter.ai/openai/gpt-oss-20b:free)  
68. Groq \- Promptfoo, accessed July 11, 2026, [https://www.promptfoo.dev/docs/providers/groq/](https://www.promptfoo.dev/docs/providers/groq/)  
69. Fastest LLM Inference Platform Comparison: Groq vs Cerebras vs SambaNova vs GMI Cloud, accessed July 11, 2026, [https://www.gmicloud.ai/ja/blog/fastest-llm-platform-compare](https://www.gmicloud.ai/ja/blog/fastest-llm-platform-compare)  
70. Model deprecation : GROQ \-\> meta-llama/llama-4-maverick-17b-128e-instruct · Issue \#617 · valentinfrlch/ha-llmvision \- GitHub, accessed July 11, 2026, [https://github.com/valentinfrlch/ha-llmvision/issues/617](https://github.com/valentinfrlch/ha-llmvision/issues/617)  
71. Qwen API Pricing: Full Breakdown of Costs (Jun 2026), accessed July 11, 2026, [https://developer.puter.com/tutorials/qwen-api-pricing/](https://developer.puter.com/tutorials/qwen-api-pricing/)  
72. Alibaba Cloud Model Studio:Qwen Code, accessed July 11, 2026, [https://www.alibabacloud.com/help/en/model-studio/qwen-code](https://www.alibabacloud.com/help/en/model-studio/qwen-code)  
73. Cerebras \- OpenClaw Docs, accessed July 11, 2026, [https://docs.openclaw.ai/providers/cerebras](https://docs.openclaw.ai/providers/cerebras)  
74. Qwen/Qwen3.6-35B-A3B \- Hugging Face, accessed July 11, 2026, [https://huggingface.co/Qwen/Qwen3.6-35B-A3B](https://huggingface.co/Qwen/Qwen3.6-35B-A3B)  
75. Qwen: Qwen3.5: Towards Native Multimodal Agents, accessed July 11, 2026, [https://qwen.ai/blog?id=qwen3.5](https://qwen.ai/blog?id=qwen3.5)  
76. MiMo-V2.5-Pro-FP4-DFlash \- DGX Spark / GB10 \- NVIDIA Developer Forums, accessed July 11, 2026, [https://forums.developer.nvidia.com/t/mimo-v2-5-pro-fp4-dflash/372652](https://forums.developer.nvidia.com/t/mimo-v2-5-pro-fp4-dflash/372652)  
77. Qwen3.6 Plus \- API Pricing & Benchmarks | OpenRouter, accessed July 11, 2026, [https://openrouter.ai/qwen/qwen3.6-plus](https://openrouter.ai/qwen/qwen3.6-plus)  
78. Alibaba Cloud Model Studio:Image and video understanding, accessed July 11, 2026, [https://www.alibabacloud.com/help/en/model-studio/vision](https://www.alibabacloud.com/help/en/model-studio/vision)