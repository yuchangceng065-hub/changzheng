//go:build windows

package main

import (
	"fmt"
	"runtime"
	"syscall"
	"unsafe"
)

func configureConsole() {
	kernel := syscall.NewLazyDLL("kernel32.dll")
	kernel.NewProc("SetConsoleOutputCP").Call(65001)
	kernel.NewProc("SetConsoleCP").Call(65001)
}

func acquireStartupLock() (func(), error) {
	// Windows mutex ownership belongs to the OS thread that acquires it.
	runtime.LockOSThread()
	kernel := syscall.NewLazyDLL("kernel32.dll")
	name, err := syscall.UTF16PtrFromString("Local\\" + appID + "-" + siteID)
	if err != nil {
		runtime.UnlockOSThread()
		return nil, err
	}
	handle, _, createError := kernel.NewProc("CreateMutexW").Call(0, 0, uintptr(unsafe.Pointer(name)))
	if handle == 0 {
		runtime.UnlockOSThread()
		return nil, fmt.Errorf("无法准备启动程序：%v", createError)
	}
	status, _, _ := kernel.NewProc("WaitForSingleObject").Call(handle, 15000)
	if status != 0 && status != 0x80 {
		kernel.NewProc("CloseHandle").Call(handle)
		runtime.UnlockOSThread()
		return nil, fmt.Errorf("另一个窗口正在启动网站，请稍后重试")
	}
	return func() {
		kernel.NewProc("ReleaseMutex").Call(handle)
		kernel.NewProc("CloseHandle").Call(handle)
		runtime.UnlockOSThread()
	}, nil
}
