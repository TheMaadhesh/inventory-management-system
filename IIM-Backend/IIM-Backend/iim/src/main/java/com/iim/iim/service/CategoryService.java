package com.iim.iim.service;

import com.iim.iim.dto.CategoryDTO;
import com.iim.iim.entity.Category;
import com.iim.iim.entity.Status;
import com.iim.iim.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public Category findId(long id)
    {
      Optional<Category> cat =  categoryRepository.findById(id);
      if (cat.isPresent())
      {
          return  cat.get();
      }
      return null;
    }
    public Category saveCategory(Category c)
    {
        if (c != null)
        {
            categoryRepository.save(c);
        }
        return  null;
    }
    public String updateCategory(Category c)
    {
     Optional<Category> cat = categoryRepository.findById(c.getCategoryId());
     if(cat.isPresent())
     {
        Category existingCat = cat.get();
        existingCat.setName(c.getName() != null && !c.getName().isEmpty() ? c.getName() : existingCat.getName() );
        existingCat.setDescription(c.getName() != null && !c.getDescription().isEmpty() ? c.getDescription() : existingCat.getDescription());
        existingCat.setItems(c.getItems() != null && !c.getItems().isEmpty() ? c.getItems() : existingCat.getItems());
        saveCategory(existingCat);
        return "Product Updated SuccessFully";
     }
        return "Check the Product Id";
    }

    public String deleteCategory(long id)
    {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return "Category Deleted Successfully";
        }

        return "Category Not Found";
    }

    public List<CategoryDTO> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(c -> new CategoryDTO(c.getCategoryId(), c.getDescription(), c.getStatus(),c.getName()))
                .collect(Collectors.toList());
    }

    public void updateStatus(long id, Status status)
    {
       Optional<Category> op =   categoryRepository.findById(id);
       if(op.isPresent())
       {
           op.get().setStatus(status);
           categoryRepository.save(op.get());
       }
    }


}
