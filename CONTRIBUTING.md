# Contributing

Thanks for wanting to help! Here's how to get set up and what to keep in mind.

## Dev setup

```bash
git clone https://github.com/buzzb0x/ytwl.git
cd ytwl
npm install
npm run dev
```

## Before you submit

```bash
npm test          # run the test suite
npm run lint      # check for lint errors
npm run types     # TypeScript type-check
npm run format    # auto-format with Prettier
```

All four should pass cleanly. The pre-commit hook (`husky`) will run lint and tests automatically.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include repro steps, browser/OS, and what you expected vs. what actually happened.

## Requesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Explain the problem you're solving, not just the solution.

## Pull requests

- Keep PRs focused — one feature or fix per PR
- Write or update tests for any changed logic
- Follow the existing code style (TypeScript strict, no `any`, `cn()` for classes)
- Fill out the PR template

## Userscript changes

The script at `scripts/tampermonkey-export.user.js` runs inside YouTube's page, so:
- Avoid modern syntax that old browsers don't support (it's not transpiled)
- Test against a real Watch Later playlist with a variety of video types (Shorts, live streams, long videos)
- Bump `@version` in the script header

## Architecture notes

See `AGENTS.md` for a detailed breakdown of the project structure, data model, and patterns used throughout the codebase.
