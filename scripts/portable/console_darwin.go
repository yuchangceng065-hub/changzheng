//go:build darwin

package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

func configureConsole() {}

func acquireStartupLock() (func(), error) {
	file, err := os.OpenFile(filepath.Join(os.TempDir(), appID+"-"+siteID+".lock"), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, fmt.Errorf("无法准备启动程序：%w", err)
	}
	deadline := time.Now().Add(15 * time.Second)
	for {
		err = syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
		if err == nil {
			return func() {
				syscall.Flock(int(file.Fd()), syscall.LOCK_UN)
				file.Close()
			}, nil
		}
		if !errors.Is(err, syscall.EWOULDBLOCK) && !errors.Is(err, syscall.EAGAIN) {
			file.Close()
			return nil, fmt.Errorf("无法锁定启动程序：%w", err)
		}
		if time.Now().After(deadline) {
			file.Close()
			return nil, fmt.Errorf("另一个窗口正在启动网站，请稍后重试")
		}
		time.Sleep(100 * time.Millisecond)
	}
}
