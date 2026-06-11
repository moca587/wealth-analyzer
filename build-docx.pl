#!/usr/bin/perl
use strict; use warnings; use utf8;
use IO::Compress::Zip qw(zip $ZipError);

# ── Helpers ────────────────────────────────────────────────────────────
sub xml_esc {
  my $s = shift // ""; $s =~ s/&/&amp;/g; $s =~ s/</&lt;/g; $s =~ s/>/&gt;/g; return $s;
}

# A run: bold/italic/mono/color/size in half-points
sub run {
  my (%o) = @_;
  my $t = xml_esc($o{text} // "");
  my @rpr;
  push @rpr, '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' if $o{mono};
  push @rpr, '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' if !$o{mono};
  push @rpr, '<w:b/>' if $o{bold};
  push @rpr, '<w:i/>' if $o{italic};
  push @rpr, qq{<w:sz w:val="$o{size}"/>} if $o{size};
  push @rpr, qq{<w:color w:val="$o{color}"/>} if $o{color};
  my $rpr = '<w:rPr>' . join("", @rpr) . '</w:rPr>';
  my $space = ($t =~ /^\s|\s$/) ? ' xml:space="preserve"' : '';
  return qq{<w:r>$rpr<w:t$space>$t</w:t></w:r>};
}

# A paragraph with arbitrary runs. ppr = paragraph properties XML
sub para {
  my (%o) = @_;
  my $runs = $o{runs} // [];
  my $ppr = $o{ppr} // '';
  my $body = join("", @$runs);
  return qq{<w:p>$ppr$body</w:p>};
}

# Title — large, bold, dark blue, centered
sub title_para {
  my $t = shift;
  return para(
    ppr => '<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="120"/></w:pPr>',
    runs => [ run(text=>$t, bold=>1, size=>48, color=>"0a1628") ]
  );
}

# Subtitle — italic, gray, centered
sub subtitle_para {
  my $t = shift;
  return para(
    ppr => '<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="360"/></w:pPr>',
    runs => [ run(text=>$t, italic=>1, size=>28, color=>"3a4659") ]
  );
}

# H1 — 18pt bold, ML blue, with bottom border
sub h1 {
  my $t = shift;
  my $ppr = '<w:pPr><w:spacing w:before="480" w:after="160"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="2" w:color="0057b8"/></w:pBdr></w:pPr>';
  return para(ppr=>$ppr, runs => [ run(text=>$t, bold=>1, size=>36, color=>"0057b8") ]);
}

# H2 — 14pt bold, dark
sub h2 {
  my $t = shift;
  return para(
    ppr => '<w:pPr><w:spacing w:before="320" w:after="120"/></w:pPr>',
    runs => [ run(text=>$t, bold=>1, size=>28, color=>"0a1628") ]
  );
}

# Body paragraph
sub body_p { para(runs=>[run(text=>shift, size=>22)]); }

# Bullet item — uses numbering reference 1
sub bullet_p {
  my @runs = @_;
  my $ppr = '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="60"/></w:pPr>';
  return para(ppr=>$ppr, runs=>\@runs);
}

# Numbered item — uses numbering reference 2 (created fresh each list)
sub num_p {
  my @runs = @_;
  my $ppr = '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr><w:spacing w:after="60"/></w:pPr>';
  return para(ppr=>$ppr, runs=>\@runs);
}

# Code block paragraph — Consolas, light gray fill, indent
sub code_p {
  my $t = shift;
  my $ppr = '<w:pPr><w:spacing w:before="80" w:after="80"/><w:ind w:left="360"/><w:shd w:val="clear" w:color="auto" w:fill="f3f4f6"/></w:pPr>';
  return para(ppr=>$ppr, runs=>[ run(text=>$t, mono=>1, size=>20, color=>"0a1628") ]);
}

# Horizontal rule paragraph
sub hr_p {
  return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="e8ecf2"/></w:pBdr><w:spacing w:before="240" w:after="240"/></w:pPr></w:p>';
}

# Spacer
sub spacer { '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>'; }

# Callout box — light blue tint, padded
sub callout {
  my $t = shift;
  my $ppr = '<w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="0057b8"/><w:left w:val="single" w:sz="4" w:space="6" w:color="0057b8"/><w:bottom w:val="single" w:sz="4" w:space="6" w:color="0057b8"/><w:right w:val="single" w:sz="4" w:space="6" w:color="0057b8"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="eff6ff"/><w:spacing w:before="200" w:after="200"/></w:pPr>';
  return para(ppr=>$ppr, runs=>[ run(text=>$t, italic=>1, size=>22, color=>"0a1628") ]);
}

# ── Build content ──────────────────────────────────────────────────────
my @body;

push @body, title_para("Wealth Analyzer — Stage 1 Setup Guide");
push @body, subtitle_para("Step-by-step from zero to a live, signup-able web app");
push @body, callout("Estimated total time: about 90 minutes — 25 min on accounts, 30 min on local install and testing, 30 min on deployment.");

# ── PART 1 ─────────────────────────────────────────────────────────────
push @body, h1("Part 1 — Create accounts (25 minutes)");

push @body, h2("Step 1 — Install Node.js LTS (5 min)");
push @body, bullet_p(run(text=>"Go to ", size=>22), run(text=>"https://nodejs.org/en/download/", size=>22, color=>"0057b8"));
push @body, bullet_p(run(text=>"Download the LTS Windows installer (currently v20.x)", size=>22));
push @body, bullet_p(run(text=>"Run it, accept all defaults — this adds ", size=>22), run(text=>"node", mono=>1, size=>20), run(text=>" and ", size=>22), run(text=>"npm", mono=>1, size=>20), run(text=>" to your PATH", size=>22));
push @body, bullet_p(run(text=>"Important: ", bold=>1, size=>22), run(text=>"close and reopen any open terminal/PowerShell windows so the new PATH is picked up", size=>22));
push @body, bullet_p(run(text=>"Verify in a new terminal: ", size=>22), run(text=>"node --version", mono=>1, size=>20), run(text=>" should print v20.x.x", size=>22));

push @body, h2("Step 2 — Sign up for Supabase (10 min)");
push @body, bullet_p(run(text=>"Go to ", size=>22), run(text=>"https://supabase.com/dashboard/sign-up", size=>22, color=>"0057b8"));
push @body, bullet_p(run(text=>"Sign up with GitHub (recommended — one click)", size=>22));
push @body, bullet_p(run(text=>'Click "New Project"', size=>22));
push @body, bullet_p(run(text=>"Project name: ", size=>22), run(text=>"wealth-analyzer", bold=>1, size=>22));
push @body, bullet_p(run(text=>"Database password: ", bold=>1, size=>22), run(text=>"generate a strong one and save it to a password manager. You may need it for direct DB access later. Don't lose it.", size=>22));
push @body, bullet_p(run(text=>"Region: pick the one closest to your users (US East / EU West / etc.)", size=>22));
push @body, bullet_p(run(text=>"Plan: ", size=>22), run(text=>"Free", bold=>1, size=>22));
push @body, bullet_p(run(text=>'Click "Create new project" and wait about 2 minutes for provisioning', size=>22));
push @body, bullet_p(run(text=>"When the dashboard loads, click ", size=>22), run(text=>"Settings → API", bold=>1, size=>22), run(text=>" in the left sidebar", size=>22));
push @body, bullet_p(run(text=>"Keep this tab open — you'll copy three values from it in Step 5:", size=>22));
push @body, bullet_p(run(text=>"   • Project URL", size=>22));
push @body, bullet_p(run(text=>"   • anon public key", size=>22));
push @body, bullet_p(run(text=>"   • service_role secret key — ", size=>22), run(text=>"TREAT THIS LIKE A PASSWORD", bold=>1, size=>22, color=>"e31837"), run(text=>", never commit it to git, never share it", size=>22));

push @body, h2("Step 3 — Sign up for Vercel (5 min)");
push @body, bullet_p(run(text=>"Go to ", size=>22), run(text=>"https://vercel.com/signup", size=>22, color=>"0057b8"));
push @body, bullet_p(run(text=>"Sign up with the same GitHub account as your repo", size=>22));
push @body, bullet_p(run(text=>"Choose the Free Hobby plan — no credit card needed", size=>22));
push @body, bullet_p(run(text=>'Skip the "Import Project" flow for now — we will connect the repo in Part 3', size=>22));

push @body, h2("Step 4 — Create a new GitHub repo (5 min)");
push @body, bullet_p(run(text=>"Go to ", size=>22), run(text=>"https://github.com/new", size=>22, color=>"0057b8"));
push @body, bullet_p(run(text=>"Repository name: ", size=>22), run(text=>"wealth-analyzer-app", bold=>1, size=>22), run(text=>" (or similar — anything you like)", size=>22));
push @body, bullet_p(run(text=>"Visibility: ", size=>22), run(text=>"Private", bold=>1, size=>22), run(text=>" is fine for now", size=>22));
push @body, bullet_p(run(text=>"Do NOT initialize with README, .gitignore, or license — the local folder already has these", size=>22));
push @body, bullet_p(run(text=>'Click "Create repository"', size=>22));
push @body, bullet_p(run(text=>"Copy the HTTPS URL shown on the next page", size=>22));

# ── PART 2 ─────────────────────────────────────────────────────────────
push @body, hr_p();
push @body, h1("Part 2 — Install and run locally (30 minutes)");

push @body, h2("Step 5 — Configure environment variables (5 min)");
push @body, body_p("Open a new PowerShell window and run:");
push @body, code_p('cd "D:\Claude PWA\wealth-app-next"');
push @body, code_p('copy .env.local.example .env.local');
push @body, code_p('notepad .env.local');
push @body, body_p("Replace the placeholders with the three values from your Supabase Settings → API page:");
push @body, bullet_p(run(text=>"NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co", mono=>1, size=>20));
push @body, bullet_p(run(text=>"NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...", mono=>1, size=>20));
push @body, bullet_p(run(text=>"SUPABASE_SERVICE_ROLE_KEY=eyJ...", mono=>1, size=>20), run(text=>" (this is the secret one)", size=>22));
push @body, bullet_p(run(text=>"NEXT_PUBLIC_APP_URL=http://localhost:3000", mono=>1, size=>20));
push @body, body_p("Save and close.");

push @body, h2("Step 6 — Install npm dependencies (3 min)");
push @body, body_p("In the same terminal:");
push @body, code_p('npm install');
push @body, body_p('You should see "added ~400 packages" with no errors. Warnings about deprecated packages are fine to ignore.');

push @body, h2("Step 7 — Apply the database schema (5 min)");
push @body, bullet_p(run(text=>"In the Supabase dashboard, click ", size=>22), run(text=>"SQL Editor", bold=>1, size=>22), run(text=>" in the left sidebar", size=>22));
push @body, bullet_p(run(text=>'Click "+ New query"', size=>22));
push @body, bullet_p(run(text=>"Open ", size=>22), run(text=>'D:\Claude PWA\wealth-app-next\supabase\migrations\001_init.sql', mono=>1, size=>20), run(text=>" in any text editor", size=>22));
push @body, bullet_p(run(text=>"Copy the entire contents and paste into the SQL Editor", size=>22));
push @body, bullet_p(run(text=>'Click "Run" (or press Ctrl+Enter)', size=>22));
push @body, bullet_p(run(text=>'You should see "Success. No rows returned"', size=>22));
push @body, bullet_p(run(text=>"Verify: click ", size=>22), run(text=>"Table Editor", bold=>1, size=>22), run(text=>" in the sidebar — you should see two new tables: ", size=>22), run(text=>"profiles", mono=>1, size=>20), run(text=>" and ", size=>22), run(text=>"simulations", mono=>1, size=>20));

push @body, h2("Step 8 — Optional: disable email confirmation for faster local testing (2 min)");
push @body, body_p("By default, Supabase requires email confirmation for new signups. To skip this during development:");
push @body, bullet_p(run(text=>"In the Supabase dashboard, click ", size=>22), run(text=>"Authentication → Providers", bold=>1, size=>22));
push @body, bullet_p(run(text=>'Click "Email"', size=>22));
push @body, bullet_p(run(text=>"Toggle ", size=>22), run(text=>'"Confirm email"', bold=>1, size=>22), run(text=>" OFF", size=>22));
push @body, bullet_p(run(text=>"Click Save", size=>22));
push @body, body_p("You can re-enable this for production later.");

push @body, h2("Step 9 — Run the dev server (1 min)");
push @body, code_p('npm run dev');
push @body, body_p('Wait for "Ready in Xs" — usually about 3-5 seconds. Open http://localhost:3000 in your browser.');

push @body, h2("Step 10 — Test the full flow (10 min)");
push @body, bullet_p(run(text=>"Landing page loads with the gradient hero — good", size=>22));
push @body, bullet_p(run(text=>'Click "Get started" → fill in signup form with a real email and password (min 8 chars)', size=>22));
push @body, bullet_p(run(text=>"You should redirect to ", size=>22), run(text=>"/app", mono=>1, size=>20), run(text=>" dashboard", size=>22));
push @body, bullet_p(run(text=>'Click "Start now" → fill out at least:', size=>22));
push @body, bullet_p(run(text=>"   • Your name and country", size=>22));
push @body, bullet_p(run(text=>"   • One income source with an amount", size=>22));
push @body, bullet_p(run(text=>"   • One expense category with monthly amount", size=>22));
push @body, bullet_p(run(text=>'   • One asset (e.g. "Brokerage", class "equity", value)', size=>22));
push @body, bullet_p(run(text=>"   • At least one financial goal", size=>22));
push @body, bullet_p(run(text=>'Click "Save plan" — should see "Saved"', size=>22));
push @body, bullet_p(run(text=>'Click "Simulation" in the sidebar', size=>22));
push @body, bullet_p(run(text=>'Click "Run Monte Carlo" → wait about 1 second', size=>22));
push @body, bullet_p(run(text=>"You should see: a percentile band chart, 5 KPI cards (P10 to P90), and a probability bar per goal", size=>22));

push @body, body_p(" ");
push @body, para(runs=>[run(text=>"If anything breaks, the most common issues are:", bold=>1, size=>22)]);
push @body, bullet_p(run(text=>'"fetch failed" ', mono=>1, size=>20), run(text=>"→ check that ", size=>22), run(text=>".env.local", mono=>1, size=>20), run(text=>" has the correct Supabase URL", size=>22));
push @body, bullet_p(run(text=>'"invalid API key" ', mono=>1, size=>20), run(text=>"→ make sure you copied the anon key (not service_role) into ", size=>22), run(text=>"NEXT_PUBLIC_SUPABASE_ANON_KEY", mono=>1, size=>20));
push @body, bullet_p(run(text=>"email confirmation never arrives → disable email confirmation as in Step 8", size=>22));
push @body, bullet_p(run(text=>"chart is blank → check browser console; usually means the plan has no assets or goals", size=>22));

# ── PART 3 ─────────────────────────────────────────────────────────────
push @body, hr_p();
push @body, h1("Part 3 — Deploy to Vercel (30 minutes)");

push @body, h2("Step 11 — Initialize git and push to GitHub (5 min)");
push @body, body_p("In the wealth-app-next folder:");
push @body, code_p('cd "D:\Claude PWA\wealth-app-next"');
push @body, code_p('git init');
push @body, code_p('git add .');
push @body, code_p('git commit -m "Stage 1: Next.js + Supabase scaffold complete"');
push @body, code_p('git branch -M main');
push @body, code_p('git remote add origin https://github.com/YOUR-USERNAME/wealth-analyzer-app.git');
push @body, code_p('git push -u origin main');
push @body, body_p("Replace YOUR-USERNAME with your actual GitHub username.");

push @body, h2("Step 12 — Import to Vercel (10 min)");
push @body, bullet_p(run(text=>"Go to ", size=>22), run(text=>"https://vercel.com/dashboard", size=>22, color=>"0057b8"));
push @body, bullet_p(run(text=>'Click "Add New..." → "Project"', size=>22));
push @body, bullet_p(run(text=>'Click "Import" next to your ', size=>22), run(text=>"wealth-analyzer-app", mono=>1, size=>20), run(text=>" repo", size=>22));
push @body, bullet_p(run(text=>"Framework Preset: Next.js (should auto-detect)", size=>22));
push @body, bullet_p(run(text=>"Root directory: ", size=>22), run(text=>"./", mono=>1, size=>20), run(text=>" (default)", size=>22));
push @body, bullet_p(run(text=>'Environment Variables: click "Add" for each of these — copy from your local ', size=>22), run(text=>".env.local", mono=>1, size=>20), run(text=>":", size=>22));
push @body, bullet_p(run(text=>"   • NEXT_PUBLIC_SUPABASE_URL", mono=>1, size=>20));
push @body, bullet_p(run(text=>"   • NEXT_PUBLIC_SUPABASE_ANON_KEY", mono=>1, size=>20));
push @body, bullet_p(run(text=>"   • SUPABASE_SERVICE_ROLE_KEY", mono=>1, size=>20));
push @body, bullet_p(run(text=>"   • NEXT_PUBLIC_APP_URL", mono=>1, size=>20), run(text=>" — set this to the Vercel preview URL or your custom domain", size=>22));
push @body, bullet_p(run(text=>'Click "Deploy"', size=>22));
push @body, bullet_p(run(text=>"Wait 1-2 minutes for the first build", size=>22));

push @body, h2("Step 13 — Update redirect URLs in Supabase (5 min)");
push @body, bullet_p(run(text=>"Once you have your Vercel URL (e.g. ", size=>22), run(text=>"https://wealth-analyzer-app.vercel.app", mono=>1, size=>20), run(text=>"):", size=>22));
push @body, bullet_p(run(text=>"In Supabase dashboard, go to ", size=>22), run(text=>"Authentication → URL Configuration", bold=>1, size=>22));
push @body, bullet_p(run(text=>'Add to "Redirect URLs":', size=>22));
push @body, bullet_p(run(text=>"   • https://wealth-analyzer-app.vercel.app/**", mono=>1, size=>20));
push @body, bullet_p(run(text=>"   • http://localhost:3000/**", mono=>1, size=>20), run(text=>" (keep this for local dev)", size=>22));
push @body, bullet_p(run(text=>'Set "Site URL" to your Vercel URL', size=>22));
push @body, bullet_p(run(text=>"Click Save", size=>22));
push @body, bullet_p(run(text=>"Back in Vercel, go to your project's Settings → Environment Variables → edit ", size=>22), run(text=>"NEXT_PUBLIC_APP_URL", mono=>1, size=>20), run(text=>" to be your Vercel URL → save → Redeploy", size=>22));

push @body, h2("Step 14 — Test the deployed app (10 min)");
push @body, bullet_p(run(text=>"Open your Vercel URL in a private/incognito window", size=>22));
push @body, bullet_p(run(text=>"Sign up with a fresh email", size=>22));
push @body, bullet_p(run(text=>"Confirm email (or use the disable-confirmation toggle from Step 8)", size=>22));
push @body, bullet_p(run(text=>"Build a plan and run a simulation", size=>22));
push @body, bullet_p(run(text=>"You should see identical behavior to the local version", size=>22));

# ── What's next ────────────────────────────────────────────────────────
push @body, hr_p();
push @body, h1("What's next — Stages 2 and 3");

push @body, h2("Stage 2 — Stripe subscriptions (about 3-5 days)");
push @body, bullet_p(run(text=>"Create a Stripe account and a product with monthly and annual pricing", size=>22));
push @body, bullet_p(run(text=>"Add a ", size=>22), run(text=>"/checkout", mono=>1, size=>20), run(text=>" route that creates a Stripe Checkout session", size=>22));
push @body, bullet_p(run(text=>"Add a ", size=>22), run(text=>"/api/stripe/webhook", mono=>1, size=>20), run(text=>" route that listens for subscription events and flips ", size=>22), run(text=>"is_paid", mono=>1, size=>20), run(text=>" in the profiles table", size=>22));
push @body, bullet_p(run(text=>"Gate premium features behind the ", size=>22), run(text=>"is_paid", mono=>1, size=>20), run(text=>" check", size=>22));

push @body, h2("Stage 3 — AI advisor with disclaimers (about 2-3 days)");
push @body, bullet_p(run(text=>"Add an ", size=>22), run(text=>"/api/ai/explain", mono=>1, size=>20), run(text=>" route that takes a user's plan plus their latest Monte Carlo result and sends them to the Anthropic API", size=>22));
push @body, bullet_p(run(text=>"Use a system prompt that strictly frames the response as educational interpretation, not financial advice", size=>22));
push @body, bullet_p(run(text=>"Hard-code disclaimers in the UI from the first render", size=>22));
push @body, bullet_p(run(text=>"Cache responses per simulation hash to control cost", size=>22));

# ── Reference ──────────────────────────────────────────────────────────
push @body, hr_p();
push @body, h1("Reference — file map of what was scaffolded");

push @body, body_p("The folder D:\\Claude PWA\\wealth-app-next already contains:");
push @body, bullet_p(run(text=>"Engine port: ", bold=>1, size=>22), run(text=>"lib/engine/", mono=>1, size=>20), run(text=>" with types.ts, constants.ts, financial-math.ts, monte-carlo.ts — pure TypeScript, no DOM", size=>22));
push @body, bullet_p(run(text=>"Supabase clients: ", bold=>1, size=>22), run(text=>"lib/supabase/client.ts", mono=>1, size=>20), run(text=>" and server.ts", size=>22));
push @body, bullet_p(run(text=>"Auth middleware: ", bold=>1, size=>22), run(text=>"middleware.ts", mono=>1, size=>20), run(text=>" — session refresh and /app/* gating", size=>22));
push @body, bullet_p(run(text=>"Database schema: ", bold=>1, size=>22), run(text=>"supabase/migrations/001_init.sql", mono=>1, size=>20), run(text=>" — profiles + simulations tables with RLS", size=>22));
push @body, bullet_p(run(text=>"UI components: ", bold=>1, size=>22), run(text=>"Tailwind + shadcn-style primitives in ", size=>22), run(text=>"components/ui/", mono=>1, size=>20));
push @body, bullet_p(run(text=>"Pages: ", bold=>1, size=>22), run(text=>"landing, login, signup, dashboard, plan capture, simulation", size=>22));
push @body, bullet_p(run(text=>"API route: ", bold=>1, size=>22), run(text=>"GET/PUT /api/plan", mono=>1, size=>20));

push @body, body_p(" ");
push @body, callout("You do not need to write any code for Stage 1 — just follow Steps 1 through 14 above.");

push @body, hr_p();
push @body, h1("If you get stuck");
push @body, bullet_p(run(text=>"Save the error message (copy the full text from the terminal or browser console)", size=>22));
push @body, bullet_p(run(text=>"Open the Wealth Analyzer chat thread again", size=>22));
push @body, bullet_p(run(text=>"Paste the error and the step you were on", size=>22));
push @body, bullet_p(run(text=>"Claude will diagnose and fix.", size=>22));

# ── Assemble document.xml ──────────────────────────────────────────────
my $body_xml = join("\n", @body);

my $document_xml = qq{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
$body_xml
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
  <w:cols w:space="720"/>
</w:sectPr>
</w:body>
</w:document>};

# ── Boilerplate XML files ──────────────────────────────────────────────
my $content_types = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>};

my $rels = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>};

my $doc_rels = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>};

my $styles = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
  <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
</w:styles>};

my $numbering = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0">
  <w:lvl w:ilvl="0">
    <w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>
    <w:lvlJc w:val="left"/>
    <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  </w:lvl>
</w:abstractNum>
<w:abstractNum w:abstractNumId="1">
  <w:lvl w:ilvl="0">
    <w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>
    <w:lvlJc w:val="left"/>
    <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
  </w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>};

my $settings = q{<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:defaultTabStop w:val="720"/>
<w:characterSpacingControl w:val="doNotCompress"/>
<w:compat>
  <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
</w:compat>
</w:settings>};

# ── Write to zip ───────────────────────────────────────────────────────
my $out = "Wealth-Analyzer-Setup-Steps.docx";
unlink $out if -e $out;

my @entries = (
  ["[Content_Types].xml"        => $content_types],
  ["_rels/.rels"                => $rels],
  ["word/_rels/document.xml.rels" => $doc_rels],
  ["word/document.xml"          => $document_xml],
  ["word/styles.xml"            => $styles],
  ["word/numbering.xml"         => $numbering],
  ["word/settings.xml"          => $settings],
);

use Encode qw(encode_utf8);

my $zip = IO::Compress::Zip->new($out,
  Name => $entries[0]->[0],
  Method => 8,
  Append => 0,
) or die "Cannot open $out: $ZipError";

# Write first entry (encode unicode to UTF-8 bytes)
$zip->print(encode_utf8($entries[0]->[1]));

# Write remaining entries
for my $i (1..$#entries) {
  $zip->newStream(Name => $entries[$i]->[0], Method => 8)
    or die "Failed to add $entries[$i]->[0]: $ZipError";
  $zip->print(encode_utf8($entries[$i]->[1]));
}
$zip->close() or die "Failed to close: $ZipError";

my $size_kb = (stat($out))[7] / 1024;
printf "✓ Created %s (%.1f KB)\n", $out, $size_kb;
