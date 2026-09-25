<script setup lang="ts">
import { computed } from "vue";
import { useSessionStore } from "../../stores/SessionStore";
import { UserRoles, UserRoleText, type UserRole } from "../../constants/roles";

const session = useSessionStore();
const roles = UserRoles;
const roleText = UserRoleText;

const actorHint: Record<UserRole, string> = {
  STREET_ADMIN: "张区长",
  WAREHOUSE_KEEPER: "王仓库",
  DISPATCHER: "林审批",
  OBSERVER: "观察员工号"
};

const onRoleChange = (event: Event) => {
  const role = (event.target as HTMLSelectElement).value as UserRole;
  session.setRole(role);
  session.setActorName(actorHint[role]);
};

const current = computed(() => session.role);
</script>

<template>
  <div class="role-switcher">
    <label>
      <span>当前角色</span>
      <select :value="current" @change="onRoleChange">
        <option v-for="role in roles" :key="role" :value="role">{{ roleText[role] }}</option>
      </select>
    </label>
    <label class="actor-name">
      <span>操作人</span>
      <input :value="session.actorName" @input="session.setActorName(($event.target as HTMLInputElement).value)" />
    </label>
  </div>
</template>
