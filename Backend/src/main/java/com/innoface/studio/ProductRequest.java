package com.innoface.studio;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank(message = "Name is required") @Size(max = 120, message = "Name must be at most 120 characters") String name,
    @NotBlank(message = "SKU is required") @Size(max = 64, message = "SKU must be at most 64 characters") String sku,
    @NotNull(message = "Price is required") @DecimalMin(value = "0.00", message = "Price must be nonnegative")
    @Digits(integer = 12, fraction = 2, message = "Price allows up to 12 whole digits and 2 decimal places") BigDecimal price,
    @Size(max = 80, message = "ERP category must be at most 80 characters") String erpCategory
) {}
