#!/usr/bin/perl
use strict; use warnings; use MIME::Base64; use POSIX qw(strftime);

# Check if File::Slurp is available, use fallback if not
sub slurp {
    my $f = shift;
    open my $fh, '<:raw', $f or die "Cannot open $f: $!";
    local $/; my $data = <$fh>; close $fh; return $data;
}
sub slurp_text {
    my $f = shift;
    open my $fh, '<:encoding(UTF-8)', $f or die "Cannot open $f: $!";
    local $/; my $data = <$fh>; close $fh; return $data;
}

my $SRC  = "wealth-analyzer.html";
my $DEST = "wealth-analyzer-standalone.html";
my $V    = "vendor";

print "Reading source files...\n";
my $html         = slurp_text($SRC);
my $chart_js     = slurp_text("$V/chart.min.js");
my $jspdf_js     = slurp_text("$V/jspdf.min.js");
my $autotable_js = slurp_text("$V/autotable.min.js");
my $pdfjs_main   = slurp_text("$V/pdf.min.js");
my $worker_bytes = slurp("$V/pdf.worker.min.js");
my $worker_b64   = encode_base64($worker_bytes, "");  # no line breaks

print "Transforming...\n";

# 0. Stamp APP_VERSION with current build timestamp (YYYYMMDD-HHMM)
my $version = strftime("%Y%m%d-%H%M", localtime);
$html =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
print "  Version: $version\n";

# 0a. Persist that same stamp back into the SOURCE wealth-analyzer.html so the
#     deployed app's APP_VERSION matches version.json. Otherwise the source keeps
#     a frozen constant, the live update-poller sees a permanent mismatch, and the
#     hosted site auto-reloads in a loop. Byte-preserving edit (only that literal).
{
  my $raw = slurp($SRC);
  $raw =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
  open my $sf, '>:raw', $SRC or die "Cannot write $SRC: $!";
  print $sf $raw; close $sf;
  print "  Synced APP_VERSION into $SRC\n";
}

# 0b. Write version.json — polled by live clients to detect new deploys
my $version_full = strftime("%Y-%m-%dT%H:%M:%S", localtime);
open my $vf, '>:encoding(UTF-8)', "version.json" or die "Cannot write version.json: $!";
print $vf qq({\n  "version": "$version",\n  "builtAt": "$version_full",\n  "channel": "production"\n}\n);
close $vf;
print "  Wrote version.json\n";

# 1. Remove Google Fonts links (old single-link form AND the newer preconnect +
#    async media=print stylesheet + noscript fallback). Standalone uses system fonts.
$html =~ s|<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">|<!-- Google Fonts removed — system fonts used (standalone mode) -->|;
$html =~ s{<link rel="preconnect" href="https://fonts\.g[^"]*"[^>]*>\s*}{}g;
$html =~ s{<link rel="stylesheet"[^>]*href="https://fonts\.googleapis\.com[^"]*"[^>]*>\s*}{}g;
$html =~ s{<noscript><link[^>]*href="https://fonts\.googleapis\.com[^"]*"[^>]*></noscript>}{<!-- Google Fonts removed — system fonts used (standalone mode) -->}g;

# 2. Replace font-family values
$html =~ s|'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Serif Display',serif|Georgia,'Times New Roman',serif|g;
$html =~ s|'DM Serif Display', serif|Georgia,'Times New Roman',serif|g;
$html =~ s|'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans',sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans', sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans',monospace|'Courier New',Courier,monospace|g;

# 2b. Inline the vendored typeface (keeps the standalone offline, and keeps
#     every client IP away from a font CDN)
my $fonts_css = slurp_text("$V/fonts.css");
my $fonts_block = "<style>/* Plus Jakarta Sans - vendored */\n$fonts_css\n</style>";
$html =~ s|<link rel="stylesheet" href="vendor/fonts\.css">|$fonts_block|;

# 3. Inline Chart.js
my $chart_block = "<script>/* Chart.js 4.4.1 — inlined */\n$chart_js\n</script>";
$html =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/4\.4\.1/chart\.umd\.min\.js"></script>|$chart_block|;

# 4. Inline pdf.js + worker blob
my $pdfjs_block = <<PDFBLOCK;
<script>/* pdf.js 3.11.174 — inlined */
$pdfjs_main
</script>
<script>/* pdf.js worker blob — base64 encoded for offline use */
(function(){
  var b64="$worker_b64";
  var bin=atob(b64);
  var arr=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  var blob=new Blob([arr],{type:"application/javascript"});
  window._pdfWorkerBlobUrl=URL.createObjectURL(blob);
})();
</script>
PDFBLOCK
$html =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/pdf\.js/3\.11\.174/pdf\.min\.js"></script>|$pdfjs_block|;

# Fix workerSrc line
$html =~ s|pdfjsLib\.GlobalWorkerOptions\.workerSrc="https://cdnjs\.cloudflare\.com/ajax/libs/pdf\.js/3\.11\.174/pdf\.worker\.min\.js";|pdfjsLib.GlobalWorkerOptions.workerSrc=window._pdfWorkerBlobUrl\|\|"";|;

# 5. Inline jsPDF
my $jspdf_block = "<script>/* jsPDF 2.5.1 — inlined */\n$jspdf_js\n</script>";
$html =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf/2\.5\.1/jspdf\.umd\.min\.js"></script>|$jspdf_block|;

# 6. Inline jsPDF-autotable
my $auto_block = "<script>/* jsPDF-autotable 3.8.2 — inlined */\n$autotable_js\n</script>";
$html =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf-autotable/3\.8\.2/jspdf\.plugin\.autotable\.min\.js"></script>|$auto_block|;

# 7. Inline qrcodejs (share-session QR rendering) — optional, skip if vendor file missing
if(-f "$V/qrcode.min.js"){
  my $qr_js = slurp_text("$V/qrcode.min.js");
  my $qr_block = "<script>/* qrcodejs 1.0.0 — inlined */\n$qr_js\n</script>";
  $html =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/qrcodejs/1\.0\.0/qrcode\.min\.js"></script>|$qr_block|;
}

# Write output
print "Writing $DEST...\n";
open my $out, '>:encoding(UTF-8)', $DEST or die "Cannot write: $!";
print $out $html;
close $out;

my $size_kb = (stat($DEST))[7] / 1024;
printf "Done!  %s  —  %.0f KB (%.1f MB)\n", $DEST, $size_kb, $size_kb/1024;

# Sanity check
my $still_cdn = ($html =~ /cdnjs\.cloudflare\.com|fonts\.googleapis\.com/) ? "YES ⚠" : "none ✓";
print "Remaining CDN references: $still_cdn\n";

# ─────────────────────────────────────────────────────────────────────────────
# Build admin-standalone.html if admin.html exists
# ─────────────────────────────────────────────────────────────────────────────
if (-f "admin.html") {
    print "\nBuilding admin-standalone.html...\n";
    my $admin = slurp_text("admin.html");
    # Stamp version into the standalone...
    $admin =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
    # ...and sync the same stamp back into the admin SOURCE, so admin.html,
    # version.json, and admin-standalone.html never drift apart (same reasoning
    # as the main app's 0a sync). Byte-preserving edit of only that literal.
    {
      my $araw = slurp("admin.html");
      $araw =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
      open my $asf, '>:raw', "admin.html" or die "Cannot write admin.html: $!";
      print $asf $araw; close $asf;
      print "  Synced APP_VERSION into admin.html\n";
    }
    # Remove Google Fonts link
    $admin =~ s|<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">|<!-- Google Fonts removed — system fonts used (standalone mode) -->|;
    # Font substitutions
    $admin =~ s|'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
    $admin =~ s|'JetBrains Mono','SF Mono','Monaco','Consolas',monospace|'SF Mono','Monaco','Consolas','Courier New',monospace|g;
    # Inline Chart.js
    $admin =~ s|<script (?:defer )?src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/4\.4\.1/chart\.umd\.min\.js"></script>|$chart_block|;

    my $admin_dest = "admin-standalone.html";
    open my $aout, '>:encoding(UTF-8)', $admin_dest or die "Cannot write admin: $!";
    print $aout $admin;
    close $aout;
    my $asize_kb = (stat($admin_dest))[7] / 1024;
    printf "Done!  %s  —  %.0f KB\n", $admin_dest, $asize_kb;
} else {
    print "\n(admin.html not found — skipping admin standalone build)\n";
}
