#!/bin/bash
# Setup all tracking files for MyDistinctAI project

echo "🚀 Setting up MyDistinctAI tracking files..."

# Create .claude/context directory
mkdir -p .claude/context

# ============================================
# 1. Create INSTRUCTIONS.md (Master Rules)
# ============================================
cat > .claude/context/INSTRUCTIONS.md << 'EOF'
# 🛑 MANDATORY INSTRUCTIONS - READ BEFORE EVERY TASK

## Critical Workflow Rules

### BEFORE Starting ANY Task:
1. ✅ Check **claude.md** for the relevant prompt (38 prompts total)
2. ✅ Check **progress.md** to see what's already done
3. ✅ Check **decisions.md** for architectural context
4. ✅ Create feature branch: `git checkout -b feature/[name]`

### DURING Development:
1. ✅ Follow the exact prompt from claude.md
2. ✅ Run quality checks: `npm run format && npm run lint && npm run type-check`
3. ✅ Test changes in browser
4. ✅ Commit frequently: `git commit -m "[type](scope): description"`

### AFTER Every Task Completion:

**MANDATORY - NEVER SKIP:**

1. **Update progress.md:**
   - Move completed task from "In Progress" to "Completed"
   - Add completion date
   - Note any blockers encountered
   - Add next steps

2. **Update bugs.md:**
   - Log ANY bugs found during development
   - Include: severity, description, steps to reproduce
   - Mark bugs as fixed when resolved
   - Document the fix applied

3. **Update decisions.md:**
   - Log EVERY architectural decision made
   - Include: context, decision, rationale, alternatives considered
   - Document trade-offs
   - Date each decision

4. **Update tasks.md:**
   - Check off completed tasks
   - Add new tasks discovered
   - Update sprint priorities

5. **Run Quality Checks:**
   ```bash
   npm run format
   npm run lint
   npm run type-check
   ```

6. **Commit Changes:**
   ```bash
   git add .
   git commit -m "[type](scope): description"
   ```

## File Locations:
- **claude.md**: Complete development guide (38 sequential prompts)
- **progress.md**: Track what's done, in progress, pending, blocked
- **bugs.md**: Log all bugs and their fixes
- **decisions.md**: Document all architectural decisions
- **tasks.md**: Sprint planning and task management

## Never Skip:
❌ Don't work on main branch
❌ Don't skip updating tracking files
❌ Don't skip format/lint/type-check
❌ Don't skip git commits
❌ Don't skip testing
❌ Don't skip documenting decisions

## Always Do:
✅ Check claude.md first
✅ Create feature branch
✅ Update ALL tracking files after every task
✅ Run quality checks
✅ Test thoroughly
✅ Commit with proper messages
✅ Document architectural decisions

## Response Template:

After completing any task, always respond with:

```
✅ Task Complete: [Task Name]

📋 Files Updated:
- ✓ progress.md: [what was updated]
- ✓ bugs.md: [any bugs logged]
- ✓ decisions.md: [any decisions logged]
- ✓ tasks.md: [tasks checked off]

🔧 Quality Checks:
- ✓ npm run format: Passed
- ✓ npm run lint: Passed
- ✓ npm run type-check: Passed

🧪 Testing:
- ✓ [What was tested]

📦 Git:
- ✓ Committed: [commit message]

📌 Next Steps:
- [What to do next from claude.md]
```

EOF

# ============================================
# 2. Create progress.md Template
# ============================================
cat > progress.md << 'EOF'
# MyDistinctAI Development Progress

**Last Updated:** [Auto-update this date on every change]

---

## 📊 Overview

**Project Start Date:** [Insert Date]  
**Current Phase:** Phase 1 - Foundation  
**Completion:** 0% (0/38 prompts completed)  
**Active Sprint:** Sprint 1 - Foundation (Week 1)

---

## ✅ Completed Tasks

### Phase 1: Project Foundation
- [ ] **Prompt 1:** Project initialization *(Not started)*
  - Created: N/A
  - Completed: N/A
  - Notes: Waiting to begin
  
- [ ] **Prompt 2:** Tracking files setup *(In Progress)*
  - Created: [Date]
  - Completed: N/A
  - Notes: Creating all tracking files

- [ ] **Prompt 3:** Supabase configuration *(Not started)*
  - Created: N/A
  - Completed: N/A
  - Notes: Pending completion of Prompt 2

---

## 🚧 In Progress

**Current Task:** Setting up tracking files and project structure  
**Started:** [Date]  
**Assigned To:** Developer  
**Blockers:** None

### Active Work Items:
1. Creating progress.md, bugs.md, decisions.md, tasks.md
2. Setting up .claude/context/ directory
3. Configuring Claude Code context

---

## ⏳ Pending Tasks

### Phase 1: Foundation (Week 1)
- [ ] Complete project initialization (Prompt 1)
- [ ] Setup Supabase integration (Prompt 3)
- [ ] Create database schema (Prompt 4)
- [ ] Build authentication system (Prompt 5)

### Phase 2: Landing Page (Week 2)
- [ ] Hero section (Prompt 6)
- [ ] Features grid (Prompt 7)
- [ ] How it works section (Prompt 8)
- [ ] Audience tabs (Prompt 9)
- [ ] Waitlist form (Prompt 10)

### Phase 3: Dashboard (Week 2-3)
- [ ] Dashboard layout (Prompt 11)
- [ ] Models dashboard (Prompt 12)
- [ ] Create model modal (Prompt 13)

### Phase 4: File Upload (Week 3)
- [ ] File upload component (Prompt 14)
- [ ] File processing backend (Prompt 15)

### Phase 5: White-Label (Week 3)
- [ ] Dynamic branding system (Prompt 16)
- [ ] Branding settings page (Prompt 17)

### Phase 6: Chat Interface (Week 4)
- [ ] Chat UI (Prompt 18)
- [ ] Chat API (Prompt 19)

### Phase 7: Payments (Week 4)
- [ ] Stripe setup (Prompt 20)
- [ ] Pricing page (Prompt 21)

### Phase 8: Desktop App (Week 5-6)
- [ ] Tauri initialization (Prompt 22)
- [ ] Ollama integration (Prompt 23)
- [ ] LanceDB integration (Prompt 24)
- [ ] File encryption (Prompt 25)

### Phase 9: Advanced Features (Week 6-7)
- [ ] Training progress tracker (Prompt 26)
- [ ] Model analytics (Prompt 27)
- [ ] User settings (Prompt 28)
- [ ] Documentation site (Prompt 29)
- [ ] Onboarding flow (Prompt 30)

### Phase 10: Testing & Launch (Week 8-10)
- [ ] Testing setup (Prompt 31)
- [ ] Deployment configuration (Prompt 32)
- [ ] Performance optimization (Prompt 33)
- [ ] Security hardening (Prompt 34)
- [ ] Accessibility audit (Prompt 35)

### Phase 11: Bonus Features (Week 10+)
- [ ] Admin dashboard (Prompt 36)
- [ ] Email templates (Prompt 37)
- [ ] Mobile optimization (Prompt 38)

---

## 🐛 Known Issues

See **bugs.md** for detailed bug tracking.

**Critical Bugs:** 0  
**Minor Bugs:** 0  
**Fixed Bugs:** 0

---

## 🚫 Blockers

**Current Blockers:** None

### Resolved Blockers:
- None yet

---

## 📈 Metrics

**Total Prompts:** 38  
**Completed:** 0 (0%)  
**In Progress:** 1 (3%)  
**Pending:** 37 (97%)  

**Estimated Completion:** Week 10 (based on 10-week timeline)

---

## 📝 Recent Updates

### [Date] - Project Initialization
- Created tracking files (progress.md, bugs.md, decisions.md, tasks.md)
- Setup .claude/context/ directory
- Configured Claude Code context

---

## 🎯 Next Milestone

**Milestone 1:** Foundation Complete (End of Week 1)
- [ ] Project initialized
- [ ] Supabase configured
- [ ] Database schema created
- [ ] Authentication working
- [ ] Protected routes implemented

---

## 📚 Resources

- **Development Guide:** claude.md (38 prompts)
- **Bug Tracker:** bugs.md
- **Decision Log:** decisions.md
- **Task Manager:** tasks.md
- **Architecture:** architecture.md
- **Deployment:** deployment.md

---

**Template for Updates:**

When updating this file, use this format:

```
### [Date] - [Task Name]
- ✅ Completed: [What was built]
- 📦 Files Created: [List files]
- 🐛 Bugs Found: [Link to bugs.md entries]
- 📝 Decisions Made: [Link to decisions.md entries]
- ⏱️ Time Taken: [Estimated time]
- 🎯 Next Steps: [What to do next]
```

---

**Last Updated by:** Claude  
**Last Update Date:** [Auto-update on every change]
EOF

# ============================================
# 3. Create bugs.md Template
# ============================================
cat > bugs.md << 'EOF'
# 🐛 Bug Tracker - MyDistinctAI

**Last Updated:** [Auto-update this date]

---

## 📋 Quick Stats

**Total Bugs Logged:** 0  
**Critical Bugs (🔴):** 0  
**Major Bugs (🟠):** 0  
**Minor Bugs (🟡):** 0  
**Fixed Bugs (✅):** 0  
**Open Bugs:** 0

---

## 🔴 Critical Bugs (P0 - Fix Immediately)

*Critical bugs that prevent core functionality or cause data loss*

### Template:
```
### BUG-001: [Bug Title]
**Status:** 🔴 Open / ✅ Fixed  
**Severity:** Critical  
**Component:** [Component/File Name]  
**Reported:** [Date]  
**Fixed:** [Date or N/A]  
**Reporter:** [Name]

**Description:**
[Detailed description of the bug]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Messages:**
```
[Paste error logs here]
```

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Node Version: [version]
- Next.js Version: [version]

**Root Cause:**
[What caused the bug - fill after investigation]

**Fix Applied:**
[How it was fixed - fill after fixing]

**Related Files:**
- [List affected files]

**Related Issues:**
- Links to related bugs or decisions

**Commit:**
[Git commit hash that fixed the bug]

**Verified:**
- [ ] Fixed in development
- [ ] Tested thoroughly
- [ ] No regression issues
- [ ] Documentation updated
```

---

## 🟠 Major Bugs (P1 - Fix This Sprint)

*Bugs that significantly impact functionality but have workarounds*

---

## 🟡 Minor Bugs (P2 - Fix When Possible)

*Bugs that have minimal impact or cosmetic issues*

---

## ✅ Fixed Bugs

### Template:
```
### ✅ BUG-XXX: [Bug Title]
**Fixed:** [Date]  
**Component:** [Component Name]  
**Fix Commit:** [commit hash]  
**Quick Summary:** [One-line description of bug and fix]
```

---

## 📝 Bug Reporting Guidelines

When logging a bug, ALWAYS include:

1. **Clear Title:** Brief description of the issue
2. **Severity:** Critical/Major/Minor
3. **Component:** Which file/component is affected
4. **Steps to Reproduce:** Exact steps to trigger the bug
5. **Expected vs Actual:** What should vs what actually happens
6. **Error Messages:** Full error logs and stack traces
7. **Environment:** Browser, OS, versions
8. **Screenshots/Videos:** If applicable

### Severity Levels:

- **🔴 Critical (P0):** 
  - App crashes or is unusable
  - Data loss or corruption
  - Security vulnerabilities
  - Authentication broken
  - Payment processing fails
  
- **🟠 Major (P1):**
  - Feature doesn't work as intended
  - Significant UX problems
  - Performance issues
  - Error messages but app still usable
  
- **🟡 Minor (P2):**
  - Cosmetic issues
  - Small UX improvements
  - Non-critical features
  - Typos or formatting

---

## 🔍 Common Bug Patterns

### Authentication Issues
- Check Supabase session handling
- Verify JWT token expiration
- Review protected route middleware

### File Upload Issues
- Verify file size limits
- Check Supabase Storage permissions
- Review CORS settings

### UI/Styling Issues
- Check Tailwind classes
- Verify responsive breakpoints
- Review z-index stacking

### API Issues
- Check API route handlers
- Verify request/response types
- Review error handling

---

## 🛠️ Bug Fix Workflow

1. **Log the Bug:** Create entry in this file
2. **Investigate:** Find root cause
3. **Create Branch:** `git checkout -b fix/bug-description`
4. **Fix the Bug:** Implement solution
5. **Test:** Verify fix works
6. **Document:** Update bug entry with fix details
7. **Commit:** `git commit -m "fix(component): description"`
8. **Update:** Move to "Fixed Bugs" section
9. **Close:** Mark as ✅ Fixed

---

## 📊 Bug Statistics by Component

| Component | Critical | Major | Minor | Fixed | Total |
|-----------|----------|-------|-------|-------|-------|
| Auth | 0 | 0 | 0 | 0 | 0 |
| Dashboard | 0 | 0 | 0 | 0 | 0 |
| File Upload | 0 | 0 | 0 | 0 | 0 |
| Chat | 0 | 0 | 0 | 0 | 0 |
| Payments | 0 | 0 | 0 | 0 | 0 |
| Branding | 0 | 0 | 0 | 0 | 0 |
| API | 0 | 0 | 0 | 0 | 0 |

---

**Last Updated by:** Claude  
**Last Update Date:** [Auto-update on every change]
EOF

# ============================================
# 4. Create decisions.md Template
# ============================================
cat > decisions.md << 'EOF'
# 🎯 Architectural Decisions Log (ADL) - MyDistinctAI

**Last Updated:** [Auto-update this date]

---

## 📋 Purpose

This document logs all significant architectural and technical decisions made during the development of MyDistinctAI. Each decision includes context, rationale, alternatives, and consequences.

---

## 🎯 Decision Summary

**Total Decisions:** 0  
**Last Decision:** N/A  
**Most Recent:** N/A

---

## 📝 Decision Template

```
## ADL-XXX: [Decision Title]

**Date:** [YYYY-MM-DD]  
**Status:** ✅ Accepted / 🤔 Proposed / ❌ Rejected / 🔄 Superseded  
**Deciders:** [Who made this decision]  
**Tags:** #architecture #frontend #backend #database #security

### Context

[Why was this decision needed? What problem are we solving?]

### Decision

[What did we decide to do?]

### Rationale

[Why did we make this decision? What factors influenced it?]

### Alternatives Considered

1. **Alternative 1:** [Description]
   - Pros: [List pros]
   - Cons: [List cons]
   - Why rejected: [Reason]

2. **Alternative 2:** [Description]
   - Pros: [List pros]
   - Cons: [List cons]
   - Why rejected: [Reason]

### Consequences

**Positive:**
- [List positive outcomes]

**Negative:**
- [List negative outcomes or trade-offs]

**Neutral:**
- [List neutral impacts]

### Implementation Notes

[Any important notes about implementing this decision]

### Related Decisions

- ADL-XXX: [Related decision]
- ADL-XXX: [Related decision]

### References

- [Links to relevant documentation, discussions, or resources]

---
```

---

## 🏗️ Foundational Decisions

### ADL-001: Initial Tech Stack Selection

**Date:** [Current Date]  
**Status:** ✅ Accepted  
**Deciders:** Development Team  
**Tags:** #architecture #stack #foundation

#### Context

Building a privacy-first AI platform that allows users to create custom GP