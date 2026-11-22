package com.innoface.studio;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(name = "uk_product_sku", columnNames = "sku"))
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 64)
    private String sku;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;
    @Column(length = 80)
    private String erpCategory;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ProductStatus status = ProductStatus.DRAFT;

    protected Product() {}
    public Product(ProductRequest request) { update(request); }
    public void update(ProductRequest request) {
        name = request.name().trim();
        sku = request.sku().trim();
        price = request.price();
        erpCategory = request.erpCategory() == null ? "" : request.erpCategory().trim();
        status = ProductStatus.DRAFT;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSku() { return sku; }
    public BigDecimal getPrice() { return price; }
    public String getErpCategory() { return erpCategory; }
    public ProductStatus getStatus() { return status; }
    public void setStatus(ProductStatus status) { this.status = status; }
}
