# `public/demos/` — HTML work-in-review

Standalone HTML that a designer wants the team (and, once the Demo row is
flipped public, stakeholders) to look at. The React product app needs no folder
— a branch of it is reviewable at `<branch>--<site>.netlify.app/dashboard-rebrand?demo=1`
— but a hand-authored HTML exploration needs somewhere to be SERVED from, and
this is it.

**Why not `public/prototypes/`?** That folder is 404'd on the public build
(`scripts/public-redirects.mjs`): it holds the finished FinServ explorations,
which are gated. This folder is deliberately NOT in that list, so a file here
is reachable from the public site — and therefore from the public site's
branch deploys, which is where a stakeholder review link points.

**The flow**

1. On your branch, add `public/demos/<your-thing>.html`.
2. Push. Netlify builds the branch; your file is at
   `https://<branch>--ux-demo-xceldashboard.netlify.app/demos/<your-thing>.html`.
3. On the full site, Demo → Add demo → paste that URL. Leave "Show on public
   site" off until it is ready for stakeholders.
4. When it is promoted, it moves out of here — into `public/prototypes/` with a
   `PROTOTYPE_FEATURES` row if it is a finished exploration, or into the React
   app if it became a product surface — and the Demo row is retired.

**What this folder is not:** a home. Nothing should live here for long, and
nothing here gets a `PROTOTYPE_FEATURES` row — the Demo panel is its listing.
The smoke suites do not cover it.
