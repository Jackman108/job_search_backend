# profile

User profile row, ranks (`deriveUserRank`), avatar upload, spin/success counters.

## Public API

- `register(app)` — mount `/profile` routes
- `getUserProfile` / `updateUserProfile` / `deleteUserProfile`
- `incrementSpinCount` / `updateSuccessfulResponsesCount`
- `deriveUserRank` / `handleAvatarUpload`
- `userProfileCache` / `invalidateUserProfileCache`

## Tables

- `profiles`

## Env

None required today (avatar writes under configured uploads path).

## Routes

| Method | Path | Auth |
|--------|------|------|
| GET | `/profile` | yes |
| PUT | `/profile` | yes |
| DELETE | `/profile` | yes |

## Security

- All routes require JWT (`req.userId`); profile scoped by `user_id`.
- Missing profile auto-creates a blank row (not seeded demo content for lists).
- Avatar accepts data-URL or remote URL; files land under uploads with user id in name.
