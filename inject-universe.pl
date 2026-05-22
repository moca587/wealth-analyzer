#!/usr/bin/perl
use strict; use warnings;

# Read the canonical fund-universe.js
open my $fh, '<:encoding(UTF-8)', 'fund-universe.js' or die "Cannot open fund-universe.js: $!";
local $/; my $src = <$fh>; close $fh;

# Extract the array body (between the `[` and `];` of `const FUND_UNIVERSE = [...]`)
my ($body) = $src =~ /const FUND_UNIVERSE = \[(.*?)\];(?:\s*\/\/.*\n)*/s;
die "Could not extract array body" unless $body;

# Extract the enrichment block (CLASS_DEFAULTS through enrichAllFunds IIFE)
my ($enrich) = $src =~ /(\/\/ FUND METRICS ENRICHMENT.*?\}\)\(\);)/s;
die "Could not extract enrichment block" unless $enrich;

print "Extracted array body: ", length($body), " bytes\n";
print "Extracted enrichment: ", length($enrich), " bytes\n";

# Build the replacement blocks
my $admin_block = "const FUND_UNIVERSE = [$body];\n\n$enrich";
my $app_block   = "const AI_FUND_UNIVERSE = [$body];\n\n" . ($enrich =~ s/FUND_UNIVERSE/AI_FUND_UNIVERSE/gr);

# ─── Patch admin.html ───────────────────────────────────────────
{
    open my $f, '<:encoding(UTF-8)', 'admin.html' or die $!;
    local $/; my $h = <$f>; close $f;

    # Remove any previous enrichment block so we can re-inject
    $h =~ s{\n*// FUND METRICS ENRICHMENT.*?\}\)\(\);}{}s;

    my $count = ($h =~ s/const FUND_UNIVERSE = \[.*?\];/$admin_block/s);
    die "FUND_UNIVERSE not found in admin.html" unless $count;

    open my $w, '>:encoding(UTF-8)', 'admin.html' or die $!;
    print $w $h; close $w;
    print "✓ admin.html patched\n";
}

# ─── Patch wealth-analyzer.html ────────────────────────────────
{
    open my $f, '<:encoding(UTF-8)', 'wealth-analyzer.html' or die $!;
    local $/; my $h = <$f>; close $f;

    # Remove any previous enrichment block (rename-aware)
    $h =~ s{\n*// FUND METRICS ENRICHMENT.*?\}\)\(\);}{}s;

    my $count = ($h =~ s/const AI_FUND_UNIVERSE = \[.*?\];/$app_block/s);
    die "AI_FUND_UNIVERSE not found in wealth-analyzer.html" unless $count;

    open my $w, '>:encoding(UTF-8)', 'wealth-analyzer.html' or die $!;
    print $w $h; close $w;
    print "✓ wealth-analyzer.html patched\n";
}

print "Done!\n";
