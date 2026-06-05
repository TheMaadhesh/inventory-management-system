package com.iim.iim.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long itemId;

    private String name;

    private String description;

    private String itemCode;

    private int quantityInStock;

    private int reOrderLevel;

    private double unit_price;


    private String qrPath;


    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;


    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    @JsonBackReference
    private Category category;


    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;
}