package com.jflow.service;

import com.jflow.model.Project;
import com.jflow.model.Task;
import com.jflow.repository.ProjectRepository;
import com.jflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByUpdatedAtDesc();
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    @Transactional
    public Project createProject(Project project) {
        project.setStatus("ACTIVE");
        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, Project updated) {
        return projectRepository.findById(id).map(p -> {
            p.setName(updated.getName());
            p.setDescription(updated.getDescription());
            p.setTechStack(updated.getTechStack());
            p.setStatus(updated.getStatus());
            return projectRepository.save(p);
        }).orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }

    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    public Map<String, Object> getProjectStats(Long id) {
        Map<String, Object> stats = new HashMap<>();
        long total = taskRepository.countByProjectId(id);
        long done = taskRepository.countByProjectIdAndStatus(id, "DONE");
        long inProgress = taskRepository.countByProjectIdAndStatus(id, "IN_PROGRESS");
        long todo = taskRepository.countByProjectIdAndStatus(id, "TODO");
        stats.put("total", total);
        stats.put("done", done);
        stats.put("inProgress", inProgress);
        stats.put("todo", todo);
        stats.put("completionPercent", total > 0 ? (int)((done * 100) / total) : 0);
        return stats;
    }
}
