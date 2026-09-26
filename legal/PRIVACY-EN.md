# Privacy Policy

**Private Wealth Intelligence GmbH (in formation / in Gründung)** · Zurich, Switzerland
Version 2.0 · Last updated: [Date of publication — to be inserted]
Supersedes version 1.0, which described only the browser-based Wealth Analyzer software.

> **Note before publication.** This policy is drafted under the revised Swiss Federal Act on Data Protection (revFADP / nDSG, in force since 1 September 2023) and addresses the corresponding requirements of the EU GDPR where that regulation applies. **It has not yet been reviewed by Swiss counsel.** Annex A lists every placeholder and every confirmation still outstanding. Annex A is an internal working annex and must be removed from the published text once its items are resolved.

> **Material change notice.** Version 1.0 stated that all financial data is processed "exclusively locally in your browser" and is "never transmitted to us or to third parties". That was accurate for the browser-based software and is **not** accurate for the Wealth Analyzer Platform. This version corrects it. Section 3 explains which statements apply to which product. Three other documents — `TERMS-EN.md`, `AGB-DE.md` and the Platform's own landing page — carried the same uncorrected claim. Replacement text for all three was prepared alongside this version; that each is actually published must be confirmed before this notice goes live. See Annex A, item 2.

> **Status of the Platform.** At the date of this version the Wealth Analyzer Platform **has never been deployed**. No production environment exists, no database has been created, and **no end-client data has ever been processed in it**. Part B of this policy therefore describes **what the software is built to do**, not what is currently happening. Where this policy describes a safeguard, it describes a safeguard implemented **in code**; it does not assert operational maturity — uptime, monitoring, backup testing, incident drills — that we have not yet had the opportunity to exercise. We say this plainly rather than write Part B in a present tense that would be false.

---

## 1. Controller and Contact Details

**Private Wealth Intelligence GmbH (in formation / in Gründung)**
Austrasse 52
CH-8045 Zurich, Switzerland
Commercial register number: CHE-[UID — to be inserted upon registration; see Annex A, item 3]

Email (data protection): mivetic@privatewealthintelligence.ch
Website: privatewealthintelligence.ch

**Accountable for data protection:** Momir Ivetic, Managing Director

We have not appointed a data protection adviser under Art. 10 revFADP; that appointment is voluntary for private controllers under Swiss law. Where the GDPR applies to a given processing activity, whether Art. 37 GDPR requires a Data Protection Officer is a question we have not yet formally assessed; the assessment is recorded in Annex A, item 9 and will be completed before launch. Whether an EU representative under Art. 27 GDPR is required is likewise open (Annex A, item 9).

You may contact us at the address above with data-protection questions or to exercise your rights. Please read section 12 first: for the financial data of a wealth-management firm's own clients, your request should normally be directed to that firm rather than to us.

## 2. Our Role: Controller for Some Data, Processor for Other Data

We act in **two distinct roles**, and this policy is divided accordingly.

**We are the controller** (Art. 5(j) revFADP; Art. 4(7) GDPR) for:

- user accounts, authentication and identity data of the staff of our customer firms;
- organisation, seat, membership and invitation data;
- billing and subscription data;
- website and server-log data;
- support correspondence.

These are covered by **Part A** (sections 4 to 7).

**We are a processor** (Art. 5(k) revFADP; Art. 4(8) GDPR) for:

- the financial and personal data of the **end clients** of our customer firms, which those firms enter into, or import into, the Platform.

For that data the **controller is the wealth-management firm** — typically a FINMA-supervised External Asset Manager, a portfolio manager or a manager of collective assets licensed under FinIA, or a bank. That firm decides which clients exist, which of its advisers may see them, which custodian and order-management endpoints are configured, and what is done with the results. We process such data **only on that firm's documented instructions**. This is covered by **Part B** (sections 8 to 12).

**On the Data Processing Agreement.** Those instructions belong in a Data Processing Agreement (Auftragsbearbeitungsvertrag) under Art. 9 revFADP and Art. 28 GDPR. **No such agreement has yet been drafted.** We state this rather than refer you to a document that does not exist. A DPA will be concluded with each firm **before onboarding**, and **no end-client data may be entered into the Platform before it is concluded**. Where this policy defers a point to "the DPA", it defers it to that future agreement, and section 11 records one term that agreement cannot contain in its standard form.

We do **not** determine the purposes or means of processing end-client financial data, and we do not use it for our own purposes.

**One qualification to this split.** Our server and application logs are ours as controller, and they may incidentally contain identifiers relating to an end client — a household identifier in a request path, for example. Where end-client data reaches our logs we treat it as the firm's data and handle it on that footing; where a defect causes such data to be logged, we treat the defect as a security incident and inform the firm (section 16).

## 3. Two Products — and Which Statements Apply to Which

We offer two different products. They handle data in fundamentally different ways, and **no statement in this policy should be read as applying to both unless it says so.**

### 3.1 Wealth Analyzer (the browser-based software)

A single-file application that runs in your browser. There is no server component and no account.

Financial and household data you enter (income, expenses, assets, liabilities, goals, simulation results) is held in your browser's `localStorage`. **We do not receive it, we have no access to it, and we do not store it.** If you clear your browser storage, it is gone, and we cannot recover it.

**Two qualifications follow. The first is optional and yours; the second is not optional and is ours.**

**(a) Optional integrations you activate, on your own credentials.** The software contains features that, **when you activate them**, send data directly from your browser to third parties **you** choose, using API credentials **you** supply and store in your own browser:

- **AI document intake and AI portfolio suggestions.** If you enter your own Anthropic API key, the software sends the **complete content of the documents you upload** — bank and brokerage statements, tax forms, pension letters, screenshots, photographs and handwritten notes, transmitted as base64-encoded PDF or image data — directly from your browser to Anthropic (United States). The AI portfolio feature in this browser-based software sends the client's risk profile and portfolio constraints. **The Platform has an AI portfolio feature too, and it works differently: it is rule-based and makes no call to any model provider — see section 9.6.**
- **Market-data, reference-data and news providers**, where you supply a key. The software's managed provider grid covers **13 providers across 14 credential slots** (Finnhub, Alpha Vantage, Twelve Data, Financial Modeling Prep, Tiingo, Polygon.io, EOD HD, Alpaca, CoinMarketCap, Open Exchange Rates, NewsAPI, Marketaux, FRED — Alpaca occupies two slots, a key and a secret); further providers, including institutional data services, are configurable outside that grid. A complete list of the providers the software can be pointed at, and of the credential slots it may store, is available on request (Annex A, item 7).
- **A third-party CORS relay (`corsproxy.io`)**, used to reach several of the above from a browser. **That relay sees the full request URL and the response passing through it** — including, for several providers, your API key in the query string.
- **Custodian, CRM and order-management endpoints** that you configure yourself.

In each case **you are the party transmitting the data**, on your own credential and under your own contract with that provider. We are not a party to the call, we hold no key, and we receive nothing. The provider's own privacy terms and retention practices govern.

The software uses **63 distinct browser storage keys**, of which **27 are slots for provider credentials**. Anyone with access to that browser profile can read them. If you use the software with data subject to professional or banking secrecy, **activating any of these features is a disclosure to a third party**, and assessing that is your decision, not ours.

**(b) Not optional: the charting library and typography.** Separately, and **without any action by you**, this build of the software loads its charting library from `cdnjs.cloudflare.com` and its typography from `fonts.googleapis.com` (both United States). Those services receive your IP address and browser details when the page opens. You do not choose this and cannot decline it except by using a different build; we determine it, and we are controller for it. Where a justification is needed it is our overriding private interest in delivering the software (Art. 31(1) revFADP); where the GDPR applies, Art. 6(1)(f) GDPR.

**The offline build `wealth-analyzer-standalone.html` is better, but it is not fully offline, and we do not describe it as such.** It vendors its charting library and typography into the file, so opening the page makes no third-party request. However, **the first time you open a zip-based document in it — an XLSX spreadsheet or a DOCX file — it fetches two further libraries (`jszip` and `xlsx`) from `cdnjs.cloudflare.com` at that moment**, which is precisely the moment a client statement is being opened. That request carries your IP address and browser details to the same United States service. Our automated release check does not catch this, because it inspects only static script tags and these libraries are injected at runtime. A firm that requires no third-party request at all must therefore either refrain from opening zip-based documents in the software, or block that domain at the network and accept that those file types will not open.

### 3.2 Wealth Analyzer Platform (the hosted service / SaaS)

A multi-tenant hosted service for wealth-management firms, with accounts, server-side storage and multi-user access. **It is not yet deployed** (see the status note above).

**Data in the Platform is stored on our servers.** A client household's complete financial position is held in our database. It is not confined to your browser. Part B describes this in detail.

Two things nonetheless remain client-side, and we state them because they are true:

- **Monte Carlo projections and financial calculations are computed in your browser**, not on our servers. A `simulations` table exists in the database schema but **no part of the application reads or writes it**; no simulation results are stored. If that changes, this policy will be updated before the change takes effect.
- **Custodian and CRM statement content retrieved through our feed relay is passed to your browser and is not written to our database**, unless an adviser chooses to apply it to a client's plan. See section 9.3 for the two qualifications to that.

**On "zero egress".** Earlier sales material described the product as having "data residency · zero egress". That describes the browser-based software, not the Platform. The Platform makes outbound connections in the following places:

1. custodian and CRM feeds the firm configures (section 9.3);
2. order routing to a system the firm nominates (section 9.4);
3. AI document intake, only where enabled (section 9.5);
4. **public market and research data**: fund price history from Yahoo Finance, and published market commentary from asset managers' public websites (BlackRock, Fidelity, Vanguard, J.P. Morgan Asset Management, Capital Group, Franklin Templeton, Schwab, Nuveen). These requests carry a fund identifier or nothing at all; **they carry no client identity and no client financial position**;
5. **our payment provider**, Stripe (`api.stripe.com`), for subscription and invoicing calls. **No end-client or plan data is sent** — see sections 4.3 and 10.

This list covers the outbound connections we are aware of in the current build; we do not make an exhaustive negative claim about a codebase still under development, and the Platform's egress is one of the things re-checked before launch (Annex A, item 18). The sales material is being corrected (Annex A, item 8).

---

# PART A — Where We Are the Controller

## 4. Data We Process as Controller

### 4.1 User Accounts and Authentication (Platform)

For each user at a customer firm we process: **email address, password (stored only as a hash by our authentication provider), display name, email-confirmation status, and session data.** Authentication and identity management are operated for us by **Supabase** (section 10).

We also process **organisation data** (firm name, seat count, subscription status, entitlement, firm-level order limits) and **membership data** (which user belongs to which firm, and in which role: owner, administrator, compliance or adviser).

We do **not** treat *which adviser is assigned to which client* as our own controller data: that record identifies an end client of the firm and is held as processor (section 8.8).

**Basis:** Under Swiss law no legal basis is required for this processing; where a justification is needed it is performance of the contract with you (Art. 31(2)(a) revFADP). Where the GDPR applies, the legal basis is Art. 6(1)(b) GDPR.

**Whether you must provide this data (Art. 13(2)(e) GDPR).** Provision of the account data in this section is a **contractual requirement**: without an email address and authentication credentials we cannot create a user account and the Platform cannot be used. Provision of the billing data in section 4.3 is required by contract and by our statutory accounting obligations. Provision of support content in section 4.4 is **voluntary**; without it we may be unable to assist.

### 4.2 Invitations

When an administrator invites a colleague, we process the **invitee's email address in plain text**, the role offered, an expiry date, and who issued the invitation. The invitation token itself is stored **only as a hash**, so a copy of our database contains no usable invitation.

**We do not send invitation emails.** The invitation link is displayed once to the administrator, who distributes it by their own means.

We do, however, send **account-confirmation and password-reset email**: those are dispatched by our authentication provider, Supabase, on our behalf, and carry the user's address and a login-capable link. Account confirmation is **required** and is not disabled on our deployments. Which mail sender Supabase uses in production, and whether a separate SMTP provider is engaged, is recorded in Annex A, item 5. **We operate no marketing, bulk or newsletter email.**

**Basis:** performance of the contract and our overriding private interest in enabling firms to manage their own teams (Art. 31(1) and 31(2)(a) revFADP). Where the GDPR applies, Art. 6(1)(b) and (f) GDPR.

### 4.3 Purchase, Subscription and Billing

**What we hold is narrower than a billing section usually implies, and we state it exactly.** We store: the **account owner's email address**, our internal organisation identifier, the **Stripe customer and subscription identifiers**, the seat count, the subscription status, and a ledger of billing events.

**Name, company name, billing address, card data and invoices are collected and held by Stripe, not by us.** We do not store card data at any point. The only data we transmit to Stripe is the account owner's email address (or, once established, the Stripe customer identifier), our internal organisation identifier, the price identifier, the seat quantity, and the return URLs. **No end-client data and no financial-plan data is ever sent to Stripe.**

**Basis:** performance of the contract (Art. 31(2)(a) revFADP; Art. 6(1)(b) GDPR) and statutory retention duties, in particular Art. 958f Swiss Code of Obligations (10 years for accounting records; Art. 6(1)(c) GDPR).

### 4.4 Support Requests

When you contact us we process your email address and name, the content of your request including attachments, and the metadata needed to respond.

**Please do not send us end-client financial documents or client-identifying data by email.** If a support matter requires it, we will agree a secure route with your firm under the DPA.

**Basis:** our overriding private interest in responding to enquiries (Art. 31(1) revFADP; Art. 6(1)(f) GDPR), and contractual performance where the request concerns an existing contract.

### 4.5 Website Visits and Server Logs

Our website hosting provider and we collect standard access data in server logs: IP address, date and time, URL requested, response status, data volume, referrer and user-agent. Normally deleted after 30 days.

**Platform application logs.** The Platform writes diagnostic messages to the application's standard output, which the hosting environment collects. Those messages may contain technical identifiers, including a household identifier appearing in a request path. **We do not intend to log the content of client financial plans or of extracted documents; where such logging is found it is treated as a defect and removed.** We state the record as it stands:

- **One such defect has been corrected.** The document-intake route previously wrote the model's full extraction to the server log, and no longer does (section 9.5).
- **One such defect is open at the date of this version.** The Platform's AI portfolio route (section 9.6) writes plan-derived output to the server log: the research signals it used and, for each of the two research sets it compares, the generated asset allocation and the selected funds with their weights — all of it derived from the client's investment amount, risk profile and time horizon. The client's name is not logged and the document-intake path is not involved. The code marks this as temporary diagnostic logging for an internal comparison. **It is nevertheless plan-derived content in a log, it contradicts the intention stated above, and it must be removed before any client data is entered** (Annex A, item 19).

Where these logs are collected and how long the hosting environment retains them depends on the hosting provider, which is not yet chosen (Annex A, item 4). **They are not exported to any third-party log or error-tracking service.**

**Basis:** our overriding private interest in the secure operation of our systems (Art. 31(1) revFADP; Art. 6(1)(f) GDPR).

### 4.6 Cookies and Browser Storage

The Platform sets **only strictly necessary cookies**:

| Cookie | Purpose | Duration |
|---|---|---|
| Supabase authentication session cookie | Keeps you signed in and refreshes your session. The authentication library may **split this across several numbered cookies**, and sets an additional short-lived verification cookie during sign-in | Session / until sign-out |
| `wa_household` | Stores the identifier of the client record you currently have selected, so the server renders the same client the on-screen switcher names | One year, or until you clear it |

The Platform also keeps that same client selection in your browser's **`localStorage`**.

**We use no analytics, no tracking cookies, no advertising technology and no third-party scripts, fonts or images.** Typography is self-hosted and served from our own servers; no request reaches Google. There is therefore no cookie banner, because there is nothing to consent to.

**Basis:** Art. 45c lit. b of the Swiss Telecommunications Act permits cookies strictly necessary to deliver a service the user has requested, subject to this notice; performance of the contract (Art. 31(2)(a) revFADP; Art. 6(1)(b) GDPR).

The browser-based software (section 3.1) uses `localStorage` rather than cookies for your inputs, preferences and any API keys you choose to save.

## 5. Purposes of Processing (Controller)

- providing, operating and further developing the Platform and the website;
- managing accounts, firms, seats and access rights;
- processing orders, contracts, payments and invoicing;
- providing customer support;
- ensuring security and preventing misuse;
- complying with statutory retention and disclosure obligations.

## 6. Retention (Controller)

| Data | Retention |
|---|---|
| Account and authentication data | For the duration of the account. **Closing an account is a manual operation we carry out on written request; the product has no self-service closure or deletion function.** |
| Records created by a user (plan versions, audit records, order instructions) | **Not deleted when the account closes.** The user's link to the record is removed and the actor is no longer identified; the record itself survives — see section 11 |
| Organisation, membership and seat data | For the duration of the customer relationship |
| Invitations | Until accepted, revoked or expired; the record of acceptance is retained as part of the access history |
| Contract and invoice data | At least 10 years (Art. 958f Swiss Code of Obligations) |
| Billing event ledger | For the life of the subscription and the statutory accounting period |
| Support requests | Up to 3 years after closure |
| Website server logs | Normally 30 days |
| Platform application logs | As determined by the hosting environment — not yet fixed (Annex A, item 4) |

## 7. Your Rights (Controller-Side Data)

If you are a user at a customer firm, you may exercise the following rights **directly against us** in respect of the data in Part A:

- **Access** (Art. 25 revFADP; Art. 15 GDPR)
- **Rectification** (Art. 32(1) revFADP; Art. 16 GDPR)
- **Erasure**, subject to statutory retention obligations and to section 11 (Art. 32(2)(c) revFADP; Art. 17 GDPR). **Erasing your account does not erase the records you created**: your link to them is removed, the records remain
- **Restriction of processing** (Art. 18 GDPR, where applicable)
- **Data portability** (Art. 28 revFADP; Art. 20 GDPR)
- **Objection** to processing based on an overriding private interest, and withdrawal of consent with effect for the future
- **Complaint** to the Federal Data Protection and Information Commissioner (FDPIC, edoeb.admin.ch) or, where the GDPR applies, to a competent EU supervisory authority (Art. 77 GDPR)

**How these are handled, stated honestly:** the Platform offers **no self-service export, closure or deletion** of controller-side data. Requests are handled manually by us on receipt at mivetic@privatewealthintelligence.ch, within the statutory period. We may need to verify your identity to prevent misuse.

---

# PART B — Where We Are a Processor for a Wealth-Management Firm

The following describes processing the Platform is **built** to carry out on behalf of, and on the documented instructions of, a customer firm. That firm is the controller. As noted above, **the Platform is not yet deployed and no end-client data has been processed in it**, and the DPA that would carry these instructions has not yet been drafted (section 2).

## 8. Categories of End-Client Data Processed

The Platform stores the following, on our servers, in our database:

**8.1 Client and spouse identity.** First name, last name, **date of birth**, country, canton or state, city and postal code, together with risk profile and investment time horizon. Up to two adults per household.

**8.2 Children.** **Where a household records a child**, the Platform provides for that child's first name, last name and **date of birth**. A household with no children stores none of this. The data model does not offer a way to record a child by age alone, and a firm that does not wish to process a minor's date of birth should omit the child from the household record. Where children are recorded, **the Platform processes personal data concerning minors**, and the firm as controller is responsible for the basis on which it does so.

**8.3 Financial position.** Income by source and owner and its tax treatment; expenses by category; accounts and assets with type, label, value, liquidity, country and free-text notes; individual securities holdings including name, ticker, ISIN, expense ratio, yield, region and currency; loans with balance, interest rate and term; financial goals with target amounts and year spans; pensions; and retirement parameters.

**8.4 Client reference data.** The client household's name and **the firm's own internal client reference number**, stored as ordinary database columns.

**8.5 Free-text notes**, whose content is determined by the adviser.

**8.6 Plan-change audit records.** See section 9.2.

**8.7 Custodian and order connection configuration.** See sections 9.3 and 9.4.

**8.8 Adviser assignment.** Which of the firm's advisers is assigned to which client household. We hold this as processor for the firm; the assignment is made and revoked by the firm.

**Note on classification.** Financial and asset data is **not** "sensitive personal data" within the meaning of Art. 5(c) revFADP, nor a special category under Art. 9 GDPR. We nonetheless treat it as **highly confidential**, both because of its nature and because it may be protected by **Art. 47 of the Swiss Banking Act** (section 13).

### Source of the data (Art. 19(3) revFADP; Art. 14 GDPR)

End-client data does **not** normally reach us from the data subject. It reaches us:

- from the **customer firm**, entered by an adviser;
- from a **custodian or CRM feed** configured by the firm and retrieved through our relay (section 9.3), where an adviser chooses to apply the retrieved data;
- from **documents uploaded by an adviser** and processed by the document-intake feature, where that feature is enabled (section 9.5).

Where the GDPR applies, the firm as controller is responsible for informing its clients under Art. 14 GDPR. We will assist the firm in doing so under the DPA.

## 9. What the Platform Does With That Data

### 9.1 Storage and versioning

A client household's complete financial position is stored server-side in our PostgreSQL database as a structured JSON document, **versioned**: each save creates a **new, immutable version**, and earlier versions are retained. Superseded versions are **not overwritten and not deleted**. This is deliberate — it gives the firm a reconstructable history of a client's recorded position — and it has the consequence set out in section 11.

**A legacy copy also exists.** The Platform's earlier data model held each plan in a single column on the user's own profile row (`profiles.plan`). When the database was restructured around firms and households, that column was **copied forward and left in place**. It is no longer read or written by the application, but for any account created before that change a second, older copy of the client's position exists there, scoped to a user rather than to a firm. Its removal is scheduled as a separate reviewed database change (Annex A, item 6). We disclose it rather than let a firm discover it in the schema.

### 9.2 Plan-change audit trail

Every change to a client's plan is recorded in an **append-only audit trail**. Each record contains: the acting user, the time, a summary of the change, the individual items that moved with their **before and after values**, net worth before and after, and a **short content fingerprint** of each side.

**The fingerprint is a non-cryptographic checksum** (a 32-bit FNV-1a hash over a canonically serialised plan). It is enough to test later whether a given plan was the one in force. **It is not a tamper-proof seal, it is not collision-resistant, and it provides no forgery resistance.** The trail's integrity rests on the append-only enforcement described next, not on the fingerprint.

**These records include the end client's full name, and their date of birth as a before-and-after pair whenever it is edited**, together with account labels and monetary values. Audit records can be exported by the firm as a CSV file.

Append-only enforcement operates at two levels: access policies grant only read and insert, and a database trigger refuses every deletion and every update — **through the application, and through every database role the application uses, including the privileged role we hold** — with **one deliberate exception**: when a user account is erased, that user's identifier may be set to null, with every other field of the record byte-identical. Nothing else about an audit record can be altered, and no audit record can be removed.

**What we do not represent away:** as the operator of the database we retain the underlying administrative control any hosting operator has — we could, in principle, alter the schema or restore a snapshot. That control is addressed in section 15 and in the DPA, and we do not claim it does not exist.

### 9.3 Custodian and CRM feed relay

Where a firm configures a feed, **our servers fetch data from an endpoint the firm supplies**, using a credential the firm supplies. The endpoint is chosen by the firm and may be operated by a custodian, a CRM provider or another party, in any country.

We store the **connection configuration** (name, URL, type, format, authentication method) and the **credential, encrypted at rest with AES-256-GCM** using a key held only in the server environment. Credentials are never returned by any interface; only the fact that a credential exists is shown.

**The statement content retrieved is passed to the adviser's browser and is not written to our database.** It is returned with caching disabled and it is not intentionally written to application logs. The comparison and merge of retrieved data against the client's plan happens **in the adviser's browser**. Retrieved custodian data enters our database only if the adviser chooses to apply it — at which point it becomes a new plan version under section 9.1.

**Two qualifications, because "not retained" would otherwise be too strong:**

1. **A failed run stores a fragment of the file.** Where a retrieved file cannot be interpreted, the connection record keeps a short status that includes **a fragment of the file — typically its column headings, or the surrounding text of a parse error** — so the adviser can see why. A custodian file's header row can carry a portfolio reference and sometimes a client name. That fragment stays on the connection record until the next run replaces it.
2. **A successful run writes one permanent audit entry; a failed run does not.** Each **successful** feed run records an entry in the append-only audit trail naming the acting user, the connection and the number of records retrieved. The retrieved content is not in that entry, but the entry itself is **retained indefinitely** under section 11. A run that fails — because the endpoint could not be reached or the file could not be interpreted — is **not written to the audit trail**; it leaves only the short status on the connection record described in point 1, which the next run overwrites. The audit trail is therefore a record of successful retrievals, not a complete record of attempts.

### 9.4 Order routing

Where a firm configures an order connection, the Platform transmits investment instructions as a structured ticket to a **portfolio or order-management system nominated by the firm**, which may be located abroad. We store the connection configuration (endpoint, custody account, custodian, currency, per-ticket limit) and the credential, encrypted as above.

**No trade is executed by us.** Instructions are always marked for staging and approval in the receiving system, never for immediate execution.

**End-client identity is transmitted only if the firm explicitly enables it** on that connection. The setting defaults to **off**, in which case the receiving system receives the account, instruments, amounts and currency, but no client name or adviser name.

**Stated separately, because it is a distinct fact:** when identity is withheld from the receiving system, **our own database still retains the ticket as it was submitted, including the client name where the instruction carried one**, in an immutable order record. "Not sent to the order-management system" does not mean "not stored by us".

Order records cannot be modified after the instruction reaches a final state, and cannot be deleted. See section 11.

### 9.5 Document intake and the transfer to the United States

> **This section describes a transfer of client financial data outside Switzerland.** The feature exists in the codebase. **It is not enabled, and it must not be used with real client data.** The conditions at the end of this section are not met.

Where an adviser uploads a client document — a **bank or brokerage statement, a tax form, a pension letter** or similar — to have its figures extracted automatically, the document is transmitted to **Anthropic PBC (United States)** for automated processing. Specifically:

- **PDFs are transmitted in full, as base64-encoded data** — not selected fields, not extracted text. **Plain-text files are transmitted as text.** The extraction covers household identity, income, expenses, assets, liabilities, holdings, goals, pensions and retirement parameters, and returns quotations from the source document;
- the request is made **server-side by us, on our own Anthropic account and API key**. Unlike the browser-based software (section 3.1), **we are the party making this transfer**;
- **we set no geographic routing parameter on the request**, so it follows whatever routing Anthropic applies by default. **We have not verified what that default currently is, and we do not state it** (Annex A, item 11). Anthropic PBC, the recipient, is established in the **United States of America**.

**Anthropic is not our sub-processor.** We intend to appoint it as one. **That appointment has not been made, no data-processing agreement and no Standard Contractual Clauses have been executed with Anthropic, and no transfer impact assessment has been completed.** A party with no such contract is not a sub-processor; it would be the recipient of an unlawful transfer. That is precisely why the feature is off.

**We make no statement about Anthropic's transfer posture, its published privacy terms, its retention of submitted content, or its status under the Swiss–US Data Privacy Framework.** We have not verified any of it. When we have, we will state the result here with the date of the check. We do **not** rely on the Data Privacy Framework for this transfer.

**Controls implemented in the code, as of this version.** The extraction route:

- **requires an authenticated session** and resolves a specific client household — it refuses to guess when an adviser holds more than one;
- **rate-limits** to 10 extractions per user per minute;
- **caps the size** of the submitted document;
- **fails closed**: with no provider key configured it returns "not configured" and makes no call. **No production environment exists, so no key is configured anywhere, so the feature is off.**
- **does not log the model's output.** An earlier version of this route had **no authentication at all** and wrote the full extraction — names, dates of birth, balances — to the server log. Both defects were corrected on 22 September 2026. **That correction has never run in production, because nothing has.**

**Comma-separated files are read and interpreted entirely in the adviser's browser** and are not transmitted to us or to Anthropic.

**Conditions before this feature may be used with real client data.** None is yet met:

1. a data-processing agreement, Standard Contractual Clauses with the Swiss addendum, and a documented transfer impact assessment, executed with Anthropic, expressly excluding use of transmitted content for model training;
2. authorisation from each customer firm for the appointment (Art. 9(3) revFADP; Art. 28(2) GDPR), which a firm subject to banking secrecy may be unable to give without its own client's consent (section 13);
3. verification of the recipient's inference routing, or a pinned geography, recorded with the date of the check.

Firms will be notified before this feature is enabled for production use.

### 9.6 AI portfolio suggestions (Platform)

The Platform has its own AI portfolio feature, distinct from the one in the browser-based software (section 3.1), and the distinction matters for transfers.

**It makes no call to any model provider.** The Platform's version runs **server-side on our own infrastructure and is rule-based**: it derives an allocation and a fund selection from the client's investment amount, risk profile, time horizon, sustainability preference and country, combined with market-research inputs held in our own database. **No client data is transmitted to Anthropic or to any other model provider by this feature, and it involves no transfer to the United States.** A reader who knows the browser-based software sends risk-profile data to Anthropic should not carry that assumption across: the Platform feature does not.

The request is **scoped to a single client household and refuses to proceed unless the caller's session resolves one**. The route relies on that resolution rather than on an authentication check of its own, so a caller without a session is refused before any processing takes place. The resulting recommendation is **stored in our database against that household** and replaced when a new one is generated; it is therefore processor-side data under section 11, on the same footing as the rest of the household record.

One qualification, stated because it is true today: this route currently writes plan-derived output to the application log. See section 4.5 and Annex A, item 19.

### 9.7 What the Platform does not do

- It does not sell, rent or share end-client data for marketing purposes.
- **We do not use end-client data to train any AI model.** Our agreements with providers will expressly exclude the use of data we transmit for model training; **until such an agreement is executed with a given provider, we do not transmit end-client data to it** (section 9.5).
- It does not store simulation results (section 3.2).
- It does not send end-client data to Stripe.
- It does not send end-client data to the market-data or research sources listed in section 3.2.

## 10. Sub-Processors

This is the list a customer firm should use for its own outsourcing inventory — **under Art. 14 FinIA and Art. 15 FinIO for a portfolio manager, or FINMA Circular 2018/3 for a bank or securities firm.** Counsel should confirm the applicable instrument and its current version.

| Sub-processor | Legal entity / location | Purpose | Data | Transfer basis |
|---|---|---|---|---|
| **Supabase** | Supabase Inc. (United States-incorporated). **The production database instance is to be created in the Switzerland (Zurich, `eu-central-2`) region. At the date of this version it has not been created** — see section 10.1 | Database hosting, authentication, session management, account-confirmation and password-reset email | All Platform data: end-client plans and versions, household records, audit trail, connection configuration and encrypted credentials, order records, user accounts, organisation and billing records | **On creation:** data at rest in Switzerland. Vendor access, backups, logging and control-plane operations are performed from the **United States** under EU Standard Contractual Clauses with the Swiss addendum |
| **Application hosting provider** | **[Not yet chosen — Annex A, item 4.]** This is the party that runs the Platform's application container. It holds client plan data in memory, the credential-encryption key and the privileged database credential in its environment, and receives the application logs. **The Swiss residency commitment in section 10.1 is not met unless this component is also located in Switzerland.** | Running the Platform application | In transit and in memory: all Platform data. At rest: application logs | To be determined with the provider |
| **Stripe** | Stripe Payments Europe Ltd (Ireland) / Stripe Inc. (United States) | Subscription payment and invoicing | Account owner's email address, our internal organisation identifier, price and seat quantity, return URLs. **No end-client or plan data** | Adequacy decision where applicable; otherwise EU Standard Contractual Clauses with the Swiss addendum |
| **Anthropic PBC** | United States | Document intake — automated extraction of figures from uploaded client documents | Would be: the **full content of uploaded client documents** and the extracted financial data | **None. No agreement executed, no appointment made, feature disabled** (section 9.5). Listed here for transparency, not as a current sub-processor |

**We use no marketing or bulk email provider, no analytics provider, no advertising or tracking provider, no error-tracking service and no content delivery network in the Platform.**

**GitHub Pages (GitHub, Inc., United States)** — the public demo and marketing pages are served as static files from GitHub Pages. GitHub receives the visitor's IP address and request metadata in its server logs. No account or client data is held there: the pages are static and the application runs entirely in the visitor's browser.
**[Accounting / bookkeeping software, if used — to be confirmed. Annex A, item 4.]**
**[Business email provider used for support correspondence — to be confirmed. Annex A, item 4.]**

### 10.1 Data location — stated precisely

**We commit that the production database holding end-client data will be provisioned in Switzerland (Supabase's Zurich region, `eu-central-2`), and that this is confirmed in writing in the DPA before any client record is loaded.** That decision was taken on 22 September 2026 and is recorded in our deployment runbook; the region is fixed at project creation and cannot be changed afterwards.

We state three qualifications, because a residency promise that is not precise is worth little:

1. **The production environment does not yet exist.** No database has been created, in Switzerland or anywhere else. The commitment above is forward and contractual, not a description of a current state. This policy will be moved to the present tense only once the environment exists and we have confirmed it.
2. **"The database is in Switzerland" is not "all processing occurs exclusively in Switzerland."** Supabase Inc. is established in the **United States of America**; its personnel, its control-plane and its support operations access the infrastructure from the United States, and its own sub-processors are located in the United States and the European Union. Backups, logging and platform operations may occur outside Switzerland. Supabase's current sub-processor list is the list we monitor under section 10.2 and is available on request.
3. **The commitment covers the database, not yet the application host.** The component that runs the Platform's code holds client data in memory and holds the encryption keys. Its provider and region are not chosen. **Until they are, we cannot and do not claim that client data is held only in Switzerland.**

**The document-intake feature in section 9.5 is, by its nature, a transfer outside Switzerland.** It is not covered by the Swiss residency commitment, which is why it is disclosed separately and why it is disabled.

**A second deployment shape.** Some firms will instead run the Platform against a database inside their own environment (for example an Avaloq estate). For such a firm, **the database is not a sub-processor of ours and the Supabase row above does not apply to that firm's end-client data**; the applicable sub-processor list is recorded in that firm's DPA.

### 10.2 Changes to sub-processors

Under the DPA we will undertake to give customer firms **at least 30 days' advance notice**, sent to the contact address the firm nominates, before engaging a new sub-processor or replacing an existing one, and the firm may object within that period. Where an objection cannot be resolved, the firm may terminate the affected service without penalty. **These are contractual undertakings in an agreement not yet concluded, not controls implemented in the product** (Art. 9(3) revFADP; Art. 28(2) and (4) GDPR).

A copy of the safeguards we rely on for transfers abroad, once executed, is available on request to mivetic@privatewealthintelligence.ch (Art. 13(1)(f) GDPR).

## 11. Retention and the Limits of Erasure (Processor-Side Data)

This section states what the system actually does. A general assurance that data is "deleted when no longer needed" would not be true of this architecture.

**Period and criteria.** Records in this section are intended to be retained for as long as the customer firm's own regulatory record-keeping obligations subsist — as a rule **ten years** from the end of the client relationship (cf. Art. 958f Swiss Code of Obligations and the record-keeping duties under FinIA/FinSA) — or for as long as a legal claim may be brought or defended, whichever is longer. **The product has no deletion path at all, so retention beyond that period is a limitation we disclose, not a purpose we assert.**

| Data | Retention |
|---|---|
| Plan versions | **Every save is retained as an immutable version.** No update path, no deletion path, no pruning process |
| Audit records | **Append-only, retained indefinitely.** A database trigger refuses deletion regardless of caller, including us. The only permitted change is nulling the actor on account erasure |
| Order records | **Immutable once final; no deletion path** |
| Client households | **No deletion path, and no archive function either.** A client record, once created, stays in the firm's client list. The database is built to support archiving and the field exists, but **the product does not expose it** |
| Legacy `profiles.plan` copy | A pre-restructuring copy of each client's position remains in a legacy column, no longer read or written. Removal is scheduled as a separate reviewed database change (section 9.1) |
| AI portfolio recommendation | One current recommendation per client household, replaced when a new one is generated (section 9.6) |
| Feed and order connections, including encrypted credentials | Deletable by the firm at any time |
| Simulations | Not stored (section 3.2) |

**Why.** These are records of financial advice and of instructions concerning client assets. Their value as evidence for the firm's regulatory record-keeping obligations and for the establishment, exercise or defence of legal claims depends on their being unalterable. Because that purpose subsists, **the duty in Art. 6(4) revFADP to destroy or anonymise data once it is no longer needed is not yet engaged**; the processing is justified under Art. 31(1) and 31(2)(a) revFADP, and under the GDPR by Art. 17(3)(b) and (e).

**Backups.** The database will be backed up by the database provider. **The backup retention period, the location of backups and the point-in-time-recovery tier are decisions taken at project creation and have not been taken** (Annex A, item 4). A restore reinstates data as it stood at the restore point. We will state the period and location here before any client data is loaded.

**The practical consequences, stated plainly:**

- **A request to erase an end client's history cannot be satisfied.** There is no deletion function in the product; a household that has ever carried an order instruction is additionally protected by a database constraint preventing its removal; and audit records cannot be deleted by anyone.
- **Erasing a user account does not erase the records that user created.** The user's link is removed; the record remains, with the actor no longer identified. This is intentional: a firm must be able to offboard an adviser without destroying the firm's own order and audit history.
- **A "return or delete all data on termination" undertaking of the standard form (Art. 28(3)(g) GDPR) cannot be given against this architecture.** The DPA we offer will carry a **return-and-retain** position with the regulatory basis above, rather than a deletion promise we could not keep.

Where a firm requires deletion capability beyond this, it must be agreed in the DPA and will require changes to the product. We will not represent otherwise.

## 12. Rights of End Clients

If you are a client of a wealth-management firm that uses the Platform, **the firm is the controller of your data, not us.**

Please address requests for access, rectification, erasure, restriction, portability or objection **to your firm**. The firm holds the direct relationship with you, can verify your identity, and can determine what applies to your file. We will assist the firm in responding, as required by Art. 9 revFADP and Art. 28(3)(e) GDPR. Note the limits on erasure in section 11.

We will not act on an end-client request received directly, other than to acknowledge it and direct it to the firm — both because we cannot reliably verify identity and because acting on it would mean processing outside the firm's instructions.

Your right to lodge a complaint with the **FDPIC** (edoeb.admin.ch), or with a competent EU supervisory authority where the GDPR applies, is unaffected.

---

# PART C — General

## 13. Confidentiality and Banking Secrecy

Where we hold data identifying the clients of a bank or securities firm, we may act as an **agent (Beauftragter)** within the meaning of **Art. 47 of the Swiss Banking Act (BankG)**. We acknowledge that position and its consequences.

Accordingly:

- **Before any client data is processed**, every person with access will be bound by a written confidentiality undertaking that survives the end of their engagement, and our processors will be bound by equivalent obligations. **We do not yet hold executed undertakings, and we do not claim to.** We will maintain a register of who is so bound and of who holds production credentials, available to a customer firm on request. **That register does not yet exist** (Annex A, item 13);
- we do not disclose client-identifying data to any third party except on the firm's instruction or where compelled by Swiss law;
- where we receive a demand from a foreign authority for data covered by Art. 47 BankG, we will not comply unilaterally; we will notify the firm, unless legally prohibited, and require the demand to proceed through the applicable channels of international legal assistance.

**Two points for a firm's compliance function.** First, banking secrecy is a separate legal regime from data protection: compliance with the revFADP and the GDPR, a Swiss database location, and transfer safeguards do **not** by themselves resolve Art. 47 BankG. Second, any disclosure of client-identifying data to a recipient abroad — including the document-intake feature in section 9.5 — requires the firm's own assessment, and may require its client's consent or effective pseudonymisation. We cannot obtain that consent and do not purport to.

We are not ourselves a FINMA-supervised institution. **On audit rights:** we grant the firm, its audit firm and FINMA rights of audit and inspection over **our own** operations. For our sub-processors, we will pass through such rights as our contracts with them permit and will otherwise provide their current third-party attestations and our own assessment of them. We state the distinction because an unqualified flow-down would be a promise we could not honour.

## 14. Automated Decision-Making and Profiling

The Platform and the software produce **decision support, not decisions.**

- **Monte Carlo projections and financial calculations** model possible outcomes from the inputs provided. In the Platform these are computed in the adviser's browser. They are estimates, not predictions, and not investment advice.
- **The document-intake feature** (section 9.5) extracts figures for an adviser to review. Extracted values are presented for confirmation and are **not applied automatically**.
- **The AI portfolio feature** generates suggestions. It exists in both products: in the browser-based software (section 3.1), where it calls a model provider on your own API key, and in the Platform (section 9.6), where it is rule-based and calls no model provider. In both cases the output is a suggested allocation and fund selection for an adviser to consider; nothing is executed from it.

The Platform is **designed so that** a qualified adviser reviews the output before any action is taken: extracted values require confirmation, and no order ticket is transmitted without an explicit instruction submitted from a signed-in adviser's session. **The Platform does not itself impose a second-person or four-eyes approval step, and it cannot observe whether a human in fact reviewed anything.** Where a firm's controls require a second-person step, it must be enforced in the firm's own procedures or in the receiving system. On that basis we do not carry out automated individual decision-making producing legal or similarly significant effects within the meaning of Art. 21 revFADP or Art. 22 GDPR.

## 15. Data Security

**The following measures are implemented in the software.** They have been exercised in our automated test suite, including against a real PostgreSQL instance for the database policies. **They have not been exercised in production, because there is no production.** We list measures that exist in code; we do not list operational practices we have not performed.

- **Transport encryption** (TLS/HTTPS) for all connections.
- **Encryption at rest of custodian and order-management credentials** using AES-256-GCM, with the key held only in the server environment and a key-rotation path in the code. If no key is configured, the system **refuses to store a credential** rather than storing it unprotected.
- **Credentials are never returned** by any interface; only their existence is reported.
- **Tenant isolation by row-level security in the database** rather than in application code: every client record — plans and their versions, client households, audit events, feed and order connections and order tickets — carries an organisation and client-household scope. A record belonging to another firm is reported as **not found** rather than as forbidden, so that its existence is not confirmed. These policies are executed against a real PostgreSQL instance in our test suite on every change; **we will re-confirm their behaviour in the production environment at commissioning, before any client data is entered.**
- **Append-only audit trail** of plan changes, enforced by both access policy and database trigger, with the single actor-erasure exception (section 9.2).
- **Immutable order records**, which cannot be altered after an instruction reaches a final state.
- **Egress protection on the feed relay** against server-side request forgery, including validation of every resolved network address and re-validation of each redirect.
- **A host allowlist on order routing**, required in production, so instructions can only be sent to endpoints explicitly approved.
- **Redaction of credentials, query strings and resolved addresses** from status messages and diagnostics. (Note the one exception in section 9.3: a failed feed run keeps a fragment of the file, and the open logging defect in section 4.5.)
- **A Content Security Policy that permits no third-party script, font, image or network connection**: outbound browser connections are restricted to our own origin and our database provider, and typography is served from our own servers. The policy permits inline script, which the application framework requires.
- **Role-based access control** within customer firms, with separate **owner, administrator, compliance and adviser** roles. The **compliance** role has read access to the firm's audit trail across all of the firm's clients and advisers.
- **Boot-time configuration checks** that prevent the application from starting in production with a security-relevant setting missing.

**A privileged credential exists, and we disclose it.** A **service credential that bypasses the row-level isolation described above** is required in the Platform's server environment whenever billing is configured, because the payment webhook must write entitlement that no client role may write. It is used by **exactly one code path**. It is held in the server environment only. It nevertheless means that, at the infrastructure level, the tenant isolation above is a control over the application's own roles and not a control over us. The procedure governing this credential's custody, its rotation and the logging of its use **is not yet written** (Annex A, item 12).

**Support access.** Access to production client data for support or fault diagnosis is to be limited to named personnel, granted only on the firm's agreement in the individual case, and logged. **The procedure implementing this does not yet exist and no such access has ever occurred, because no production data exists.** We will not publish an unqualified claim about support access until the procedure is written (Annex A, item 12). Our database provider's own personnel have technical access to the underlying infrastructure under their contractual confidentiality and access-control obligations.

Absolute security cannot be guaranteed for data transmitted over the internet.

## 16. Breach Notification

**We have never had a data-security breach to report, and we have never exercised an incident procedure. The following states our legal obligations, not a track record or a service level.**

Where we act as **controller**, we must notify the FDPIC as quickly as possible where a data-security breach is likely to result in a high risk to the personality or fundamental rights of the data subjects (Art. 24(1) revFADP), and, where the GDPR applies, within 72 hours where feasible (Art. 33 GDPR). Affected individuals are informed where required.

Where we act as **processor**, we must notify the controller firm **without undue delay** on becoming aware of a breach (Art. 24(3) revFADP; Art. 33(2) GDPR), with the information the firm needs for its own notification obligations, including to FINMA where applicable.

A FINMA-supervised firm has its own reporting clock and will require a specific contractual timing and a named contact. **That timing is a term of the DPA and has not yet been agreed.** We will not state a response time here that we have never had to meet.

## 17. Application of the GDPR

We are established in Switzerland. The GDPR applies to our processing only where the conditions of Art. 3 GDPR are met — in particular where we offer services to data subjects in the European Union. Where we act as processor for a Swiss firm whose clients include EU residents, the GDPR reaches us principally through that firm's obligations and the DPA.

Where the GDPR applies, the additional rights and information in sections 4, 7 and 12 apply. Where it does not, the revFADP governs. Note that the revFADP does not operate a "legal basis" regime in the GDPR sense: Arts. 30–31 revFADP supply **grounds of justification**, relevant where processing would otherwise constitute an unlawful breach of personality. This policy uses "basis" in that sense for Swiss law and in the Art. 6 sense for the GDPR.

## 18. Changes to this Privacy Policy

We will update this policy where our processing or the legal framework changes. The current version is always available on our website. Where a change is material — in particular any change to the sub-processor list, to where data is stored, or to transfers abroad — we will notify customer firms in advance, at the contact address the firm nominates, and will not implement the change before the notice period in the DPA has run.

---

# ANNEX A — Before publication: outstanding items

> ## ⚠ INTERNAL WORKING CHECKLIST — DELETE THIS ENTIRE ANNEX BEFORE PUBLISHING
>
> **This annex is not part of the privacy notice.** It is an internal to-do list, written for the founder and for counsel. It names unfixed defects, unwritten procedures and documents that are currently false. **It must be deleted in full — heading and all items — before this notice is published, given to a prospect, or included in an onboarding pack.** Publishing it would hand a compliance function a list of our open gaps in our own words.
>
> Nothing elsewhere in the notice depends on this annex being present: every cross-reference to "Annex A, item *n*" is removed in the same pass. Each item below is a factual confirmation, a decision or a build change — none is a drafting task.

Items 1 to 5 are blockers: publishing with any of them open makes the policy inaccurate or unusable on the day it goes live.

### Blockers

1. **Contact details — DONE, one item to confirm.** The registered office (Austrasse 52, CH-8045 Zürich), website, data-protection contact and accountable person are filled in at section 1. The contact is a personal mailbox; a role alias such as `datenschutz@` is better practice in a published legal document and should replace it before launch. A compliance officer will not accept an onboarding pack whose privacy notice has no responsible person and no address in it.

2. **The three documents that carried the version-1.0 claim — corrected in the repository.** `legal/TERMS-EN.md` §10.2 and `legal/AGB-DE.md` §10.2 now split the statement between the browser software, where it is true, and the hosted Platform, where it is not. The contract documents mattered more than this notice: the same sentence in a policy is a disclosure problem, in a contract a bank signs it is a representation. **What remains is to confirm the published versions match the repository** — a corrected file that nobody deployed changes nothing. Still outstanding:

   - **`legal/TERMS-EN.md` §10.2 (line 119)** and **`legal/AGB-DE.md` §10.2 (line 119)** both read that financial data "is stored entirely locally in the browser (localStorage) and is **not** transmitted to the Provider. The Provider has no access to that data." Those are the **contract** documents. The hedge "depending on the plan chosen" does not cure it, because the sentence then asserts non-transmission and no access unconditionally. Suggested replacement: *"For the standalone browser version, financial data entered by the Customer is stored locally in the browser, is not transmitted to the Provider, and the Provider has no access to it; backup and data sovereignty rest with the Customer. For the hosted Platform, the Customer's data is stored on the Provider's servers and is processed by the Provider as the Customer's processor, as described in the Privacy Policy and the Data Processing Agreement."* Check §§2.2 and 11.4 of both for the same claim.
   - **`wealth-app-next/app/page.tsx` — the Platform's own landing page.** Line 77 shows the headline statistic `{ v: "100%", l: "Browser-based — your data stays yours" }` and line 50 reads "Build a complete financial plan in your browser." Both are false of the Platform, and this is the page a prospect sees first. The marketing copy must match section 3.2: the Platform stores the client's position on our servers; only the projections are computed in the browser.

   The orchestrator of this revision is correcting all three separately; **confirm each was actually changed before publication** rather than assuming it.

3. **Company identity.** Confirm whether the GmbH is registered. If it is, insert the CHE-UID and remove "(in formation / in Gründung)". If it is not, the designation stays. **Do not insert a UID that is not in the commercial register.**

4. **Decide and name the hosting stack, then complete section 10 and section 11's backup paragraph.** Outstanding: the **application hosting provider and its region** (without which the Swiss residency statement in section 10.1 cannot be completed), application-log retention, the website hosting provider, accounting software if any, the business email provider used for support, and the **backup retention period, backup location and PITR tier** — the last of which is fixed at database creation. **Do not carry over the example vendors from version 1.0; they were placeholders, not suppliers.** Where a category is genuinely unused, say so, as the policy does for bulk email and analytics.

5. **Confirm the production mail sender.** Account-confirmation and password-reset email is dispatched by Supabase Auth. Confirm whether the hosted project uses Supabase's built-in sender or a separate SMTP provider, and add the corresponding sub-processor row. Confirm that email confirmations remain **enabled** — invitation redemption requires a confirmed address, and the deployment config pins this.

### Required before publication

6. **Remove the legacy `profiles.plan` copy** (section 9.1) in a separate reviewed migration, and revoke the remaining client write grant on that column. Until then the disclosure in sections 9.1 and 11 stays.

7. **Publish, or make available on request, the full list of providers the browser-based software can be pointed at** and of the credential slots it stores (section 3.1). The managed grid covers 13 providers across 14 credential slots (Alpaca takes two), which is itself a subset of 27 credential slots across 63 storage keys; a firm assessing professional-secrecy exposure needs all of them, not a sample.

8. **Correct the sales material — the client-facing PDFs, not only the deck.** The residency and egress promises prospects actually received are in these documents, and every one of them must be re-read against section 3.2 and section 10.1:

   - `docs/pitch/wealth-analyzer-firms-pitch.pdf`
   - `docs/pitch/wealth-analyzer-firms-pitch-no-pricing.pdf`
   - `docs/pitch/wealth-analyzer-avaloq-clients-pitch.pdf`
   - `docs/pitch/wealth-analyzer-avaloq-clients-pitch-no-pricing.pdf`
   - `docs/pitch/avaloq-partnership-deck.html` (carries "Data residency · zero egress", which is false of the Platform)

   Any slide promising Switzerland must match section 10.1's forward, contractual form rather than the present tense. Where a PDF has already gone to a named prospect, decide whether a correction needs to be sent to that prospect, not merely made in the file. Re-check every other document that repeats a residency or egress claim.

9. **Complete the Art. 37 GDPR assessment** on whether a Data Protection Officer is required, and decide the **Art. 27 GDPR EU representative** question (section 1, which points here for both). Do not concede blanket Art. 3(2) applicability.

10. **Draft the DPA** (section 2). It is load-bearing for the whole of Part B and does not exist. It must carry: the return-and-retain position with its regulatory basis instead of the standard Art. 28(3)(g) deletion clause (section 11); the breach-notification timing and named contact a FINMA-supervised firm requires (section 16); the sub-processor notice period; and the residency commitment (section 10.1). **Do not sign the standard deletion clause as drafted.**

11. **Before the document-intake feature is enabled:** execute a data-processing agreement, Standard Contractual Clauses with the Swiss addendum and a transfer impact assessment with Anthropic, excluding use of transmitted content for model training; verify the recipient's inference routing (or pin a geography in the request) and record the date of the check; obtain each firm's authorisation for the appointment. **Until all three are done, keep the feature disabled and keep section 9.5 in its present form.** If the feature is removed from the shipping build, delete section 9.5 and the Anthropic row — disclosing a transfer that does not occur is the same class of error as v1.0's, in the other direction.

12. **Write the privileged-access procedure** referenced in section 15: who may hold the service credential and the encryption keys, where they are stored, on what authorisation production client data may be accessed, the rotation cadence, and whether such access is logged. **Verify and, if necessary, remediate whether any departed personnel retain credentials to the hosting, database or model-provider accounts.** A bank's compliance function asks this in the first round, and the previous policy's "we have no access to it" makes the question sharper.

13. **Execute the confidentiality undertakings** referenced in section 13, and stand up the register of who is bound and who holds production credentials. Section 13 states in terms that the register does not yet exist; do not soften that wording until it does.

14. **Maintain a record of processing activities** (Art. 12 revFADP; Art. 30 GDPR). The under-250-employee exemption is conditioned on low-risk processing and does not cover the complete financial position of households across multiple firms; as a processor under the GDPR there is no equivalent exemption.

15. **Carry out a Data Protection Impact Assessment** (Art. 22 revFADP; Art. 35 GDPR) before production launch. Large-scale processing of household financial positions, the processing of minors' data, the document-intake transfer and the order-routing path each independently suggest one is required.

16. **Keep the German version, `DATENSCHUTZ-DE.md`, in step with this one, and publish both together.** Both language versions now exist; neither is a summary of the other, and **any change made here must be made there in the same pass**. Three specific points of discipline, each of which has already diverged once:

    - **Tense.** Where the English is an **undertaking** about something we have not yet done, the German must be an undertaking too — a future or *werden*-form, not a present indicative that reads as existing practice. This has bitten section 11 (backups: "we **will** state the period and location here") and, most seriously, section 13 (the confidentiality register: "we **will** maintain a register"). A German present tense there asserts a control that does not exist.
    - **Substance.** The controller definition in section 2 must name the same FinIA licence categories in both languages (portfolio manager **and** manager of collective assets / *Vermögensverwalter* **und** *Verwalter von Kollektivvermögen*). Do not let one language carry a category the other omits.
    - **Terminology.** In German use *Rechtfertigungsgrund*, not *Rechtsgrundlage*, for the revFADP citations (section 17).

    **A German text still stating that data never leaves the browser would reinstate the exact v1.0 defect in the language a Zurich court and a Swiss compliance officer will actually read.**

17. **Swiss counsel review of the whole document**, with particular attention to section 9.5 (transfer), section 11 (retention and erasure) and section 13 (banking secrecy). Art. 47 BankG exposure is criminal. The residency statement in section 10.1 becomes contractual in effect the moment a customer relies on it.

18. **Before launch, re-read this policy against the code that actually ships.** This revision exists because version 1.0 contained a sentence that was comfortable and false. The check that matters is not whether the prose is reassuring but whether each sentence is still true of the build on the day it is published. Re-derive the Platform's outbound-connection list in section 3.2 from the code at that point rather than from this draft.

19. **Remove the plan-derived logging from the AI portfolio route** (`wealth-app-next/app/api/ai-portfolio/route.ts`, the `console.log` block at lines 60–90), which currently writes the research signals, the generated asset mix and the selected funds with weights to the application log for both the live and the legacy research set. The code comments mark it as a temporary A/B comparison. It is disclosed as an open defect in section 4.5; **when it is removed, delete that disclosure and the qualification at the end of section 9.6** — and not before.

---

*Version 2.0, dated [Date]. Supersedes version 1.0. For questions, contact mivetic@privatewealthintelligence.ch.*
```

**On item F, which required me to check the code:** the defect is **real and still open**. `wealth-app-next/app/api/ai-portfolio/route.ts` lines 59–87 carry a block commented `// Temporary A/B test logging.` that `console.log`s the live provider ids, `liveSignals`, `legacySignals`, `liveResult.assetMix`, `legacyResult.assetMix`, and both fund lists (ticker + weight). The asset mix and fund selections are derived from the client's `amount`, `risk`, `horizon` and `country`, so this is plan-derived content in the server log. It does not log the client's name or the raw input amount, and the document-intake path is not involved. I therefore corrected §4.5 to distinguish the corrected intake defect from this open one, added Annex item 19, and cross-referenced it from §9.6 and §15 — rather than keeping the v2 sentence.
