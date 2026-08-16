import { ZapTransaction } from '../types';

export const ARCHITECT_LIGHTNING_ADDRESS = 'architect@projectvoice.foundation';
export const ARCHITECT_FEE_PERCENT = 0.05; // 5% protocol fee

/**
 * Creates a simulated Lightning Zap Invoice (NIP-57 compliant)
 */
export function createZapInvoice(
  eventId: string,
  recipientPubkey: string,
  senderPubkey: string,
  amountSats: number
): ZapTransaction {
  const protocolFeeSats = Math.max(1, Math.round(amountSats * ARCHITECT_FEE_PERCENT));
  const invoiceId = `zap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const bolt11Invoice = `lnbc${amountSats}n1p39${invoiceId}x8922001k934a11200000000000000000`;

  return {
    id: invoiceId,
    eventId,
    senderPubkey,
    recipientPubkey,
    amountSats,
    protocolFeeSats,
    feeAddress: ARCHITECT_LIGHTNING_ADDRESS,
    timestamp: Date.now(),
    bolt11Invoice,
    status: 'pending',
  };
}

/**
 * Simulates settlement of Lightning Zap transaction across Lightning Network
 */
export async function executeZapPayment(zap: ZapTransaction): Promise<ZapTransaction> {
  // Simulate Lightning routing network delay
  await new Promise(r => setTimeout(r, 600));
  return {
    ...zap,
    status: 'settled',
  };
}
