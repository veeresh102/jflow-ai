package com.jflow.controller;

import com.jflow.model.AiMessage;
import com.jflow.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat/{projectId}")
    public ResponseEntity<Map<String, String>> chat(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }
        String reply = aiService.chat(projectId, message);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    @GetMapping("/history/{projectId}")
    public List<AiMessage> getChatHistory(@PathVariable Long projectId) {
        return aiService.getChatHistory(projectId);
    }

    @DeleteMapping("/history/{projectId}")
    public ResponseEntity<Void> clearHistory(@PathVariable Long projectId) {
        aiService.clearHistory(projectId);
        return ResponseEntity.noContent().build();
    }
}
