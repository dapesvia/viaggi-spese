/**
 * Calculate how an expense amount is split between Alex and Tina.
 * Used by wallet-dashboard and stats pages.
 */
export function calculateSplit(
    amount: number,
    splitType: string,
    manualAlex: number = 0,
    manualTina: number = 0
): { alex: number; tina: number } {
    switch (splitType) {
        case 'me':
            return { alex: amount, tina: 0 };
        case 'partner':
            return { alex: 0, tina: amount };
        case '70-30':
            return { alex: amount * 0.7, tina: amount * 0.3 };
        case '60-40':
            return { alex: amount * 0.6, tina: amount * 0.4 };
        case 'custom':
            return { alex: manualAlex, tina: manualTina };
        case 'equal':
        default:
            return { alex: amount / 2, tina: amount / 2 };
    }
}
