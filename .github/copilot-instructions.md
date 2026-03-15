---
applyTo: "**"
---

# GitHub Copilot Instructions

## Security

- **Never read, display, suggest, or reference the contents of any `.env` file** (including `.env`, `.env.local`, `.env.development`, `.env.production`, `.env*.local`, or any other environment variable file). This includes summarising, printing keys, or inferring values from them.
- If asked about environment variable values, respond only with the variable *name* and where it should be configured — never its value.
- Do not generate code that logs, exposes, or transmits values sourced from environment variables to any external service.
