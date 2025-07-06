export interface NextPlan {
  data_limit: number | null
  expire: number | null
  add_remaining_traffic: boolean
  fire_on_either: boolean
}

export interface Admin {
  username: string
  is_sudo: boolean
  telegram_id: number | null
  discord_webhook: string | null
  users_usage: number | null
}

export interface User {
  proxies: Record<string, string[]>

  expire: number | null
  data_limit: number | null
  data_limit_reset_strategy: 'no_reset' | 'day' | 'week' | 'month' | 'year'
  inbounds: Record<'vmess' | 'vless' | 'trojan' | 'shadowsocks', string[]>
  note: string | null

  sub_updated_at: string | null
  sub_last_user_agent: string | null
  online_at: string | null

  on_hold_expire_duration: number | null
  on_hold_timeout: string | null
  auto_delete_in_days: number | null

  next_plan: NextPlan | null

  username: string
  status: 'active' | 'disabled' | 'limited' | 'expired' | 'on_hold'

  used_traffic: number
  lifetime_used_traffic: number

  created_at: string
  links: string[]
  subscription_url: string

  excluded_inbounds: Record<
    'vmess' | 'vless' | 'trojan' | 'shadowsocks',
    string[]
  >

  admin: Admin | null
}
