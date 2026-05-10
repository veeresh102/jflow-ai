package com.jflow.repository;

import com.jflow.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatusOrderByUpdatedAtDesc(String status);
    List<Project> findAllByOrderByUpdatedAtDesc();
}
