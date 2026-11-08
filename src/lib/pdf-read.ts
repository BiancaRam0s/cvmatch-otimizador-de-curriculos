/** Extracts plain text from a PDF file in the browser (pdf.js). */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let pageText = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = (item.transform as number[])[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) pageText += "\n";
      pageText += item.str;
      lastY = y;
    }
    parts.push(pageText.trim());
  }
  return parts.join("\n\n").trim();
}
