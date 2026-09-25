package com.generated.rescueStock.services;

/** 业务异常：携带错误码，由 controller 分别包装，错误处理中间件统一兜底。 */
public class DispatchFlowException extends RuntimeException {
  private final String code;

  public DispatchFlowException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
