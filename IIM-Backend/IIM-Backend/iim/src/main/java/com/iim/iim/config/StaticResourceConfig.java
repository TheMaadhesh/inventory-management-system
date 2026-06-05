package com.iim.iim.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/qr/**")
                .addResourceLocations("file:///C:/QrImages/");
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:///C:/images/");
    }

}