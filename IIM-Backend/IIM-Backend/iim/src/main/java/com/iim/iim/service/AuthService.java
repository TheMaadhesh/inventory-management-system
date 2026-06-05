package com.iim.iim.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.iim.iim.entity.*;
import com.iim.iim.repository.UserRepository;
import com.iim.iim.dto.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request, MultipartFile image) {

        String fileName = null;

        try {

            if (image != null && !image.isEmpty()) {

                String uploadDir = "C:/images/";
                fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();

                Path uploadPath = Paths.get(uploadDir);

                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                Path filePath = uploadPath.resolve(fileName);

                Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        // create user
        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setGender(request.getGender());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setMobile(request.getMobile());
        user.setRole(request.getRole());
        user.setEmailVerified(request.isEmailVerified());
        user.setPath(fileName); // image filename

        repository.save(user);

        return new AuthResponse("User Registered");
    }
    public AuthResponse login(AuthRequest request) {

        User user = repository.findByEmail(request.getEmail())
                .orElseThrow();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtService.generateToken(user.getEmail(),user.getRole(), user.getId());

        return new AuthResponse(token);
    }


    public User findById(long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(User u)
    {
        Optional<User> existing = repository.findById(u.getId());
        if(existing.isPresent())
        {

            existing.get().setFirstName(!u.getFirstName().isEmpty() ? u.getFirstName() : existing.get().getFirstName());
            existing.get().setLastName(!u.getLastName().isEmpty() ? u.getLastName() : existing.get().getLastName());
            existing.get().setMobile(!u.getMobile().isEmpty() ? u.getMobile() :existing.get().getMobile());
            return repository.save(existing.get());
        }
        return null;
    }
    public String updatePassword(PasswordUpdateRequest request) {

        User user = repository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));


        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }


        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        repository.save(user);

        return "Password updated successfully";
    }

    public List<User> findAllusers(){
        return repository.findAll();
    }

    public String deleteStaff(Long id)
    {
       Optional<User> ul =  repository.findById(id);
       if(ul.isPresent())
       {
           repository.deleteById(ul.get().getId());
           return "delete SuccessFully";
       }
       return "id Not Found";
    }


}