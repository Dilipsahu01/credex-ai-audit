# PROMPTS.md

## Anthropic API Integration

### Model Used
claude-haiku-4-5-20251001

### Why Haiku
Haiku is the fastest and cheapest Claude model ($1/1M input tokens).
The summary task is simple text generation — no complex reasoning needed.
Sonnet would cost 3x more with no quality improvement for this use case.

### System Design
The prompt is sent from a Next.js API route (server-side) so the
ANTHROPIC_API_KEY is never exposed to the browser.

### The Prompt (Final Version)
[paste your prompt here]

### What I Tried First (v1)
Initially asked for a bullet-pointed summary. Output was too structured
and felt robotic. Switched to prose with "plain text only" instruction.

### Fallback Strategy
If the API call fails or returns an empty response, a template string
is generated client-side using the audit numbers directly. The results
page never breaks due to API failure.

### Token Usage
- Input: ~200 tokens per audit (prompt + tool summary)
- Output: ~100 tokens (2-3 sentences)
- Cost per audit: ~$0.0003 (less than 1 cent)
