import { DEFAULT_GRID_PRECISION, distanceInMeters, snapToGrid } from './coordinates';

describe('snapToGrid', () => {
  const zocalo = { latitude: 19.432608, longitude: -99.133209 };

  it('rounds to the default grid precision', () => {
    expect(snapToGrid(zocalo)).toEqual({ latitude: 19.433, longitude: -99.133 });
  });

  /**
   * ESTE es el criterio de aceptación: "muevo el mapa unos metros y no se dispara una
   * petición nueva". La clave de caché sale de aquí, así que si dos puntos separados por
   * decenas de metros producen el mismo objeto, producen la misma clave.
   */
  it('gives the same cell for two points a few metres apart', () => {
    const aFewMetresAway = { latitude: 19.432_651, longitude: -99.133_188 };

    expect(distanceInMeters(zocalo, aFewMetresAway)).toBeLessThan(100);
    expect(snapToGrid(aFewMetresAway)).toEqual(snapToGrid(zocalo));
  });

  it('gives a different cell once the move is big enough to matter', () => {
    const aKilometreAway = { latitude: 19.441_6, longitude: -99.133_209 };

    expect(distanceInMeters(zocalo, aKilometreAway)).toBeGreaterThan(900);
    expect(snapToGrid(aKilometreAway)).not.toEqual(snapToGrid(zocalo));
  });

  /**
   * `Math.round(x * 1000) / 1000` devuelve aquí 19.432999999999996 en vez de 19.433, y esa
   * diferencia serializa a dos claves distintas para el mismo sitio. Por eso `toFixed`.
   */
  it('does not leak binary floating point noise into the key', () => {
    const snapped = snapToGrid({ latitude: 19.4325, longitude: -99.1335 });

    expect(String(snapped.latitude)).not.toContain('999');
    expect(String(snapped.longitude)).not.toContain('999');
  });

  it('normalises negative zero, which serialises differently from zero', () => {
    const snapped = snapToGrid({ latitude: -0.0001, longitude: -0.0004 });

    expect(Object.is(snapped.latitude, -0)).toBe(false);
    expect(JSON.stringify(snapped)).toBe('{"latitude":0,"longitude":0}');
  });

  it('accepts a tighter grid when a caller needs one', () => {
    expect(snapToGrid(zocalo, 5)).toEqual({ latitude: 19.43261, longitude: -99.13321 });
    expect(DEFAULT_GRID_PRECISION).toBe(3);
  });
});

describe('distanceInMeters', () => {
  it('is zero for the same point', () => {
    expect(
      distanceInMeters(
        { latitude: 19.43, longitude: -99.13 },
        { latitude: 19.43, longitude: -99.13 },
      ),
    ).toBe(0);
  });

  it('matches a known distance: CDMX to Guadalajara is about 460 km', () => {
    const distance = distanceInMeters(
      { latitude: 19.4326, longitude: -99.1332 },
      { latitude: 20.6597, longitude: -103.3496 },
    );

    expect(distance).toBeGreaterThan(455_000);
    expect(distance).toBeLessThan(465_000);
  });
});
