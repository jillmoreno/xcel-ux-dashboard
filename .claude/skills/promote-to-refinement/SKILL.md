---
name: promote-to-refinement
description: Put the branch you are on in front of the team — derive its Netlify branch-build URL, make sure it is pushed and built, draft the Refinement row (title, where-to-look note), and open the full site's Refinement section with the Add form prefilled so the designer checks it and clicks Add. Step 6 of the Contributing guide, without retyping a URL. Pairs with promote-to-prototype, which later takes the row off. Trigger on "promote to refinement", "add this to refinement", "share this branch", "put this up for review", "share with the team", "/promote-to-refinement".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-21
status: active
---

# Skill: Promote to Refinement

Puts the work on the current branch onto the **Refinement** section of the XCEL
UX Dashboard — the review inbox — by opening the full site's **Add link** form
with everything filled in. The designer looks, maybe edits the note, and clicks
**Add link**. That click is the only thing this skill does not do, on purpose.

## Config — set once per repo

```yaml
full_site: "https://ux-design-xceldashboard.netlify.app"  # the FULL site (designers + developers)
branch_host: "ux-design-xceldashboard.netlify.app"       # branch builds live under this host
review_path: "/dashboard-rebrand?demo=1"                 # what a product branch is reviewed at
```

**`branch_host` is the FULL site, changed 2026-09-21** — it was the public site
(`ux-demo-xceldashboard`) until then. Branch builds are for designers reviewing
each other's work, and a public-mode branch build shows them nothing at all for
any change to a gated section. The consequence is that a branch URL is a full
build; the prototype bar's home icon is dropped there so a stakeholder who gets
the link through a public Refinement row is not one click from the project list.
See CLAUDE.md, "Branch deploys build on the FULL site".

## Why the last step is a click, not a POST

Both Netlify sites sit behind a site password, and that password stands in
front of `/api/demos` too. A script could log in through Netlify's password
form and keep the cookie, but then the password has to live on every
designer's machine and the skill breaks the day the form changes. Instead the
skill hands the finished row to the browser, where the designer is already
signed in: the page reads `?section=demo&add=1&url=…&title=…&note=…`, opens
the form with those fields (see `LinkBoardPresentation.prefill` in
`LinksPanel.tsx`), and strips the params once it has. The form's validation
and the endpoint's both still run. Nothing is saved until Add is clicked.

## Steps

### 1. Where are we?

```bash
git rev-parse --abbrev-ref HEAD
```

- On `main`: stop. Refinement is for branches; `main` IS Prototypes.
- Detached HEAD: stop and say so.

Derive the Netlify **branch slug** the way Netlify does — lowercase, every run
of characters that is not `a–z0–9` becomes one `-`, leading/trailing `-`
trimmed:

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
echo "https://${SLUG}--ux-design-xceldashboard.netlify.app"
```

### 2. Is it pushed?

```bash
git fetch origin --quiet
git status -sb | head -1          # "## feat/x...origin/feat/x" — no [ahead N]
git rev-parse --verify --quiet "origin/${BRANCH}" >/dev/null && echo pushed || echo NOT-PUSHED
```

- No upstream, or `[ahead N]`: say what is unpushed and **offer** to push
  (`git push -u origin "$BRANCH"`, or through the GitHub connector when this
  runs in the Claude desktop app). Do not push without a yes — a push is a
  deploy on this repo.
- Uncommitted changes (`git status --porcelain` non-empty): mention them.
  The branch build will not include them; the designer decides.

### 3. What is being shared?

```bash
git diff --name-only origin/main...HEAD -- public/demos/ | grep '\.html$'
```

- **Files listed** → offer each as `https://<slug>--<branch_host>/demos/<file>`.
  If there is exactly one, default to it.
- **None** → default to the product: `https://<slug>--<branch_host><review_path>`.
- Ask ONE question with **AskUserQuestion** only if there is a real choice
  (several demo files, or demo files AND product changes under `src/`).

### 4. Draft the row

| Field | Draft |
|---|---|
| **Title** | A short description of the work + the branch name, e.g. `Study streak card — feat/study-streak-card`. Take the description from the branch's commit subjects (`git log origin/main..HEAD --format=%s`); if they do not say, ask. |
| **Note** | Where to look and what question is being asked. Ask the designer for one sentence if the commits do not make it obvious: *"Home, under Current Progress. Is the streak motivating or nagging?"* |
| **Added by** | Not needed — the form prefills it from the browser's last author. |
| **Show on public site** | Left OFF. Always. That toggle is Jillienne's decision, made on the page. |

Show the draft (URL · Title · Note) and let the designer edit before opening.

### 5. Has the branch built yet?

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$URL"
```

Netlify answers **200** (built, no password) or **401** (built, behind the
site password) once the deploy is live, and **404** while there is no deploy
for that branch yet. Poll every 20 seconds for up to five minutes on a 404,
saying so; after that, continue anyway with a note that the link will start
working when the build finishes.

### 6. Open the prefilled form

URL-encode each field and open the full site:

```bash
node -e '
const [site,url,title,note]=process.argv.slice(1);
const q=new URLSearchParams({section:"demo",add:"1",url,title,note});
console.log(`${site}/?${q}`)' "$FULL_SITE" "$URL" "$TITLE" "$NOTE"
```

**Give the designer that address as a clickable link** — in the Claude desktop
app the sandbox cannot open their browser, so the link IS the hand-off. (In a
terminal session `open "<address>"` / `xdg-open` is fine too.) Then say, in
two lines: *click the link — the form opens on the full site with the fields
filled; check the note and click **Add link**. The row is team-only until
someone flips "Show on public site".*

## Guardrails

- **Never on `main`.** Refinement is for work in review; `main` is the product.
- **Never push without a yes.** A push is a deploy.
- **Never flip public.** The prefill has no `isPublic` and the form opens with
  the toggle off. Making a row public is a decision made on the page.
- **Never POST to `/api/demos` from the skill.** The click is the gate.
- **One row per branch.** If the designer says a row already exists, do not
  open a second Add — they can **Edit** the existing row on the page.

## The other half

`promote-to-prototype` runs on the PR before merge and ends by retiring this
row. Between the two, the loop is: this skill puts the work on the table;
that one takes it off once it is in Prototypes.
