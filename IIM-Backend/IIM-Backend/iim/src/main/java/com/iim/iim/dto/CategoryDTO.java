
package com.iim.iim.dto;

import com.iim.iim.entity.Status;

public class CategoryDTO {
    private Long id;
    private String description;
    private Status status;
    private String name;
    public CategoryDTO() {}

    public CategoryDTO(Long id, String description, Status status,String name) {
        this.id = id;
        this.description = description;
        this.status = status;
        this.name = name;
    }



    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getName()
    {
        return name;
    }
    public void setName(String name)
    {
        this.name = name;
    }
}