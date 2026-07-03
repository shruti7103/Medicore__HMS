package com.medicore.pharmacy.repository;
import com.medicore.pharmacy.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByStockQtyLessThanEqual(Integer reorderLevel);
}
