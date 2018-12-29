const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron');
const fs = require('fs');
const {join} = require('path');
const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));
const Git = require('nodegit');
const moment = require('moment');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    minWidth: 1050,
    height: 400,
    minHeight: 320,
    show: true
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.loadURL('http://localhost:3000/');
}

function save(event, arg) {
  dialog.showSaveDialog(mainWindow, {
    filters: [{name: 'Json', extensions: ['json']}]
  }, filename => {
    if (filename)
      fs.writeFileSync(filename, JSON.stringify(arg));
  });
}

function load(event) {
  dialog.showOpenDialog(mainWindow, {
    filters: [{name: 'Json', extensions: ['json']}]
  }, files => {
    if (files && files.length > 0) {
      let content = fs.readFileSync(files[0]);
      event.sender.send('load-response', JSON.parse(content));
    }
  });
}

function exportToRepo(event, arg) {
  dialog.showOpenDialog(mainWindow, {
    filters: [{name: 'Directory', extensions: []}],
    properties: [
      'openDirectory',
      'createDirectory',
    ]
  }, files => {
    if (!files || files.length === 0) return;
    const filename = files[0];
    rimraf(filename)
    .then(() => {
      fs.mkdirSync(filename);
      return Git.Repository.init(filename, 0);
    })
    .then(repository => {
      let data = arg.data.filter(value => value.count > 0);
      let index;
      const offset = -new Date().getTimezoneOffset();
      let writeAll = (i, c, parents) => {
        if (i >= data.length) return Promise.resolve();
        let value = data[i];
        let dummy = join(filename, 'dummy.txt');
        fs.writeFileSync(dummy, `${i}-${c}`);
        return repository.refreshIndex()
        .then(idx => {
          index = idx;
          return index.addByPath('dummy.txt');
        })
        .then(() => index.write)
        .then(() => index.writeTree())
        .then(oid => {
          let author = Git.Signature.create(arg.name, arg.email, +moment(value.date).format("X"), offset);
          return repository.createCommit('HEAD', author, author, `${i}-${c}`, oid, parents);
        })
        .then(oid => {
          ++c;
          if (c < value.count)
            return writeAll(i, c, [oid]);
          else
            return writeAll(i + 1, 0, [oid]);
        });
      };
      return writeAll(0, 0, []);
    })
    .then(() => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Success',
        message: 'Repository has been created'
      });
    })
    .catch(error => {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error',
        message: error.message
      });
    });
  });
}

app.on('ready', () => {
  createWindow();
  ipcMain.on('save', save);
  ipcMain.on('load', load);
  ipcMain.on('export', exportToRepo);
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});
app.on('activate', () => {
  if (!mainWindow)
    createWindow();
});
