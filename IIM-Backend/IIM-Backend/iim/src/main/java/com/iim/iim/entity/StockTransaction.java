package com.iim.iim.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "stock_transaction")
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;


    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Integer quantity;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime transactionDate;

    @Column(length = 500)
    private String remarks;



    @Column(name = "user_id")
    private Long userId;
}