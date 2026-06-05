package com.iim.iim.service;

import com.iim.iim.entity.Item;
import com.iim.iim.entity.StockTransaction;
import com.iim.iim.repository.ItemRepository;
import com.iim.iim.repository.StockTransactionRepository;
import com.iim.iim.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Service
public class StockTransactionService {

    @Autowired
    private StockTransactionRepository stockTransactionRepository;


    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;


    public StockTransaction saveStock(Long itemId, Integer quantity, String type,String remarks,long userId) {


        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        StockTransaction stock = new StockTransaction();
        stock.setItem(item);
        stock.setUserId(userId);
        stock.setQuantity(quantity);
        stock.setType(type);
        stock.setTransactionDate(LocalDateTime.now());
        stock.setRemarks(remarks);
        return stockTransactionRepository.save(stock);
    }

    public List<StockTransaction> fetchAllTransactions() {
        return stockTransactionRepository.findAll();
    }

    public Long stockCount(Long id)
    {
        return stockTransactionRepository.countByUserId(id);
    }



    public Map<String,Object> getUserIdStockCount(Long userId)
    {
        long total = stockTransactionRepository.countByUserId(userId);
        List<Item> lowStockItems = itemRepository.findLowStockItems((Pageable) PageRequest.of(0,5));
        Map<String, Object> map = new HashMap<>();
        map.put("total", total);
        return  map;
    }



    public Map<String, Object> getStockCounts(Long userId) {

        long total = stockTransactionRepository.countByUserId(userId);
        long stockIn = stockTransactionRepository.countByUserIdAndType(userId, "STOCK_IN");
        long stockOut = stockTransactionRepository.countByUserIdAndType(userId, "STOCK_OUT");

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.atTime(23,59,59);

        LocalDateTime yesterdayStart = yesterday.atStartOfDay();
        LocalDateTime yesterdayEnd = yesterday.atTime(23,59,59);

        long todayStockIn = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_IN", todayStart, todayEnd);
        long todayStockOut = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_OUT", todayStart, todayEnd);

        long yesterdayStockIn = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_IN", yesterdayStart, yesterdayEnd);
        long yesterdayStockOut = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_OUT", yesterdayStart, yesterdayEnd);

        // Previous Week
        LocalDate startOfThisWeek = today.with(java.time.DayOfWeek.MONDAY);
        LocalDate startOfPreviousWeek = startOfThisWeek.minusWeeks(1);
        LocalDate endOfPreviousWeek = startOfThisWeek.minusDays(1);

        LocalDateTime previousWeekStart = startOfPreviousWeek.atStartOfDay();
        LocalDateTime previousWeekEnd = endOfPreviousWeek.atTime(23,59,59);

        long previousWeekStockIn = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_IN", previousWeekStart, previousWeekEnd);
        long previousWeekStockOut = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_OUT", previousWeekStart, previousWeekEnd);

        // Previous Week Daily Counts
        Map<String, Map<String, Long>> previousWeekDaily = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = startOfPreviousWeek.plusDays(i);
            LocalDateTime dayStart = day.atStartOfDay();
            LocalDateTime dayEnd = day.atTime(23, 59, 59);

            long dayStockIn = stockTransactionRepository
                    .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_IN", dayStart, dayEnd);
            long dayStockOut = stockTransactionRepository
                    .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_OUT", dayStart, dayEnd);

            Map<String, Long> counts = new HashMap<>();
            counts.put("stockIn", dayStockIn);
            counts.put("stockOut", dayStockOut);

            previousWeekDaily.put(day.toString(), counts);
        }

        // --- Previous Month ---
        LocalDate firstDayOfThisMonth = today.withDayOfMonth(1);
        LocalDate firstDayOfPreviousMonth = firstDayOfThisMonth.minusMonths(1);
        LocalDate lastDayOfPreviousMonth = firstDayOfThisMonth.minusDays(1);

        LocalDateTime previousMonthStart = firstDayOfPreviousMonth.atStartOfDay();
        LocalDateTime previousMonthEnd = lastDayOfPreviousMonth.atTime(23,59,59);

        long previousMonthStockIn = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_IN", previousMonthStart, previousMonthEnd);
        long previousMonthStockOut = stockTransactionRepository
                .countByUserIdAndTypeAndTransactionDateBetween(userId, "STOCK_OUT", previousMonthStart, previousMonthEnd);

        List<StockTransaction> recentTransactions =
                stockTransactionRepository.findTop5ByUserIdOrderByTransactionDateDesc(userId);

        List<Item> lowStockItems = itemRepository.findLowStockItems((Pageable) PageRequest.of(0,5));

        Map<String, Object> map = new HashMap<>();
        map.put("total", total);
        map.put("stockIn", stockIn);
        map.put("stockOut", stockOut);

        map.put("todayStockIn", todayStockIn);
        map.put("todayStockOut", todayStockOut);

        map.put("yesterdayStockIn", yesterdayStockIn);
        map.put("yesterdayStockOut", yesterdayStockOut);

        map.put("previousWeekStockIn", previousWeekStockIn);
        map.put("previousWeekStockOut", previousWeekStockOut);
        map.put("previousWeekDaily", previousWeekDaily);

        map.put("previousMonthStockIn", previousMonthStockIn);
        map.put("previousMonthStockOut", previousMonthStockOut);

        map.put("lowStock", lowStockItems.size());
        map.put("recentTransactions", recentTransactions);
        map.put("lowStockItems", lowStockItems);

        return map;
    }
}

