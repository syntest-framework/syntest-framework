export interface Typing {
  type: TypingType
  import?: string
}

export interface TypingType {
  Primitive,
  Array,
  Object
}