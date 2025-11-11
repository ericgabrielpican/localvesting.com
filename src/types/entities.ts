// src/types/entities.ts
import { Timestamp } from "firebase/firestore";

export interface Business {
  id: string;
  owner_email: string;
  business_name: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  verified: boolean;
  created_at?: Date | null;
}

export interface Campaign {
  id: string;
  business_id: string;
  business_name: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  funding_goal: number;
  current_funding: number;
  min_investment: number;
  deadline?: Date | null;
  status: "active" | "completed" | "cancelled";
  risk_profile: "low" | "medium" | "high" | string;
  created_date?: Date | null;
}

export interface Review {
  id: string;
  campaign_id: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at?: Date | null;
}

export interface Investment {
  id: string;
  campaign_id: string;
  user_email: string;
  amount: number;
  created_at?: Date | null;
}

export interface VerificationRequest {
  id: string;
  business_id: string;
  owner_email: string;
  status: "pending" | "approved" | "rejected";
  created_at?: Date | null;
  reviewed_at?: Date | null;
}

function tsToDate(ts?: Timestamp | null): Date | null {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : null;
}

// mappers from Firestore docs to typed entities
export const mapBusiness = (doc: any): Business => {
  const data = doc.data();
  return {
    id: doc.id,
    owner_email: data.owner_email,
    business_name: data.business_name,
    description: data.description,
    category: data.category,
    address: data.address,
    city: data.city,
    country: data.country,
    verified: data.verified ?? false,
    created_at: tsToDate(data.created_at),
  };
};

export const mapCampaign = (doc: any): Campaign => {
  const data = doc.data();
  return {
    id: doc.id,
    business_id: data.business_id,
    business_name: data.business_name,
    title: data.title,
    description: data.description,
    category: data.category,
    city: data.city,
    funding_goal: data.funding_goal ?? 0,
    current_funding: data.current_funding ?? 0,
    min_investment: data.min_investment ?? 0,
    deadline: tsToDate(data.deadline),
    status: data.status ?? "active",
    risk_profile: data.risk_profile ?? "medium",
    created_date: tsToDate(data.created_date),
  };
};

export const mapReview = (doc: any): Review => {
  const data = doc.data();
  return {
    id: doc.id,
    campaign_id: data.campaign_id,
    user_email: data.user_email,
    rating: data.rating,
    comment: data.comment,
    created_at: tsToDate(data.created_at),
  };
};

export const mapInvestment = (doc: any): Investment => {
  const data = doc.data();
  return {
    id: doc.id,
    campaign_id: data.campaign_id,
    user_email: data.user_email,
    amount: data.amount,
    created_at: tsToDate(data.created_at),
  };
};

export const mapVerificationRequest = (doc: any): VerificationRequest => {
  const data = doc.data();
  return {
    id: doc.id,
    business_id: data.business_id,
    owner_email: data.owner_email,
    status: data.status ?? "pending",
    created_at: tsToDate(data.created_at),
    reviewed_at: tsToDate(data.reviewed_at),
  };
};
