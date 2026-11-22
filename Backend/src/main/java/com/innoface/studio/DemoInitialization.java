package com.innoface.studio;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

/** Remembers initialization even when the operator deletes every product. */
@Entity
public class DemoInitialization {
    @Id
    private Long id;

    protected DemoInitialization() {}
    public DemoInitialization(Long id) { this.id = id; }
}
