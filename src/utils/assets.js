/**
 * Helper pour résoudre les chemins d'assets.
 * Vite gère automatiquement les paths absolus depuis /public/.
 */
export function resolveAsset(path) {
  // En dev et prod Vite, les fichiers de /public/ sont servis depuis la racine
  return path
}
