import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { env } from '../config/env';

/**
 * Add missing 'Other' income category for a specific user
 */
export async function addMissingOtherIncomeCategory(email: string): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`Processing user: ${user.email}`);

    // Check if user already has 'Other' income category
    const existingOtherIncomeCategory = await Category.findOne({
      userId: user._id,
      name: 'Other',
      type: 'income'
    });

    if (existingOtherIncomeCategory) {
      console.log(`User ${user.email} already has 'Other' income category. Skipping.`);
      return;
    }

    // Create the 'Other' income category
    await Category.create({
      userId: user._id,
      name: 'Other',
      type: 'income',
      color: '#6b7280',
      icon: 'more-horizontal',
      isDefault: true
    });

    console.log(`Added 'Other' income category for user: ${user.email}`);
  } catch (error) {
    console.error('Error adding missing category:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Add missing 'Other' income category for all users who don't have it
 */
export async function addMissingOtherIncomeCategoryForAllUsers(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);

      // Check if user already has 'Other' income category
      const existingOtherIncomeCategory = await Category.findOne({
        userId: user._id,
        name: 'Other',
        type: 'income'
      });

      if (existingOtherIncomeCategory) {
        console.log(`User ${user.email} already has 'Other' income category. Skipping.`);
        skippedCount++;
        continue;
      }

      // Create the 'Other' income category
      await Category.create({
        userId: user._id,
        name: 'Other',
        type: 'income',
        color: '#6b7280',
        icon: 'more-horizontal',
        isDefault: true
      });

      console.log(`Added 'Other' income category for user: ${user.email}`);
      addedCount++;
    }

    console.log(`Migration completed. Added: ${addedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error adding missing categories:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const email = args[0];

  if (email) {
    console.log(`Adding 'Other' income category for user: ${email}`);
    addMissingOtherIncomeCategory(email)
      .then(() => {
        console.log('Done');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Adding missing \'Other\' income category for all users');
    addMissingOtherIncomeCategoryForAllUsers()
      .then(() => {
        console.log('Done');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
      });
  }
}
