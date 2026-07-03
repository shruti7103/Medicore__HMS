package com.medicore.nurse;
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
@SpringBootApplication @Import(CommonAutoConfiguration.class)
public class NurseServiceApplication { public static void main(String[] a) { SpringApplication.run(NurseServiceApplication.class,a); } }
