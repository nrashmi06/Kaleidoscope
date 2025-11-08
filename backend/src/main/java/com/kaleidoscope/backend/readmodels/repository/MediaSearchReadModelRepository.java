
package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MediaSearchReadModelRepository extends JpaRepository<MediaSearchReadModel, Long> {
}

