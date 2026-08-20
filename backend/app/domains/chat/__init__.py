"""Chat domain — LLM clients for chat completion.

We talk to the provider through the OpenAI SDK with a configurable
base URL, so the same client works against Mistral, OpenAI, Groq,
Together, etc.
"""