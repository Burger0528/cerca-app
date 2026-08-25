/**
 * El único archivo que conoce la librería de iconos.
 *
 * Las pantallas piden `name="search"`, no `"magnify"`: el nombre describe el PAPEL, igual
 * que los colores describen el papel y no el tono. Cambiar de juego de iconos —o pasar a
 * SVG el día que entre `react-native-svg`— se hace en este mapa y en ningún sitio más.
 *
 * `@expo/vector-icons` es solo JS: las fuentes las carga `expo-font`, que ya está enlazado
 * en el dev client. Por eso esto NO obliga a recompilar el APK.
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { cssInterop } from 'nativewind';

const StyledIcon = cssInterop(MaterialCommunityIcons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const ICONS = {
  search: 'magnify',
  bookings: 'calendar-check-outline',
  listings: 'clipboard-text-outline',
  account: 'account-circle-outline',
  moderation: 'shield-alert-outline',

  rating: 'star',
  distance: 'map-marker-outline',
  price: 'tag-outline',
  chevron: 'chevron-right',
  share: 'share-variant-outline',
  filter: 'tune-variant',
  add: 'plus',
  close: 'close',
  back: 'arrow-left',

  requested: 'clock-outline',
  accepted: 'check-circle-outline',
  declined: 'close-circle-outline',
  completed: 'check-decagram-outline',
  cancelled: 'cancel',

  empty: 'inbox-outline',
  error: 'alert-circle-outline',
  location: 'crosshairs-gps',
  language: 'translate',
  signOut: 'logout',
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  /** Clases de color, p. ej. `text-muted`. El tamaño va por `size`, no por clase. */
  readonly className?: string;
}

export function Icon({ name, size = 20, className = 'text-foreground' }: IconProps) {
  return (
    <StyledIcon
      name={ICONS[name]}
      size={size}
      className={className}
      // Los iconos acompañan al texto que ya lee el lector: anunciarlos otra vez duplica.
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
