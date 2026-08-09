export type ReceiptStatus = 'pendent' | 'pagat' | 'vencut' | 'anullat'

// due_date comes back from Postgres as 'YYYY-MM-DD', which sorts/compares
// lexicographically the same as chronologically.
export function isOverdue(status: string, dueDate: string): boolean {
  return status === 'pendent' && dueDate < new Date().toISOString().slice(0, 10)
}
