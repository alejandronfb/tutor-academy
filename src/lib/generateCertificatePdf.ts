import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  tutorName: string;
  certTitle: string;
  issuedAt: string;
  verificationId: string;
}

export async function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Generate QR code as data URL
  const verifyUrl = `${window.location.origin}/verify/${data.verificationId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#1e3a8a", light: "#f8fafc" },
  });

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, w, h, "F");

  // Border frame
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Corner accents
  const cornerSize = 12;
  doc.setFillColor(30, 58, 138);
  [[14, 14], [w - 14 - cornerSize, 14], [14, h - 14 - cornerSize], [w - 14 - cornerSize, h - 14 - cornerSize]].forEach(([x, y]) => {
    doc.rect(x, y, cornerSize, 1, "F");
    doc.rect(x, y, 1, cornerSize, "F");
  });

  // Header icon
  doc.setFontSize(28);
  doc.setTextColor(30, 58, 138);
  doc.text("🎓", w / 2, 38, { align: "center" });

  // "Certificate of Completion"
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("CERTIFICATE OF COMPLETION", w / 2, 50, { align: "center" });

  // Decorative line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(w / 2 - 40, 55, w / 2 + 40, 55);

  // Certificate title
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(data.certTitle, w / 2, 70, { align: "center", maxWidth: w - 60 });

  // "Awarded to"
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text("Awarded to", w / 2, 85, { align: "center" });

  // Tutor name
  doc.setFontSize(26);
  doc.setTextColor(30, 58, 138);
  doc.text(data.tutorName, w / 2, 98, { align: "center" });

  // Description
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "For successfully completing all course requirements and demonstrating",
    w / 2, 112, { align: "center" }
  );
  doc.text(
    "proficiency in the subject matter as assessed by LatinHire Academy.",
    w / 2, 118, { align: "center" }
  );

  // Decorative line
  doc.line(w / 2 - 40, 126, w / 2 + 40, 126);

  // Date and Verification ID
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const leftCol = w / 2 - 55;
  const rightCol = w / 2 + 55;

  doc.text("Date Issued", leftCol, 138, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.issuedAt, leftCol, 145, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Verification ID", rightCol, 138, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.verificationId.substring(0, 8).toUpperCase(), rightCol, 145, { align: "center" });

  // QR Code (bottom-right area)
  const qrSize = 28;
  const qrX = w - 20 - qrSize;
  const qrY = h - 20 - qrSize;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // QR label
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Verify at: ${verifyUrl}`,
    w / 2, h - 22, { align: "center" }
  );
  doc.text("LatinHire Academy — Professional Tutor Development", w / 2, h - 17, { align: "center" });

  // Download
  const fileName = `${data.certTitle.replace(/\s+/g, "_")}_Certificate.pdf`;
  doc.save(fileName);
}
