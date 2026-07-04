import type { TrustReport } from "@/lib/trustReport";
import { ERC8004, MONAD_TESTNET, VISION_MODEL } from "@/lib/constants";

export interface TrustReportPaymentReceipt {
  txHash: string;
  amount: string;
  asset: string;
  network: string;
  payTo: string;
  payer?: string;
  paidAt: string;
  wallet: "MetaMask";
}

const MONAD_PURPLE: [number, number, number] = [110, 84, 255];
const TEXT_DARK: [number, number, number] = [32, 32, 32];
const TEXT_MUTED: [number, number, number] = [120, 120, 120];
const PASS_GREEN: [number, number, number] = [22, 163, 74];
const FAIL_AMBER: [number, number, number] = [202, 138, 4];
const FAIL_RED: [number, number, number] = [220, 38, 38];

function statusColor(status: TrustReport["overallStatus"]): [number, number, number] {
  if (status === "trusted") return PASS_GREEN;
  if (status === "warning") return FAIL_AMBER;
  return FAIL_RED;
}

function answerLabel(answer: TrustReport["questions"][0]["answer"]): string {
  return answer.toUpperCase();
}

function wrapText(text: string, maxWidth: number, doc: import("jspdf").jsPDF): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function pdfFilename(agentId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `montrust-report-agent-${agentId}-${stamp}.pdf`;
}

export async function generateTrustReportPdf(
  report: TrustReport,
  payment?: TrustReportPaymentReceipt
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFillColor(...MONAD_PURPLE);
  doc.rect(0, 0, pageWidth, 72, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MonTrust Agent Security Report", margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("ERC-8004 · Monad Testnet · Pay-When-It-Works x402", margin, 54);

  y = 96;
  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Executive Summary", margin, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...statusColor(report.overallStatus));
  doc.text(`Overall trust: ${report.overallStatus.toUpperCase()}`, margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  const summaryLines = wrapText(report.summary, contentWidth, doc);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 13 + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Target Agent", margin, y);
  y += 16;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4, textColor: TEXT_DARK },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 110, textColor: TEXT_MUTED } },
    body: [
      ["Agent ID", report.agentId],
      ["Agent source", report.agentSource],
      ["Endpoint", report.endpointUrl],
      ["Proof hash", report.proofHash ?? "—"],
      ["Generated", new Date(report.generatedAt).toLocaleString()],
      ["Registry", ERC8004.identityRegistry],
      ["Vision model", VISION_MODEL],
    ],
  });

  y = (doc as import("jspdf").jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  if (payment) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...MONAD_PURPLE);
    doc.text("x402 Payment Receipt (MetaMask)", margin, y);
    y += 16;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: { fillColor: MONAD_PURPLE, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 110 } },
      body: [
        ["Status", "Settled"],
        ["Wallet", payment.wallet],
        ["Amount", `${payment.amount} ${payment.asset}`],
        ["Network", payment.network],
        ["Payer", payment.payer ?? "—"],
        ["Seller", payment.payTo],
        ["Transaction", payment.txHash],
        ["Paid at", new Date(payment.paidAt).toLocaleString()],
      ],
    });

    y = (doc as import("jspdf").jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_DARK);
  doc.text("Trust Analysis — Six Questions", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Proof pipeline uses ${VISION_MODEL} (NVIDIA NIM) for vision audit + on-chain ProofAnchor verification.`,
    margin,
    y + 10
  );
  y += 24;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["#", "Question", "Answer", "Pass", "Detail"]],
    headStyles: { fillColor: MONAD_PURPLE, textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 115 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: contentWidth - 210 },
    },
    body: report.questions.map((q, i) => [
      String(i + 1),
      q.question,
      answerLabel(q.answer),
      q.passed ? "YES" : "NO",
      q.detail,
    ]),
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const passed = data.cell.raw === "YES";
        data.cell.styles.textColor = passed ? PASS_GREEN : FAIL_AMBER;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as import("jspdf").jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  if (report.linkSafety.findings.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Link Safety Scan", margin, y);
    y += 14;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Severity", "Check", "Result", "Detail"]],
      headStyles: { fillColor: MONAD_PURPLE, textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      body: report.linkSafety.findings.map((f) => [
        f.severity.toUpperCase(),
        f.label,
        f.passed ? "PASS" : "FAIL",
        f.detail,
      ]),
    });

    y = (doc as import("jspdf").jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Pay-When-It-Works", margin, y);
  y += 14;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 110, textColor: TEXT_MUTED } },
    body: [
      ["Eligible for settlement", report.payWhenItWorks.eligible ? "Yes" : "No"],
      ["Reason", report.payWhenItWorks.reason],
      ["x402 note", report.payWhenItWorks.x402Note],
    ],
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      `MonTrust · ${MONAD_TESTNET.name} (${MONAD_TESTNET.chainId}) · Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 24
    );
  }

  return doc.output("blob");
}

export async function downloadTrustReportPdf(
  report: TrustReport,
  payment?: TrustReportPaymentReceipt
): Promise<void> {
  const blob = await generateTrustReportPdf(report, payment);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = pdfFilename(report.agentId);
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildPaymentReceiptFromX402Response(
  data: {
    amount?: string;
    asset?: string;
    network?: string;
    payTo?: string;
  },
  txHash: string,
  payer?: string
): TrustReportPaymentReceipt {
  return {
    txHash,
    amount: data.amount ?? "0.1",
    asset: data.asset ?? "MON",
    network: data.network ?? `Monad Testnet (${MONAD_TESTNET.chainId})`,
    payTo: data.payTo ?? "",
    payer,
    paidAt: new Date().toISOString(),
    wallet: "MetaMask",
  };
}

/** Sample report for PDF layout tests (no browser required). */
export function createSampleTrustReport(): TrustReport {
  return {
    generatedAt: new Date().toISOString(),
    agentId: "1786",
    endpointUrl: "https://example.com/api/agent/challenge",
    proofHash: "0xabc123",
    agentSource: "montrust",
    overallStatus: "trusted",
    summary: "All trust checks pass. Safe for Pay-When-It-Works settlement.",
    questions: [
      {
        id: "proof-genuine",
        question: "Was the proof genuine?",
        answer: "yes",
        passed: true,
        detail: "Proof hash matches canonical JSON and is anchored on ProofAnchor.",
      },
      {
        id: "agent-genuine",
        question: "Was the agent genuine?",
        answer: "yes",
        passed: true,
        detail: "Agent exists on ERC-8004 registry.",
      },
    ],
    linkSafety: {
      safe: true,
      findings: [
        {
          id: "https-check",
          severity: "low",
          passed: true,
          label: "HTTPS endpoint",
          detail: "Endpoint uses HTTPS.",
        },
      ],
    },
    payWhenItWorks: {
      eligible: true,
      reason: "Proof anchored + agent verified.",
      x402Note: "x402 on Monad Testnet — 0.1 MON via MetaMask.",
    },
  };
}
