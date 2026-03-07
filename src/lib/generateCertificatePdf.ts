import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  tutorName: string;
  certTitle: string;
  issuedAt: string;
  verificationId: string;
  template?: "classic" | "modern" | "elegant";
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
  const template = data.template || "classic";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  const verifyUrl = `${window.location.origin}/verify/${data.verificationId}`;
  const [qrDataUrl, logoDataUrl] = await Promise.all([
    QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: "#0F3C6E", light: "#FFFFFF" } }),
    loadImageAsDataUrl("/images/latinhire-logo.jpg"),
  ]);

  if (template === "modern") {
    renderModernTemplate(doc, data, w, h, qrDataUrl, logoDataUrl, verifyUrl);
  } else if (template === "elegant") {
    renderElegantTemplate(doc, data, w, h, qrDataUrl, logoDataUrl, verifyUrl);
  } else {
    renderClassicTemplate(doc, data, w, h, qrDataUrl, logoDataUrl, verifyUrl);
  }

  const fileName = `${data.certTitle.replace(/\s+/g, "_")}_Certificate.pdf`;
  doc.save(fileName);
}

function renderClassicTemplate(doc: jsPDF, data: CertificateData, w: number, h: number, qrDataUrl: string, logoDataUrl: string, verifyUrl: string) {
  const blue = { r: 18, g: 116, b: 181 };
  const navy = { r: 15, g: 60, b: 110 };
  const orange = { r: 247, g: 168, b: 37 };
  const lightBlue = { r: 26, g: 143, b: 212 };

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  doc.setDrawColor(blue.r, blue.g, blue.b);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, w - 16, h - 16);

  doc.setDrawColor(orange.r, orange.g, orange.b);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, w - 24, h - 24);

  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(12, 12, w - 24, 3, "F");

  const ornamentSize = 15;
  const corners = [[12, 12], [w - 12 - ornamentSize, 12], [12, h - 12 - ornamentSize], [w - 12 - ornamentSize, h - 12 - ornamentSize]];
  doc.setFillColor(blue.r, blue.g, blue.b);
  corners.forEach(([x, y]) => { doc.rect(x, y, ornamentSize, 0.8, "F"); doc.rect(x, y, 0.8, ornamentSize, "F"); });
  doc.setFillColor(orange.r, orange.g, orange.b);
  corners.forEach(([x, y]) => { doc.rect(x + 2, y + 2, ornamentSize - 4, 0.5, "F"); doc.rect(x + 2, y + 2, 0.5, ornamentSize - 4, "F"); });

  const logoW = 52, logoH = 16;
  doc.addImage(logoDataUrl, "PNG", w / 2 - logoW / 2, 22, logoW, logoH);

  doc.setFontSize(10);
  doc.setTextColor(lightBlue.r, lightBlue.g, lightBlue.b);
  doc.text("ACADEMY", w / 2, 43, { align: "center" });

  const divY = 47;
  doc.setDrawColor(orange.r, orange.g, orange.b);
  doc.setLineWidth(0.6);
  doc.line(w / 2 - 50, divY, w / 2 - 8, divY);
  doc.line(w / 2 + 8, divY, w / 2 + 50, divY);
  doc.setFillColor(orange.r, orange.g, orange.b);
  const cx = w / 2, cy = divY;
  doc.triangle(cx, cy - 2.5, cx - 2.5, cy, cx, cy + 2.5, "F");
  doc.triangle(cx, cy - 2.5, cx + 2.5, cy, cx, cy + 2.5, "F");

  doc.setFontSize(11); doc.setTextColor(120, 130, 145);
  doc.text("CERTIFICATE OF COMPLETION", w / 2, 56, { align: "center" });

  doc.setFontSize(24); doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.certTitle, w / 2, 70, { align: "center", maxWidth: w - 60 });

  doc.setFontSize(10); doc.setTextColor(120, 130, 145);
  doc.text("is hereby awarded to", w / 2, 82, { align: "center" });

  doc.setFontSize(28); doc.setTextColor(blue.r, blue.g, blue.b);
  doc.text(data.tutorName, w / 2, 96, { align: "center" });

  const nameWidth = doc.getTextWidth(data.tutorName);
  doc.setDrawColor(orange.r, orange.g, orange.b); doc.setLineWidth(0.5);
  doc.line(w / 2 - nameWidth / 2 - 5, 99, w / 2 + nameWidth / 2 + 5, 99);

  doc.setFontSize(9.5); doc.setTextColor(100, 116, 139);
  doc.text("For successfully completing all course requirements and demonstrating", w / 2, 109, { align: "center" });
  doc.text("proficiency in the subject matter as assessed by LatinHire Academy.", w / 2, 115, { align: "center" });

  renderBottomSection(doc, data, w, h, qrDataUrl, verifyUrl, navy, blue);
}

function renderModernTemplate(doc: jsPDF, data: CertificateData, w: number, h: number, qrDataUrl: string, logoDataUrl: string, verifyUrl: string) {
  // Clean white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // Thin colored border - primary blue
  doc.setDrawColor(18, 116, 181);
  doc.setLineWidth(1);
  doc.rect(10, 10, w - 20, h - 20);

  // Accent line at top
  doc.setFillColor(247, 168, 37);
  doc.rect(10, 10, w - 20, 2, "F");

  // Logo
  const logoW = 44, logoH = 14;
  doc.addImage(logoDataUrl, "PNG", w / 2 - logoW / 2, 20, logoW, logoH);

  // Certificate label — minimal
  doc.setFontSize(9); doc.setTextColor(160, 170, 180);
  doc.text("CERTIFICATE OF COMPLETION", w / 2, 42, { align: "center" });

  // Thin divider
  doc.setDrawColor(220, 225, 230); doc.setLineWidth(0.3);
  doc.line(w / 2 - 40, 46, w / 2 + 40, 46);

  // Tutor name — large, bold, dark
  doc.setFontSize(34); doc.setTextColor(30, 40, 55);
  doc.text(data.tutorName, w / 2, 66, { align: "center" });

  // Course title
  doc.setFontSize(14); doc.setTextColor(18, 116, 181);
  doc.text(data.certTitle, w / 2, 80, { align: "center", maxWidth: w - 60 });

  // Description
  doc.setFontSize(9); doc.setTextColor(130, 140, 155);
  doc.text("Has successfully completed all course requirements", w / 2, 94, { align: "center" });
  doc.text("as assessed by LatinHire Academy.", w / 2, 100, { align: "center" });

  // Bottom section
  const bottomY = 125;
  const col1 = w / 2 - 70, col2 = w / 2, col3 = w / 2 + 70;

  doc.setDrawColor(220, 225, 230); doc.setLineWidth(0.3);
  doc.line(col1 - 25, bottomY + 5, col1 + 25, bottomY + 5);
  doc.line(col2 - 25, bottomY + 5, col2 + 25, bottomY + 5);
  doc.line(col3 - 25, bottomY + 5, col3 + 25, bottomY + 5);

  doc.setFontSize(10); doc.setTextColor(30, 40, 55);
  doc.text(data.issuedAt, col1, bottomY + 3, { align: "center" });
  doc.text("LatinHire", col2, bottomY + 2, { align: "center" });
  doc.text(data.verificationId.substring(0, 8).toUpperCase(), col3, bottomY + 3, { align: "center" });

  doc.setFontSize(7); doc.setTextColor(160, 170, 180);
  doc.text("Date Issued", col1, bottomY + 10, { align: "center" });
  doc.text("Director of Education", col2, bottomY + 10, { align: "center" });
  doc.text("Verification ID", col3, bottomY + 10, { align: "center" });

  // QR Code
  const qrSize = 22;
  doc.addImage(qrDataUrl, "PNG", w - 14 - qrSize, h - 14 - qrSize, qrSize, qrSize);
  doc.setFontSize(6); doc.setTextColor(160, 170, 180);
  doc.text("Scan to verify", w - 14 - qrSize / 2, h - 14 + 3, { align: "center" });

  // Bottom accent
  doc.setFillColor(18, 116, 181);
  doc.rect(10, h - 12, w - 20, 2, "F");

  doc.setFontSize(6.5);
  doc.text(`Verify: ${verifyUrl}`, w / 2, h - 16, { align: "center" });
}

function renderElegantTemplate(doc: jsPDF, data: CertificateData, w: number, h: number, qrDataUrl: string, logoDataUrl: string, verifyUrl: string) {
  // Cream/ivory background
  doc.setFillColor(252, 250, 245);
  doc.rect(0, 0, w, h, "F");

  // Decorative double border
  doc.setDrawColor(140, 110, 70);
  doc.setLineWidth(2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, w - 24, h - 24);

  // Corner ornamental squares
  const orn = 8;
  [[12, 12], [w - 12 - orn, 12], [12, h - 12 - orn], [w - 12 - orn, h - 12 - orn]].forEach(([x, y]) => {
    doc.setFillColor(140, 110, 70);
    doc.rect(x, y, orn, orn, "F");
    doc.setFillColor(252, 250, 245);
    doc.rect(x + 1.5, y + 1.5, orn - 3, orn - 3, "F");
  });

  // Top decorative bar
  doc.setFillColor(140, 110, 70);
  doc.rect(20, 12, w - 40, 1.5, "F");

  // Logo
  const logoW = 48, logoH = 15;
  doc.addImage(logoDataUrl, "PNG", w / 2 - logoW / 2, 22, logoW, logoH);

  doc.setFontSize(9); doc.setTextColor(140, 110, 70);
  doc.text("A C A D E M Y", w / 2, 42, { align: "center" });

  // Decorative flourish
  doc.setDrawColor(140, 110, 70); doc.setLineWidth(0.4);
  doc.line(w / 2 - 55, 46, w / 2 - 5, 46);
  doc.line(w / 2 + 5, 46, w / 2 + 55, 46);
  doc.setFillColor(140, 110, 70);
  doc.circle(w / 2, 46, 1.5, "F");

  doc.setFontSize(12); doc.setTextColor(100, 80, 50);
  doc.text("Certificate of Completion", w / 2, 55, { align: "center" });

  // Certificate title — serif style
  doc.setFontSize(22); doc.setTextColor(60, 45, 25);
  doc.text(data.certTitle, w / 2, 70, { align: "center", maxWidth: w - 60 });

  doc.setFontSize(10); doc.setTextColor(120, 100, 75);
  doc.text("is proudly presented to", w / 2, 82, { align: "center" });

  // Tutor name — large serif
  doc.setFontSize(30); doc.setTextColor(60, 45, 25);
  doc.text(data.tutorName, w / 2, 98, { align: "center" });

  // Name underline — gold
  const nameWidth = doc.getTextWidth(data.tutorName);
  doc.setDrawColor(190, 155, 90); doc.setLineWidth(0.6);
  doc.line(w / 2 - nameWidth / 2 - 5, 101, w / 2 + nameWidth / 2 + 5, 101);

  doc.setFontSize(9); doc.setTextColor(120, 100, 75);
  doc.text("For demonstrating excellence in completing all requirements", w / 2, 111, { align: "center" });
  doc.text("of this course as certified by LatinHire Academy.", w / 2, 117, { align: "center" });

  // Bottom section
  const bottomY = 135;
  const col1 = w / 2 - 80, col2 = w / 2, col3 = w / 2 + 80;

  doc.setDrawColor(140, 110, 70); doc.setLineWidth(0.3);
  doc.line(col1 - 25, bottomY + 5, col1 + 25, bottomY + 5);
  doc.line(col2 - 25, bottomY + 5, col2 + 25, bottomY + 5);
  doc.line(col3 - 25, bottomY + 5, col3 + 25, bottomY + 5);

  doc.setFontSize(11); doc.setTextColor(60, 45, 25);
  doc.text(data.issuedAt, col1, bottomY + 3, { align: "center" });
  doc.setFontSize(14);
  doc.text("LatinHire", col2, bottomY + 2, { align: "center" });
  doc.setFontSize(11);
  doc.text(data.verificationId.substring(0, 8).toUpperCase(), col3, bottomY + 3, { align: "center" });

  doc.setFontSize(7.5); doc.setTextColor(140, 110, 70);
  doc.text("Date Issued", col1, bottomY + 10, { align: "center" });
  doc.text("Director of Education", col2, bottomY + 10, { align: "center" });
  doc.text("Verification ID", col3, bottomY + 10, { align: "center" });

  // QR Code
  const qrSize = 24;
  doc.addImage(qrDataUrl, "PNG", w - 16 - qrSize, h - 16 - qrSize, qrSize, qrSize);
  doc.setFontSize(6.5); doc.setTextColor(140, 110, 70);
  doc.text("Scan to verify", w - 16 - qrSize / 2, h - 16 + 3, { align: "center" });

  // Bottom decorative bar
  doc.setFillColor(140, 110, 70);
  doc.rect(20, h - 15, w - 40, 1.5, "F");

  doc.setFontSize(6.5); doc.setTextColor(160, 140, 110);
  doc.text(`Verify: ${verifyUrl}`, w / 2, h - 18, { align: "center" });
}

function renderBottomSection(doc: jsPDF, data: CertificateData, w: number, h: number, qrDataUrl: string, verifyUrl: string, navy: any, blue: any) {
  const bottomY = 135;
  const col1 = w / 2 - 80, col2 = w / 2, col3 = w / 2 + 80;

  doc.setDrawColor(blue.r, blue.g, blue.b); doc.setLineWidth(0.3);
  doc.line(col1 - 25, bottomY + 5, col1 + 25, bottomY + 5);
  doc.setFontSize(11); doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.issuedAt, col1, bottomY + 3, { align: "center" });
  doc.setFontSize(8); doc.setTextColor(120, 130, 145);
  doc.text("Date Issued", col1, bottomY + 10, { align: "center" });

  doc.setDrawColor(navy.r, navy.g, navy.b); doc.setLineWidth(0.3);
  doc.line(col2 - 25, bottomY + 5, col2 + 25, bottomY + 5);
  doc.setFontSize(14); doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text("LatinHire", col2 - 5, bottomY + 2, { align: "center" });
  doc.setFontSize(8); doc.setTextColor(120, 130, 145);
  doc.text("Director of Education", col2, bottomY + 10, { align: "center" });

  doc.setDrawColor(blue.r, blue.g, blue.b);
  doc.line(col3 - 25, bottomY + 5, col3 + 25, bottomY + 5);
  doc.setFontSize(11); doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text(data.verificationId.substring(0, 8).toUpperCase(), col3, bottomY + 3, { align: "center" });
  doc.setFontSize(8); doc.setTextColor(120, 130, 145);
  doc.text("Verification ID", col3, bottomY + 10, { align: "center" });

  const qrSize = 24;
  doc.addImage(qrDataUrl, "PNG", w - 16 - qrSize, h - 16 - qrSize, qrSize, qrSize);
  doc.setFontSize(6.5); doc.setTextColor(120, 130, 145);
  doc.text("Scan to verify", w - 16 - qrSize / 2, h - 16 + 3, { align: "center" });

  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(12, h - 15, w - 24, 3, "F");

  doc.setFontSize(7); doc.setTextColor(160, 170, 180);
  doc.text(`Verify online: ${verifyUrl}`, w / 2, h - 18, { align: "center" });
}
