import { Phase, CourseType } from '@/types/course';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PhaseNavigatorProps {
  phases: Phase[];
  currentPhaseId: string;
  currentItemIndex: number;
  courseType: CourseType;
  onPhaseSelect: (phaseId: string, itemIndex: number) => void;
  completedPhases: Set<string>;
  completedSubPhases: Set<string>;
  courseData: Record<string, any>;
}

export function PhaseNavigator({ phases, currentPhaseId, currentItemIndex, courseType, onPhaseSelect, completedPhases, completedSubPhases, courseData }: PhaseNavigatorProps) {
  const currentPhase = phases.find(p => p.id === currentPhaseId);
  const isMCType = courseType === 'micro-credential' || courseType === 'composite-micro-credential';
  const visibleSubPhases = currentPhase?.subPhases?.filter(sp => isMCType || !sp.mcOnly) ?? [];
  return (
    <nav className="border-b border-border bg-card" aria-label="Course phases">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-2">
          {phases.map((phase, phaseIdx) => {
            const isActive = phase.id === currentPhaseId;
            const isCompleted = completedPhases.has(phase.id);
            const currentPhaseIdx = phases.findIndex(p => p.id === currentPhaseId);
            const isPast = currentPhaseIdx > phaseIdx;

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseSelect(phase.id, 0)}
                className={cn(
                  'flex-1 relative pb-4 transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="min-h-[80px] flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300',
                        isActive && 'bg-primary text-primary-foreground shadow-md',
                        isCompleted && !isActive && 'bg-primary/80 text-primary-foreground',
                        !isActive && !isCompleted && 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {isCompleted && !isActive ? <Check className="w-6 h-6" /> : phase.number}
                    </div>
                    <div className="text-center">
                      <div
                        className={cn(
                          'text-sm font-medium transition-colors duration-300',
                          isActive && 'text-primary',
                          !isActive && 'text-muted-foreground'
                        )}
                      >
                        {`Phase ${phase.number} – ${phase.id === 'phase5' && courseType === 'standalone' ? 'Learning processes' : phase.title}`}
                      </div>
                    </div>
                  </div>
                </div>
                {phaseIdx < phases.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 transition-all duration-300',
                      isCompleted ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {currentPhase && (
          <div className="mt-4">
            {/* Sub-phase mini stepper for active phase */}
            {visibleSubPhases.length > 0 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                {visibleSubPhases.map((sp, idx) => {
                  const currentItemId = currentPhase.items[currentItemIndex]?.id;
                  const isActiveSp = sp.itemIds.includes(currentItemId);
                  const isCompletedSp = completedSubPhases.has(sp.id);
                  const firstItemIndex = currentPhase.items.findIndex(it => sp.itemIds.includes(it.id));

                  return (
                    <button
                      key={sp.id}
                      onClick={() => onPhaseSelect(currentPhase.id, Math.max(0, firstItemIndex))}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border flex items-center gap-1.5',
                        isActiveSp && 'bg-primary text-primary-foreground border-primary',
                        !isActiveSp && isCompletedSp && 'bg-emerald-100 text-emerald-700 border-emerald-300 font-medium',
                        !isActiveSp && !isCompletedSp && 'bg-secondary text-secondary-foreground border-secondary'
                      )}
                    >
                      {!isActiveSp && isCompletedSp && <Check className="w-3.5 h-3.5" />}
                      {sp.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
