package com.medicore.analytics;
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;
@SpringBootApplication @Import(CommonAutoConfiguration.class)
public class AnalyticsServiceApplication {
 public static void main(String[] a) { SpringApplication.run(AnalyticsServiceApplication.class,a); }
 @Bean @LoadBalanced RestTemplate restTemplate() { return new RestTemplate(); }
}
