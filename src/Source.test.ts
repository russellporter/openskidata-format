import { getSourceName, getSourceURL, SourceType } from './Source.js'

describe('getSourceURL', () => {
  it('links to an OpenStreetMap element', () => {
    expect(
      getSourceURL({ type: SourceType.OPENSTREETMAP, id: 'relation/5883752' }),
    ).toBe('https://www.openstreetmap.org/relation/5883752')
  })

  it('links to a Skimap.org ski area', () => {
    expect(getSourceURL({ type: SourceType.SKIMAP_ORG, id: '181' })).toBe(
      'https://www.skimap.org/SkiAreas/view/181',
    )
  })
})

describe('getSourceName', () => {
  it('names every source type', () => {
    for (const type of Object.values(SourceType)) {
      expect(getSourceName(type).length).toBeGreaterThan(0)
    }
  })
})
