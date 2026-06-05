package com.iim.iim.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.iim.iim.dto.ItemDTO;
import com.iim.iim.entity.Item;
import com.iim.iim.repository.ItemRepository;
import com.iim.iim.repository.StockTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    private StockTransactionRepository stockTransactionRepository;

    public Item findIdItems(long id) {
        Optional<Item> item = itemRepository.findById(id);
        return item.orElse(null);
    }


    public Item saveItem(Item item) {
        Item savedItem = itemRepository.save(item);

        String qrText = savedItem.getItemId() + "," +
                savedItem.getName() + "," +
                savedItem.getItemCode() + "," +
                savedItem.getCreatedAt();

        String fileName = savedItem.getName() +
                "_" +
                savedItem.getItemCode() +
                "_" +
                savedItem.getItemId();

        String qrPath = createQrCode(qrText, fileName);

        savedItem.setQrPath(qrPath);

        return itemRepository.save(savedItem);
    }

    public Item updateStock(Long id, int quantity) {

        Optional<Item> item = itemRepository.findById(id);

        if (item.isPresent()) {

            int existing = item.get().getQuantityInStock();

            item.get().setQuantityInStock(existing + quantity);

            itemRepository.save(item.get());

            return item.get();
        }

        return null;
    }

    public Item decreaseStock(Long id, int quantity) {

        Optional<Item> item = itemRepository.findById(id);

        if (item.isPresent()) {

            int existing = item.get().getQuantityInStock();

            item.get().setQuantityInStock(existing - quantity);

            itemRepository.save(item.get());

            return item.get();
        }

        return null;
    }

    public String updateItem(Item item) {

        Optional<Item> existingItem = itemRepository.findById(item.getItemId());

        if (existingItem.isPresent()) {

            Item dbItem = existingItem.get();

            if (item.getItemCode() != null && !item.getItemCode().isEmpty()) {
                dbItem.setItemCode(item.getItemCode());
            }

            if (item.getName() != null && !item.getName().isEmpty()) {
                dbItem.setName(item.getName());
            }

            if (item.getDescription() != null && !item.getDescription().isEmpty()) {
                dbItem.setDescription(item.getDescription());
            }

            if (item.getUnit_price() >= 0) {
                dbItem.setUnit_price(item.getUnit_price());
            }

            if (item.getQuantityInStock() >= 0) {
                dbItem.setQuantityInStock(item.getQuantityInStock());
            }

            if (item.getReOrderLevel() >= 0) {
                dbItem.setReOrderLevel(item.getReOrderLevel());
            }

            if (item.getCategory() != null) {
                dbItem.setCategory(item.getCategory());
            }

            if (item.getSupplier() != null) {
                dbItem.setSupplier(item.getSupplier());
            }

            itemRepository.save(dbItem);

            return "Item Updated Successfully";
        }

        return "Item Not Found";
    }


    public String deleteItem(long id) {

        Optional<Item> item = itemRepository.findById(id);

        if (item.isPresent()) {
            itemRepository.deleteById(id);
            return "Item Deleted Successfully";
        }

        return "Item Not Found";
    }


    public String createQrCode(String text, String filename) {

        String folderPath = "C:/QrImages";
        File folder = new File(folderPath);

        if (!folder.exists()) {
            folder.mkdirs();
        }

        try {

            QRCodeWriter writer = new QRCodeWriter();

            BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, 300, 300);

            Path filePath = Paths.get(folderPath + "/" + filename + ".png");

            MatrixToImageWriter.writeToPath(matrix, "PNG", filePath);

            return "http://localhost:8080/qr/" + filename + ".png";

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public List<ItemDTO> getAllItems() {
        List<Item> items = itemRepository.findAll();
        return items.stream().map(item -> new ItemDTO(
                item.getItemId(),
                item.getName(),
                item.getItemCode(),
                item.getDescription(),
                item.getQuantityInStock(),
                item.getUnit_price(),
                item.getCategory() != null ? item.getCategory().getDescription() : null,
                item.getSupplier() != null ? item.getSupplier().getName() : null,
                item.getReOrderLevel(),
                item.getQrPath()
        )).collect(Collectors.toList());
    }


    public void getCounts(){
        long items = itemRepository.count();
        long stocks = stockTransactionRepository.count();
        long stockIn = stockTransactionRepository.countByType("STOCK_IN");
        long stockOut = stocks - stockIn;

        System.out.println(items);
    }



}