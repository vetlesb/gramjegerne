export type Reference = {
  _ref: string;
  _type: 'reference';
};

function isReference(input: unknown): input is Reference {
  return (
    typeof input === 'object' &&
    input !== null &&
    '_ref' in input &&
    typeof input._ref === 'string' &&
    '_type' in input &&
    input._type === 'reference'
  );
}

function isOptionalReference(input: unknown): input is Optional<Reference> {
  if (input === null || input === undefined) {
    return true;
  }
  return isReference(input);
}

type Primitive = 'string' | 'number' | 'boolean';

function isOptionalValue(input: unknown, type: Primitive) {
  return typeof input === type || input === null || input === undefined;
}

/**
 * Make all properties in T optional.
 * Below is usually the behaviour of sanity, but because this API replaces the entire array,
 * both `null` and `undefined` essentially removes the field.
 * `undefined`: Sanity ignores the field.
 * `null`: Sanity sets the field to null.
 */
type Optional<T> = T | null | undefined;

export type ListItemPatch = {
  _key: string;
  _type: 'listItem';
  item: Optional<Reference>;
  checked: Optional<boolean>;
  quantity: Optional<number>;
  categoryOverride: Optional<Reference>;
};

function isListItemPatch(input: unknown): input is ListItemPatch {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const requiredFields = ['_key', '_type'];

  for (const field of requiredFields) {
    if (!(field in input)) {
      return false;
    }
  }

  if (!('_key' in input) || typeof input._key !== 'string') {
    return false;
  }

  if (!('_type' in input) || input._type !== 'listItem') {
    return false;
  }

  if ('checked' in input && !isOptionalValue(input.checked, 'boolean')) {
    return false;
  }

  if ('quantity' in input && !isOptionalValue(input.quantity, 'number')) {
    return false;
  }

  if ('categoryOverride' in input && !isOptionalReference(input.categoryOverride)) {
    return false;
  }

  if ('item' in input && !isOptionalReference(input.item)) {
    return false;
  }

  return true;
}

export function isListItemsPatch(input: unknown): input is ListItemPatch[] {
  if (!Array.isArray(input)) {
    return false;
  }

  for (const item of input) {
    if (!isListItemPatch(item)) {
      debugger;
      isListItemPatch(item);
      return false;
    }
  }

  return true;
}
