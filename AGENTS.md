# Repository instructions

## Project

- This repository contains the public website for 豊田Ai塾.
- Use Japanese for customer-facing copy and handoff notes.
- The source of truth is the GitHub `main` branch.
- The GitHub repository is public: anonymous read/clone is allowed, while pushes still require write access.
- The current production URL is https://toyota-ai-school.mondism.chatgpt.site.

## Setup and validation

- Use Node.js 22.13 or newer and npm with the committed `package-lock.json`.
- Install with `npm ci`.
- Run `npm run doctor` after moving to a new Mac.
- Run `npm run verify` before committing or publishing.
- `npm run lint` currently reports known issues in existing and generated UI components; do not represent lint as clean until those issues are addressed.

## Hosting

- Reuse the existing Sites project in `.openai/hosting.json`.
- Do not create a new Site or replace `project_id` unless the user explicitly requests a migration.
- A GitHub push does not publish the production Site. Sites deployment is a separate step.
- Never persist Sites write credentials, GitHub tokens, API keys, or payment secrets in the repository.

## Editing boundaries

- Do not edit or commit `node_modules/`, `dist/`, `.next/`, `.vinext/`, `.wrangler/`, `output/`, or `tmp/`.
- Preserve the visible demo disclosures until authentication, persistence, reservation delivery, and payments are actually implemented.
- Update `README.md` and `docs/HANDOFF.md` when setup, hosting, routes, or feature status changes materially.
