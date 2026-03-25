// LEARN: Defining types for our database tables here means TypeScript
// will catch any typo or wrong field name throughout the whole app —
// before the code ever runs. Think of it as a safety net that costs nothing.

export type Profile = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type Letter = {
  id: string
  from_id: string
  to_id: string
  subject: string | null
  body: string
  sent_at: string
  read_at: string | null
  created_at: string
  // Joined from profiles table
  from_profile?: Pick<Profile, 'display_name' | 'email'>
  to_profile?: Pick<Profile, 'display_name' | 'email'>
}
