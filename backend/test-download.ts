import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { Report } from './src/models/Report';
import { User } from './src/models/User';
import * as jwt from 'jsonwebtoken';
import * as http from 'http';

function generateToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
}

async function testDownloadRoute() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const user = await User.findOne({});
  if (!user) {
    console.log('No user');
    process.exit(1);
  }
  const token = generateToken({ id: user._id.toString(), role: user.role });

  const report = await Report.findOne({ userId: user._id });
  if (!report) {
    console.log('No report for this user');
    process.exit(1);
  }

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/reports/${report._id}/download`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let size = 0;
    res.on('data', (chunk) => {
      size += chunk.length;
    });
    
    res.on('end', () => {
      console.log(`Downloaded ${size} bytes`);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
  });

  req.end();
}

testDownloadRoute();
