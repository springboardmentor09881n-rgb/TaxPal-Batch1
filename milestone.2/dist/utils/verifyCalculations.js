"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const categorySuggester_1 = require("./categorySuggester");
const mockTransactions = [
    { id: 1, userId: 1, description: 'Uber ride', amount: 50, type: 'EXPENSE', category: 'Transport', date: new Date('2026-07-15') },
    { id: 2, userId: 1, description: 'Fuel', amount: 150, type: 'EXPENSE', category: 'Transport', date: new Date('2026-07-16') },
    { id: 3, userId: 1, description: 'Coffee', amount: 10, type: 'EXPENSE', category: 'Food', date: new Date('2026-07-10') },
    { id: 4, userId: 1, description: 'Restaurant', amount: 120, type: 'EXPENSE', category: 'Food', date: new Date('2026-07-11') },
    { id: 5, userId: 1, description: 'Salary', amount: 5000, type: 'INCOME', category: 'Income', date: new Date('2026-07-01') },
    { id: 6, userId: 1, description: 'Internet bill', amount: 80, type: 'EXPENSE', category: 'Utilities', date: new Date('2026-07-05') },
    { id: 7, userId: 1, description: 'Electricity bill', amount: 120, type: 'EXPENSE', category: 'Utilities', date: new Date('2026-07-06') },
];
const mockBudgets = [
    { id: 1, userId: 1, category: 'Food', limit: 300, month: '2026-07' },
    { id: 2, userId: 1, category: 'Transport', limit: 200, month: '2026-07' },
    { id: 3, userId: 1, category: 'Utilities', limit: 150, month: '2026-07' },
];
console.log('=== TaxPal Backend offline logic validation ===');
// 1. Suggestion matching tests
const testSuggestions = [
    { desc: 'Uber ride to client meeting', expected: 'Transport' },
    { desc: 'Coffee at Starbucks', expected: 'Food' },
    { desc: 'monthly Internet payment', expected: 'Utilities' },
    { desc: 'monthly Client Payment', expected: 'Income' },
    { desc: 'Lunch at a restaurant', expected: 'Food' },
    { desc: 'Gasoline for delivery truck', expected: 'Other' }, // doesn't match 'fuel', 'uber', 'taxi' literally
    { desc: 'fuel cost', expected: 'Transport' },
];
console.log('\n1. Testing Category Suggestions:');
for (const test of testSuggestions) {
    const result = (0, categorySuggester_1.suggestCategory)(test.desc);
    const status = result === test.expected ? 'PASSED' : 'FAILED';
    console.log(`- Description: "${test.desc}" => Category: "${result}" [${status}]`);
}
// 2. Budget progress logic check
console.log('\n2. Testing Budget Progress Calculations:');
const spentByCategory = {};
for (const tx of mockTransactions) {
    if (tx.type === 'EXPENSE') {
        const key = tx.category.toLowerCase();
        spentByCategory[key] = (spentByCategory[key] || 0) + tx.amount;
    }
}
const progress = mockBudgets.map((b) => {
    const spent = spentByCategory[b.category.toLowerCase()] || 0;
    return {
        category: b.category,
        limit: b.limit,
        spent,
        remaining: b.limit - spent,
        percentageUsed: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
    };
});
console.table(progress);
// 3. Chart data grouping check
console.log('\n3. Testing Spending Breakdown Chart Data:');
const labels = Object.keys(spentByCategory).map((k) => k.charAt(0).toUpperCase() + k.slice(1));
const values = Object.values(spentByCategory);
console.log('Labels:', labels);
console.log('Values:', values);
//# sourceMappingURL=verifyCalculations.js.map