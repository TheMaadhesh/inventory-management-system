package com.iim.iim.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long supplierId;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String contactPerson;
    @Column(nullable = false)
    private String email;
    @Column(nullable = false)
    private long phoneNo;
    @Column(nullable = false)
    private String address;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @OneToMany(mappedBy = "supplier",fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Item> items;
}
