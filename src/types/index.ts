export interface UserDoc {
  uid: string;
  role: "investor" | "business" | "admin";
  displayName: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  about?: string;
  isAdmin?: boolean;
  createdAt: any;
}

export interface Business {
  id?: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  coords?: { lat: number; lng: number };
  category: string;
  verified: boolean;
  createdAt: any;
}

export interface Campaign {
  id?: string;
  businessId: string;
  title: string;
  description: string;
  goal: number;
  apr: number;
  termMonths: number;
  risk: string;
  category: string;
  image?: string;
  pledged: number;
  raised: number;
  createdAt: any;
  status: "active" | "closed";
}

export interface Pledge {
  id?: string;
  campaignId: string;
  investorId: string;
  amount: number;
  createdAt: any;
}
