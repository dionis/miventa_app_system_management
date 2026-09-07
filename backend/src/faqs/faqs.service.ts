import { Injectable, NotFoundException } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqsService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async findAllPublished() {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  async create(dto: CreateFaqDto) {
    const { data, error } = await this.supabase
      .from('faqs')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateFaqDto) {
    const { data, error } = await this.supabase
      .from('faqs')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new NotFoundException('FAQ not found');
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.from('faqs').delete().eq('id', id);

    if (error) throw error;
    return { deleted: true };
  }
}
