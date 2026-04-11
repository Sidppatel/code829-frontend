export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  totalSeats?: number | string;
  isActive: boolean;
  createdAt: string;
}
