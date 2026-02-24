package main

import "testing"

func TestBasic(t *testing.T) {
	expected := true
	if !expected {
		t.Errorf("Expected %v, got %v", true, expected)
	}
}
