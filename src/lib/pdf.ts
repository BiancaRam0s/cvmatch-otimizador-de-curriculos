/** Exports the optimized CV (plain text with UPPERCASE section headings) to a real PDF file. */
export async function exportCvPdf(text: string, filename = "curriculo-otimizado-cvmatch.pdf") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const lines = text.replace(/\r/g, "").split("\n");
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += 8;
      return;
    }
    const isName = idx === 0;
    const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
    const isHeading = !isName && letters.length >= 3 && letters === letters.toUpperCase() && line.length < 60;

    if (isName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(36, 77, 115);
    } else if (isHeading) {
      y += 6;
      ensure(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(36, 77, 115);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(40, 48, 60);
    }

    const bullet = /^[-•]\s+/.test(line);
    const content = bullet ? line.replace(/^[-•]\s+/, "") : line;
    const indent = bullet ? 12 : 0;
    const wrapped = doc.splitTextToSize(content, maxW - indent) as string[];
    const lh = isName ? 22 : isHeading ? 16 : 14.5;

    wrapped.forEach((w, i) => {
      ensure(lh);
      if (bullet && i === 0) doc.text("•", margin, y);
      doc.text(w, margin + indent, y);
      y += lh;
    });

    if (isHeading) {
      doc.setDrawColor(185, 217, 239);
      doc.setLineWidth(1);
      doc.line(margin, y - 10, pageW - margin, y - 10);
      y += 2;
    }
    if (isName) y += 2;
  });

  doc.save(filename);
}
