export const SupplyCategory = ["FOOD","WATER","MEDICAL","SHELTER","RESCUE_TOOL"] as const;
export type SupplyCategory = (typeof SupplyCategory)[number];
export const SupplyCategoryText: Record<SupplyCategory, string> = {
  FOOD: "食品",
  WATER: "饮用水",
  MEDICAL: "医疗物资",
  SHELTER: "安置物资",
  RESCUE_TOOL: "救援工具"
};

export const SupplyCategoryFilterOptions: { value: SupplyCategory | ""; label: string }[] = [
  { value: "", label: "全部分类" },
  ...SupplyCategory.map((value) => ({ value, label: SupplyCategoryText[value] }))
];
