package com.generated.rescueStock.types;

import com.fasterxml.jackson.annotation.JsonAlias;

/** 审批请求体：低于安全库存放行时 safetyReason 必填（兼容 camelCase 与 snake_case 入参）。 */
public record DispatchApproveRequest(
    @JsonAlias("actor") String actor,
    @JsonAlias("safetyReason") String safetyReason,
    @JsonAlias("note") String note) {}
