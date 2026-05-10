package com.jflow.repository;

import com.jflow.model.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findByProjectIdOrderByCreatedAtAsc(Long projectId);
    void deleteByProjectId(Long projectId);
}
