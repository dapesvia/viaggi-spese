import { Trip, Expense } from './supabase';
import { calculateSplit } from './split-utils';

export function calculateGlobalBalance(trips: Trip[], expenses: Expense[]): number {
    let globalAlexPaid = 0;
    let globalAlexConsumed = 0;

    // 1. Trips Costs
    trips.forEach(trip => {
        const tripCost = trip.budget || 0;
        const tripPayer = trip.cost_payer || 'split';
        const tripCostPerPerson = tripCost / 2;

        if (tripPayer === 'alex') {
            globalAlexPaid += tripCost;
        } else if (tripPayer === 'split') {
            globalAlexPaid += tripCostPerPerson;
        } else if (tripPayer === 'custom') {
            globalAlexPaid += (trip.cost_split_manual_alex || 0);
        }

        globalAlexConsumed += tripCostPerPerson;
    });

    // 2. Expenses
    expenses.forEach(e => {
        const amount = e.amount_in_eur;
        const payer = e.payer || (e.split_type === 'partner' ? 'tina' : 'alex');

        if (payer === 'alex') globalAlexPaid += amount;

        const split = calculateSplit(amount, e.split_type, e.split_manual_alex, e.split_manual_tina);
        globalAlexConsumed += split.alex;
    });

    return globalAlexPaid - globalAlexConsumed;
}
