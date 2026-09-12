import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import * as bcrypt from 'bcrypt';

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
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    // Strip password_hash + verification token from response
    const cleanData = (data || []).map(
      ({ password_hash, email_verification_token, ...rest }) => rest,
    );

    return { data: cleanData, total: count, page, limit };
  }

  async findOne(id: string) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*, subscriptions(*, plans(name))')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { password_hash, email_verification_token, ...cleanProfile } =
      profile;
    return cleanProfile;
  }

  async findByEmail(email: string) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return profile;
  }

  async create(userData: any) {
    const {
      email,
      password,
      full_name,
      company,
      phone,
      secondary_phone,
      email_verified,
      email_verification_token,
      email_verification_expires,
    } = userData;

    // Hash password before saving
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await this.supabase
      .from('profiles')
      .insert([
        {
          email,
          password_hash,
          full_name,
          company: company ?? null,
          phone: phone ?? null,
          secondary_phone: secondary_phone ?? null,
          email_verified: email_verified ?? false,
          email_verification_token: email_verification_token ?? null,
          email_verification_expires: email_verification_expires ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const {
      password_hash: _hash,
      email_verification_token: _tok,
      ...cleanProfile
    } = data;
    return cleanProfile;
  }
}
