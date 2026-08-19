# Contributing to SkillsConnect Ghana

Thanks for helping improve SkillsConnect Ghana — we appreciate human contributors.

- Run tests and linters before opening a PR:

```bash
npm install
npm run lint
npm run test
```

- Commit message style: `type(scope): short summary` (e.g., `fix(register): validate phone format`).
- Keep PRs small and focused; include screenshots or short recordings for UI changes.
- For database/seed changes, update `database/skillsconnect.sql` and add a short note in the PR describing the realistic data added.
- If your change adds or modifies user-facing copy, mark the PR with `i18n` and include sample screenshots showing the new copy in context.

Maintainers will review within 48 hours. For urgent production fixes, tag `@jesse` in the PR title.
