package com.iim.iim.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemDTO {
    private Long itemId;
    private String name;
    private String itemCode;
    private String description;
    private int quantityInStock;
    private double unitPrice;
    private String categoryDescription;
    private String supplierName;
    private int reOrderLevel;
    private String qrPath;

    // Constructor
    public ItemDTO(Long itemId, String name, String itemCode, String description, int quantityInStock,
                   double unitPrice, String categoryDescription, String supplierName,int reOrderLevel,String qrPath) {
        this.itemId = itemId;
        this.name = name;
        this.itemCode = itemCode;
        this.description = description;
        this.quantityInStock = quantityInStock;
        this.unitPrice = unitPrice;
        this.categoryDescription = categoryDescription;
        this.supplierName = supplierName;
        this.reOrderLevel = reOrderLevel;
        this.qrPath = qrPath;
    }

    // Getters and setters (or use Lombok @Data)
}