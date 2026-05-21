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
    # Stamp version
    $admin =~ s/const APP_VERSION\s*=\s*"[^"]*"/const APP_VERSION = "$version"/;
    # Remove Google Fonts link
    $admin =~ s|<link href="https://fonts\.googleapis\.com[^"]*" rel="stylesheet">|<!-- Google Fonts removed — system fonts used (standalone mode) -->|;
    # Font substitutions
    $admin =~ s|'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif|-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif|g;
    $admin =~ s|'JetBrains Mono','SF Mono','Monaco','Consolas',monospace|'SF Mono','Monaco','Consolas','Courier New',monospace|g;
    # Inline Chart.js
    $admin =~ s|<script src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/4\.4\.1/chart\.umd\.min\.js"></script>|$chart_block|;

    my $admin_dest = "admin-standalone.html";
    open my $aout, '>:encoding(UTF-8)', $admin_dest or die "Cannot write admin: $!";
    print $aout $admin;
    close $aout;
    my $asize_kb = (stat($admin_dest))[7] / 1024;
    printf "Done!  %s  —  %.0f KB\n", $admin_dest, $asize_kb;
} else {
    print "\n(admin.html not found — skipping admin standalone build)\n";
}
