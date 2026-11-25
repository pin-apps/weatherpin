// Made-up RainViewer frame list (real shape): 13 frames, 10 minutes apart,
// the newest at 13:00 UTC (14:00 in Oslo, the tests' time zone).

const NEWEST = Date.UTC(2026, 10, 15, 13, 0) / 1000;

export function radarFramesFixture() {
  return {
    version: '2.0',
    generated: NEWEST + 120,
    host: 'https://tilecache.rainviewer.com',
    radar: {
      past: Array.from({ length: 13 }, (_, i) => {
        const time = NEWEST - (12 - i) * 600;
        return { time, path: `/v2/radar/test${time}` };
      }),
      // Discontinued for free users in 2026.
      nowcast: [],
    },
    satellite: { infrared: [] },
  };
}

/**
 * Made-up ECCC (MSC GeoMet) capabilities for the radar layers (real shape,
 * trimmed): times every 6 minutes for 3 hours, the newest at 13:00 UTC for
 * rain and 12:54 UTC for snow (so each test can tell which was asked).
 */
export const ECCC_CAPABILITIES = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
  <Capability>
    <Layer>
      <Title>MSC GeoMet</Title>
      <Layer queryable="1">
        <Name>RADAR_1KM_RRAI</Name>
        <Title>Radar precipitation rate for rain [mm/h]</Title>
        <Dimension name="time" units="ISO8601" default="2026-11-15T13:00:00Z" nearestValue="0">2026-11-15T10:00:00Z/2026-11-15T13:00:00Z/PT6M</Dimension>
      </Layer>
      <Layer queryable="1">
        <Name>RADAR_1KM_RSNO</Name>
        <Title>Radar precipitation rate for snow [cm/h]</Title>
        <Dimension name="time" units="ISO8601" default="2026-11-15T12:54:00Z" nearestValue="0">2026-11-15T09:54:00Z/2026-11-15T12:54:00Z/PT6M</Dimension>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
