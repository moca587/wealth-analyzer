# Documents

Working area for legal text that is not yet ready to publish. The canonical,
current documents live in [`../legal/`](../legal/) — edit those, not copies.

## What is here

**`PRIVACY-EN.minimal-fix.md`** — the previous live privacy policy with two
surgical corrections and nothing else changed. It exists because the full
rewrite in `legal/` still has placeholders that only the founder can fill, and
this version has **none**: it can replace a published policy today.

It makes exactly two changes:

- The blanket promise that client data is *"never transmitted to us or to third
  parties"* is replaced by the honest split between the browser application and
  the hosted Platform, and the optional integrations are disclosed — including
  that AI document intake sends the content of uploaded documents to a provider
  in the United States, on the **user's own API key**, which makes the user the
  transmitting party rather than PWI.
- The cookie clause about a **shopping cart** is removed. There is no shopping
  cart; it was unedited template text.

Use it if a corrected policy is needed on the website before the company is
registered. Otherwise publish `legal/PRIVACY-EN.md` once the four items below
are resolved.

## What changed in `legal/`

All four documents carried the same false claim. They have been replaced:

| File | What it was | What it is now |
|---|---|---|
| `legal/PRIVACY-EN.md` | Claimed data is never transmitted; shopping-cart cookie clause | Full rewrite, two products separated |
| `legal/DATENSCHUTZ-DE.md` | Same claim in German | Full rewrite, same facts as the English |
| `legal/TERMS-EN.md` §10.2 | *Contract* text asserting non-transmission and no access | Split into (a) browser software and (b) hosted Platform |
| `legal/AGB-DE.md` §10.2 | Same clause in German | Same split |

The two contract documents mattered most: a false statement in a policy is a
disclosure problem, the same statement in the contract a bank signs is a
representation.

## Before the full rewrite can be published

| Outstanding | Why it is not filled in |
|---|---|
| `CHE-UID` | Requires the commercial-register entry. Do not insert a UID that is not in the register. |
| Application hosting provider | Not chosen. **The Swiss residency commitment in section 10.1 is not met until this component is also in Switzerland** — the database region alone does not satisfy it. |
| Publication date | Set on the day it goes live. |
| Annex A | An internal working checklist. **Delete it from the published text**, as the document itself instructs. |

Already filled: registered office Austrasse 52, CH-8045 Zürich. Website and
data-protection contact are derived from the address published on the sales
decks — a role alias such as `datenschutz@` would be better practice than a
personal mailbox in a published legal document. Website hosting is recorded as
GitHub Pages (GitHub, Inc., **United States**), which is where the demo is
served from.

## Keeping the two languages in step

The English and German versions state the same facts in the same places. If you
edit one, edit the other. A promise that appears in only one language, or is
stronger in one language, is a defect — the German text is the one a Zurich
court and a Swiss compliance function will actually read.

---

None of these has been reviewed by Swiss counsel.
