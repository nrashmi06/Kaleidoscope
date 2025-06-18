package com.kaleidoscope.backend.shared.exception.categoryException;

public class CategoryAlreadyExistsException extends RuntimeException {
    public CategoryAlreadyExistsException(String name) {
        super("Category already exists with name: " + name);
    }
}