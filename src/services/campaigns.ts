// src/services/campaigns.ts
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Campaign, mapCampaign } from "../types/entities";

const campaignsCol = collection(db, "campaigns");

export async function listCampaigns(): Promise<Campaign[]> {
  const q = query(campaignsCol, orderBy("created_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(mapCampaign);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const ref = doc(campaignsCol, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapCampaign(snap);
}

export async function listCampaignsByCity(city: string): Promise<Campaign[]> {
  const q = query(campaignsCol, where("city", "==", city));
  const snap = await getDocs(q);
  return snap.docs.map(mapCampaign);
}
