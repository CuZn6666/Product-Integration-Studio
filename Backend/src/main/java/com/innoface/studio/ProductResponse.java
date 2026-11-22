package com.innoface.studio;

import java.math.BigDecimal;

public record ProductResponse(Long id, String name, String sku, BigDecimal price, String erpCategory, ProductStatus status) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(product.getId(), product.getName(), product.getSku(), product.getPrice(), product.getErpCategory(), product.getStatus());
    }
}
