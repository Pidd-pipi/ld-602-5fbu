package com.generated.rescueStock.services;

import com.generated.rescueStock.models.DispatchOrder;
import com.generated.rescueStock.repositories.InMemoryDataRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/** 调拨单查询：列表与详情都返回明细、批次方案、缺口和时间线进度。 */
@Service
public class DispatchOrderService {

  private final InMemoryDataRepository repo;

  public DispatchOrderService(InMemoryDataRepository repo) {
    this.repo = repo;
  }

  public List<DispatchOrder> list() {
    return repo.dispatchOrders;
  }

  public DispatchOrder detail(Long id) {
    return repo.findOrder(id)
        .orElseThrow(() -> new DispatchFlowException("DISPATCH_NOT_FOUND", "调拨单不存在或已被处理"));
  }
}
