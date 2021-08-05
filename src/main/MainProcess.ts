"use strict";
import "reflect-metadata";
import path from "path";
import fs from "fs";
import util from "util";
import {
  shell,
  dialog,
  app,
  protocol,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  screen
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import WindowPromise from "./WindowPromise";
import RpcController from "./RpcController";
import storeFactory from "./store/storeFactory";
import documentStateFactory from "./store/DocumentState";
import partsListStateFactory from "./store/PartsListState";
import LdrModelLoader from "@/app/files/LdrModelLoader";
import Settings from "@/app/settings/Settings";
import MainState from "./store/MainState";
import { Store } from "vuex";
import { Rect } from "@/components/DockingLayout/Rect";
import { DockingLayoutConfig } from "@/components/DockingLayout/DockingLayoutConfig";

const readFileAsync = util.promisify(fs.readFile);

const isDevelopment = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

declare let __static: string;

export default class MainProcess {
  private windows = new Set<BrowserWindow>();
  private windowPromises = new Map<number, WindowPromise>();
  private rpcController: RpcController;
  private menuStates = new Map<number, Map<string, boolean>>();
  private settings = new Settings();
  private store: Store<MainState>;
  private ldrModelLoader: LdrModelLoader;

  constructor() {
    // Scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([
      { scheme: "app", privileges: { secure: true, standard: true } }
    ]);

    this.ldrModelLoader = new LdrModelLoader(this.settings);

    // Create the vuex state shared by all renderer processes
    this.store = storeFactory(
      documentStateFactory(),
      partsListStateFactory(this.ldrModelLoader)
    );
    this.rpcController = new RpcController(this, this.store);
    this.ldrModelLoader.store = this.store;

    this.store.dispatch("partsList/load");

    app.on("window-all-closed", () => this.handleWindowAllClosed());
    app.on("activate", () => this.handleActivate());
    app.on("ready", () => this.handleReady());
    app.on("open-file", (e, p) => this.handleOpenFile(e, p));

    // Exit cleanly on request from parent process in development mode.
    if (isDevelopment) {
      if (process.platform === "win32") {
        process.on("message", (data) => {
          if (data === "graceful-exit") {
            app.quit();
          }
        });
      } else {
        process.on("SIGTERM", () => {
          app.quit();
        });
      }
    }

    // Setup a listener for the event that indicates the browser windows ipc listener
    // is hooked up and ready to receive.
    ipcMain.on("READY", (event) => {
      const id = event.sender.id;

      for (const window of this.windows) {
        if (window.webContents.id === id) {
          const windowPromise = this.windowPromises.get(id);
          if (windowPromise) {
            this.windowPromises.delete(id);
            windowPromise.resolve(window);
          }
        }
      }
    });

    ipcMain.on("MENU", (_event, menu: string, disabled: boolean) => {
      // Store the menu states by window
      let states = this.menuStates.get(_event.sender.id);
      if (!states) {
        states = new Map<string, boolean>();
        this.menuStates.set(_event.sender.id, states);
      }

      states.set(menu, disabled);

      // Update the menu if the state change came from the current window
      const currentWindow = BrowserWindow.getFocusedWindow();
      if (currentWindow && currentWindow.webContents.id == _event.sender.id) {
        const mainMenu = Menu.getApplicationMenu();
        if (mainMenu) {
          const menuItem = mainMenu.getMenuItemById(menu);
          if (menuItem) {
            menuItem.enabled = !disabled;
          }
        }
      }
    });
  }

  // Quit when all windows are closed.
  private handleWindowAllClosed(): boolean {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform === "darwin") {
      // Disable all the menus that need to be disabled
      const mainMenu = Menu.getApplicationMenu();
      if (mainMenu) {
        const saveMenuItem = mainMenu.getMenuItemById("save");
        if (saveMenuItem !== null) {
          saveMenuItem.enabled = false;
        }

        const saveAsMenuItem = mainMenu.getMenuItemById("saveAs");
        if (saveAsMenuItem !== null) {
          saveAsMenuItem.enabled = false;
        }
      }

      return false;
    }

    app.quit();
    return true;
  }

  private async handleActivate(): Promise<void> {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (this.windows.size === 0) {
      const browserWindow = await this.createWindow();
      browserWindow.webContents.send("menu.new");
    }
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  private async handleReady(): Promise<void> {
    const template = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                {
                  label: "Preferences",
                  submenu: [
                    {
                      id: "settings",
                      label: "Settings",
                      accelerator: "CommandOrControl+S",
                      click: (
                        _menuItem: MenuItem,
                        browserWindow: BrowserWindow
                      ) => {
                        browserWindow.webContents.send("menu.settings");
                      }
                    }
                  ]
                },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" }
              ]
            }
          ]
        : []),
      // { role: 'fileMenu' }
      {
        label: "File",
        submenu: [
          {
            label: "New",
            accelerator: "CommandOrControl+N",
            click: async (
              _menuItem: MenuItem,
              browserWindow: BrowserWindow | undefined
            ) => {
              if (!browserWindow) {
                this.createWindow();
              } else {
                browserWindow.webContents.send("menu.new");
              }
            }
          },
          {
            label: "New Window",
            accelerator: "Shift+CommandOrControl+N",
            click: async () => {
              const browserWindow = await this.createWindow();
              browserWindow.webContents.send("menu.new");
            }
          },
          { type: "separator" },
          {
            label: "Open...",
            accelerator: "CommandOrControl+O",
            click: async (_: MenuItem, browserWindow: BrowserWindow) => {
              // Invoke the operating system file open dialog
              const r = await dialog.showOpenDialog(browserWindow, {
                properties: ["openFile"],
                filters: [{ name: "Model Files", extensions: ["ldr"] }]
              });

              if (r.canceled || r.filePaths.length === 0) {
                return;
              }

              this.openFile(r.filePaths[0], browserWindow);
            }
          },
          {
            label: "Open Recent",
            role: "recentdocuments",
            submenu: [
              {
                label: "Clear Recently Opened",
                role: "clearrecentdocuments"
              }
            ]
          },
          { type: "separator" },
          {
            id: "save",
            label: "Save",
            accelerator: "CommandOrControl+S",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              browserWindow.webContents.send("menu.save");
            }
          },
          {
            id: "saveAs",
            label: "Save As...",
            accelerator: "Shift+CommandOrControl+S",
            click: async (_: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              browserWindow.webContents.send("menu.saveAs");
            }
          },
          { type: "separator" },
          isMac ? { role: "close" } : { role: "quit" }
        ]
      },
      //{ role: "editMenu" },
      {
        id: "edit",
        label: "Edit",
        submenu: [
          {
            id: "undo",
            label: "Undo",
            accelerator: "CommandOrControl+Z",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.undo");
            }
          },
          {
            id: "redo",
            label: "Redo",
            accelerator: "Shift+CommandOrControl+Z",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.redo");
            }
          },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "delete" },
          ...(isMac
            ? [{ role: "selectAll" }, { type: "separator" }]
            : [
                { type: "separator" },
                { role: "selectAll" },
                { type: "separator" }
              ])
          //{ role: "replace" }
        ]
      },
      { role: "windowMenu" },
      {
        role: "help",
        submenu: [
          {
            label: "Learn More",
            click: async () => {
              await shell.openExternal("http://cequel.space");
            }
          }
        ]
      },
      {
        label: "Debug",
        submenu: [
          { role: "reload" },
          { role: "forcereload" },
          { role: "toggledevtools" }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(
      template as Electron.MenuItemConstructorOptions[]
    );
    Menu.setApplicationMenu(menu);

    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }

    createProtocol("app");

    // Create the window with a new tab
    const browserWindow = await this.createWindow();
    browserWindow.webContents.send("menu.new");
  }

  private async handleOpenFile(event: Event, path: string): Promise<void> {
    event.preventDefault();

    const currentWindow = BrowserWindow.getFocusedWindow();

    if (isMac) {
      this.openFile(path, currentWindow);
    } else {
      this.openFile(process.argv[0], currentWindow);
    }
  }

  private createWindow(): Promise<BrowserWindow> {
    const preload =
      process.env.NODE_ENV === "development"
        ? // eslint-disable-next-line no-undef
          path.resolve(__static, "..", "src", "preload.js") // dev
        : // eslint-disable-next-line no-undef
          path.join(__dirname, "preload.js"); // prod
    let x, y, width, height;

    // Base the initial position on the currently focused window if there is one.
    const currentWindow = BrowserWindow.getFocusedWindow();

    if (currentWindow) {
      const bounds = currentWindow.getBounds();
      x = bounds.x + 40;
      y = bounds.y + 40;
      width = bounds.width;
      height = bounds.height;
    } else {
      // When there isn't an existing window, default to 80% of the screen size
      const display = screen.getPrimaryDisplay();
      const size = display.size;

      x = size.width * 0.1;
      y = size.height * 0.1;
      width = size.width * 0.8;
      height = size.height * 0.8;
    }

    // Create the browser window.
    const window: BrowserWindow = new BrowserWindow({
      x: Math.round(x),
      y: Math.round(y),
      show: false,
      backgroundColor: "#2c3947", // Copied from $app-background
      width: Math.round(width),
      height: Math.round(height),
      title: app.name,
      titleBarStyle: "hidden",
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env
          .ELECTRON_NODE_INTEGRATION as unknown as boolean,
        contextIsolation: false,
        //contextIsolation: !(process.env
        //  .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
        preload,
        enableWebSQL: false,
        spellcheck: false,
        nativeWindowOpen: true
      }
    });

    // Capture the webContents.id here so that it is passed into to the 'closed' event handler
    // in the closures below.  This allows us to remove the menu states after the webContents has been
    // destroyed.
    const webContentsId = window.webContents.id;

    // Keep a reference to the window so its not garbage collected until it is closed
    this.windows.add(window);

    // Keep a promise to resolve when the renderer process indicates its IPC handler is ready
    const promise = new WindowPromise(window);
    this.windowPromises.set(webContentsId, promise);

    window.once("ready-to-show", () => {
      window.show();
    });

    window.on("close", () => {
      window.webContents.send("menu.close");
    });

    window.on("closed", () => {
      // Cleanup the state for the window
      this.menuStates.delete(webContentsId);
      this.windows.delete(window);
    });

    window.on("focus", () => {
      // Apply the recorded menu states to the main menu bar
      const states = this.menuStates.get(webContentsId);
      if (states) {
        const mainMenu = Menu.getApplicationMenu();
        if (mainMenu) {
          for (const pair of states) {
            const menuItem = mainMenu.getMenuItemById(pair[0]);
            if (menuItem) {
              menuItem.enabled = !pair[1];
            }
          }
        }
      }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
      if (!process.env.IS_TEST) {
        window.webContents.openDevTools();
      }
    } else {
      // Load the index.html when not in development
      window.loadURL("app://./index.html");
    }

    // Enable all the menus that need to be enabled when a window is created
    const mainMenu = Menu.getApplicationMenu();
    if (mainMenu) {
      const saveMenuItem = mainMenu.getMenuItemById("save");
      if (saveMenuItem !== null) {
        saveMenuItem.enabled = false;
      }

      const saveAsMenuItem = mainMenu.getMenuItemById("saveAs");
      if (saveAsMenuItem !== null) {
        saveAsMenuItem.enabled = false;
      }
    }

    return promise.promise;
  }

  private async openFile(
    fileName: string,
    window: BrowserWindow | null
  ): Promise<void> {
    // Start loading the file
    const contentPromise = readFileAsync(fileName);

    if (!window) {
      window = await this.createWindow();
    }

    // Update the window title
    app.addRecentDocument(fileName);

    // Send the file contents into the render process
    const content = (await contentPromise).toString();
    //window.webContents.send("menu.open", fileName, content);

    const modelPromise = this.ldrModelLoader.loadString(fileName, content);

    this.store.dispatch("document/setIsDirty", { isDirty: false });
    this.store.dispatch("document/setFileName", { fileName: fileName });
    window.setRepresentedFilename(fileName);

    const model = await modelPromise;
    this.store.dispatch("document/setModel", { model: model });
  }

  public newWindow(
    parentWindow: BrowserWindow,
    bounds: Rect,
    layoutConfig: DockingLayoutConfig
  ): Promise<BrowserWindow> {
    const preload =
      process.env.NODE_ENV === "development"
        ? // eslint-disable-next-line no-undef
          path.resolve(__static, "..", "src", "preload.js") // dev
        : // eslint-disable-next-line no-undef
          path.join(__dirname, "preload.js"); // prod

    // The provided bounds are relative to the parent window so adjust to make them relative to the dekstop
    const contentBounds = parentWindow.getContentBounds();

    // Create the browser window.
    const window: BrowserWindow = new BrowserWindow({
      x: Math.round(contentBounds.x + bounds.left),
      y: Math.round(contentBounds.y + bounds.top),
      show: false,
      backgroundColor: "#2c3947", // Copied from $app-background
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      title: app.name,
      center: false,
      useContentSize: true,
      resizable: true,
      fullscreenable: false,
      skipTaskbar: true,
      titleBarStyle: "hidden",
      //roundedCorners: false,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env
          .ELECTRON_NODE_INTEGRATION as unknown as boolean,
        contextIsolation: false,
        preload,
        enableWebSQL: false,
        spellcheck: false,
        nativeWindowOpen: true,
        additionalArguments: ["--layoutConfig", JSON.stringify(layoutConfig)]
      }
    });

    // Capture the webContents.id here so that it is passed into to the 'closed' event handler
    // in the closures below.  This allows us to remove the menu states after the webContents has been
    // destroyed.
    const webContentsId = window.webContents.id;

    // Keep a reference to the window so its not garbage collected until it is closed
    this.windows.add(window);

    // Keep a promise to resolve when the renderer process indicates its IPC handler is ready
    const promise = new WindowPromise(window);
    this.windowPromises.set(webContentsId, promise);

    window.once("ready-to-show", () => {
      window.show();
    });

    window.on("close", () => {
      window.webContents.send("menu.close");
    });

    window.on("closed", () => {
      // Cleanup the state for the window
      this.menuStates.delete(webContentsId);
      this.windows.delete(window);
    });

    window.on("focus", () => {
      // Apply the recorded menu states to the main menu bar
      const states = this.menuStates.get(webContentsId);
      if (states) {
        const mainMenu = Menu.getApplicationMenu();
        if (mainMenu) {
          for (const pair of states) {
            const menuItem = mainMenu.getMenuItemById(pair[0]);
            if (menuItem) {
              menuItem.enabled = !pair[1];
            }
          }
        }
      }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
      //if (!process.env.IS_TEST) {
      //  window.webContents.openDevTools();
      //}
    } else {
      // Load the index.html when not in development
      window.loadURL("app://./index.html");
    }

    // Enable all the menus that need to be enabled when a window is created
    const mainMenu = Menu.getApplicationMenu();
    if (mainMenu) {
      const saveMenuItem = mainMenu.getMenuItemById("save");
      if (saveMenuItem !== null) {
        saveMenuItem.enabled = false;
      }

      const saveAsMenuItem = mainMenu.getMenuItemById("saveAs");
      if (saveAsMenuItem !== null) {
        saveAsMenuItem.enabled = false;
      }
    }

    return promise.promise;
  }
}
