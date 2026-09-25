package com.generated.rescueStock.services;

import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import com.generated.rescueStock.models.*;
import com.generated.rescueStock.repositories.InMemoryDatabase;

/** 工作流校验异常，由 Controller/全局错误处理转成结构化错误响应 */
public class WorkflowException extends RuntimeException {
  public final String code;
  public WorkflowException(String code, String message) {
    super(message);
    this.code = code;
  }
}
