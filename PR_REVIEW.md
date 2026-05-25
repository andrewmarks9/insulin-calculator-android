# PR Review Checklist

Use this checklist for pull requests before merge/release.

## Summary
- [ ] PR description clearly explains user impact and scope.
- [ ] Linked issue/ticket is included (if applicable).
- [ ] Screenshots or short screen recording added for UI changes.

## Safety and Medical Requirements
- [ ] Medical disclaimer remains present and unchanged in UI/docs.
- [ ] Dose calculation does not produce negative insulin doses.
- [ ] Rounding behavior remains consistent (1 decimal at calculation time).
- [ ] Invalid numeric input paths are still handled safely.

## Accessibility
- [ ] Labels are associated with inputs (`htmlFor` + `id`).
- [ ] Invalid fields expose error state (`aria-invalid` / `aria-describedby`).
- [ ] Status/error messages are announced to assistive tech (live regions).
- [ ] Keyboard flow is preserved (tab order, focus after key actions).

## Data and Storage
- [ ] LocalStorage interactions are wrapped in error handling.
- [ ] Quota-exceeded behavior still trims/recovers as expected.
- [ ] History limits and retention behavior remain correct.
- [ ] History item IDs are collision-resistant strings and do not rely on Date.now().
- [ ] Sensitive API keys are stored outside LocalStorage and migrated from legacy plaintext settings.
- [ ] Users can clear the secure-stored Gemini API key from Settings.

## Android Permissions and Export
- [ ] Storage permission flow works on Android native builds.
- [ ] Denied permission path provides app-settings guidance.
- [ ] PDF export works for selected date range and reports status in-app.
- [ ] Web export path uses browser download (no native Filesystem/Share dependency in desktop browser).
- [ ] PDF chart capture path does not rely on fixed delay and remains stable on slower devices.
- [ ] Export action state matches the selected date range, not just total history.
- [ ] Export button label clearly reflects the selected range when applicable.

## Code Quality
- [ ] No unrelated refactors mixed into the PR.
- [ ] Lint passes for changed files.
- [ ] Tests pass locally for affected functionality.
- [ ] New/changed behavior is covered by tests where practical.

## Release and Docs
- [ ] CHANGELOG updated if behavior changed.
- [ ] README and Android README updated for user-facing changes.
- [ ] Release docs/examples updated if versioning flow changed.
