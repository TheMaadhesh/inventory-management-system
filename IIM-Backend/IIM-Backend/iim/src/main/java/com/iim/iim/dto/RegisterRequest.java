package com.iim.iim.dto;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.*;
import com.iim.iim.entity.Role;

@Getter
@Setter
public class RegisterRequest {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String mobile;
    private String gender;
    private boolean emailVerified;
    private String path;
    private Role role;
}