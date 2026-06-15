-- Create insights_cache table
CREATE TABLE IF NOT EXISTS public.insights_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  insight_text text NOT NULL,
  generated_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, generated_date)
);

-- Enable RLS
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own cached insights"
  ON public.insights_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached insights"
  ON public.insights_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached insights"
  ON public.insights_cache FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
