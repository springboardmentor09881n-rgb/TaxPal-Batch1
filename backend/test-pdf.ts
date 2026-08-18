import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { ReportService } from './src/services/report.service';
import { Report } from './src/models/Report';

async function testPdf() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  // get a random report
  const report = await Report.findOne({});
  if (!report) {
    console.log('No report found');
    process.exit(0);
  }

  try {
    const pdfBuffer = await ReportService.generatePDF(report as any, 'Test User');
    console.log(`PDF generated successfully. Buffer length: ${pdfBuffer.length}`);
  } catch (err: any) {
    console.log(`PDF generation failed:`, err.message);
    console.log(err.stack);
  }

  process.exit(0);
}

testPdf();
