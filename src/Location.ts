export type Location = {
  iso3166_1Alpha2: string
  iso3166_2: string | null
  localized: {
    en: {
      country: string
      region: string | null
      locality: string | null
    }
  }
}
