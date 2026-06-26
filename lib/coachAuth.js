import { getSupabase } from './supabase';

export const validateCoachPasscode = async (passcode) => {
  if (!passcode) return null;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('coaches')
    .select('id, name')
    .eq('passcode', passcode)
    .maybeSingle();
  return data || null;
};
