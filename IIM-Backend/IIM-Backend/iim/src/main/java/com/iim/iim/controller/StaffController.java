package com.iim.iim.controller;

import com.iim.iim.dto.ItemDTO;
import com.iim.iim.dto.PasswordUpdateRequest;
import com.iim.iim.entity.Item;
import com.iim.iim.entity.StockTransaction;
import com.iim.iim.entity.User;
import com.iim.iim.service.AuthService;
import com.iim.iim.service.ItemService;
import com.iim.iim.service.StockTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5073")
@RequestMapping("/api/staff")
@ResponseBody
public class StaffController {

    @Autowired
    private ItemService itemService;
    @Autowired
    private AuthService authService;

    @Autowired
    private StockTransactionService stockTransactionService;

    @GetMapping("/item/fetchAll")
    public List<ItemDTO> fetchAllInventoryItem()
    {
        return itemService.getAllItems();
    }


    @GetMapping("/stock/all")
    public List<StockTransaction> getAllStockTransactions() {
        return stockTransactionService.fetchAllTransactions();
    }


    @PostMapping("/stock/save")
    public StockTransaction saveStock(
            @RequestParam Long itemId,
            @RequestParam Integer quantity,
            @RequestParam String type,
            @RequestParam String remarks,
            @RequestParam long userId
    ) {
        return stockTransactionService.saveStock(itemId, quantity, type, remarks,userId);
    }

    @PutMapping("/stock/update")
    public ResponseEntity<?> updateStock(
            @RequestParam Long id,
            @RequestParam Integer quantity
    ) {

        if (id == null) {
            return ResponseEntity.badRequest().body("Item id required");
        }

        Item item = itemService.updateStock(id, quantity);

        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(item);
    }

    @PutMapping("/stock/decrease")
    public ResponseEntity<?> delStock(
            @RequestParam Long id,
            @RequestParam Integer quantity
    ) {

        if (id == null) {
            return ResponseEntity.badRequest().body("Item id required");
        }

        Item item = itemService.decreaseStock(id, quantity);

        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(item);
    }

    @GetMapping("/count/all")
    public void count()
    {
        itemService.getCounts();
    }

    @GetMapping("/find")
    public User find(@RequestParam long id){
        return  authService.findById(id);
    }

    @GetMapping("/stock/Count/User")
    public Long countStocks(@RequestParam long id)
    {
        return stockTransactionService.stockCount(id);
    }

    @PutMapping("/user/profile/update")
    public User updateUser(@RequestBody User u)
    {
       return authService.updateUser(u);
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody PasswordUpdateRequest request) {

        String message = authService.updatePassword(request);

        return ResponseEntity.ok(message);
    }

    @GetMapping("/count/user")
    public Map<String, Object> getStockCounts(@RequestParam Long id) {
        return stockTransactionService.getStockCounts(id);
    }

}