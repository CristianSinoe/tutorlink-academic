package com.sinoe.authmfa.dto.email;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrevoEmailRequest {
    private Map<String, String> sender;
    private List<Map<String, String>> to;
    private String subject;
    private String htmlContent;
}
