# Tab Pet

Tab Pet is a Nuxt 3 MVP that turns the browser tab title and favicon into a small pet interface.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run test
npm run lint
npm run build
```

End-to-end tests (Playwright) start the dev server themselves:

```bash
npm run build:extension
npm run test:e2e
```

GitHub Actions (`.github/workflows/ci.yml`) runs all of the above on every pull request.
Screenshot baselines for CI are the `*-linux.png` files; after an intended visual change,
run the "Update screenshot baselines" workflow on your branch from the Actions tab.

## Chrome extension

```bash
npm run pack:extension   # zip for the Chrome Web Store → extension/release/
npm run store:images     # store screenshots and promo tile → extension/store/images/
```

See `docs/08-extension.md` and `docs/10-store-listing.md`.
