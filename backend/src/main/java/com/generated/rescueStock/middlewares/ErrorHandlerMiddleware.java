package com.generated.rescueStock.middlewares;

import com.generated.rescueStock.services.DispatchFlowException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 全局错误处理中间件：service 抛出的带码异常在这里统一转成错误响应，不在各层吞掉。 */
@RestControllerAdvice
public class ErrorHandlerMiddleware {

  @ExceptionHandler(DispatchFlowException.class)
  public ResponseEntity<Map<String, String>> handleFlow(DispatchFlowException exception) {
    HttpStatus status = switch (exception.getCode()) {
      case "DISPATCH_NOT_FOUND" -> HttpStatus.NOT_FOUND;
      case "VALIDATION_FAILED", "DISPATCH_STATUS_CONFLICT" -> HttpStatus.BAD_REQUEST;
      default -> HttpStatus.UNPROCESSABLE_ENTITY;
    };
    return ResponseEntity.status(status).body(Map.of(
        "code", exception.getCode(),
        "message", exception.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleOther(Exception exception) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(Map.of("code", "INTERNAL_ERROR", "message", exception.getMessage() == null ? "内部错误" : exception.getMessage()));
  }
}
