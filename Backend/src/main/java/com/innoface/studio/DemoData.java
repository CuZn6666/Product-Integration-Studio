package com.innoface.studio;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Component
public class DemoData implements CommandLineRunner {
    private final ProductRepository repository;
    private final DemoInitializationRepository initialization;
    public DemoData(ProductRepository repository, DemoInitializationRepository initialization) {
        this.repository = repository;
        this.initialization = initialization;
    }
    @Override @Transactional
    public void run(String... args) {
        if (initialization.existsById(1L)) return;
        if (repository.count() == 0) {
            repository.saveAll(List.of(
                new Product(new ProductRequest("Precision Gear Assembly", "PLM-GEAR-001", new BigDecimal("249.90"), "Mechanical Components")),
                new Product(new ProductRequest("Industrial Temperature Sensor", "PLM-SENS-002", new BigDecimal("89.50"), "Electronics")),
                new Product(new ProductRequest("Aluminum Mounting Bracket", "PLM-BRKT-003", new BigDecimal("24.00"), ""))
            ));
        }
        initialization.save(new DemoInitialization(1L));
    }
}
