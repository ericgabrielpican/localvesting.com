// src/services/reviews.ts
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Review, mapReview } from "../types/entities";

const reviewsCol = collection(db, "reviews");

export async function listReviews(): Promise<Review[]> {
  const snap = await getDocs(reviewsCol);
  return snap.docs.map(mapReview);
}

export async function listReviewsForCampaign(
  campaignId: string
): Promise<Review[]> {
  const q = query(reviewsCol, where("campaign_id", "==", campaignId));
  const snap = await getDocs(q);
  return snap.docs.map(mapReview);
}

export async function addReview(params: {
  campaignId: string;
  userEmail: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { campaignId, userEmail, rating, comment } = params;
  await addDoc(reviewsCol, {
    campaign_id: campaignId,
    user_email: userEmail,
    rating,
    comment,
    created_at: serverTimestamp(),
  });
}
