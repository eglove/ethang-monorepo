export const bestSeat = (seats: number[]) => {
  let _bestSeat = -1;
  let maxSpace = 0;

  let leftPointer = 0;

  while (leftPointer < seats.length) {
    let rightPointer = leftPointer + 1;

    while (rightPointer < seats.length && 0 === seats[rightPointer]) {
      rightPointer += 1;
    }

    const availableSpace = rightPointer - leftPointer - 1;
    if (availableSpace > maxSpace) {
      _bestSeat = Math.floor((leftPointer + rightPointer) / 2);
      maxSpace = availableSpace;
    }

    leftPointer = rightPointer;
  }

  return _bestSeat;
};
