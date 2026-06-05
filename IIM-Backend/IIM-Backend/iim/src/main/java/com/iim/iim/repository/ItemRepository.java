package com.iim.iim.repository;

import com.iim.iim.entity.Item;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item,Long> {

    @Query("SELECT COUNT(i) FROM Item i WHERE i.quantityInStock <= i.reOrderLevel")
    long countLowStockItems();

    @Query("SELECT i FROM Item i WHERE i.quantityInStock <= i.reOrderLevel ORDER BY i.quantityInStock ASC")
    List<Item> findLowStockItems(Pageable pageable);

}