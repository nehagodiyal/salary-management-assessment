# Project Instructions

## Knowledge Base Auto-Update

Keep `artifacts/knowledge-base.md` in sync with project changes automatically — do not wait for an explicit request.

**Only log actions, never questions.** If the user is just asking a question, seeking an explanation, or having a discussion (e.g., "is this URL correct?", "what does this do?"), do NOT add anything to the KB. The KB records what *changed* in the project, not a Q&A log.

**Trigger an update only when:**
- The user makes (or asks me to make) a concrete change: code edits, config changes, new features, bug fixes, architectural/library decisions, deferred work being completed.

**Do NOT trigger on:**
- Questions, explanations, exploratory discussion, status checks, doc reads — anything that doesn't change project state.

**Map actions to sections in `artifacts/knowledge-base.md`:**
- New architectural/library choice → **Engineering Decisions** (short "Why X" subsection)
- New design pattern adopted → **Patterns Used**
- Auth-related change → **Authentication**
- Bug fix or recurring problem solved (the fix itself, not a discussion) → **Common Issues**
- New planned work or deferred improvement → **Future Improvements**
- Item moves out of **Future Improvements** once shipped

**Style:**
- Keep entries terse and in the existing bullet style — no prose.
- If an action doesn't fit any section (pure refactor, formatting, dep bump with no decision behind it), skip the update.
- Mention the KB update briefly in the end-of-turn summary, but don't ask permission first.
