// Commission calculation helpers
// Used in property detail and anywhere commission splits are displayed.

export interface PartnerCommissionInfo {
  commission_type: string | null
  commission_value: number | null
}

/**
 * Calculate commission figures for a property.
 *
 * @param price            Listing price in €
 * @param commissionPct    Our commission percentage (e.g. 5 for 5%)
 * @param partner          Optional partner with their commission model
 */
export function calcCommission(
  price: number | null,
  commissionPct: number | null,
  partner?: PartnerCommissionInfo | null,
): { gross: number; partnerAmount: number; net: number } {
  const gross =
    price != null && commissionPct != null
      ? price * (commissionPct / 100)
      : 0;

  let partnerAmount = 0;
  if (partner && gross > 0) {
    if (partner.commission_type === 'percent' && partner.commission_value != null) {
      partnerAmount = gross * (partner.commission_value / 100);
    } else if (partner.commission_type === 'fixed' && partner.commission_value != null) {
      partnerAmount = partner.commission_value;
    }
  }

  const net = gross - partnerAmount;
  return { gross, partnerAmount, net };
}
