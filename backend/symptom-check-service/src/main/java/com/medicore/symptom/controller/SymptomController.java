package com.medicore.symptom.controller;

import com.medicore.common.dto.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class SymptomController {

    private static final Map<String, String> RULES = Map.ofEntries(
            Map.entry("chest", "Cardiology"), Map.entry("heart", "Cardiology"), Map.entry("cardiac", "Cardiology"),
            Map.entry("child", "Pediatrics"), Map.entry("pediatric", "Pediatrics"), Map.entry("baby", "Pediatrics"),
            Map.entry("bone", "Orthopedics"), Map.entry("joint", "Orthopedics"), Map.entry("fracture", "Orthopedics"),
            Map.entry("headache", "Neurology"), Map.entry("seizure", "Neurology"), Map.entry("brain", "Neurology"),
            Map.entry("fever", "General Medicine"), Map.entry("cough", "General Medicine"), Map.entry("cold", "General Medicine")
    );

    @PostMapping("/symptom-check")
    public ApiResponse<Result> check(@RequestBody Request req) {
        String text = req.getSymptoms().toLowerCase();
        String dept = "General Medicine";
        int hits = 0;
        for (var e : RULES.entrySet()) {
            if (text.contains(e.getKey())) {
                dept = e.getValue();
                hits++;
            }
        }
        Result r = new Result();
        r.setDepartment(dept);
        r.setConfidence(Math.min(0.95, 0.5 + hits * 0.15));
        r.setKeywords(List.of(dept));
        return ApiResponse.ok(r);
    }

    @Data
    public static class Request {
        @NotBlank
        private String symptoms;
    }

    @Data
    public static class Result {
        private String department;
        private double confidence;
        private List<String> keywords;
    }
}
