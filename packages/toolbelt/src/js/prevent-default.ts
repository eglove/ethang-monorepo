export const preventDefault = (callback: () => void) => {
  return (event: { preventDefault: () => void }) => {
    event.preventDefault();
    callback();
  };
};
