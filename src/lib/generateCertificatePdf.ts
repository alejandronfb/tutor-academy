import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  tutorName: string;
  certTitle: string;
  issuedAt: string;
  verificationId: string;
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Brand colors — LatinHire Blue (#1274B5), Orange (#F7A825), Light Blue (#1A8FD4)
  const blue = { r: 18, g: 116, b: 181 };
  const navy = { r: 15, g: 60, b: 110 };
  const orange = { r: 247, g: 168, b: 37 };
  const lightBlue = { r: 26, g: 143, b: 212 };

  // Load assets in parallel
  const verifyUrl = `${window.location.origin}/verify/${data.verificationId}`;
  const [qrDataUrl, logoDataUrl] = await Promise.all([
    QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#0F3C6E", light: "#FFFFFF" },
    }),
    loadImageAsDataUrl("/images/latinhire-logo.jpg"),
  ]);

  // ── Background ──
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // ── Outer border ──
  doc.setDrawColor(blue.r, blue.g, blue.b);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, w - 16, h - 16);

  // ── Inner border ──
  doc.setDrawColor(orange.r, orange.g, orange.b);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, w - 24, h - 24);

  // ── Top accent bar ──
  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(12, 12, w - 24, 3, "F");

  // ── Corner ornaments ──
  const ornamentSize = 15;
  const corners = [
    [12, 12], [w - 12 - ornamentSize, 12],
    [12, h - 12 - ornamentSize], [w - 12 - ornamentSize, h - 12 - ornamentSize],
  ];
  doc.setFillColor(blue.r, blue.g, blue.b);
  corners.forEach(([x, y]) => {
    doc.rect(x, y, ornamentSize, 0.8, "F");
    doc.rect(x, y, 0.8, ornamentSize, "F");
  });
  doc.setFillColor(orange.r, orange.g, orange.b);
  corners.forEach(([x, y]) => {
    doc.rect(x + 2, y + 2, ornamentSize - 4, 0.5, "F");
    doc.rect(x + 2, y + 2, 0.5, ornamentSize - 4, "F");
  });

  // ── Logo ──
  const logoW = 52;
  const logoH = 16;
  doc.addImage(logoDataUrl, "PNG", w / 2 - logoW / 2, 22, logoW, logoH);

  // ── "ACADEMY" subtitle under logo ──
  doc.setFontSize(10);
  doc.setTextColor(lightBlue.r, lightBlue.g, lightBlue.b);
  doc.text("ACADEMY", w / 2, 43, { align: "center" });

  // ── Decorative divider ──
  const divY = 47;
  doc.setDrawColor(orange.r, orange.g, orange.b);
  doc.setLineWidth(0.6);
  doc.line(w / 2 - 50, divY, w / 2 - 8, divY);
  doc.line(w / 2 + 8, divY, w / 2 + 50, divY);
  // Diamond in center
  doc.setFillColor(orange.r, orange.g, orange.b);
  const cx = w / 2, cy = divY;
  doc.triangle(cx, cy - 2.5, cx - 2.5, cy, cx, cy + 2.5, "F");
  doc.triangle(cx, cy - 2.5, cx + 2.5, cy, cx, cy + 2.5, "F");

  // ── "Certificate of Completion" ──
  doc.setFontSize(11);
  doc.setTextColor(120, 130, 145);
  doc.text("CERTIFICATE OF COMPLETION", w / 2, 56, { align: "center" });

  // ── Certificate title ──
  doc.setFontSize(24);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.certTitle, w / 2, 70, { align: "center", maxWidth: w - 60 });

  // ── "Awarded to" ──
  doc.setFontSize(10);
  doc.setTextColor(120, 130, 145);
  doc.text("is hereby awarded to", w / 2, 82, { align: "center" });

  // ── Tutor name ──
  doc.setFontSize(28);
  doc.setTextColor(blue.r, blue.g, blue.b);
  doc.text(data.tutorName, w / 2, 96, { align: "center" });

  // ── Name underline ──
  const nameWidth = doc.getTextWidth(data.tutorName);
  doc.setDrawColor(orange.r, orange.g, orange.b);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - nameWidth / 2 - 5, 99, w / 2 + nameWidth / 2 + 5, 99);

  // ── Description ──
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "For successfully completing all course requirements and demonstrating",
    w / 2, 109, { align: "center" }
  );
  doc.text(
    "proficiency in the subject matter as assessed by LatinHire Academy.",
    w / 2, 115, { align: "center" }
  );

  // ── Bottom section: Date | Signature | Verification ──
  const bottomY = 135;
  const col1 = w / 2 - 80;
  const col2 = w / 2;
  const col3 = w / 2 + 80;

  // Date
  doc.setDrawColor(blue.r, blue.g, blue.b);
  doc.setLineWidth(0.3);
  doc.line(col1 - 25, bottomY + 5, col1 + 25, bottomY + 5);
  doc.setFontSize(11);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.issuedAt, col1, bottomY + 3, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text("Date Issued", col1, bottomY + 10, { align: "center" });

  // Digital signature (stylized)
  doc.setDrawColor(navy.r, navy.g, navy.b);
  doc.setLineWidth(0.3);
  doc.line(col2 - 25, bottomY + 5, col2 + 25, bottomY + 5);
  doc.setFontSize(14);
  doc.setTextColor(navy.r, navy.g, navy.b);
  // Cursive-style signature
  doc.text("LatinHire", col2 - 5, bottomY + 2, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text("Director of Education", col2, bottomY + 10, { align: "center" });

  // Verification ID
  doc.setDrawColor(blue.r, blue.g, blue.b);
  doc.line(col3 - 25, bottomY + 5, col3 + 25, bottomY + 5);
  doc.setFontSize(11);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.verificationId.substring(0, 8).toUpperCase(), col3, bottomY + 3, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text("Verification ID", col3, bottomY + 10, { align: "center" });

  // ── QR Code (bottom-right) ──
  const qrSize = 24;
  const qrX = w - 16 - qrSize;
  const qrY = h - 16 - qrSize;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 130, 145);
  doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 3.5, { align: "center" });

  // ── Bottom accent bar ──
  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(12, h - 15, w - 24, 3, "F");

  // ── Footer text ──
  doc.setFontSize(7);
  doc.setTextColor(160, 170, 180);
  doc.text(
    `Verify online: ${verifyUrl}`,
    w / 2, h - 18, { align: "center" }
  );

  // Download
  const fileName = `${data.certTitle.replace(/\s+/g, "_")}_Certificate.pdf`;
  doc.save(fileName);
}
