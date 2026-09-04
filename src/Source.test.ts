import {
  getSourceName,
  getSourceURL,
  getStormSkiingChartCSVURL,
  SourceType,
} from './Source.js'

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

  it('links to a cell of the ski pass chart', () => {
    expect(
      getSourceURL({ type: SourceType.STORM_SKIING, id: '677843907!AI64' }),
    ).toBe(
      'https://docs.google.com/spreadsheets/d/1G2-l2DVg7-QwroOi7EqRDrJYJ4ICYLcJbLx-nARJdrA/edit?gid=677843907#gid=677843907&range=AI64',
    )
  })

  it('rejects a ski pass chart id without a sheet', () => {
    expect(() =>
      getSourceURL({ type: SourceType.STORM_SKIING, id: 'AI64' }),
    ).toThrow('Malformed stormskiing.com source id')
  })
})

describe('getSourceName', () => {
  it('names every source type', () => {
    for (const type of Object.values(SourceType)) {
      expect(getSourceName(type).length).toBeGreaterThan(0)
    }
  })
})

describe('getStormSkiingChartCSVURL', () => {
  it('builds the CSV export URL for a sheet', () => {
    expect(getStormSkiingChartCSVURL('677843907')).toBe(
      'https://docs.google.com/spreadsheets/d/1G2-l2DVg7-QwroOi7EqRDrJYJ4ICYLcJbLx-nARJdrA/export?format=csv&gid=677843907',
    )
  })
})
