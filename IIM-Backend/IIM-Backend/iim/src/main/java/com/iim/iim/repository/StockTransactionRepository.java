package com.iim.iim.repository;

import com.iim.iim.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;


public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    long countByType(String name);
    long countByUserId(Long id);
    long countByUserIdAndType(Long userId, String type);

    List<StockTransaction> findTop5ByUserIdOrderByTransactionDateDesc(Long userId);
    long countByUserIdAndTypeAndTransactionDateBetween(
            Long userId,
            String type,
            LocalDateTime start,
            LocalDateTime end
    );

}