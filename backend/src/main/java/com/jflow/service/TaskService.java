package com.jflow.service;

import com.jflow.model.Task;
import com.jflow.repository.ProjectRepository;
import com.jflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public List<Task> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public Task createTask(Long projectId, Task task) {
        return projectRepository.findById(projectId).map(project -> {
            task.setProject(project);
            if (task.getStatus() == null) task.setStatus("TODO");
            if (task.getPriority() == null) task.setPriority("MEDIUM");
            return taskRepository.save(task);
        }).orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
    }

    @Transactional
    public Task updateTask(Long id, Task updated) {
        return taskRepository.findById(id).map(t -> {
            t.setTitle(updated.getTitle());
            t.setDescription(updated.getDescription());
            t.setStatus(updated.getStatus());
            t.setPriority(updated.getPriority());
            t.setLabel(updated.getLabel());
            t.setAssignee(updated.getAssignee());
            return taskRepository.save(t);
        }).orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    @Transactional
    public Task updateTaskStatus(Long id, String status) {
        return taskRepository.findById(id).map(t -> {
            t.setStatus(status);
            return taskRepository.save(t);
        }).orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    @Transactional
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
