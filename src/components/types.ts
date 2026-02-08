export interface Recommendation {
  name: string
  category: string
  area: string
  description: string
  link: string | null
  lat?: number
  lng?: number
  city?: string
  tags?: string[]
}
