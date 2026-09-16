type Props = {
  onUpload: (file: File) => void;
};

export function UploadDocumentSection({ onUpload }: Props) {
  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Upload Document
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      <p className="mb-4 text-[12px] leading-5 text-[#64748b]">
        Upload a financial document to import household information. Supported
        document formats are CSV, TXT, PDF.
      </p>

      <label className="inline-flex cursor-pointer items-center rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] transition hover:bg-[#f8faff]">
        ⬆ Upload document
        <input
          type="file"
          accept=".csv,.txt,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) {
              return;
            }

            onUpload(file);

            // Allows the same file to be
            // selected again later.
            e.target.value = "";
          }}
        />
      </label>
    </section>
  );
}
