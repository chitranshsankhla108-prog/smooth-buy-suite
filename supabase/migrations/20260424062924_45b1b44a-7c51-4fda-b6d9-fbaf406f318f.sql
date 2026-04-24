DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dealer' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'dealer';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealer_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.dealer_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;