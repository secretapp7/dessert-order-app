import type { Transition, Variants } from "framer-motion";

/** Calm easing — short fade/slide curves */
export const easePremium = [0.22, 1, 0.36, 1] as const;

/** Compact spring for UI chrome (nav pill, toggles) — not bouncy */
export const softSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.85,
};

export function navSpringTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) return { duration: 0 };
  return softSpring;
}

export function fadeUpVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.12 },
      },
    };
  }
  return {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: easePremium },
    },
  };
}

export function fadeInVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.12 } },
    };
  }
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.26, ease: easePremium } },
  };
}

/** Alias for screen entrances */
export function pageTransitionVariants(reducedMotion: boolean): Variants {
  return fadeUpVariants(reducedMotion);
}

export function staggerContainerVariants(reducedMotion: boolean, stagger = 0.045): Variants {
  return {
    hidden: {},
    visible: {
      transition: reducedMotion
        ? {}
        : {
            staggerChildren: stagger,
            delayChildren: 0.04,
          },
    },
  };
}

export function staggerItemVariants(reducedMotion: boolean): Variants {
  return fadeUpVariants(reducedMotion);
}

export function heroRevealVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) return fadeInVariants(true);
  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: easePremium },
    },
  };
}

export function slideUpBarVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.12 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: easePremium, delay: 0.08 },
    },
  };
}

export function subtleFadeVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) return fadeInVariants(true);
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.22, ease: easePremium },
    },
  };
}

/** Tap feedback — minimal scale */
export function scaleTapWhile(reducedMotion: boolean): { scale: number } | undefined {
  return reducedMotion ? undefined : { scale: 0.97 };
}

/** Desktop hover lift on cards */
export function cardHoverWhile(reducedMotion: boolean): { y: number } | undefined {
  return reducedMotion ? undefined : { y: -3 };
}
