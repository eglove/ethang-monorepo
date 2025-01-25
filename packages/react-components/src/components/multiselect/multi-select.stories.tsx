import { MultiSelect } from "./multi-select.tsx";

export default {
  title: "multiselect",
};

const flatOptions = [
  {
    id: "one",
    value: "One",
  },
  {
    id: "two",
    value: "Two",
  },
  {
    id: "three",
    value: "Three",
  },
  {
    id: "four",
    value: "Four",
  },
];

export const Flat = () => {
  return <MultiSelect options={flatOptions} />;
};

const groupedOptions = {
  "Group One": [
    {
      id: "one",
      value: "One",
    },
    {
      id: "two",
      value: "Two",
    },
  ],
  "Group Two": [
    {
      id: "three",
      value: "Three",
    },
    {
      id: "four",
      value: "Four",
    },
  ],
};

export const Grouped = () => {
  return <MultiSelect options={groupedOptions} />;
};
