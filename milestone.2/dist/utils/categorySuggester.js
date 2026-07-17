"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestCategory = void 0;
/**
 * Simple keyword-based category suggestion engine
 * @param description Transaction description
 * @returns Suggested category name
 */
const suggestCategory = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('uber') || desc.includes('fuel') || desc.includes('taxi')) {
        return 'Transport';
    }
    if (desc.includes('coffee') || desc.includes('restaurant')) {
        return 'Food';
    }
    if (desc.includes('internet') || desc.includes('electricity')) {
        return 'Utilities';
    }
    if (desc.includes('salary') || desc.includes('client payment')) {
        return 'Income';
    }
    return 'Other';
};
exports.suggestCategory = suggestCategory;
//# sourceMappingURL=categorySuggester.js.map