package com.innoface.studio;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:studio-test;DB_CLOSE_DELAY=-1", "spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
@Transactional
class ProductApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ProductRepository repository;

    @Test void listContainsThreeSeedProducts() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
    }
    @Test void createAndEditProduct() throws Exception {
        var request = new ProductRequest(" Test Product ", " TEST-001 ", new BigDecimal("15.25"), null);
        var response = mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Test Product"))
            .andExpect(jsonPath("$.sku").value("TEST-001")).andExpect(jsonPath("$.status").value("DRAFT"))
            .andReturn().getResponse().getContentAsString();
        long id = json.readTree(response).get("id").asLong();
        mvc.perform(put("/api/products/" + id).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(new ProductRequest("Updated", "TEST-001", new BigDecimal("0.00"), "Mechanical"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated")).andExpect(jsonPath("$.price").value(0));
    }
    @Test void rejectsBlankFieldsAndNegativePrice() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \",\"sku\":\"\",\"price\":-1}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.name").exists())
            .andExpect(jsonPath("$.fieldErrors.sku").exists()).andExpect(jsonPath("$.fieldErrors.price").exists());
    }
    @Test void rejectsMissingAndOverPrecisePrice() throws Exception {
        for (String price : new String[]{"null", "1.234"}) {
            mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Product\",\"sku\":\"PRICE-TEST\",\"price\":" + price + "}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.price").exists());
        }
    }
    @Test void rejectsDuplicateSkuOnCreateAndUpdate() throws Exception {
        var products = repository.findAll();
        String body = json.writeValueAsString(new ProductRequest("Duplicate", products.get(0).getSku(), BigDecimal.ONE, ""));
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message", containsString("SKU")));
        mvc.perform(put("/api/products/" + products.get(1).getId()).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }
    @Test void returnsReadableNotFoundAndMalformedErrors() throws Exception {
        mvc.perform(put("/api/products/999999").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(new ProductRequest("Missing", "MISSING", BigDecimal.ONE, ""))))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Product not found"));
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{bad json"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
    }
    @Test void syncMappedProductAndResetOnEdit() throws Exception {
        Product product = repository.findAll().stream().filter(p -> !p.getErpCategory().isBlank()).findFirst().orElseThrow();
        mvc.perform(post("/api/products/" + product.getId() + "/sync"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.productId").value(product.getId()))
            .andExpect(jsonPath("$.outcome").value("SUCCESS")).andExpect(jsonPath("$.status").value("SYNCED"));
        org.junit.jupiter.api.Assertions.assertEquals(ProductStatus.SYNCED, repository.findById(product.getId()).orElseThrow().getStatus());
        mvc.perform(put("/api/products/" + product.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(new ProductRequest(product.getName(), product.getSku(), product.getPrice(), product.getErpCategory()))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
    }
    @Test void missingCategoryIsReadableBusinessFailure() throws Exception {
        Product product = repository.findAll().stream().filter(p -> p.getErpCategory().isBlank()).findFirst().orElseThrow();
        mvc.perform(post("/api/products/" + product.getId() + "/sync"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.outcome").value("FAILURE"))
            .andExpect(jsonPath("$.status").value("FAILED")).andExpect(jsonPath("$.message", containsString("ERP category is required")));
        org.junit.jupiter.api.Assertions.assertEquals(ProductStatus.FAILED, repository.findById(product.getId()).orElseThrow().getStatus());
    }
    @Test void syncRevalidatesProductData() throws Exception {
        Product product = repository.saveAndFlush(new Product(new ProductRequest("Invalid imported record", "INVALID-001", new BigDecimal("-1.00"), "Mechanical")));
        mvc.perform(post("/api/products/" + product.getId() + "/sync"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.message", containsString("Price must be nonnegative")));
    }
    @Test void syncUnknownProductReturnsNotFound() throws Exception {
        mvc.perform(post("/api/products/999999/sync"))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Product not found"));
    }
    @Test void deleteRemovesOnlyRequestedProductAndAllowsSkuReuse() throws Exception {
        Product product = repository.findAll().get(0);
        mvc.perform(delete("/api/products/" + product.getId()))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        org.junit.jupiter.api.Assertions.assertFalse(repository.existsById(product.getId()));
        mvc.perform(get("/api/products")).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(post("/api/products/" + product.getId() + "/sync")).andExpect(status().isNotFound());
        mvc.perform(put("/api/products/" + product.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(new ProductRequest(product.getName(), product.getSku(), product.getPrice(), product.getErpCategory()))))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(new ProductRequest(product.getName(), product.getSku(), product.getPrice(), product.getErpCategory()))))
            .andExpect(status().isCreated());
    }
    @Test void deleteUnknownAndMalformedIdsReturnsReadableErrors() throws Exception {
        mvc.perform(delete("/api/products/999999")).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Product not found"));
        mvc.perform(delete("/api/products/not-a-number")).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
        mvc.perform(get("/api/products")).andExpect(jsonPath("$", hasSize(3)));
    }
    @Autowired DemoData demoData;
    @Test void deletedProductsAreNotReseededAfterInitialization() throws Exception {
        for (Product product : repository.findAll()) {
            mvc.perform(delete("/api/products/" + product.getId())).andExpect(status().isNoContent());
        }
        demoData.run();
        mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }
}
