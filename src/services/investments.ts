// src/services/investments.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const investmentsCol = collection(db, "investments");

export async function createInvestment(params: {
  campaignId: string;
  amount: number;
  userEmail: string;
}): Promise<void> {
  const { campaignId, amount, userEmail } = params;
  await addDoc(investmentsCol, {
    campaign_id: campaignId,
    user_email: userEmail,
    amount,
    created_at: serverTimestamp(),
  });
}
