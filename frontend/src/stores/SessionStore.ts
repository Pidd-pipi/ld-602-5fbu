import { defineStore } from "pinia";
import {
  SESSION_STORAGE_KEY,
  UserRoles,
  type UserRole,
  canPerform,
  type DispatchAction
} from "../constants/roles";

interface SessionState {
  role: UserRole;
  actorName: string;
}

const defaultSession: SessionState = { role: "DISPATCHER", actorName: "林审批" };

const loadSession = (): SessionState => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return { ...defaultSession, ...(JSON.parse(raw) as SessionState) };
  } catch {
    // 损坏的会话直接回退默认角色
  }
  return defaultSession;
};

export const useSessionStore = defineStore("session", {
  state: (): SessionState => loadSession(),
  getters: {
    can: (state) => (action: DispatchAction) => canPerform(state.role, action)
  },
  actions: {
    setRole(role: UserRole) {
      this.role = role;
      this.persist();
    },
    setActorName(name: string) {
      this.actorName = name;
      this.persist();
    },
    persist() {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ role: this.role, actorName: this.actorName })
      );
    }
  }
});

export { UserRoles };
