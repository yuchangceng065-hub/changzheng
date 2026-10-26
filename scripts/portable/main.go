package main

import (
	"bufio"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

//go:embed web
var website embed.FS

var siteID = "development"

const appID = "changzheng-portable"
const firstPort = 17834
const lastPort = 17844
const instancePath = "/__changzheng_instance"

type instance struct {
	App  string `json:"app"`
	Site string `json:"site"`
}

func main() {
	configureConsole()
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "启动失败：", err)
		fmt.Println("按回车键关闭窗口。")
		bufio.NewReader(os.Stdin).ReadString('\n')
		os.Exit(1)
	}
}

func run() error {
	releaseStartup, err := acquireStartupLock()
	if err != nil {
		return err
	}
	locked := true
	unlockStartup := func() {
		if locked {
			releaseStartup()
			locked = false
		}
	}
	defer unlockStartup()
	files, err := fs.Sub(website, "web")
	if err != nil {
		return err
	}
	client := &http.Client{
		Timeout: 300 * time.Millisecond,
		Transport: &http.Transport{
			Proxy:             nil,
			DisableKeepAlives: true,
			DialContext:       (&net.Dialer{Timeout: 200 * time.Millisecond}).DialContext,
		},
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse },
	}
	for port := firstPort; port <= lastPort; port++ {
		if sameInstance(client, port) {
			url := address(port)
			fmt.Println("网站已在运行：", url)
			openBrowser(url)
			return nil
		}
	}

	var listener net.Listener
	var port int
	for port = firstPort; port <= lastPort; port++ {
		listener, err = net.Listen("tcp4", net.JoinHostPort("127.0.0.1", strconv.Itoa(port)))
		if err == nil {
			break
		}
	}
	if listener == nil {
		return fmt.Errorf("本地端口 %d—%d 暂时无法使用，请关闭其他本地网站后重新打开", firstPort, lastPort)
	}

	for extension, contentType := range map[string]string{
		".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
		".json": "application/json; charset=utf-8", ".webp": "image/webp",
		".mp4": "video/mp4", ".mp3": "audio/mpeg",
	} {
		mime.AddExtensionType(extension, contentType)
	}
	staticFiles := http.FileServer(http.FS(files))
	server := &http.Server{
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    16 << 10,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			host, requestPort, hostError := net.SplitHostPort(r.Host)
			if hostError != nil || requestPort != strconv.Itoa(port) || (host != "127.0.0.1" && host != "localhost") {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			if r.Method != http.MethodGet && r.Method != http.MethodHead {
				w.Header().Set("Allow", "GET, HEAD")
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("X-Content-Type-Options", "nosniff")
			if r.URL.Path == instancePath {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				json.NewEncoder(w).Encode(instance{App: appID, Site: siteID})
				return
			}
			cleanPath := path.Clean("/" + r.URL.Path)
			if cleanPath != "/" {
				info, statError := fs.Stat(files, strings.TrimPrefix(cleanPath, "/"))
				if statError != nil || info.IsDir() {
					http.NotFound(w, r)
					return
				}
			}
			staticFiles.ServeHTTP(w, r)
		}),
	}
	serveError := make(chan error, 1)
	go func() { serveError <- server.Serve(listener) }()
	ready := false
	for attempt := 0; attempt < 10; attempt++ {
		if sameInstance(client, port) {
			ready = true
			break
		}
		select {
		case err := <-serveError:
			return err
		default:
		}
		time.Sleep(100 * time.Millisecond)
	}
	if !ready {
		server.Close()
		return fmt.Errorf("本地网站未能就绪，请重新打开程序")
	}
	unlockStartup()

	fmt.Println("长征征途 · 本地免安装版")
	fmt.Println()
	fmt.Println("网站地址：", address(port))
	fmt.Println("正在打开浏览器。若没有自动打开，请复制上面的地址到浏览器。")
	fmt.Println("使用期间保留此窗口；关闭窗口或按 Ctrl+C 即可退出。")
	openBrowser(address(port))

	stop := make(chan os.Signal, 1)
	exitSignals := []os.Signal{os.Interrupt, syscall.SIGTERM}
	if runtime.GOOS == "darwin" {
		exitSignals = append(exitSignals, syscall.Signal(1)) // Terminal 关闭时发送 SIGHUP。
	}
	signal.Notify(stop, exitSignals...)
	defer signal.Stop(stop)
	select {
	case err := <-serveError:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-stop:
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		return server.Shutdown(ctx)
	}
	return nil
}

func address(port int) string {
	return "http://127.0.0.1:" + strconv.Itoa(port) + "/"
}

func sameInstance(client *http.Client, port int) bool {
	response, err := client.Get(address(port) + strings.TrimPrefix(instancePath, "/"))
	if err != nil {
		return false
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return false
	}
	var running instance
	if json.NewDecoder(io.LimitReader(response.Body, 2048)).Decode(&running) != nil {
		return false
	}
	return running.App == appID && running.Site == siteID
}

func openBrowser(url string) {
	if os.Getenv("CHANGZHENG_NO_OPEN") == "1" {
		return
	}
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = exec.Command(filepath.Join(os.Getenv("SystemRoot"), "System32", "rundll32.exe"), "url.dll,FileProtocolHandler", url)
	case "darwin":
		command = exec.Command("open", url)
	default:
		command = exec.Command("xdg-open", url)
	}
	if err := command.Start(); err != nil {
		fmt.Println("请手动打开浏览器，访问：", url)
		return
	}
	go command.Wait()
}
