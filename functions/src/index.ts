// functions/src/index.ts
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Transaction } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

type CreateLivePledgeInput = {
  campaignId: string;
  amount: number;
};

type CreateLivePledgeResult = {
  pledgeId: string;
};

// 1) Callable: creates pledge + updates wallet (NOT campaign.raised)
// Campaign.raised will be updated by trigger below (always consistent)
export const createLivePledge = onCall(
  async (request: CallableRequest<CreateLivePledgeInput>): Promise<CreateLivePledgeResult> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

    const { campaignId, amount } = request.data || ({} as any);

    if (!campaignId || typeof campaignId !== "string") {
      throw new HttpsError("invalid-argument", "campaignId is required.");
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError("invalid-argument", "amount must be a positive number.");
    }

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const walletRef = db.collection("wallets").doc(uid);
    const pledgesRef = db.collection("pledges");

    const result = await db.runTransaction(async (tx: Transaction) => {
      const [campaignSnap, walletSnap] = await Promise.all([
        tx.get(campaignRef),
        tx.get(walletRef),
      ]);

      if (!campaignSnap.exists) {
        throw new HttpsError("not-found", "Campaign not found.");
      }

      const campaign = campaignSnap.data() as any;
      const minInvestment = Number(campaign?.minInvestment ?? 0);

      if (minInvestment && amount < minInvestment) {
        throw new HttpsError("failed-precondition", `Minimum investment is ${minInvestment}.`);
      }

      // Wallet
      const walletData = walletSnap.exists ? (walletSnap.data() as any) : null;
      const balance = Number(walletData?.liveBalance ?? 0);

      if (balance < amount) {
        throw new HttpsError("failed-precondition", "Insufficient live balance.");
      }

      // Create pledge doc
      const pledgeDoc = pledgesRef.doc();
      tx.set(pledgeDoc, {
        campaignId,
        investorId: uid,
        amount,
        mode: "live",
        createdAt: FieldValue.serverTimestamp(),

        // idempotency flags for triggers
        appliedToCampaign: false,
      });

      // Update wallet balance
      const newWallet = balance - amount;

      if (walletSnap.exists) {
        tx.update(walletRef, {
          liveBalance: newWallet,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(walletRef, {
          liveBalance: newWallet,
          demoBalance: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { pledgeId: pledgeDoc.id };
    });

    return result;
  }
);

// 2) Trigger: whenever a pledge is created, increment campaign.raised exactly once
export const applyPledgeToCampaignRaised = onDocumentCreated(
  "pledges/{pledgeId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const pledge = snap.data() as any;

    // only count live pledges
    if (pledge?.mode !== "live") return;

    const campaignId = String(pledge?.campaignId ?? "");
    const amount = Number(pledge?.amount ?? 0);
    const alreadyApplied = Boolean(pledge?.appliedToCampaign);

    if (!campaignId || !Number.isFinite(amount) || amount <= 0) return;
    if (alreadyApplied) return; // idempotent

    const pledgeRef = snap.ref;
    const campaignRef = db.collection("campaigns").doc(campaignId);

    await db.runTransaction(async (tx) => {
      const [pledgeSnap, campaignSnap] = await Promise.all([
        tx.get(pledgeRef),
        tx.get(campaignRef),
      ]);

      if (!pledgeSnap.exists) return;
      const latest = pledgeSnap.data() as any;

      // Re-check inside transaction
      if (latest?.appliedToCampaign) return;
      if (!campaignSnap.exists) return;

      tx.update(campaignRef, {
        raised: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(pledgeRef, {
        appliedToCampaign: true,
        appliedAt: FieldValue.serverTimestamp(),
      });
    });
  }
);
