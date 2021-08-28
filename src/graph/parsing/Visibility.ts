export interface Visibility {
  name: string;
}

/**
 * Function can be called from both inside and outside the contract.
 */
export const PublicVisibility: Visibility = {
  name: "public",
};

/**
 * Function can only be called from within the contract where it is defined.
 */
export const PrivateVisibility: Visibility = {
  name: "private",
};
