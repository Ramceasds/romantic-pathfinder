<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Mobile-first dating app (web/PWA, installable on Android); authenticated screens live under `src/routes/_authenticated.*` with a client-only (`ssr: false`) auth guard in the layout.
- Users are identified in app tables by `profiles.id` (not auth user id); `my_profile_id()` backs all RLS. Why: demo profiles have no auth user.
- Demo profiles (`is_demo`) are seeded in the migration; database triggers auto-match likes on them and send canned chat replies.
- Matches are created only by the `handle_new_swipe` trigger (pairs stored ordered, `profile_a < profile_b`); clients never insert matches.
- Avatars are in a private storage bucket (public buckets are blocked); photo_url stores the storage path (or `demo:N` for bundled images) and `ProfilePhoto` resolves signed URLs.
