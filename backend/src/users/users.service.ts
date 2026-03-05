import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';

@Injectable()
export class UsersService {
    private get supabase() {
        return getSupabaseAdmin();
    }

    async findAll(page = 1, limit = 20, search?: string) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = this.supabase
            .from('profiles')
            .select('*, subscriptions(*, plans(name))', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;

        // Also fetch emails from auth.users via admin API
        const enrichedData = await Promise.all(
            (data || []).map(async (profile) => {
                const { data: { user } } = await this.supabase.auth.admin.getUserById(profile.id);
                return { ...profile, email: user?.email };
            }),
        );

        return { data: enrichedData, total: count, page, limit };
    }

    async findOne(id: string) {
        const { data: profile, error } = await this.supabase
            .from('profiles')
            .select('*, subscriptions(*, plans(name))')
            .eq('id', id)
            .single();

        if (error) throw error;

        const { data: { user } } = await this.supabase.auth.admin.getUserById(id);
        return { ...profile, email: user?.email };
    }
}
