export interface SocialHandles {
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
}

export interface Contact {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  organization: string;
  website: string;
  address: string;
  avatar: string; // Base64 DataURL or empty
  socials: SocialHandles;
  createdAt?: string;
}

export interface SystemStatus {
  configured: boolean;
  mode: "database" | "memory";
  connected: boolean;
  dbName: string;
  error: string | null;
}
