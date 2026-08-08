export type PlaybackLoopOptions<Step> = {
  repeat: boolean;
  shouldContinue: () => boolean;
  playStep: (step: Step) => Promise<void>;
  onCycleStart?: (cycle: number) => void;
};

export const runPlaybackQueue = async <Step>(
  steps: readonly Step[],
  options: PlaybackLoopOptions<Step>,
) => {
  if (steps.length === 0) return 0;
  let cycles = 0;
  do {
    cycles += 1;
    options.onCycleStart?.(cycles);
    for (const step of steps) {
      if (!options.shouldContinue()) return cycles;
      await options.playStep(step);
    }
  } while (options.repeat && options.shouldContinue());
  return cycles;
};
