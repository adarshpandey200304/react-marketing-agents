import type { CSSProperties } from 'react';
import { useChatStore } from '../store/useChatStore';
import { WORKFLOW_STEPS, t } from '../i18n/strings';
import type { WorkflowStep } from '../types';

type StepStatus = 'done' | 'active' | 'current' | 'locked';

/**
 * Guided, animated stepper that walks the user through the 4 campaign stages in
 * order: Content Briefing → Cast Research → Consumer Insights → Creative Ideation.
 *
 * - done    : already completed (checkmark, filled connector)
 * - active  : currently running (pulsing ring + spinner)
 * - current : the next recommended, unlocked step (glowing, clickable)
 * - locked  : a later step gated behind earlier ones
 */
export default function WorkflowStepper() {
  const language = useChatStore((s) => s.language);
  const completedSteps = useChatStore((s) => s.completedSteps);
  const activeStep = useChatStore((s) => s.activeStep);
  const processing = useChatStore((s) => s.processing);
  const goToStep = useChatStore((s) => s.goToStep);

  const isDone = (id: WorkflowStep) => completedSteps.includes(id);

  // The "current" step is the first one in order that isn't done yet.
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => !isDone(s.id));
  const allDone = currentIndex === -1;
  const doneCount = completedSteps.length;
  // Progress fill (%) along the connector rail — based on completed stages.
  const progressPct = (doneCount / (WORKFLOW_STEPS.length - 1)) * 100;

  const statusOf = (id: WorkflowStep, index: number): StepStatus => {
    if (activeStep === id) return 'active';
    if (isDone(id)) return 'done';
    if (index === currentIndex) return 'current';
    return 'locked';
  };

  const onStepClick = (id: WorkflowStep, status: StepStatus) => {
    if (processing) return;
    // Done steps can be re-run; the current step can be started. Locked: no-op.
    if (status === 'locked' || status === 'active') return;
    void goToStep(id);
  };

  return (
    <section className="wf-stepper" aria-label="Campaign workflow">
      <div className="wf-stepper-head">
        <div>
          <h3 className="wf-title">{t('workflowTitle', language)}</h3>
          <p className="wf-sub">{allDone ? t('workflowComplete', language) : t('workflowSub', language)}</p>
        </div>
        <span className="wf-progress-badge">
          {doneCount}/{WORKFLOW_STEPS.length}
        </span>
      </div>

      <div className="wf-track" style={{ '--wf-progress': `${progressPct}%` } as CSSProperties}>
        <div className="wf-rail" aria-hidden="true">
          <div className="wf-rail-fill" />
        </div>

        <ol className="wf-steps">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = statusOf(step.id, index);
            const clickable = !processing && (status === 'current' || status === 'done');
            const title =
              status === 'locked'
                ? t('stepLocked', language)
                : status === 'done'
                  ? t('stepRedo', language)
                  : t('stepStart', language);

            return (
              <li key={step.id} className={`wf-step wf-${status}`}>
                <button
                  type="button"
                  className="wf-node"
                  onClick={() => onStepClick(step.id, status)}
                  disabled={!clickable}
                  title={title}
                  aria-current={status === 'current' || status === 'active'}
                >
                  <span className="wf-node-ring" aria-hidden="true" />
                  {status === 'done' ? (
                    <span className="material-symbols-outlined wf-check icon-filled">check</span>
                  ) : status === 'active' ? (
                    <span className="wf-spinner" aria-hidden="true" />
                  ) : (
                    <span className="material-symbols-outlined wf-icon">{step.icon}</span>
                  )}
                  <span className="wf-step-num">{index + 1}</span>
                </button>

                <div className="wf-step-text">
                  <span className="wf-step-label">{step.label[language]}</span>
                  <span className="wf-step-hint">
                    {status === 'done'
                      ? t('stepDone', language)
                      : status === 'current'
                        ? t('stepNext', language)
                        : step.hint[language]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
