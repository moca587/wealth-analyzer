# Privacy documents

Three privacy notices at different stages. **They are not interchangeable — check
the status below before publishing any of them.**

The policy currently live on `main` at `legal/PRIVACY-EN.md` states that client
data is *"never transmitted to us or to third parties, and we have no access to
it."* That is false as soon as AI document intake or any market-data provider is
used, and the same file carries a cookie clause about a **shopping cart**, which
is unedited template text. Everything here exists to correct that.

| File | Status | Use it for |
|---|---|---|
| `PRIVACY-EN.minimal-fix.md` | **Publishable now** | Replacing the live policy today |
| `PRIVACY-EN.md` | Needs 4 facts | The full rewrite, once the company is registered |
| `DATENSCHUTZ-DE.md` | Needs the same 4 facts | German version of the full rewrite |

---

## `PRIVACY-EN.minimal-fix.md` — publishable now

The live policy with two surgical corrections and nothing else changed:

- The blanket "never transmitted" promise is replaced by the honest split
  between the browser application and the hosted Platform, and the optional
  integrations are disclosed — including that AI document intake sends the
  content of uploaded documents to a provider in the United States, on the
  **user's own API key**, which makes the user the transmitting party.
- The shopping-cart cookie clause is removed.

It adds **no new placeholders**. Two sub-processor rows (email provider,
accounting software) are still bracketed; those were already bracketed on `main`
and are gaps, not misstatements.

## `PRIVACY-EN.md` / `DATENSCHUTZ-DE.md` — the full rewrite

A materially different document: it separates the two products throughout,
separates PWI-as-controller from PWI-as-processor, names every sub-processor
with its jurisdiction and transfer mechanism, and carries an explicit list of
what is still outstanding — including that no data processing agreement exists
yet. It went through three adversarial review passes against the actual code.

The two language versions state the same facts in the same places. If you edit
one, edit the other; a promise that appears in only one language, or is stronger
in one language, is the defect the second review pass was written to catch.

### Before either can be published

| Outstanding | Why it is not filled in |
|---|---|
| `CHE-UID` | Requires the commercial-register entry. Do not insert a UID that is not in the register. |
| Application hosting provider | Not chosen. **The Swiss residency commitment in section 10.1 is not met until this component is also in Switzerland** — the database region alone does not satisfy it. |
| Publication date | Set on the day it goes live. |
| Annex A | An internal working checklist. **Delete it from the published text**, as the document itself instructs. |

### Facts already filled in

Registered office Austrasse 52, CH-8045 Zürich. Website and data-protection
contact are derived from the address published on the sales decks — a role alias
such as `datenschutz@` would be better practice than a personal mailbox in a
published legal document. Website hosting is recorded as GitHub Pages
(GitHub, Inc., **United States**), which is where the demo is served from.

---

None of these has been reviewed by Swiss counsel.
