#!/usr/bin/perl
use strict; use warnings;
use Encode qw(encode_utf8);

# Read the new accounts file
open my $fh, "<:encoding(UTF-8)", "country-accounts.js" or die "Cannot open country-accounts.js: $!";
local $/; my $src = <$fh>; close $fh;

# Extract just the `const COUNTRY_ACCOUNTS = {...};` block.
# The data file's contents ARE essentially that — find the const through the matching trailing `};`.
my ($block) = $src =~ /(const COUNTRY_ACCOUNTS\s*=\s*\{[\s\S]*?\n\};)\s*$/;
die "Could not extract COUNTRY_ACCOUNTS block from country-accounts.js" unless $block;

print "Extracted COUNTRY_ACCOUNTS block: ", length($block), " bytes\n";
my $count_countries = () = $block =~ /^[A-Z]{2,5}:\{flag:/gm;
print "Country entries detected: $count_countries\n";

# Read wealth-analyzer.html
open my $f, "<:encoding(UTF-8)", "wealth-analyzer.html" or die "Cannot open wealth-analyzer.html: $!";
local $/; my $html = <$f>; close $f;

# Replace the existing one-line COUNTRY_ACCOUNTS={...}; declaration.
# It's a single very long line so use the lazy match.
my $count = ($html =~ s/const COUNTRY_ACCOUNTS\s*=\s*\{.*?\};/$block/s);
die "FAIL: matched $count times (expected 1)" unless $count == 1;

open my $w, ">:encoding(UTF-8)", "wealth-analyzer.html" or die "Cannot write: $!";
print $w $html; close $w;

print "OK rewrote COUNTRY_ACCOUNTS in wealth-analyzer.html\n";
