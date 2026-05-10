package com.jflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jflow.model.AiMessage;
import com.jflow.model.Task;
import com.jflow.repository.AiMessageRepository;
import com.jflow.repository.ProjectRepository;
import com.jflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    private static final int MAX_HISTORY_MESSAGES = 20;

    private final AiMessageRepository aiMessageRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.demo-mode:false}")
    private boolean demoMode;

    @Transactional
    public String chat(Long projectId, String userMessage) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        aiMessageRepository.save(AiMessage.builder()
                .projectId(projectId)
                .role("user")
                .content(userMessage.trim())
                .build());

        String systemPrompt = buildProjectContext(projectId);
        List<AiMessage> history = aiMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        List<Map<String, String>> messages = toGeminiHistory(history);

        String assistantReply = callGeminiApi(systemPrompt, messages);

        aiMessageRepository.save(AiMessage.builder()
                .projectId(projectId)
                .role("assistant")
                .content(assistantReply)
                .build());

        return assistantReply;
    }

    private String buildProjectContext(Long projectId) {
        List<Task> tasks = taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        StringBuilder context = new StringBuilder();
        context.append("You are J-Flow AI, an intelligent project management assistant. ");
        context.append("You help small development teams manage tasks, track progress, and get things done.\n\n");
        context.append("Current project has ").append(tasks.size()).append(" tasks:\n");
        for (Task task : tasks) {
            context.append("- [").append(valueOrDefault(task.getStatus(), "TODO")).append("] ")
                    .append(task.getTitle());
            if (task.getPriority() != null && !task.getPriority().isBlank()) {
                context.append(" | priority: ").append(task.getPriority());
            }
            if (task.getLabel() != null && !task.getLabel().isBlank()) {
                context.append(" | label: ").append(task.getLabel());
            }
            if (task.getAssignee() != null && !task.getAssignee().isBlank()) {
                context.append(" | assignee: ").append(task.getAssignee());
            }
            context.append("\n");
        }
        context.append("\nBe concise, helpful, and actionable. ");
        context.append("Suggest task breakdowns, priorities, blockers, acceptance criteria, and next steps when useful.");
        return context.toString();
    }

    private List<Map<String, String>> toGeminiHistory(List<AiMessage> history) {
        int fromIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        List<Map<String, String>> messages = new ArrayList<>();
        String previousRole = null;
        for (AiMessage msg : history.subList(fromIndex, history.size())) {
            if (msg.getContent() == null || msg.getContent().isBlank()) {
                continue;
            }
            String role = "assistant".equals(msg.getRole()) ? "model" : "user";
            if (messages.isEmpty() && "model".equals(role)) {
                continue;
            }
            if (role.equals(previousRole)) {
                Map<String, String> previousMessage = messages.get(messages.size() - 1);
                previousMessage.put("content", previousMessage.get("content") + "\n\n" + msg.getContent());
                continue;
            }
            Map<String, String> message = new HashMap<>();
            message.put("role", role);
            message.put("content", msg.getContent());
            messages.add(message);
            previousRole = role;
        }
        return messages;
    }

    private String callGeminiApi(String systemPrompt, List<Map<String, String>> messages) {
        if (shouldUseDemoMode()) {
            return generateDemoResponse(messages);
        }

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
            body.put("contents", buildGeminiContents(messages));
            body.put("generationConfig", Map.of(
                    "temperature", 0.7,
                    "topP", 0.9,
                    "maxOutputTokens", 1024
            ));

            String requestBody = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return extractGeminiError(json, response.statusCode());
            }

            String text = extractGeminiText(json);
            if (text == null || text.isBlank()) {
                return "Gemini returned an empty response. Please try again.";
            }
            return text.trim();
        } catch (Exception e) {
            return "Gemini service error: " + e.getMessage();
        }
    }

    private boolean shouldUseDemoMode() {
        return demoMode || apiKey == null || apiKey.isBlank() || "demo-key".equalsIgnoreCase(apiKey.trim());
    }

    private List<Map<String, Object>> buildGeminiContents(List<Map<String, String>> messages) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (Map<String, String> message : messages) {
            contents.add(Map.of(
                    "role", message.get("role"),
                    "parts", List.of(Map.of("text", message.get("content")))
            ));
        }
        return contents;
    }

    private String extractGeminiText(JsonNode json) {
        JsonNode candidates = json.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return null;
        }
        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return null;
        }
        StringBuilder text = new StringBuilder();
        for (JsonNode part : parts) {
            String value = part.path("text").asText(null);
            if (value != null) {
                text.append(value);
            }
        }
        return text.toString();
    }

    private String extractGeminiError(JsonNode json, int statusCode) {
        String message = json.path("error").path("message").asText("Unknown Gemini API error");
        return "Gemini API error (HTTP " + statusCode + "): " + message;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String generateDemoResponse(List<Map<String, String>> messages) {
        String lastMsg = messages.isEmpty() ? "" : messages.get(messages.size() - 1).get("content").toLowerCase();

        if (lastMsg.contains("suggest") || lastMsg.contains("task") || lastMsg.contains("what")) {
            return "Based on your current project tasks, I suggest:\n\n" +
                   "1. **Prioritize IN_PROGRESS items** — finish what's started before pulling new work\n" +
                   "2. **Break large tasks** into smaller subtasks (2-4 hours each)\n" +
                   "3. **Daily standup** — review TODO → IN_PROGRESS transitions every morning\n\n" +
                   "_Tip: Set `GEMINI_API_KEY` to unlock live Gemini responses._";
        } else if (lastMsg.contains("help") || lastMsg.contains("how")) {
            return "I'm J-Flow AI, your project assistant! I can help you:\n\n" +
                   "- 📋 **Analyze your backlog** and suggest priorities\n" +
                   "- 🔍 **Identify blockers** in your workflow\n" +
                   "- 💡 **Generate task descriptions** and acceptance criteria\n" +
                   "- 📊 **Summarize sprint progress**\n\n" +
                   "Ask me anything about your project!";
        } else if (lastMsg.contains("sprint") || lastMsg.contains("progress")) {
            return "Your sprint looks on track! Here's a quick summary:\n\n" +
                   "✅ Tasks in DONE are ready for review\n" +
                   "🔄 IN_PROGRESS items need daily check-ins\n" +
                   "📌 TODO backlog should be groomed this week\n\n" +
                   "Keep the momentum going! Would you like me to suggest a sprint goal?";
        } else {
            return "I'm here to help with your project! You can ask me to:\n" +
                   "- Analyze your current tasks and priorities\n" +
                   "- Suggest improvements to your workflow\n" +
                   "- Help write task descriptions\n" +
                   "- Identify potential blockers\n\n" +
                   "What would you like to focus on?";
        }
    }

    public List<AiMessage> getChatHistory(Long projectId) {
        return aiMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }

    @Transactional
    public void clearHistory(Long projectId) {
        aiMessageRepository.deleteByProjectId(projectId);
    }
}
