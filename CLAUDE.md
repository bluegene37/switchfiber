## Git

Never commit. The user commits, always. Do the work, leave it staged or unstaged
in the working tree, and end by printing the exact git commands to run (add,
commit with the full message, push) in a copyable block. This applies to every
change, including reverts and one-line fixes, and to skills that would otherwise
commit on their own (/qa commits per fix, /ship commits and opens a PR) — run
their workflow but stop before the commit and hand over the commands.


## Document & PDF Storage and Naming Standards

- **Central Storage Mirroring**: Always save/mirror generated documentation, executive reports, architecture guides, and exported PDFs to `/Users/bluegene37/Documents/personal_projects/documents/` in addition to workspace `docs/`.
- **Unique Versioning & Timestamps**: Every time a file, report, or export is generated or modified, append a version number and/or date-time stamp to the filename (e.g. `_vX.X_YYYYMMDD_HHmm` or `_YYYYMMDD_HHmmss`) to guarantee uniqueness and prevent overwriting past deliverables.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
