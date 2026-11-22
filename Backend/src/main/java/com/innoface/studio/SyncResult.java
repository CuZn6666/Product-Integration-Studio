package com.innoface.studio;

public record SyncResult(Long productId, Outcome outcome, String message, ProductStatus status) {
    public enum Outcome { SUCCESS, FAILURE }
}
