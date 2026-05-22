#!/usr/bin/perl
use strict; use warnings;

# Read the new fund universe
open my $fh, '<:encoding(UTF-8)', 'fund-universe.js' or die "Cannot open fund-universe.js: $!";
local $/; my $src = <$fh>; close $fh;

# Extract just the array body (between the `[` and `];`)
my ($body) = $src =~ /const FUND_UNIVERSE = \[(.*?)\];\s*\z/s;
die "Could not extract array body" unless $body;
print "Extracted array body: ", length($body), " bytes\n";

# Build the replacement blocks
my $admin_block   = "const FUND_UNIVERSE = [$body];";
my $app_block     = "const AI_FUND_UNIVERSE = [$body];";

# ─── Patch admin.html ───────────────────────────────────────────
{
    open my $f, '<:encoding(UTF-8)', 'admin.html' or die $!;
    local $/; my $h = <$f>; close $f;

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

    my $count = ($h =~ s/const AI_FUND_UNIVERSE = \[.*?\];/$app_block/s);
    die "AI_FUND_UNIVERSE not found in wealth-analyzer.html" unless $count;

    open my $w, '>:encoding(UTF-8)', 'wealth-analyzer.html' or die $!;
    print $w $h; close $w;
    print "✓ wealth-analyzer.html patched\n";
}

print "Done!\n";
