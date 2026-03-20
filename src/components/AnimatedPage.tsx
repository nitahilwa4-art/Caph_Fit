import { motion, HTMLMotionProps } from 'motion/react';
import React from 'react';

interface AnimatedPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

const variants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
};

export default function AnimatedPage({ children, className = '', ...rest }: AnimatedPageProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full h-full ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
