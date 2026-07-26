import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { env } from '../config/env';

/**
 * Drop the old index and recreate with the correct compound index
 */
export async function fixCategoryIndex(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.collection('categories');

    // Drop the old index
    console.log('Dropping old index userId_1_name_1...');
    await collection.dropIndex('userId_1_name_1');
    console.log('Old index dropped successfully');

    // The new index will be created automatically when the model is loaded
    console.log('New index will be created automatically on next application start');
    console.log('Please restart your backend server');
  } catch (error: any) {
    if (error.code === 26) {
      console.log('Index not found, may have already been dropped');
    } else {
      console.error('Error fixing index:', error);
      throw error;
    }
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  fixCategoryIndex()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
