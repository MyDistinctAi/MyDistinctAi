import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data } = await supabase
  .from('models')
  .select('*')
  .eq('id', '7903d76e-6278-47f4-be7b-5406c9017694')
  .single()

console.log('Model:', JSON.stringify(data, null, 2))
