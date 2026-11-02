/**
 * Shape every translation must have: same keys as the source catalog with string values.
 * Plural keys (`x_other`) may additionally come with `x_few` / `x_many` forms (Czech, Polish…).
 */
export type Catalog<T> = {
  [K in keyof T]: T[K] extends string ? string : Catalog<T[K]>;
} & {
  [K in keyof T as K extends `${infer Base}_other` ? `${Base}_few` | `${Base}_many` : never]?: string;
};
