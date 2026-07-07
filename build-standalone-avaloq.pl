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

my $SRC  = "wealth-analyzer-avaloq.html";
my $DEST = "wealth-analyzer-avaloq-standalone.html";
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

# 0a. Persist that same stamp back into the SOURCE so the deployed app's
#     APP_VERSION matches version-avaloq.json. Otherwise the source keeps a
#     frozen constant, the live update-poller sees a permanent mismatch, and
#     the hosted Avaloq edition auto-reloads in a loop — the same bug that hit
#     the main app. Byte-preserving edit (only that literal).
{
  my $raw = slurp($SRC);
  $raw =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
  open my $sf, '>:raw', $SRC or die "Cannot write $SRC: $!";
  print $sf $raw; close $sf;
  print "  Synced APP_VERSION into $SRC\n";
}

# 0b. The Avaloq edition gets its OWN version channel. version.json belongs to
# the main app — sharing it would make whichever edition was built last force
# the other into an auto-reload loop, and the shared localStorage version key
# would wipe wa_* keys every time the user switched editions on one origin.
my $version_full = strftime("%Y-%m-%dT%H:%M:%S", localtime);
open my $vf, '>:encoding(UTF-8)', "version-avaloq.json" or die "Cannot write version-avaloq.json: $!";
print $vf qq({\n  "version": "$version",\n  "builtAt": "$version_full",\n  "channel": "avaloq"\n}\n);
close $vf;
print "  Wrote version-avaloq.json\n";
$html =~ s|fetch\("version\.json\?t="|fetch("version-avaloq.json?t="|g;
$html =~ s|"wa_app_version"|"wa_avaloq_app_version"|g;

# 1. Remove Google Fonts link
$html =~ s|<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">|<!-- Google Fonts removed — system fonts used (standalone mode) -->|;

# 2. Replace font-family values
$html =~ s|'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Serif Display',serif|Georgia,'Times New Roman',serif|g;
$html =~ s|'DM Serif Display', serif|Georgia,'Times New Roman',serif|g;
$html =~ s|'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans',sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans', sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
$html =~ s|'DM Sans',monospace|'Courier New',Courier,monospace|g;

# 3. Inline Chart.js
my $chart_block = "<script>/* Chart.js 4.4.1 — inlined */\n$chart_js\n</script>";
$html =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/4\.4\.1/chart\.umd\.min\.js"></script>|$chart_block|;

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
$html =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/pdf\.js/3\.11\.174/pdf\.min\.js"></script>|$pdfjs_block|;

# Fix workerSrc line
$html =~ s|pdfjsLib\.GlobalWorkerOptions\.workerSrc="https://cdnjs\.cloudflare\.com/ajax/libs/pdf\.js/3\.11\.174/pdf\.worker\.min\.js";|pdfjsLib.GlobalWorkerOptions.workerSrc=window._pdfWorkerBlobUrl\|\|"";|;

# 5. Inline jsPDF
my $jspdf_block = "<script>/* jsPDF 2.5.1 — inlined */\n$jspdf_js\n</script>";
$html =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf/2\.5\.1/jspdf\.umd\.min\.js"></script>|$jspdf_block|;

# 6. Inline jsPDF-autotable
my $auto_block = "<script>/* jsPDF-autotable 3.8.2 — inlined */\n$autotable_js\n</script>";
$html =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jspdf-autotable/3\.8\.2/jspdf\.plugin\.autotable\.min\.js"></script>|$auto_block|;

# 7. Inline qrcodejs (share-session QR rendering) — optional, skip if vendor file missing
if(-f "$V/qrcode.min.js"){
  my $qr_js = slurp_text("$V/qrcode.min.js");
  my $qr_block = "<script>/* qrcodejs 1.0.0 — inlined */\n$qr_js\n</script>";
  $html =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/qrcodejs/1\.0\.0/qrcode\.min\.js"></script>|$qr_block|;
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

# NOTE: admin-standalone.html is intentionally NOT built here. The admin app is
# not Avaloq-specific and is owned by the main build (build-standalone.pl),
# versioned by version.json. Building it in two places with two different
# timestamps was a source of version drift, so it lives in one place now.
