package com.iim.iim.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.iim.iim.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}