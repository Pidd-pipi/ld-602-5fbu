package com.generated.rescueStock.types;

import com.fasterxml.jackson.annotation.JsonAlias;

/** 操作人请求体（出库、签收共用），签收时 remark 可选，驳回时 reason 必填。 */
public record DispatchActionRequest(
    @JsonAlias("actor") String actor,
    @JsonAlias("remark") String remark,
    @JsonAlias("reason") String reason) {}
