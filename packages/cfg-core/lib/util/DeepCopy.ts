export function deepCopy<T>(instance: T): T {
  if (instance == null) {
    return instance;
  }

  // handle Dates
  if (instance instanceof Date) {
    return new Date(instance.getTime()) as any;
  }

  // handle Array types
  if (instance instanceof Array) {
    const cloneArr = [] as any[];
    (instance as any[]).forEach((value) => {
      cloneArr.push(value);
    });
    // for nested objects
    return cloneArr.map((value: any) => deepCopy<any>(value)) as any;
  }
  // handle objects
  if (instance instanceof Object) {
    const copyInstance = { ...(instance as { [key: string]: any }) } as {
      [key: string]: any;
    };
    for (const attr in instance) {
      if (Object.hasOwn(copyInstance, attr))
        copyInstance[attr] = deepCopy<any>(instance[attr]);
    }
    return copyInstance as T;
  }
  // handling primitive data types
  return instance;
}
