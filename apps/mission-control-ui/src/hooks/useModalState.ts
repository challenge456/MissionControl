import { useCallback, useState } from "react";

// ============================================================================
// MODAL STATE HOOK
// Centralises all show/hide booleans that were cluttering App.tsx.
// Usage: const { modals, open, close } = useModalState();
//        open("createTask")  →  shows CreateTaskModal
//        close("approvals")  →  hides ApprovalsModal
// ============================================================================

const INITIAL: {
  createTask: boolean;
  approvals: boolean;
  policy: boolean;
  operatorControls: boolean;
  notifications: boolean;
  standup: boolean;
  agentDashboard: boolean;
  costAnalytics: boolean;
  budgetBurnDown: boolean;
  advancedAnalytics: boolean;
  healthDashboard: boolean;
  monitoringDashboard: boolean;
  commandPalette: boolean;
  keyboardHelp: boolean;
  activityFeed: boolean;
  agentsFlyout: boolean;
  missionModal: boolean;
  suggestionsDrawer: boolean;
  importPrd: boolean;
  startQcRun: boolean;
  pauseConfirm: boolean;
  alertRules: boolean;
  createAgent: boolean;
} = {
  createTask: false,
  approvals: false,
  policy: false,
  operatorControls: false,
  notifications: false,
  standup: false,
  agentDashboard: false,
  costAnalytics: false,
  budgetBurnDown: false,
  advancedAnalytics: false,
  healthDashboard: false,
  monitoringDashboard: false,
  commandPalette: false,
  keyboardHelp: false,
  activityFeed: false,
  agentsFlyout: false,
  missionModal: false,
  suggestionsDrawer: false,
  importPrd: false,
  startQcRun: false,
  pauseConfirm: false,
  alertRules: false,
  createAgent: false,
};

export type ModalKey = keyof typeof INITIAL;
export type Modals = typeof INITIAL;

export function useModalState() {
  const [modals, setModals] = useState<Modals>({ ...INITIAL });

  const open = useCallback((key: ModalKey) => {
    setModals((prev) => ({ ...prev, [key]: true }));
  }, []);

  const close = useCallback((key: ModalKey) => {
    setModals((prev) => ({ ...prev, [key]: false }));
  }, []);

  const closeAll = useCallback(() => {
    setModals({ ...INITIAL });
  }, []);

  return { modals, open, close, closeAll };
}
