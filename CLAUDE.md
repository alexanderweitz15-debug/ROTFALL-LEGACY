# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ROTFALL: LEGACY — a grimdark sandbox RPG that runs in the browser. Plain ES modules, **no build step, no npm, no dependencies**, no image files: every sprite is drawn in code as a pixel raster. Everything user-facing (UI text, code comments, docs, commit messages) is **German**; keep it that way.

## Running and testing

ES modules don't load over `file://`, so serve the repo root with any static server:

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

A browser module cache causes stale code after edits. Use a server that sends `Cache-Control: no-store`, or bump the cache key (below).

- `?test` runs the built-in self-test on load (results in the console).
- `?dev` exposes `window.RF` (state `RF.S`, `RF.selftest()`, `RF.tick(ms)`, `RF.spawnEnemy`, `RF.travel`, `RF.simFight`, `RF.coop.fakeGuest`, …).
- **Ctrl+Shift+D** opens the debug menu (`debugSections()` in game.js). Every feature has an entry there to trigger it.
- `?coopLocal` runs network co-op between two windows of the same browser (BroadcastChannel instead of WebRTC).

**Self-test** = `selftest()` in `src/game.js`, a list of `ok(name, cond)` probes (~300). There is no filter argument; to run "one test", read `RF.selftest()` output (array of `PASS …`/`FAIL …` strings) or evaluate the probe body in the console. It takes ~40 s, so in tooling start it with `setTimeout(() => window.__st = RF.selftest(), 50)` and read `window.__st` in a later call. All probes must pass.

**The self-test and dev snippets must never change the real save.** Before a test reload, restore the save from the backup and silence saving:

```js
localStorage.setItem('rotfall.legacy.save', localStorage.getItem('rotfall.backup.s14c'));
localStorage.setItem('rotfall.slot.active', 'legacy');
// reload with ?dev, then: RF.S._quiet = true; click [data-act="continue"]
```

Probes use `sandbox()` / `stage()` / `actor()` helpers inside `selftest()` (throwaway maps like `__a`); anything else they touch must be restored.

There is no linter. After editing a file, at least parse-check it (e.g. with acorn in the browser: `acorn.parse(src, {ecmaVersion: 2022, sourceType: 'module'})`) and confirm `window.RF` exists after reload (a duplicate top-level `const` breaks the whole module).

## Editing rules learned the hard way

- **Never put code after a `//` comment on the same line.** Scripted edits that append to a line have swallowed code several times. Use `/* … */` for inline comments.
- `src/game.js` is ~23k lines. Make targeted edits with unique anchors; re-read the region first.
- **Line endings differ per file:** `buildings.js`, `data.js`, `sim.js`, `sky.js` and `docs/ROADMAP_ZENTRAL.md` are CRLF; all other source files (including `game.js`) are LF. Edit byte-exact; never let a tool (e.g. Git-Bash `sed -i`) rewrite a whole file's line endings. The Edit tool inserts LF, so use a byte-exact script for the CRLF files.
- **RNG split:** game logic draws from the seeded `rnd()` (state.js); visuals use `vrnd` (Math.random). New `rnd()` calls shift random-dependent probes.
- **Save format RFZ1** (gzip, 15 bit per char) since 01.10.; old JSON saves still load (`unpackAll` before `boot()`, then `loadRaw`).
- **Cache key:** every import and `index.html` use `?v=N` (currently `v=29`). When shipping, bump it everywhere (index.html + all `import … from './x.js?v=N'` + `import('./coop.js?v=N')`), plus the visible version label in `index.html`. `src/coop.js` also has `VER`, which must match.
- New save fields must tolerate being missing (old saves). Migrations go into `continueGame()` / the `ensure*()` functions it calls.
- Keep world generation deterministic: `world.js` uses the seeded `rnd()` from state.js; adding RNG calls there shifts the whole world.
- Every new mechanic needs an in-game hint for the player (log, toast, tooltip or dialogue) and a debug entry. Also add it to `docs/MECHANIKEN.md`.
- Balance numbers follow `docs/REGELN_UND_SPECS.md` §D (balance rules); measurements go into the appendix of `docs/IST_ZUSTAND.md`. Measure with `RF.simFight(...)`.

## Architecture

`index.html` loads `src/game.js` (entry, `boot()`). Modules, by responsibility:

- **state.js** — the single mutable state object `S`, seeded RNG, log/chronicle, `saveData()`/`applySave()`/`save()`/`loadRaw()`. **Save slots:** `SAVE_KEY` is a live binding to the active slot (`setSlot`, `slotIndex`, `rotfall.slots` index). The legacy slot keeps the key `rotfall.legacy.save`. `SKIP` lists state keys never saved (e.g. `coop`, `fx`).
- **data.js** — all content tables: `ITEMS`, `MONSTERS`, `NPCS`, `CLASSES`, `ABILITIES`, `SKILL_TREE`, `TITLE_CLASSES`, `FACTIONS`, `QUESTS`, `BOSS_LOOT`, `ELITES` (bounty mini-bosses), spells `sp_*`. 
- **world.js** — deterministic map generation (`genWorld`, dungeons, sky island, sea isles, tower), tiles/collision, `TOWN_PLAN` (towns/villages), `HOUSES`, `LOCATIONS`, `regionAt()`.
- **game.js** — everything else: main loop (`loop` → `update` → `R.drawFrame`), player control, combat (`attack`/`resolveSwing`/`hit`/`hurt`/`die`, projectiles), AI (`think` → `updateEnemy`/`updateNpc`/`partyAI`), dialogue (`talk`), quests/contracts, jail/bond/crime, big world events (`BIG`), event consequences (`S.after`), economy hooks, death and succession (`playerDeath` → `chooseSuccessor`), debug menu, self-test. Content lives in data.js; behaviour lives here.
- **sim.js / economy.js** — off-screen world simulation: war graph (armies, fronts, occupation), town markets, caravans, prices.
- **body.js** — hit zones and limbs (`damagePart`, knockout/revive), bionics (prosthesis tiers, modules, robot eye).
- **render.js** — canvas renderer (tile chunks, entities, light/weather, UI overlays). **sprites.js / fig5.js / figure.js** — procedural pixel sprites. A "spec" object (`humanSpec`, `monsterSpec`) describes a figure. Only fields in `SPEC_KEYS` affect the frame cache, so new look fields must be added there. Seeded variants use `e.seed`. Art style "R" (fig5.js) is the default; D is selectable but frozen; F (reference atlas) is switched off (saved F loads as R, the PNG is not loaded). **anim.js** — death types and gestures. **buildings.js**, **atlas.js** (world map, fog), **sfx.js** (WebAudio synthesis), **cloudsave.js** (encrypted export/import).
- **ui.js** — HUD, modals (`openModal(name)`), dialogue (`dialogue(npc, text, choices)`). `bind(actions)` receives callbacks from game.js. `uiHooks` lets coop reroute dialogues and modals.
- **coop.js** — opt-in network co-op (PeerJS/WebRTC, lazy-loaded only from the co-op button). The host simulates everything and saves; guests send input, receive entity deltas, and never save. Guests play their own hero (`coopHero`, parked in `S.coopHeroes` when offline) or pilot a companion (`m.coopPilot`). Hooks into game.js go through `coopHooks` and the `coopAPI()` object. Design notes live in the code comments of coop.js (the former PLAN_COOP.md is in git history, commit c21fd64).

**Transient content pattern:** many NPC groups (Aurelion, Eisenfeste life, Karak-Atar, Black Keep court, Weidenau militia, mini-boss followers) are marked `transient: true`. They are not saved; instead an idempotent `ensure*()` rebuilds them on every load. Those functions are called in both `newGame()` and `continueGame()` (search `ensureDefenseMasters();`). Add new populations the same way. NPC dialogue options are appended in `talk()` via helper hooks such as `bionicChoices`, `karakChoices` and `keepChoices`.

**Probes and RNG:** `chance()`/`pick()` draw from the shared seeded RNG. Adding entities or RNG calls anywhere can change the outcome of random-dependent probes. If an unrelated probe starts failing, log its intermediate values before assuming a regression; sometimes it exposes a real logic bug.

Map ids: `S.map` is `'world'` or a dungeon/area key; entities live in `S.ents[map]`. `byId()` resolves ids across maps. Time: `S.minute` (1 real second = 1 game minute), `S.day`. Difficulty via `DIFF`/`applyDifficulty`.

## Docs worth knowing

Exactly five documents plus STYLE_GUIDE (doc cleanup 08.10.2026; everything older is in git history, commit c21fd64):

- `docs/ROADMAP_ZENTRAL.md` — **the one list of open work** and open developer decisions. Update it after every finished package or agent report; never start a parallel list.
- `docs/IST_ZUSTAND.md` — inventory of every existing feature (check here before building something that may already exist); appendix holds the balance measurements.
- `docs/MECHANIKEN.md` — player-facing rules of every mechanic, appended every round.
- `docs/ENTSCHEIDUNGEN.md` — every decision the developer has made (protocol); never contradict it silently.
- `docs/REGELN_UND_SPECS.md` — binding workflow (Feature Readiness Gate, team rules, balance rules) and the developer's specs (world/tutorial, skills/grind, combat animation, visual).
- `docs/STYLE_GUIDE.md` — art direction (style R default; references in `docs/reference/`).
