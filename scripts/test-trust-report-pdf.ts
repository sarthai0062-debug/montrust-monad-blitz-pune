#!/usr/bin/env tsx
/**
 * Generates a sample MonTrust trust report PDF to verify layout (no browser).
 * Output: ./tmp/montrust-sample-report.pdf
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createSampleTrustReport,
  generateTrustReportPdf,
  buildPaymentReceiptFromX402Response,
} from "../src/lib/trustReportPdf";

async function main() {
  const report = createSampleTrustReport();
  const receipt = buildPaymentReceiptFromX402Response(
    {
      amount: "0.1",
      asset: "MON",
      network: "Monad Testnet (10143)",
      payTo: "0xda49D74234318880a2b6af6BF76B390A55284e73",
    },
    "0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678",
    "0xda49D74234318880a2b6af6BF76B390A55284e73"
  );

  const blob = await generateTrustReportPdf(report, receipt);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const outDir = join(process.cwd(), "tmp");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "montrust-sample-report.pdf");
  writeFileSync(outPath, buffer);

  if (buffer.length < 500) {
    console.error("FAIL: PDF too small — generation likely broken");
    process.exit(1);
  }

  if (buffer.subarray(0, 4).toString() !== "%PDF") {
    console.error("FAIL: Output is not a valid PDF header");
    process.exit(1);
  }

  console.log(`OK: wrote ${outPath} (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
