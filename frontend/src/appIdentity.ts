/**
 * Customer-visible application identity.
 *
 * Keep display naming separate from compatibility-sensitive identifiers so a
 * future brand change does not invalidate saved browser data or deployed
 * infrastructure.
 */
export const APP_DISPLAY_NAME = 'Grover';
export const APP_TECHNICAL_NAMESPACE = 'yardfolio';

export const FIELD_APP_DISPLAY_NAME = `${APP_DISPLAY_NAME} Field`;
export const API_DISPLAY_NAME = `${APP_DISPLAY_NAME} API`;

export function appPageTitle(title: string): string {
  return `${title} | ${APP_DISPLAY_NAME}`;
}
