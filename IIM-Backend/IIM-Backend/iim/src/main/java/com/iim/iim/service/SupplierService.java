package com.iim.iim.service;

import com.iim.iim.entity.Supplier;
import com.iim.iim.repository.SupplierRespository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    @Autowired
    private SupplierRespository supplierRespository;


    public Supplier findSupplier(long id)
    {
        Optional<Supplier> sp = supplierRespository.findById(id);
        if (sp.isPresent())
        {
            return sp.get();
        }
        return null;
    }
    public Supplier saveSupplier(Supplier s)
    {
        return  supplierRespository.save(s);
    }

    public String updateSupplier(Supplier sp)
    {
        Optional<Supplier> existing = supplierRespository.findById(sp.getSupplierId());
        if (existing.isPresent()) {
            Supplier s = existing.get();
            s.setName(sp.getName());
            s.setEmail(sp.getEmail());
            s.setPhoneNo(Long.parseLong(String.valueOf(sp.getPhoneNo())));
            s.setAddress(sp.getAddress());
            s.setContactPerson(sp.getContactPerson());
            supplierRespository.save(s);
            return "Supplier updated successfully";
        } else {
            return "Supplier not found";
        }
    }



    public String deleteSupplier(long id)
    {
        Optional<Supplier> sp = supplierRespository.findById(id);
        if (sp.isPresent())
        {
            supplierRespository.deleteById(id);
            return "Supplier Delete SuccessFully";
        }
        return "Supplier Id Not Found";
    }

    public List<Supplier> getAllSuppliers() {

        return supplierRespository.findAll();
    }

    public long supplierCount(){
        return  supplierRespository.findAll().size();
    }
}
