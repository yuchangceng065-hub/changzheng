//go:build !windows && !darwin

package main

func configureConsole() {}

func acquireStartupLock() (func(), error) { return func() {}, nil }
