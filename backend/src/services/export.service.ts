import { FairValueResult } from '../types';
import { createLogger } from '../utils/logger';
import PDFDocument from 'pdfkit';

const logger = createLogger('ExportService');

/**
 * ExportService handles CSV and PDF export generation
 * Requirements: 9.1, 9.2, 9.3
 */
export class ExportService {
  /**
   * Generate CSV from fair value data
   * Requirements: 9.1, 9.3
   */
  generateCSV(data: FairValueResult[]): string {
    try {
      logger.info(`Generating CSV for ${data.length} stocks`);

      // CSV header
      const headers = [
        'Ticker',
        'Company Name',
        'Current Price',
        'DCF Fair Value',
        'DDM Fair Value',
        'P/E Fair Value',
        'P/B Fair Value',
        'P/S Fair Value',
        'Graham Number',
        'Average Fair Value',
        'Valuation Status',
        'Calculated At',
      ];

      // Build CSV rows
      const rows = data.map((stock) => {
        // Extract fair values
        const dcfValue = stock.dcf?.fairValue?.toFixed(2) || 'N/A';
        const ddmValue = stock.ddm?.fairValue?.toFixed(2) || 'N/A';
        const peValue = stock.relativeValue?.peRatioFairValue?.toFixed(2) || 'N/A';
        const pbValue = stock.relativeValue?.pbRatioFairValue?.toFixed(2) || 'N/A';
        const psValue = stock.relativeValue?.psRatioFairValue?.toFixed(2) || 'N/A';
        const grahamValue = stock.graham?.fairValue?.toFixed(2) || 'N/A';

        // Calculate average fair value
        const validFairValues = [
          stock.dcf?.fairValue,
          stock.ddm?.fairValue,
          stock.relativeValue?.peRatioFairValue,
          stock.relativeValue?.pbRatioFairValue,
          stock.relativeValue?.psRatioFairValue,
          stock.graham?.fairValue,
        ].filter((v) => v !== null && v !== undefined && v > 0) as number[];

        const avgFairValue =
          validFairValues.length > 0
            ? (validFairValues.reduce((sum, v) => sum + v, 0) / validFairValues.length).toFixed(2)
            : 'N/A';

        // Format valuation status
        const statusMap: Record<string, string> = {
          undervalued: 'Undervalued',
          fairly_priced: 'Fairly Priced',
          overvalued: 'Overvalued',
        };

        const status = statusMap[stock.valuationStatus] || stock.valuationStatus;

        // Format calculated date
        const calculatedAt = new Date(stock.calculatedAt).toISOString();

        return [
          stock.ticker,
          stock.ticker, // Company name (ticker used as placeholder)
          stock.currentPrice.toFixed(2),
          dcfValue,
          ddmValue,
          peValue,
          pbValue,
          psValue,
          grahamValue,
          avgFairValue,
          status,
          calculatedAt,
        ];
      });

      // Combine headers and rows
      const csvLines = [headers, ...rows];

      // Convert to CSV format
      const csv = csvLines
        .map((row) =>
          row
            .map((cell) => {
              // Escape quotes and wrap in quotes if contains comma or quote
              const cellStr = String(cell);
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        )
        .join('\n');

      logger.info(`CSV generated successfully with ${data.length} rows`);

      return csv;
    } catch (error) {
      logger.error('Error generating CSV:', error);
      throw new Error('Failed to generate CSV export');
    }
  }

  /**
   * Generate PDF from fair value data
   * Requirements: 9.2, 9.3
   */
  async generatePDF(data: FairValueResult[]): Promise<Buffer> {
    try {
      logger.info(`Generating PDF for ${data.length} stocks`);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add branding header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Stockmeter', { align: 'center' })
          .moveDown(0.3);

        doc
          .fontSize(12)
          .font('Helvetica')
          .text('Fair Value Analysis Report', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
          .moveDown(1);

        // Add summary
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Summary', { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Total Stocks Analyzed: ${data.length}`)
          .moveDown(0.3);

        const undervaluedCount = data.filter((s) => s.valuationStatus === 'undervalued').length;
        const fairCount = data.filter((s) => s.valuationStatus === 'fairly_priced').length;
        const overvaluedCount = data.filter((s) => s.valuationStatus === 'overvalued').length;

        doc
          .text(`Undervalued: ${undervaluedCount}`)
          .text(`Fairly Priced: ${fairCount}`)
          .text(`Overvalued: ${overvaluedCount}`)
          .moveDown(1.5);

        // Add table header
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Detailed Analysis', { underline: true })
          .moveDown(0.5);

        // Table configuration
        const tableTop = doc.y;
        const colWidths = {
          ticker: 60,
          price: 60,
          dcf: 50,
          ddm: 50,
          pe: 50,
          graham: 50,
          avg: 60,
          status: 80,
        };

        const startX = 50;

        // Draw table header
        doc.fontSize(9).font('Helvetica-Bold');

        let currentX = startX;
        doc.text('Ticker', currentX, tableTop, { width: colWidths.ticker, align: 'left' });
        currentX += colWidths.ticker;

        doc.text('Price', currentX, tableTop, { width: colWidths.price, align: 'right' });
        currentX += colWidths.price;

        doc.text('DCF', currentX, tableTop, { width: colWidths.dcf, align: 'right' });
        currentX += colWidths.dcf;

        doc.text('DDM', currentX, tableTop, { width: colWidths.ddm, align: 'right' });
        currentX += colWidths.ddm;

        doc.text('P/E', currentX, tableTop, { width: colWidths.pe, align: 'right' });
        currentX += colWidths.pe;

        doc.text('Graham', currentX, tableTop, { width: colWidths.graham, align: 'right' });
        currentX += colWidths.graham;

        doc.text('Avg FV', currentX, tableTop, { width: colWidths.avg, align: 'right' });
        currentX += colWidths.avg;

        doc.text('Status', currentX, tableTop, { width: colWidths.status, align: 'left' });

        // Draw header line
        doc
          .moveTo(startX, tableTop + 15)
          .lineTo(startX + Object.values(colWidths).reduce((a, b) => a + b, 0), tableTop + 15)
          .stroke();

        // Draw table rows
        doc.fontSize(8).font('Helvetica');
        let currentY = tableTop + 20;

        for (const stock of data) {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          // Extract values
          const dcfValue = stock.dcf?.fairValue?.toFixed(2) || 'N/A';
          const ddmValue = stock.ddm?.fairValue?.toFixed(2) || 'N/A';
          const peValue = stock.relativeValue?.peRatioFairValue?.toFixed(2) || 'N/A';
          const grahamValue = stock.graham?.fairValue?.toFixed(2) || 'N/A';

          // Calculate average
          const validFairValues = [
            stock.dcf?.fairValue,
            stock.ddm?.fairValue,
            stock.relativeValue?.peRatioFairValue,
            stock.relativeValue?.pbRatioFairValue,
            stock.relativeValue?.psRatioFairValue,
            stock.graham?.fairValue,
          ].filter((v) => v !== null && v !== undefined && v > 0) as number[];

          const avgFairValue =
            validFairValues.length > 0
              ? (validFairValues.reduce((sum, v) => sum + v, 0) / validFairValues.length).toFixed(2)
              : 'N/A';

          // Format status
          const statusMap: Record<string, string> = {
            undervalued: 'Undervalued',
            fairly_priced: 'Fair',
            overvalued: 'Overvalued',
          };
          const status = statusMap[stock.valuationStatus] || stock.valuationStatus;

          // Draw row
          currentX = startX;
          doc.text(stock.ticker, currentX, currentY, { width: colWidths.ticker, align: 'left' });
          currentX += colWidths.ticker;

          doc.text(`$${stock.currentPrice.toFixed(2)}`, currentX, currentY, {
            width: colWidths.price,
            align: 'right',
          });
          currentX += colWidths.price;

          doc.text(dcfValue === 'N/A' ? dcfValue : `$${dcfValue}`, currentX, currentY, {
            width: colWidths.dcf,
            align: 'right',
          });
          currentX += colWidths.dcf;

          doc.text(ddmValue === 'N/A' ? ddmValue : `$${ddmValue}`, currentX, currentY, {
            width: colWidths.ddm,
            align: 'right',
          });
          currentX += colWidths.ddm;

          doc.text(peValue === 'N/A' ? peValue : `$${peValue}`, currentX, currentY, {
            width: colWidths.pe,
            align: 'right',
          });
          currentX += colWidths.pe;

          doc.text(grahamValue === 'N/A' ? grahamValue : `$${grahamValue}`, currentX, currentY, {
            width: colWidths.graham,
            align: 'right',
          });
          currentX += colWidths.graham;

          doc.text(avgFairValue === 'N/A' ? avgFairValue : `$${avgFairValue}`, currentX, currentY, {
            width: colWidths.avg,
            align: 'right',
          });
          currentX += colWidths.avg;

          doc.text(status, currentX, currentY, { width: colWidths.status, align: 'left' });

          currentY += 15;
        }

        // Add footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            'Disclaimer: This report is for informational purposes only and should not be considered investment advice.',
            50,
            750,
            { align: 'center', width: 500 }
          );

        // Finalize PDF
        doc.end();
      });
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF export');
    }
  }
}

export default ExportService;
