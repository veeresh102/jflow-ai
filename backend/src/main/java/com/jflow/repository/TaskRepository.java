package com.jflow.repository;

import com.jflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Task> findByProjectIdAndStatus(Long projectId, String status);
    long countByProjectId(Long projectId);
    long countByProjectIdAndStatus(Long projectId, String status);
}
