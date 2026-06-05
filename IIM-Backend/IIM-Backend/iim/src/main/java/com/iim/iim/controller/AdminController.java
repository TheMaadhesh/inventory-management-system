package com.iim.iim.controller;

import com.iim.iim.dto.CategoryDTO;
import com.iim.iim.dto.ItemDTO;
import com.iim.iim.dto.PasswordUpdateRequest;
import com.iim.iim.entity.*;
import com.iim.iim.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5073")
@RestController
@RequestMapping("/api/admin")
@ResponseBody
public class AdminController {

    @Autowired
    private ItemService itemService;
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private SupplierService supplierService;
    @Autowired
    private StockTransactionService stockTransactionService;
    @Autowired
    private AuthService authService;

    @PostMapping("/item/save")
    public Item saveInventoryItem(@RequestBody Item item){
        return itemService.saveItem(item);
    }

    @GetMapping("/item/fetchAll")
    public List<ItemDTO> fetchAllInventoryItem()
    {
        return itemService.getAllItems();
    }

    @DeleteMapping("/item/deleteByid")
    public String deleteItem(@RequestParam long id)
    {
        return itemService.deleteItem(id);
    }

    @PutMapping("/item/update")
    public String updateItem(@RequestBody Item item)
    {
        return  itemService.updateItem(item);
    }

    @PostMapping("/category/save")
    public Category saveCategory(@RequestBody Category cat)
    {
        return  categoryService.saveCategory(cat);
    }

    @GetMapping("/category/fetchAll")
    public List<CategoryDTO> fetchAll()
    {
        return categoryService.getAllCategories();
    }

    @PutMapping("/category/update/status")
    public  void updateStatus(@RequestParam long id, @RequestParam Status status)
    {
        categoryService.updateStatus(id,status);
    }

    @DeleteMapping("/category/delete")
    public String deleteCategory(@RequestParam long id)
    {
        return  categoryService.deleteCategory(id);
    }

    @PostMapping("/stock/save")
    public ResponseEntity<?> saveStock(
            @RequestParam Long itemId,
            @RequestParam Integer quantity,
            @RequestParam String type,
            @RequestParam String remarks,
            @RequestParam long userId
    ) {
        StockTransaction stock = stockTransactionService.saveStock(itemId, quantity, type,remarks,userId);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/stock/all")
    public List<StockTransaction> getAllStockTransactions() {
        return stockTransactionService.fetchAllTransactions();
    }

    @PostMapping("/supplier/service/save")
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        Supplier saved = supplierService.saveSupplier(supplier);
        return ResponseEntity.ok(saved);
    }
    @GetMapping("/supplier/fetchAll")
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        List<Supplier> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(suppliers);
    }
    @PutMapping("/supplier/update")
    public String updateSupplier(@RequestBody Supplier sp) {
        return supplierService.updateSupplier(sp);
    }

    @DeleteMapping("/supplier/delete")
    public String deleteSupplier(@RequestParam long id)
    {
        return  supplierService.deleteSupplier(id);
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


    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody PasswordUpdateRequest request) {

        String message = authService.updatePassword(request);

        return ResponseEntity.ok(message);
    }

    @GetMapping("/find")
    public User find(@RequestParam long id){
        return  authService.findById(id);
    }

    @PutMapping("/user/profile/update")
    public User updateUser(@RequestBody User u)
    {
        return authService.updateUser(u);
    }

    @GetMapping("/users/fetchAll")
    public List<User> findAllUsers()
    {
        return authService.findAllusers();
    }

    @GetMapping("/users/profile/count")
    public Map<String,Object>findUerProfileCount(Long userId)
    {
        return stockTransactionService.getUserIdStockCount(userId);
    }

    @DeleteMapping("/users/delete")
    public String removeStaff(@RequestParam Long id)
    {
        return authService.deleteStaff(id);
    }

    @GetMapping("/users/supplier/count")
    public long countSupplier()
    {
        return  supplierService.supplierCount();
    }

}