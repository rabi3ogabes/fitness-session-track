
export interface Trainer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: string;
  gender?: string;
  created_at?: string;
}

export type TrainerFormData = Omit<Trainer, 'id' | 'created_at'>;
