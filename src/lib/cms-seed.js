/**
 * CMS Seeder — Imports all hardcoded data into Supabase CMS tables
 * Called from the Admin Dashboard "Import All Content" button
 */
import { supabase } from './supabase.js'

export async function seedAllContent(onProgress) {
  if (!supabase) throw new Error('Supabase not configured')
  
  const results = { listings: 0, deals: 0, sponsors: 0, discovery: 0, questions: 0, errors: [] }
  
  // ── 1. LISTINGS ──
  onProgress?.('Importing listings...')
  try {
    const { LISTINGS } = await import('../data/listings.jsx')
    for (const l of LISTINGS) {
      const row = {
        id: l.id,
        name: l.name,
        category: l.category,
        subcategory: l.subcategory || null,
        area: l.area || null,
        price_range: l.priceRange || null,
        rating: l.rating || 0,
        phone: l.phone || null,
        whatsapp: l.whatsapp || null,
        website: l.website || null,
        instagram: l.instagram || null,
        hours: l.hours || null,
        lat: l.lat || null,
        lng: l.lng || null,
        description: l.description || null,
        photos: l.photos || [],
        tags: l.tags || [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('cms_listings').upsert(row, { onConflict: 'id' })
      if (error) results.errors.push(`Listing ${l.id}: ${error.message}`)
      else results.listings++
    }
  } catch (e) { results.errors.push(`Listings import: ${e.message}`) }

  // ── 2. DEALS ──
  onProgress?.('Importing deals...')
  try {
    const { DEALS } = await import('../data/deals.js')
    for (const d of DEALS) {
      const row = {
        id: d.id,
        business: d.business || d.name || '',
        category: d.category || 'food',
        category_label: d.categoryLabel || d.category || '',
        location: d.location || '',
        lat: d.coords?.lat || d.lat || null,
        lng: d.coords?.lng || d.lng || null,
        offer: d.offer || '',
        mechanic: d.mechanic || 'show_screen',
        quest_unlock: d.questUnlock || null,
        description: d.description || null,
        expiry: d.expiry || null,
        badge: d.badge || null,
        color: d.color || null,
        sponsor: !!d.sponsor,
        featured: !!d.featured,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('cms_deals').upsert(row, { onConflict: 'id' })
      if (error) results.errors.push(`Deal ${d.id}: ${error.message}`)
      else results.deals++
    }
  } catch (e) { results.errors.push(`Deals import: ${e.message}`) }

  // ── 3. SPONSORS ──
  onProgress?.('Importing sponsors...')
  try {
    const { SPONSORS } = await import('../data/sponsors.js')
    for (const s of SPONSORS) {
      const row = {
        id: s.id,
        brand: s.brand || '',
        icon: s.icon || '',
        logo: s.logo || null,
        message: s.message || '',
        cta: s.cta || '',
        url: s.url || '',
        tier: s.tier || 'bronze',
        active: s.active !== false,
        question_ids: s.questionIds || [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('cms_sponsors').upsert(row, { onConflict: 'id' })
      if (error) results.errors.push(`Sponsor ${s.id}: ${error.message}`)
      else results.sponsors++
    }
  } catch (e) { results.errors.push(`Sponsors import: ${e.message}`) }

  // ── 4. DISCOVERY POIs ──
  onProgress?.('Importing discovery POIs...')
  try {
    const { DISCOVERY_POIS } = await import('../data/discovery.js')
    for (const p of DISCOVERY_POIS) {
      const row = {
        id: p.id,
        name: p.name || '',
        category: p.category || 'food',
        lat: p.lat || null,
        lng: p.lng || null,
        area: p.area || null,
        rating: p.rating || 0,
        description: p.description || null,
        cta: p.cta || null,
        map_url: p.mapUrl || null,
        sponsored: !!p.sponsored,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('cms_discovery').upsert(row, { onConflict: 'id' })
      if (error) results.errors.push(`Discovery ${p.id}: ${error.message}`)
      else results.discovery++
    }
  } catch (e) { results.errors.push(`Discovery import: ${e.message}`) }

  // ── 5. QUESTIONS ──
  onProgress?.('Importing quiz questions...')
  try {
    const QUESTIONS = (await import('../data/questions.js')).default
    for (const q of QUESTIONS) {
      const row = {
        id: q.id,
        category: q.category || '',
        category_label: q.categoryLabel || '',
        difficulty: q.difficulty || 'beginner',
        region: q.region || 'lagos',
        question: q.question || '',
        hint: q.hint || null,
        answer_lat: q.answer?.lat || null,
        answer_lng: q.answer?.lng || null,
        answer_name: q.answer?.name || '',
        answer_description: q.answer?.description || null,
        fun_fact: q.funFact || null,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('cms_questions').upsert(row, { onConflict: 'id' })
      if (error) results.errors.push(`Question ${q.id}: ${error.message}`)
      else results.questions++
    }
  } catch (e) { results.errors.push(`Questions import: ${e.message}`) }

  onProgress?.('Done!')
  return results
}
