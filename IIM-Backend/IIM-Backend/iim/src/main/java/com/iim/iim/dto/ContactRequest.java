package com.iim.iim.dto;

public class ContactRequest {

    private String name;
    private String email;
    private String to;
    private String company;
    private String message;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTo()
    {
        return to;
    }
    public void setTo(String to)
    {
        this.to = to;
    }


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}