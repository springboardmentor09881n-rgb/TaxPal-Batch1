import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { Report } from './src/models/Report';
import { User } from './src/models/User';
import { ReportService } from './src/services/report.service';

async function testAllReports() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const reports = await Report.find({});
  console.log(`Found ${reports.length} reports in the DB.`);

  for (const report of reports) {
    try {
      console.log(`Testing report ${report._id} of type ${report.reportType}...`);
      if (report.format === 'CSV') {
        const csv = ReportService.generateCSV(report as any);
        console.log(`- CSV generated. Length: ${csv.length}`);
      } else {
        const pdf = await ReportService.generatePDF(report as any, 'Test User');
        console.log(`- PDF generated. Length: ${pdf.length}`);
      }
    } catch (e: any) {
      console.error(`- Error on report ${report._id}:`, e.message);
    }
  }

  process.exit(0);
}

testAllReports();
