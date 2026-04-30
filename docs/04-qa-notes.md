# Tab Pet QA Notes

## 1. Local QA Scope

Date: 2026-04-29

Legacy note: this section documents the pre-Growth MVP QA run and may refer to the previous mood-based model. The current Growth MVP verification starts at `2026-04-30 Growth MVP QA`.

Target:

- Nuxt dev server
- URL: `http://127.0.0.1:3000/`

Checked areas:

- First load
- Pet setup
- Action-driven stat updates
- `document.title` updates
- Dynamic favicon link updates
- Disguise title picker
- Theme picker
- Monetization mock visibility
- Emoji copy panel visibility
- Console errors and warnings
- Korean and Japanese language switching
- Locale persistence after reload

## 2. Browser QA Results

| Area | Result |
| --- | --- |
| First load | Passed |
| Initial title | Passed: `Project Dashboard` |
| Pet setup | Passed: Cat selection created the pet state |
| Stats display | Passed: fullness, mood, energy displayed |
| Action update | Passed: repeated play actions changed stats |
| Status calculation | Passed: low fullness produced `hungry` |
| Title signal | Passed: hungry state produced `Project Dashboard *` |
| Disguise title | Passed: selecting Inbox produced `Inbox *` |
| Theme picker | Passed: Night theme became selected |
| Favicon | Passed: one `link[data-tab-pet-icon="true"]` exists with SVG data URL |
| Reload persistence | Passed: selected pet, `Inbox *` title, and Night theme restored after reload |
| Korean i18n | Passed: UI changed to Korean and title localized, e.g. `프로젝트 대시보드 ...` |
| Japanese i18n | Passed: UI changed to Japanese and title localized, e.g. `プロジェクトダッシュボード ...` |
| Locale persistence | Passed: Japanese UI and title restored after reload |
| Console errors | Passed: no browser error or warning logs found |

## 3. Notes

- Nuxt DevTools was disabled after QA so the local MVP screen stays focused on the product UI.
- A reload issue was fixed by syncing the reactive tab title with Nuxt head management as well as `document.title`.
- Nuxt `experimental.appManifest` was disabled to avoid a dev-server-only `#app-manifest` pre-transform error in the current local toolchain.
- Shell `curl` could not connect to the local server because of sandbox loopback restrictions, but the in-app browser loaded the app successfully at `http://127.0.0.1:3000/`.
- Favicon behavior was verified by checking the generated icon link. Browser chrome favicon rendering can vary by browser cache behavior, so final deployment QA should include Chrome and Safari.

## 4. Follow-up QA

- Verify corrupted `localStorage` recovery manually in browser devtools or with an automated browser test when an evaluate-capable runner is introduced.
- Verify mobile layout with a viewport-capable browser test runner.

## 2026-04-30 Growth MVP QA

- `npm run test`: passed (43 tests)
- `npm run lint`: passed
- `npm run build`: passed after stopping the QA dev server lock
- `npm run dev -- --port 5175`: passed at `http://localhost:5175/`
- `npm run dev -- --port 5176`: passed for follow-up hidden-tab browser QA
- Manual browser QA:
  - First entry cat/dog selection: passed
  - Selecting a pet opens the main pet screen: passed
  - Side panel starts on status and switches to settings/back: passed
  - Pet name change: passed
  - Care action delayed stat update and clicked-action cooldown: passed
  - Feed/play/sleep/wash controls update stats: passed
  - Fullness/energy/cleanliness display without mood: passed
  - Level and affinity progress after actions: passed
  - Status title mode: passed for Korean status title in an inactive tab, always-visible mode, and default title while visible in inactive-only mode
  - Disguise preset/custom title modes: passed
  - Favicon data URL changes when pet status changes in disguise title mode: passed
  - Theme system/light/dark visible palette changes: passed
  - Dark theme persistence after reload: passed
  - Reload restores pet state and exercises offline-decay loading path: passed
- Additional coverage:
  - Inactive-tab status title behavior is covered by `tests/pet-alert.test.ts` and was manually verified with a separate headless Chrome two-tab QA flow.
  - The 24-hour offline decay cap is covered by `tests/pet-model.test.ts`; browser QA verified reload persistence and the storage decay path.
- Notes:
  - Browser QA found and fixed a custom disguise title input issue before the final checks.
  - The first `npm run build` attempt was blocked by the running QA dev server lock, then passed after stopping that server.
