package com.jflow.config;

import com.jflow.model.Project;
import com.jflow.model.Task;
import com.jflow.repository.ProjectRepository;
import com.jflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    @Override
    public void run(String... args) {
        if (projectRepository.count() > 0) return;

        // Project 1: Order-API-Backend
        Project p1 = projectRepository.save(Project.builder()
                .name("Order-API-Backend")
                .description("Sprint 14: Resilience & Security Refactoring")
                .techStack("SPRING BOOT • MAVEN")
                .status("ACTIVE")
                .build());

        taskRepository.save(Task.builder().project(p1).title("Setup Spring Security with Keycloak")
                .status("TODO").priority("HIGH").label("BACKEND").build());
        taskRepository.save(Task.builder().project(p1).title("Refactor JpaRepository to use Specification API")
                .description("Migrate query methods to use Spring Data Specifications for dynamic filtering")
                .status("IN_PROGRESS").priority("HIGH").label("BACKEND").build());
        taskRepository.save(Task.builder().project(p1).title("Initial Flyway Migration Setup")
                .status("DONE").priority("MEDIUM").label("BACKEND").build());
        taskRepository.save(Task.builder().project(p1).title("Define Dockerfile for native GraalVM build")
                .status("IN_PROGRESS").priority("MEDIUM").label("DEVOPS").build());
        taskRepository.save(Task.builder().project(p1).title("Write integration tests for Order endpoints")
                .status("TODO").priority("LOW").label("TESTING").build());

        // Project 2: AuthService-Module
        Project p2 = projectRepository.save(Project.builder()
                .name("AuthService-Module")
                .description("OAuth2 + JWT implementation")
                .techStack("JAVA • SPRING")
                .status("ACTIVE")
                .build());

        taskRepository.save(Task.builder().project(p2).title("Implement JWT token refresh logic")
                .status("IN_PROGRESS").priority("HIGH").label("BACKEND").build());
        taskRepository.save(Task.builder().project(p2).title("Add rate limiting middleware")
                .status("TODO").priority("MEDIUM").label("BACKEND").build());
        taskRepository.save(Task.builder().project(p2).title("OAuth2 Google provider setup")
                .status("DONE").priority("HIGH").label("BACKEND").build());

        // Project 3: UI-Core-Module
        Project p3 = projectRepository.save(Project.builder()
                .name("UI-Core-Module")
                .description("React component library")
                .techStack("JAVA FRONTEND • VITE")
                .status("ACTIVE")
                .build());

        taskRepository.save(Task.builder().project(p3).title("Design system tokens setup")
                .status("DONE").priority("HIGH").label("FRONTEND").build());
        taskRepository.save(Task.builder().project(p3).title("Build reusable Table component")
                .status("IN_PROGRESS").priority("MEDIUM").label("FRONTEND").build());
        taskRepository.save(Task.builder().project(p3).title("Dark mode implementation")
                .status("TODO").priority("LOW").label("FRONTEND").build());

        System.out.println("✅ Demo data seeded: 3 projects, 11 tasks");
    }
}
