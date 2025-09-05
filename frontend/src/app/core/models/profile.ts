export interface Profile {
  id?: number;
  userId?: number;
  name: string;
  ntncnic: string;
  businessName: string;
  province: string;
  address: string;
  registrationType: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
