import courierAvatarCarlos from './images/courier_avatar_carlos_1795349183424.jpg';
import dishArepaReina from './images/dish_arepa_reina_1795349184183.jpg';
import dishSmashBurger from './images/dish_smash_burger_1795349183594.jpg';
import groceryFreshProduce from './images/grocery_fresh_produce_1795349182665.jpg';
import pharmacyWellnessKit from './images/pharmacy_wellness_kit_1795349184012.jpg';

export const MEDIA_ASSETS = {
  courierAvatarCarlos,
  dishArepaReina,
  dishSmashBurger,
  groceryFreshProduce,
  pharmacyWellnessKit,
} as const;

const LEGACY_PATH_MAP: Record<string, string> = {
  '/src/assets/images/courier_avatar_carlos_1795349183424.jpg': courierAvatarCarlos,
  '/src/assets/images/dish_arepa_reina_1795349184183.jpg': dishArepaReina,
  '/src/assets/images/dish_smash_burger_1795349183594.jpg': dishSmashBurger,
  '/src/assets/images/grocery_fresh_produce_1795349182665.jpg': groceryFreshProduce,
  '/src/assets/images/pharmacy_wellness_kit_1795349184012.jpg': pharmacyWellnessKit,
};

export function resolveAssetUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (LEGACY_PATH_MAP[trimmed]) {
    return LEGACY_PATH_MAP[trimmed];
  }
  const filename = trimmed.split('/').pop();
  if (filename) {
    for (const [legacyKey, resolved] of Object.entries(LEGACY_PATH_MAP)) {
      if (legacyKey.endsWith(`/${filename}`)) {
        return resolved;
      }
    }
  }
  return trimmed;
}
