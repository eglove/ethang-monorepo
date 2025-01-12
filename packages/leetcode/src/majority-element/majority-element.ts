export const majorityElement = (array: number[]) => {
  let majority = Number.NEGATIVE_INFINITY;
  const counts = new Map<number, number>();

  for (const value of array) {
    if (counts.has(value)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    } else {
      counts.set(value, 1);
    }

    if (
      (counts.get(value) ?? Number.NEGATIVE_INFINITY) >
      (counts.get(majority) ?? 0)
    ) {
      majority = value;
    }
  }

  if (
    (counts.get(majority) ?? Number.NEGATIVE_INFINITY) >=
    Math.ceil(array.length / 2)
  ) {
    return majority;
  }

  return null;
};

// Boyer-Moore, does not validate correctness
export const majorityElementSimple = (array: number[]) => {
  let count = 0;
  let answer: null | number = null;

  for (const value of array) {
    if (0 === count) {
      answer = value;
    }

    if (value === answer) {
      count += 1;
    } else {
      count -= 1;
    }
  }

  return answer;
};
