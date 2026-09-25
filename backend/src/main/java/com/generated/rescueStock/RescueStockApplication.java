package com.generated.rescueStock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration;

/**
 * 当前演示实现使用进程内内存仓库（InMemoryDatabase）等价本地数据库，
 * 因此排除数据源/JPA/MyBatis 自动装配；接入 MySQL 时移除 exclude 并补充数据源配置即可。
 */
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
    MybatisPlusAutoConfiguration.class
})
public class RescueStockApplication {
  public static void main(String[] args) {
    SpringApplication.run(RescueStockApplication.class, args);
  }
}
