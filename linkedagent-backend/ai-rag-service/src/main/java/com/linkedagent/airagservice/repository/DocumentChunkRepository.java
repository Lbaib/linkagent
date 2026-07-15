package com.linkedagent.airagservice.repository;

import com.linkedagent.airagservice.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import com.linkedagent.airagservice.dto.DocumentStat;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    @Query(value = "SELECT content FROM document_chunks ORDER BY embedding <-> CAST(:vector AS vector) LIMIT 3", nativeQuery = true)
    List<String> findTop3Similar(@Param("vector") String vector);

    @Query("SELECT d.documentName as documentName, COUNT(d) as chunkCount FROM DocumentChunk d GROUP BY d.documentName")
    List<DocumentStat> getDocumentStats();

    @Transactional
    @Modifying
    @Query("DELETE FROM DocumentChunk d WHERE d.documentName = :documentName")
    void deleteByDocumentName(@Param("documentName") String documentName);
}
