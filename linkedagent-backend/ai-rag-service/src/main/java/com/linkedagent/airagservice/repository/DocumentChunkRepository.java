package com.linkedagent.airagservice.repository;

import com.linkedagent.airagservice.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    @Query(value = "SELECT content FROM document_chunks ORDER BY embedding <-> CAST(:vector AS vector) LIMIT 3", nativeQuery = true)
    List<String> findTop3Similar(@Param("vector") String vector);
}
