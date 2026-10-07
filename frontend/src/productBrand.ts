export const PRODUCT_NAME = 'Yardfolio';
export const FIELD_APP_NAME = `${PRODUCT_NAME} Field`;
export const PRODUCT_API_NAME = `${PRODUCT_NAME} API`;

export function productPageTitle(title: string): string {
  return `${title} | ${PRODUCT_NAME}`;
}
