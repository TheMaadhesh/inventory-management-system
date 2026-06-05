package com.iim.iim.controller;

import com.iim.iim.dto.ContactRequest;
import com.iim.iim.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequestMapping("/mail")
public class EmaiController {
    @Autowired
    private OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        String otp = otpService.sendOtp(email);
        return ResponseEntity.ok(otp);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestParam String email,
            @RequestParam String otp) {

        boolean valid = otpService.verifyOtp(email, otp);

        if (valid) {
            return ResponseEntity.ok("OTP Verified");
        }
        return ResponseEntity.badRequest().body("Invalid or Expired OTP");
    }



    public EmaiController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send/mail")
    public ResponseEntity<?> sendContact(@RequestBody ContactRequest request) {

        String response = otpService.sendContactMail(request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete-otp")
    public String deleteOtp(@RequestParam String email)
    {
        return otpService.deleteOtp(email);
    }
}
