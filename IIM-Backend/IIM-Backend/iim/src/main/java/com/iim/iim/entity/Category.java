package com.iim.iim.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long categoryId;
    @Column(nullable = false)
    private String name;
    private String description;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    @OneToMany(mappedBy = "category",fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Item> items;
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE ;


}
