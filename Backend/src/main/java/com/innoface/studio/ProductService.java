package com.innoface.studio;

import jakarta.validation.Validator;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@Transactional
public class ProductService {
    private final ProductRepository repository;
    private final Validator validator;
    public ProductService(ProductRepository repository, Validator validator) {
        this.repository = repository;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list() {
        return repository.findAll(Sort.by("id")).stream().map(ProductResponse::from).toList();
    }
    public ProductResponse create(ProductRequest request) {
        if (repository.existsBySku(request.sku().trim())) { throw duplicateSku(); }
        return ProductResponse.from(repository.saveAndFlush(new Product(request)));
    }
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        if (repository.existsBySkuAndIdNot(request.sku().trim(), id)) { throw duplicateSku(); }
        product.update(request);
        return ProductResponse.from(repository.saveAndFlush(product));
    }
    public void delete(Long id) {
        repository.delete(find(id));
        repository.flush();
    }
    public SyncResult sync(Long id) {
        Product product = find(id);
        var input = new ProductRequest(product.getName(), product.getSku(), product.getPrice(), product.getErpCategory());
        var errors = validator.validate(input);
        String failure = errors.stream().map(error -> error.getMessage()).sorted().reduce((a, b) -> a + "; " + b).orElse(null);
        if (failure == null && (product.getErpCategory() == null || product.getErpCategory().isBlank())) {
            failure = "ERP category is required to sync. Edit the product, add a category, and try again.";
        }
        product.setStatus(failure == null ? ProductStatus.SYNCED : ProductStatus.FAILED);
        repository.saveAndFlush(product);
        return new SyncResult(product.getId(), failure == null ? SyncResult.Outcome.SUCCESS : SyncResult.Outcome.FAILURE,
            failure == null ? "Product validated and exported to the simulated ERP." : failure, product.getStatus());
    }
    private Product find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }
    private ResponseStatusException duplicateSku() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "SKU already exists. Choose a unique SKU.");
    }
}
