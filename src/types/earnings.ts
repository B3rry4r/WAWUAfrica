export type HeldStatus = "payable" | "held" | "refunded";

export interface EarningsSummary {
  /** Amount earned and payable (KYC approved). */
  payable: number;
  /** Amount earned but held while KYC is pending or unverified. */
  held: number;
  /** Amount returned to buyers within the 24h DM window. */
  refunded: number;
  creditsBalance: number;
  period: string;
}

export interface EarningsEntry {
  id: string;
  kind: "dm" | "sale" | "credit";
  label: string;
  amount: number;
  held: HeldStatus;
  date: string;
}
