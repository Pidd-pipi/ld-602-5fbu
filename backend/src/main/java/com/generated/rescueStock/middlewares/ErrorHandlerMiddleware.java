package com.generated.rescueStock.middlewares;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.generated.rescueStock.services.WorkflowException;

/** 全局错误处理：工作流校验错误统一结构化返回，service 与 controller 不吞异常 */
@RestControllerAdvice
public class ErrorHandlerMiddleware {

  @ExceptionHandler(WorkflowException.class)
  public ResponseEntity<Map<String, Object>> handleWorkflow(WorkflowException ex) {
    boolean denied = "RBAC_DENIED".equals(ex.code) || "AUTH_REQUIRED".equals(ex.code);
    boolean invalid = "VALIDATION_FAILED".equals(ex.code) || "ORDER_STATUS_INVALID".equals(ex.code)
        || "FORCE_REASON_REQUIRED".equals(ex.code) || "EMPTY_DISPATCH_LINES".equals(ex.code);
    HttpStatus status = denied ? HttpStatus.FORBIDDEN : invalid ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT;
    return ResponseEntity.status(status).body(Map.of(
        "code", ex.code,
        "message", ex.getMessage() == null ? "" : ex.getMessage()
    ));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleOther(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
        "code", "INTERNAL_ERROR",
        "message", ex.getMessage() == null ? "服务内部错误" : ex.getMessage()
    ));
  }
}
