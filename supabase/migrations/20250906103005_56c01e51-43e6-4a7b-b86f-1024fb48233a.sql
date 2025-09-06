-- Create membership_types table
CREATE TABLE public.membership_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sessions INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;

-- Create policies for membership types
CREATE POLICY "Anyone can view active membership types" 
ON public.membership_types 
FOR SELECT 
USING (active = true);

CREATE POLICY "Authenticated users can manage membership types" 
ON public.membership_types 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert default membership types
INSERT INTO public.membership_types (name, sessions, price, description) VALUES
('Basic', 12, 80, 'Perfect for trying out our gym facilities and classes'),
('Standard', 20, 95, 'Great for regular gym-goers who want flexibility'),
('Premium', 30, 120, 'Our most popular plan with unlimited access');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_membership_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_membership_types_updated_at
BEFORE UPDATE ON public.membership_types
FOR EACH ROW
EXECUTE FUNCTION public.update_membership_types_updated_at();