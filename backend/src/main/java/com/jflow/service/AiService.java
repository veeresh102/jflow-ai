package com.jflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jflow.model.AiMessage;
import com.jflow.model.Task;
import com.jflow.repository.AiMessageRepository;
import com.jflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    private final AiMessageRepository aiMessageRepository;
    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Value("${anthropic.api.key}")
    private String apiKey;

    @Value("${anthropic.api.url}")
    private String apiUrl;

    @Transactional
    public String chat(Long projectId, String userMessage) {
        // Save user message
        aiMessageRepository.save(AiMessage.builder()
                .projectId(projectId)
                .role("user")
                .content(userMessage)
                .build());

        // Build context about project tasks
        List<Task> tasks = taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        StringBuilder context = new StringBuilder();
        context.append("You are J-Flow AI, an intelligent project management assistant. ");
        context.append("You help small development teams manage tasks, track progress, and get things done.\n\n");
        context.append("Current project has ").append(tasks.size()).append(" tasks:\n");
        for (Task t : tasks) {
            context.append("- [").append(t.getStatus()).append("] ").append(t.getTitle());
            if (t.getLabel() != null) context.append(" (").append(t.getLabel()).append(")");
            context.append("\n");
        }
        context.append("\nBe concise, helpful, and actionable. You can suggest task breakdowns, priorities, and improvements.");

        // Get history
        List<AiMessage> history = aiMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        List<Map<String, String>> messages = new ArrayList<>();
        for (AiMessage msg : history) {
            Map<String, String> m = new HashMap<>();
            m.put("role", msg.getRole());
            m.put("content", msg.getContent());
            messages.add(m);
        }

        String assistantReply = callAnthropicApi(context.toString(), messages);

        // Save assistant reply
        aiMessageRepository.save(AiMessage.builder()
                .projectId(projectId)
                .role("assistant")
                .content(assistantReply)
                .build());

        return assistantReply;
    }

    private String callAnthropicApi(String systemPrompt, List<Map<String, String>> messages) {
        // Check if using demo key
        if (apiKey == null || apiKey.equals("demo-key") || !apiKey.startsWith("AIzaSy")) {
            return generateDemoResponse(messages);
        }

        try {
            // Convert messages to Gemini format
            List<Map<String, Object>> contents = new ArrayList<>();
            
            // Add system prompt as first message
            Map<String, Object> systemMsg = new HashMap<>();
            systemMsg.put("role", "user");
            Map<String, Object> systemPart = new HashMap<>();
            systemPart.put("text", systemPrompt);
            systemMsg.put("parts", List.of(systemPart));
            contents.add(systemMsg);
            
            // Add conversation history
            for (Map<String, String> msg : messages) {
                Map<String, Object> content = new HashMap<>();
                String role = "user".equals(msg.get("role")) ? "user" : "model";
                content.put("role", role);
                
                Map<String, Object> part = new HashMap<>();
                part.put("text", msg.get("content"));
                content.put("parts", List.of(part));
                contents.add(content);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);

            String requestBody = objectMapper.writeValueAsString(body);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());

            if (json.has("candidates") && json.get("candidates").isArray() && json.get("candidates").size() > 0) {
                JsonNode candidate = json.get("candidates").get(0);
                if (candidate.has("content") && candidate.get("content").has("parts")) {
                    JsonNode parts = candidate.get("content").get("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).get("text").asText();
                    }
                }
            }
            return "I encountered an issue connecting to the AI service. Please check your API key.";
        } catch (Exception e) {
            return "AI service error: " + e.getMessage();
        }
    }

    private String generateDemoResponse(List<Map<String, String>> messages) {
        String lastMsg = messages.isEmpty() ? "" : messages.get(messages.size() - 1).get("content").toLowerCase();

        if (lastMsg.contains("suggest") || lastMsg.contains("task") || lastMsg.contains("what")) {
            return "Based on your current project tasks, I suggest:\n\n" +
                   "1. **Prioritize IN_PROGRESS items** — finish what's started before pulling new work\n" +
                   "2. **Break large tasks** into smaller subtasks (2-4 hours each)\n" +
                   "3. **Daily standup** — review TODO → IN_PROGRESS transitions every morning\n\n" +
                   "_Tip: Set your `ANTHROPIC_API_KEY` env variable to unlock full AI capabilities!_";
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
