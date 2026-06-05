package com.iim.iim.service;

import com.iim.iim.dto.ContactRequest;
import com.iim.iim.entity.EmailOtp;
import com.iim.iim.repository.EmailOtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailOtpRepository otpRepo;

    public String sendOtp(String email) {

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(email);
        emailOtp.setOtp(otp);
        emailOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepo.save(emailOtp);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your OTP Verification Code");
        message.setText("Your OTP is: " + otp + "\nValid for 5 minutes.");

        mailSender.send(message);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {

        Optional<EmailOtp> optional = otpRepo.findByEmail(email);

        if (optional.isEmpty()) return false;

        EmailOtp savedOtp = optional.get();

        if (!savedOtp.getOtp().equals(otp)) return false;

        if (savedOtp.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        return true;
    }

    public String deleteOtp(String email)
    {
        Optional<EmailOtp>  eo = otpRepo.findByEmail(email);
        if(eo.isPresent())
        {
            otpRepo.deleteById(eo.get().getId());
            return "otp Delete Successfully";
        }
        return null;
    }

    public String sendContactMail(ContactRequest request) {

        SimpleMailMessage mail = new SimpleMailMessage();

        mail.setTo(request.getEmail());
        mail.setSubject(" IIM System");

        String body =
                "New Contact Form Submission\n\n" +
                        "Name: " + request.getName() + "\n" +
                        "Email: " + request.getEmail() + "\n" +
                        "Company: " + request.getCompany() + "\n\n" +
                        "Message:\n" + request.getMessage();

        mail.setText(body);

        mailSender.send(mail);

        return "Message sent successfully";
    }
}