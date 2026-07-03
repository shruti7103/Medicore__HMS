package com.medicore.pharmacy;

import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonAutoConfiguration.class)
public class PharmacyServiceApplication {
    public static void main(String[] args) { SpringApplication.run(PharmacyServiceApplication.class, args); }
}
