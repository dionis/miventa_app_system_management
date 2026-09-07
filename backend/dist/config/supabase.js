"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdmin = getSupabaseAdmin;
const supabase_js_1 = require("@supabase/supabase-js");
let supabaseAdmin;
function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
            throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Check backend/.env (see .env_example.txt).');
        }
        supabaseAdmin = (0, supabase_js_1.createClient)(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return supabaseAdmin;
}
//# sourceMappingURL=supabase.js.map