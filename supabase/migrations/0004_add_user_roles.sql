-- Add role and barber_id columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'barber' CHECK (role IN ('admin', 'barber')),
ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers(id);

-- Update existing users to have barber role (if any exist)
UPDATE public.users SET role = 'barber' WHERE role IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_barber_id ON public.users(barber_id);

