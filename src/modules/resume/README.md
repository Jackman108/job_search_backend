# resume

User resume stack: resume, contacts, skills, work experience, plus HH sync upsert.

## Public API

- `register(app)` — mount resume / contacts / skills / work_experience routes
- CRUD helpers: `*ResumeUser`, `*ContactUser`, `*SkillUser`, `*ExperienceUser`
- `upsertResumeFromHh(userId, mapped)` — worker sync port
- `getResumeByUserId` / `invalidateResumeIdCache`

## Tables

- `resumes`, `contacts`, `skills`, `work_experience`

## Env

None required today.

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET/POST/PUT/DELETE | `/resume` | yes |
| GET/POST/PUT/DELETE | `/contacts` | yes |
| GET/POST | `/skills` | yes |
| PUT/DELETE | `/skills/:skillId` | yes |
| GET/POST | `/work_experience` | yes |
| PUT/DELETE | `/work_experience/:experienceId` | yes |

## Security

- All routes require JWT (`req.userId`); child rows scoped via resume owned by user.
- Empty lists → `200 []` / null-safe reads (no fake seed rows).
