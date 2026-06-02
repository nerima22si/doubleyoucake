import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
    "https://rxynsbtwrmhoxntklzhm.supabase.co";

const supabaseKey =
    "sb_publishable_8hrtWldziAo12MUkBBUs_w_rziYqVXp";

export const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );