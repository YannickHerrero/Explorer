# Cross-compile the Explorer Tauri app for Windows from WSL and install the
# standalone .exe (no installer, no WebView2 download) into the Windows
# Documents/apps folder.

TARGET := x86_64-pc-windows-gnu
# NOTE: the deployed binary is named explorer-app.exe ON PURPOSE. Do NOT rename
# it to Explorer.exe -- `taskkill /IM` matches image names case-insensitively,
# so killing "Explorer.exe" would also kill the Windows shell (explorer.exe).
BIN := explorer-app.exe
LOADER := WebView2Loader.dll
RELEASE_DIR := src-tauri/target/$(TARGET)/release

ifndef WIN_USER
WIN_USER := $(shell cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r\n')
endif
DEST_DIR := /mnt/c/Users/$(WIN_USER)/Documents/apps

.PHONY: default build install kill clean deploy
default: install

build:
	@test -d node_modules || bun install
	bun tauri build --no-bundle --target $(TARGET)

kill:
	@cmd.exe /c "taskkill /IM $(BIN) >nul 2>&1" 2>/dev/null || true
	@sleep 0.4
	@cmd.exe /c "taskkill /F /IM $(BIN) >nul 2>&1" 2>/dev/null || true

install: build kill
	@test -n "$(WIN_USER)" || { echo "ERROR: WIN_USER is empty (cmd.exe detection failed). Run with WIN_USER=<name>."; exit 1; }
	mkdir -p $(DEST_DIR)
	cp $(RELEASE_DIR)/$(BIN) $(DEST_DIR)/$(BIN)
	cp $(RELEASE_DIR)/$(LOADER) $(DEST_DIR)/$(LOADER)
	@echo "Installed: $(DEST_DIR)/$(BIN)  (+ $(LOADER) alongside it)"

clean:
	cargo clean --manifest-path src-tauri/Cargo.toml
	rm -rf dist

deploy:
	@./scripts/deploy.sh $(BUMP)
