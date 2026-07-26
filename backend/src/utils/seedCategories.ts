import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { env } from '../config/env';

/**
 * Seed default categories for all existing users
 * This script ensures all users have the default expense and income categories
 */
export async function seedCategoriesForAllUsers(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    const defaultExpenseCategories = [
      { name: 'Office Supplies', color: '#3b82f6', icon: 'briefcase' },
      { name: 'Software/SaaS', color: '#8b5cf6', icon: 'cpu' },
      { name: 'Hardware/Gadgets', color: '#ec4899', icon: 'monitor' },
      { name: 'Travel/Meals', color: '#f59e0b', icon: 'plane' },
      { name: 'Marketing/Ads', color: '#ef4444', icon: 'megaphone' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    const defaultIncomeCategories = [
      { name: 'Freelance Project', color: '#10b981', icon: 'briefcase' },
      { name: 'Consulting', color: '#06b6d4', icon: 'users' },
      { name: 'Contract Work', color: '#8b5cf6', icon: 'file-text' },
      { name: 'Royalties', color: '#f59e0b', icon: 'gift' },
      { name: 'Ad Revenue', color: '#ef4444', icon: 'trending-up' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    for (const user of users) {
      console.log(`Processing user: ${user.email}`);

      // Check if user already has categories
      const existingCategories = await Category.find({ userId: user._id });
      
      if (existingCategories.length > 0) {
        console.log(`User ${user.email} already has ${existingCategories.length} categories. Skipping.`);
        continue;
      }

      // Create default expense categories
      for (const cat of defaultExpenseCategories) {
        await Category.create({
          userId: user._id,
          name: cat.name,
          type: 'expense',
          color: cat.color,
          icon: cat.icon,
          isDefault: true
        });
      }

      // Create default income categories
      for (const cat of defaultIncomeCategories) {
        await Category.create({
          userId: user._id,
          name: cat.name,
          type: 'income',
          color: cat.color,
          icon: cat.icon,
          isDefault: true
        });
      }

      console.log(`Created default categories for user: ${user.email}`);
    }

    console.log('Category seeding completed successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Seed categories for a specific user by email
 */
export async function seedCategoriesForUser(email: string): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    console.log(`Processing user: ${user.email}`);

    // Check if user already has categories
    const existingCategories = await Category.find({ userId: user._id });
    
    if (existingCategories.length > 0) {
      console.log(`User ${user.email} already has ${existingCategories.length} categories. Skipping.`);
      return;
    }

    const defaultExpenseCategories = [
      { name: 'Office Supplies', color: '#3b82f6', icon: 'briefcase' },
      { name: 'Software/SaaS', color: '#8b5cf6', icon: 'cpu' },
      { name: 'Hardware/Gadgets', color: '#ec4899', icon: 'monitor' },
      { name: 'Travel/Meals', color: '#f59e0b', icon: 'plane' },
      { name: 'Marketing/Ads', color: '#ef4444', icon: 'megaphone' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    const defaultIncomeCategories = [
      { name: 'Freelance Project', color: '#10b981', icon: 'briefcase' },
      { name: 'Consulting', color: '#06b6d4', icon: 'users' },
      { name: 'Contract Work', color: '#8b5cf6', icon: 'file-text' },
      { name: 'Royalties', color: '#f59e0b', icon: 'gift' },
      { name: 'Ad Revenue', color: '#ef4444', icon: 'trending-up' },
      { name: 'Other', color: '#6b7280', icon: 'more-horizontal' }
    ];

    // Create default expense categories
    for (const cat of defaultExpenseCategories) {
      await Category.create({
        userId: user._id,
        name: cat.name,
        type: 'expense',
        color: cat.color,
        icon: cat.icon,
        isDefault: true
      });
    }

    // Create default income categories
    for (const cat of defaultIncomeCategories) {
      await Category.create({
        userId: user._id,
        name: cat.name,
        type: 'income',
        color: cat.color,
        icon: cat.icon,
        isDefault: true
      });
    }

    console.log(`Created default categories for user: ${user.email}`);
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const email = args[0];

  if (email) {
    console.log(`Seeding categories for user: ${email}`);
    seedCategoriesForUser(email)
      .then(() => {
        console.log('Done');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Seeding categories for all users');
    seedCategoriesForAllUsers()
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
