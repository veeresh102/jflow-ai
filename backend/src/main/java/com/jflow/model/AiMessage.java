package com.jflow.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long projectId;

    private String role; // user, assistant

    @Column(length = 5000)
    private String content;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
