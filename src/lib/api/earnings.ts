import type { EarningsEntry, EarningsSummary } from "@/types/earnings";
import { mockRequest } from "./client";

export const currentEarnings: EarningsSummary = {
  payable: 171750,
  held: 12750,
  refunded: 0,
  creditsBalance: 48,
  period: "this month",
};

export const earningsEntries: EarningsEntry[] = [
  { id: "e1", kind: "dm", label: "Paid message from Ada", amount: 300, held: "held", date: "Today" },
  { id: "e2", kind: "dm", label: "Paid message from Musa", amount: 300, held: "held", date: "Yesterday" },
  { id: "e3", kind: "credit", label: "Credits earned on 12 messages", amount: 48, held: "held", date: "2 days ago" },
];

export interface EarningsApi {
  getSummary: () => Promise<EarningsSummary>;
  getEntries: () => Promise<EarningsEntry[]>;
}

export const earningsApi: EarningsApi = {
  getSummary: () => mockRequest({ ...currentEarnings }),
  getEntries: () => mockRequest([...earningsEntries]),
};
