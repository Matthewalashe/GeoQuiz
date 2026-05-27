import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim()
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim()

const supabase = createClient(url, key)

async function run() {
  const { data: listings, error } = await supabase.from('cms_listings').select('*')
  if (error) {
    console.error(error)
    return
  }
  const invalid = listings.filter(l => !l.lat || !l.lng || isNaN(parseFloat(l.lat)) || isNaN(parseFloat(l.lng)))
  console.log(`Found ${invalid.length} listings with invalid coords:`)
  invalid.forEach(l => console.log(l.id, l.name, l.lat, l.lng))
}
run()
