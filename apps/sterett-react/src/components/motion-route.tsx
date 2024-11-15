import type { PropsWithChildren } from "react";

import { type AnimationProps, motion } from "framer-motion";

const transition = { duration: 0.5 };

const pageTransition = {
  exit: {
    opacity: 0,
    transition,
  },
  hidden: {
    opacity: 0,
    transition,
  },
  visible: {
    opacity: 1,
    transition,
  },
} satisfies AnimationProps["variants"];

export const MotionRoute = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <motion.div
      animate="visible"
      exit="exit"
      initial="hidden"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
};
