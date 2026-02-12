// functions/src/index.ts
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Transaction } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";

initializeApp();
const db = getFirestore();

// ✅ Set your deployed region here (must match client getFunctions(app, region))
const REGION = "us-central1";

// ---------------------------------------------------------------------
// Turnstile (unchanged, but pinned to region)
// ---------------------------------------------------------------------
const TURNSTILE_SECRET = defineSecret("TURNSTILE_SECRET");

type VerifyTurnstileInput = {
  token: string;
  action?: string;
};

type VerifyTurnstileResult = {
  ok: boolean;
};

export const verifyTurnstile = onCall<VerifyTurnstileInput>(
  { region: REGION, secrets: [TURNSTILE_SECRET] },
  async (request): Promise<VerifyTurnstileResult> => {
    const token = request.data?.token;

    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "Missing Turnstile token.");
    }

    const secret = TURNSTILE_SECRET.value();
    if (!secret) {
      throw new HttpsError("failed-precondition", "TURNSTILE_SECRET not set.");
    }

    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);

    let data: any;
    try {
      const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      data = await resp.json();
    } catch (e) {
      console.error("Turnstile verification fetch failed:", e);
      throw new HttpsError("unavailable", "Turnstile verification unavailable.");
    }

    const success = data?.success === true;
    if (!success) {
      console.warn("Turnstile failed:", data);
      throw new HttpsError("permission-denied", "Turnstile challenge failed.");
    }

    return { ok: true };
  }
);

// ---------------------------------------------------------------------
// Pledges
// ---------------------------------------------------------------------
type CreatePledgeInput = {
  campaignId: string;
  amount: number;
};

type CreatePledgeResult = {
  pledgeId: string;
};

function walletRefFor(uid: string) {
  // ✅ NEW wallet location
  return db.collection("users").doc(uid).collection("wallet").doc("main");
}

function assertPositiveAmount(amount: any) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError("invalid-argument", "amount must be a positive number.");
  }
}

function assertCampaignId(campaignId: any) {
  if (!campaignId || typeof campaignId !== "string") {
    throw new HttpsError("invalid-argument", "campaignId is required.");
  }
}

// -------------------------
// LIVE pledge
// -------------------------
export const createLivePledge = onCall(
  { region: REGION },
  async (request: CallableRequest<CreatePledgeInput>): Promise<CreatePledgeResult> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

    const { campaignId, amount } = request.data || ({} as any);

    assertCampaignId(campaignId);
    assertPositiveAmount(amount);

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const walletRef = walletRefFor(uid);
    const pledgesRef = db.collection("pledges");

    const result = await db.runTransaction(async (tx: Transaction) => {
      const [campaignSnap, walletSnap] = await Promise.all([tx.get(campaignRef), tx.get(walletRef)]);

      if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

      const campaign = campaignSnap.data() as any;
      const status = String(campaign?.status ?? "").toLowerCase();
      const minInvestment = Number(campaign?.minInvestment ?? 0);
      const goal = Number(campaign?.goal ?? 0);
      const raised = Number(campaign?.raised ?? 0);

      if (status !== "active") {
        throw new HttpsError("failed-precondition", "Campaign is not active.");
      }

      if (Number.isFinite(minInvestment) && minInvestment > 0 && amount < minInvestment) {
        throw new HttpsError("failed-precondition", `Minimum investment is ${minInvestment}.`);
      }

      // Capacity check for live pledges only
      if (Number.isFinite(goal) && goal > 0) {
        const remaining = Math.max(0, goal - (Number.isFinite(raised) ? raised : 0));
        if (amount > remaining) {
          throw new HttpsError("failed-precondition", "Amount exceeds remaining capacity.");
        }
      }

      const walletData = walletSnap.exists ? (walletSnap.data() as any) : {};
      const liveBalance = Number(walletData?.liveBalance ?? 0);

      if (!Number.isFinite(liveBalance) || liveBalance < amount) {
        throw new HttpsError("failed-precondition", "Insufficient live balance.");
      }

      const pledgeDoc = pledgesRef.doc();
      tx.set(pledgeDoc, {
        campaignId,
        investorId: uid,
        amount,
        mode: "live",
        createdAt: FieldValue.serverTimestamp(),
        appliedToCampaign: false,
      });

      const newLive = liveBalance - amount; // already ensured >= 0
      tx.set(
        walletRef,
        {
          liveBalance: newLive,
          demoBalance: Number(walletData?.demoBalance ?? 0),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt:
            walletSnap.exists
              ? walletData?.createdAt ?? FieldValue.serverTimestamp()
              : FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { pledgeId: pledgeDoc.id };
    });

    return result;
  }
);

// -------------------------
// DEMO pledge
// -------------------------
export const createDemoPledge = onCall(
  { region: REGION },
  async (request: CallableRequest<CreatePledgeInput>): Promise<CreatePledgeResult> => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

    const { campaignId, amount } = request.data || ({} as any);

    assertCampaignId(campaignId);
    assertPositiveAmount(amount);

    const campaignRef = db.collection("campaigns").doc(campaignId);
    const walletRef = walletRefFor(uid);
    const pledgesRef = db.collection("pledges");

    const result = await db.runTransaction(async (tx: Transaction) => {
      const [campaignSnap, walletSnap] = await Promise.all([tx.get(campaignRef), tx.get(walletRef)]);

      if (!campaignSnap.exists) throw new HttpsError("not-found", "Campaign not found.");

      const campaign = campaignSnap.data() as any;
      const status = String(campaign?.status ?? "").toLowerCase();
      const minInvestment = Number(campaign?.minInvestment ?? 0);

      if (status !== "active") {
        throw new HttpsError("failed-precondition", "Campaign is not active.");
      }

      if (Number.isFinite(minInvestment) && minInvestment > 0 && amount < minInvestment) {
        throw new HttpsError("failed-precondition", `Minimum investment is ${minInvestment}.`);
      }

      const walletData = walletSnap.exists ? (walletSnap.data() as any) : {};
      const demoBalance = Number(walletData?.demoBalance ?? 0);

      if (!Number.isFinite(demoBalance) || demoBalance < amount) {
        throw new HttpsError("failed-precondition", "Insufficient demo balance.");
      }

      const pledgeDoc = pledgesRef.doc();
      tx.set(pledgeDoc, {
        campaignId,
        investorId: uid,
        amount,
        mode: "demo",
        createdAt: FieldValue.serverTimestamp(),
        appliedToCampaign: false,
      });

      const newDemo = demoBalance - amount;
      tx.set(
        walletRef,
        {
          demoBalance: newDemo,
          liveBalance: Number(walletData?.liveBalance ?? 0),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt:
            walletSnap.exists
              ? walletData?.createdAt ?? FieldValue.serverTimestamp()
              : FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { pledgeId: pledgeDoc.id };
    });

    return result;
  }
);

// -------------------------
// Trigger: apply pledge to campaign (live -> raised, demo -> demoRaised)
// -------------------------
export const applyPledgeToCampaignRaised = onDocumentCreated(
  { region: REGION, document: "pledges/{pledgeId}" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const pledge = snap.data() as any;

    const mode = String(pledge?.mode ?? "");
    const campaignId = String(pledge?.campaignId ?? "");
    const amount = Number(pledge?.amount ?? 0);

    if (!campaignId || !Number.isFinite(amount) || amount <= 0) return;
    if (mode !== "live" && mode !== "demo") return;

    const pledgeRef = snap.ref;
    const campaignRef = db.collection("campaigns").doc(campaignId);

    await db.runTransaction(async (tx) => {
      const [pledgeSnap, campaignSnap] = await Promise.all([tx.get(pledgeRef), tx.get(campaignRef)]);
      if (!pledgeSnap.exists || !campaignSnap.exists) return;

      const latest = pledgeSnap.data() as any;
      if (latest?.appliedToCampaign) return;

      const incField = mode === "live" ? "raised" : "demoRaised";

      tx.update(campaignRef, {
        [incField]: FieldValue.increment(amount), // ✅ creates demoRaised if missing
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(pledgeRef, {
        appliedToCampaign: true,
        appliedAt: FieldValue.serverTimestamp(),
      });
    });
  }
);
